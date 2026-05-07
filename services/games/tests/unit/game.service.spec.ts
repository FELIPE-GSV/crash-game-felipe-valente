import { describe, it, expect, mock, beforeEach } from "bun:test";
import { of } from "rxjs";
import { GameService } from "../../src/application/game.service";
import { Round } from "../../src/domain/round";
import { Bet } from "../../src/domain/bet";
import { Money } from "../../src/domain/money";
import type { RoundRepository } from "../../src/application/round.repository";
import type { BetRepository } from "../../src/application/bet.repository";
import {
  RoundNotInBettingPhaseError,
  RoundNotRunningError,
  InsufficientFundsError,
} from "../../src/domain/errors";

// ---- fakes ----

class FakeRoundRepo implements RoundRepository {
  private rounds: Round[] = [];

  async save(round: Round): Promise<void> {
    const idx = this.rounds.findIndex((r) => r.id === round.id);
    if (idx >= 0) this.rounds[idx] = round;
    else this.rounds.push(round);
  }

  async findCurrent(): Promise<Round | null> {
    return this.rounds.at(-1) ?? null;
  }

  async findById(id: string): Promise<Round | null> {
    return this.rounds.find((r) => r.id === id) ?? null;
  }

  async findHistory(_page: number, _limit: number): Promise<Round[]> {
    return [...this.rounds].reverse();
  }

  seed(round: Round) {
    this.rounds.push(round);
  }
}

class FakeBetRepo implements BetRepository {
  bets: Bet[] = [];

  async save(bet: Bet): Promise<void> {
    const idx = this.bets.findIndex((b) => b.id === bet.id);
    if (idx >= 0) this.bets[idx] = bet;
    else this.bets.push(bet);
  }

  async saveMany(bets: Bet[]): Promise<void> {
    for (const b of bets) await this.save(b);
  }

  async findByRoundAndPlayer(roundId: string, playerId: string): Promise<Bet | null> {
    return this.bets.find((b) => b.roundId === roundId && b.playerId === playerId) ?? null;
  }

  async findByPlayer(playerId: string, _page: number, _limit: number): Promise<Bet[]> {
    return this.bets.filter((b) => b.playerId === playerId);
  }
}

function makeBettingRound(id = "round-1"): Round {
  return new Round({
    id,
    status: "betting",
    crashPoint: 5.0,
    serverSeed: "server-seed",
    serverSeedHash: "server-seed-hash",
    startedAt: null,
    crashedAt: null,
    createdAt: new Date(),
    bets: [],
  });
}

function makeRunningRound(id = "round-1", startedAtOffsetMs = 5000): Round {
  return new Round({
    id,
    status: "running",
    crashPoint: 5.0,
    serverSeed: "server-seed",
    serverSeedHash: "server-seed-hash",
    startedAt: new Date(Date.now() - startedAtOffsetMs),
    crashedAt: null,
    createdAt: new Date(),
    bets: [],
  });
}

// ---- gateway spy ----

function makeGatewaySpy() {
  return {
    emitBetPlaced: mock(() => {}),
    emitBetCashedOut: mock(() => {}),
    emitRoundNew: mock(() => {}),
    emitRoundCrashed: mock(() => {}),
    emitRoundStarted: mock(() => {}),
    emitTick: mock(() => {}),
  };
}

// ---- wallet client stub ----

function makeWalletClientOk() {
  return { send: () => of({ ok: true, balance: "99000" }) };
}

function makeWalletClientFail() {
  return { send: () => of({ ok: false, error: "INSUFFICIENT_FUNDS" }) };
}

// ---- tests ----

