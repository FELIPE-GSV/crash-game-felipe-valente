import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { GameService } from "../../application/game.service";
import { GameGateway } from "../websocket/game.gateway";

const BETTING_DURATION_MS = 10_000;
const TICK_INTERVAL_MS = 100;
const CRASH_COOLDOWN_MS = 3_000;
const GROWTH_FACTOR = 0.06;

@Injectable()
export class GameLoopService implements OnModuleInit {
  private readonly logger = new Logger(GameLoopService.name);

  constructor(
    private readonly gameService: GameService,
    private readonly gateway: GameGateway,
  ) {}

  onModuleInit(): void {
    this.runLoop().catch((err) => this.logger.error("Game loop terminou inesperadamente", err));
  }

  private async runLoop(): Promise<void> {
    while (true) {
      try {
        await this.runOneCycle();
      } catch (err) {
        this.logger.error("Erro no ciclo da rodada, reiniciando em 3s", err);
        await this.sleep(CRASH_COOLDOWN_MS);
      }
    }
  }

  private async runOneCycle(): Promise<void> {
    const round = await this.gameService.createRound();
    this.logger.log(`Rodada ${round.id} criada | hash: ${round.serverSeedHash} | crash: ${round.crashPoint}x`);

    this.gateway.emitRoundNew({
      roundId: round.id,
      serverSeedHash: round.serverSeedHash,
      bettingEndsAt: new Date(Date.now() + BETTING_DURATION_MS).toISOString(),
    });

    await this.sleep(BETTING_DURATION_MS);

    await this.gameService.startRound(round.id);
    this.logger.log(`Rodada ${round.id} iniciada`);

    this.gateway.emitRoundStarted({
      roundId: round.id,
      startedAt: new Date().toISOString(),
    });

    const startTime = Date.now();
    while (true) {
      await this.sleep(TICK_INTERVAL_MS);
      const elapsedMs = Date.now() - startTime;
      const multiplier = parseFloat(Math.exp(GROWTH_FACTOR * (elapsedMs / 1000)).toFixed(2));

      this.gateway.emitTick({ roundId: round.id, multiplier, elapsedMs });

      if (multiplier >= round.crashPoint) {
        break;
      }
    }

    await this.gameService.crashRound(round.id);
    this.logger.log(`Rodada ${round.id} crashou em ${round.crashPoint}x`);

    this.gateway.emitRoundCrashed({
      roundId: round.id,
      crashPoint: round.crashPoint,
      crashedAt: new Date().toISOString(),
      serverSeed: round.serverSeed,
    });

    await this.sleep(CRASH_COOLDOWN_MS);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
