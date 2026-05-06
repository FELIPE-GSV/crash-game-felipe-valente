import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { GameGateway } from "../infrastructure/websocket/game.gateway";
import { firstValueFrom, timeout } from "rxjs";

import { Round } from "../domain/round";
import { Bet } from "../domain/bet";
import { Money } from "../domain/money";
import { generateServerSeed, hashServerSeed, calculateCrashPoint } from "../domain/provably-fair";
import {
  InsufficientFundsError,
  RoundNotFoundError,
  RoundNotInBettingPhaseError,
  RoundNotRunningError,
} from "../domain/errors";

import { ROUND_REPOSITORY } from "./round.repository";
import type { RoundRepository } from "./round.repository";
import { BET_REPOSITORY } from "./bet.repository";
import type { BetRepository } from "./bet.repository";

export const WALLET_CLIENT = "WALLET_CLIENT";
const GROWTH_FACTOR = 0.06;

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor(
    @Inject(ROUND_REPOSITORY) private readonly roundRepo: RoundRepository,
    @Inject(BET_REPOSITORY) private readonly betRepo: BetRepository,
    @Optional() @Inject(WALLET_CLIENT) private readonly walletClient: ClientProxy | null,
    @Optional() private readonly gateway: GameGateway | null,
  ) {}

  async createRound(): Promise<Round> {
    const serverSeed = generateServerSeed();
    const serverSeedHash = hashServerSeed(serverSeed);
    const crashPoint = calculateCrashPoint(serverSeed);

    const round = new Round({
      id: crypto.randomUUID(),
      status: "betting",
      crashPoint,
      serverSeed,
      serverSeedHash,
      startedAt: null,
      crashedAt: null,
      createdAt: new Date(),
      bets: [],
    });

    await this.roundRepo.save(round);
    return round;
  }

  async startRound(roundId: string): Promise<Round> {
    const round = await this.roundRepo.findById(roundId);
    if (!round) throw new RoundNotFoundError();
    round.start();
    await this.roundRepo.save(round);
    return round;
  }

  async crashRound(roundId: string): Promise<Round> {
    const round = await this.roundRepo.findById(roundId);
    if (!round) throw new RoundNotFoundError();
    const lostBets = round.crash();
    await this.roundRepo.save(round);
    if (lostBets.length > 0) {
      await this.betRepo.saveMany(lostBets);
    }
    return round;
  }

  async placeBet(playerId: string, amountCents: number): Promise<Bet> {
    const round = await this.roundRepo.findCurrent();
    if (!round || round.status !== "betting") {
      throw new RoundNotInBettingPhaseError();
    }

    const amount = Money.fromCents(amountCents);
    const bet = round.placeBet(playerId, amount);

    if (this.walletClient) {
      const reply = await firstValueFrom<{ ok: boolean; error?: string }>(
        this.walletClient
          .send("wallet.debit", { playerId, amount: amountCents.toString(), correlationId: bet.id })
          .pipe(timeout(5000)),
      ).catch(() => ({ ok: false, error: "TIMEOUT" }));

      if (!reply.ok) {
        this.logger.warn(`Wallet debit failed for player ${playerId}: ${reply.error}`);
        throw new InsufficientFundsError();
      }
    }

    await this.betRepo.save(bet);

    this.gateway?.emitBetPlaced({
      roundId: round.id,
      playerId,
      amountCents,
    });

    return bet;
  }

  async cashout(playerId: string): Promise<Bet> {
    const round = await this.roundRepo.findCurrent();
    if (!round || round.status !== "running") {
      throw new RoundNotRunningError();
    }

    const elapsed = (Date.now() - round.startedAt!.getTime()) / 1000;
    const multiplier = Math.min(
      parseFloat(Math.exp(GROWTH_FACTOR * elapsed).toFixed(2)),
      round.crashPoint,
    );

    const bet = round.cashoutPlayer(playerId, multiplier);

    if (this.walletClient) {
      await firstValueFrom<{ ok: boolean }>(
        this.walletClient
          .send("wallet.credit", {
            playerId,
            amount: bet.payout!.toCents().toString(),
            correlationId: bet.id,
          })
          .pipe(timeout(5000)),
      ).catch((err) => {
        this.logger.error(`Wallet credit failed for player ${playerId}`, err);
      });
    }

    await this.betRepo.save(bet);

    this.gateway?.emitBetCashedOut({
      roundId: round.id,
      playerId,
      multiplier,
      payoutCents: Number(bet.payout!.toCents()),
    });

    return bet;
  }

  async getCurrentRound(): Promise<Round | null> {
    return this.roundRepo.findCurrent();
  }

  async getHistory(page: number, limit: number): Promise<Round[]> {
    return this.roundRepo.findHistory(page, limit);
  }

  async getRoundForVerification(roundId: string): Promise<Round> {
    const round = await this.roundRepo.findById(roundId);
    if (!round) throw new RoundNotFoundError();
    return round;
  }

  async getPlayerBets(playerId: string, page: number, limit: number): Promise<Bet[]> {
    return this.betRepo.findByPlayer(playerId, page, limit);
  }
}