describe("GameService", () => {
  let roundRepo: FakeRoundRepo;
  let betRepo: FakeBetRepo;
  let gateway: ReturnType<typeof makeGatewaySpy>;

  beforeEach(() => {
    roundRepo = new FakeRoundRepo();
    betRepo = new FakeBetRepo();
    gateway = makeGatewaySpy();
  });

  function makeService(walletClient: any = null) {
    return new GameService(roundRepo, betRepo, walletClient, gateway as any);
  }

  describe("createRound", () => {
    it("persiste round em status betting", async () => {
      const svc = makeService();
      const round = await svc.createRound();
      expect(round.status).toBe("betting");
    });

    it("gera serverSeed, serverSeedHash e crashPoint", async () => {
      const svc = makeService();
      const round = await svc.createRound();
      expect(round.serverSeed).toBeString();
      expect(round.serverSeedHash).toBeString();
      expect(round.serverSeedHash).toHaveLength(64);
      expect(round.crashPoint).toBeGreaterThanOrEqual(1.0);
    });
  });

  describe("placeBet", () => {
    it("salva bet e emite bet:placed (sem walletClient)", async () => {
      roundRepo.seed(makeBettingRound());
      const svc = makeService(null);
      const bet = await svc.placeBet("player-1", 1000);
      expect(bet.status).toBe("pending");
      expect(betRepo.bets).toHaveLength(1);
      expect(gateway.emitBetPlaced).toHaveBeenCalledTimes(1);
      expect(gateway.emitBetPlaced.mock.calls[0][0]).toMatchObject({
        playerId: "player-1",
        amountCents: 1000,
      });
    });

    it("salva bet com walletClient retornando ok", async () => {
      roundRepo.seed(makeBettingRound());
      const svc = makeService(makeWalletClientOk());
      const bet = await svc.placeBet("player-1", 2000);
      expect(bet.status).toBe("pending");
      expect(betRepo.bets).toHaveLength(1);
    });

    it("lança InsufficientFundsError e NÃO salva bet quando wallet falha", async () => {
      roundRepo.seed(makeBettingRound());
      const svc = makeService(makeWalletClientFail());
      await expect(svc.placeBet("player-1", 1000)).rejects.toThrow(InsufficientFundsError);
      expect(betRepo.bets).toHaveLength(0);
    });

    it("lança RoundNotInBettingPhaseError se round está running", async () => {
      roundRepo.seed(makeRunningRound());
      const svc = makeService();
      await expect(svc.placeBet("player-1", 1000)).rejects.toThrow(RoundNotInBettingPhaseError);
    });

    it("lança RoundNotInBettingPhaseError se não há round ativo", async () => {
      const svc = makeService();
      await expect(svc.placeBet("player-1", 1000)).rejects.toThrow(RoundNotInBettingPhaseError);
    });
  });

  describe("cashout", () => {
    it("realiza cashout e emite bet:cashedout", async () => {
      // Criar em betting, apostar, depois iniciar
      const round = makeBettingRound("round-1");
      const bet = round.placeBet("player-1", Money.fromCents(1000));
      round.start();
      // Retroagir startedAt para simular 5s passados
      (round as any)._startedAt = new Date(Date.now() - 5000);
      roundRepo.seed(round);
      await betRepo.save(bet);

      const svc = makeService(null);
      const result = await svc.cashout("player-1");

      expect(result.status).toBe("cashed_out");
      expect(result.cashoutMultiplier).toBeGreaterThan(1.0);
      expect(result.payout!.toCents()).toBeGreaterThan(1000n);
      expect(gateway.emitBetCashedOut).toHaveBeenCalledTimes(1);
    });

    it("cashout multiplier é limitado ao crashPoint", async () => {
      // Round com crashPoint baixo; 60s elapsed → multiplier natural >> 1.1 → deve capar em 1.1
      const round = new Round({
        id: "round-1",
        status: "betting",
        crashPoint: 1.1,
        serverSeed: "s",
        serverSeedHash: "h",
        startedAt: null,
        crashedAt: null,
        createdAt: new Date(),
        bets: [],
      });
      const bet = round.placeBet("player-1", Money.fromCents(1000));
      round.start();
      (round as any)._startedAt = new Date(Date.now() - 60_000);
      roundRepo.seed(round);
      await betRepo.save(bet);

      const svc = makeService(null);
      const result = await svc.cashout("player-1");
      expect(result.cashoutMultiplier!).toBeLessThanOrEqual(1.1);
    });

    it("lança RoundNotRunningError se round está em betting", async () => {
      roundRepo.seed(makeBettingRound());
      const svc = makeService();
      await expect(svc.cashout("player-1")).rejects.toThrow(RoundNotRunningError);
    });

    it("lança RoundNotRunningError se não há round ativo", async () => {
      const svc = makeService();
      await expect(svc.cashout("player-1")).rejects.toThrow(RoundNotRunningError);
    });
  });

  describe("crashRound", () => {
    it("altera round para crashed e persiste bets como lost", async () => {
      const round = makeBettingRound();
      const bet = round.placeBet("player-1", Money.fromCents(1000));
      round.start();
      roundRepo.seed(round);
      await betRepo.save(bet);

      const svc = makeService();
      const crashed = await svc.crashRound(round.id);

      expect(crashed.status).toBe("crashed");
      expect(betRepo.bets[0].status).toBe("lost");
    });

    it("não chama saveMany se não há bets pendentes", async () => {
      const round = makeBettingRound();
      round.start();
      roundRepo.seed(round);

      const svc = makeService();
      const crashed = await svc.crashRound(round.id);
      expect(crashed.status).toBe("crashed");
      expect(betRepo.bets).toHaveLength(0);
    });
  });
});
