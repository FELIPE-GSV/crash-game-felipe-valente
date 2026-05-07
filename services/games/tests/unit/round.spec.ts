import { describe, it, expect } from "bun:test";
import { Round } from "../../src/domain/round";
import { Money } from "../../src/domain/money";
import {
  RoundNotInBettingPhaseError,
  RoundNotRunningError,
  PlayerAlreadyBetError,
  InvalidBetAmountError,
  BetNotFoundError,
} from "../../src/domain/errors";

function makeRound(overrides: Partial<ConstructorParameters<typeof Round>[0]> = {}): Round {
  return new Round({
    id: "round-1",
    status: "betting",
    crashPoint: 2.5,
    serverSeed: "seed",
    serverSeedHash: "hash",
    startedAt: null,
    crashedAt: null,
    createdAt: new Date(),
    bets: [],
    ...overrides,
  });
}

const BET_MIN = Money.fromCents(100);   // R$ 1,00
const BET_MAX = Money.fromCents(100_000); // R$ 1.000,00

describe("Round", () => {
  describe("placeBet", () => {
    it("adiciona bet e retorna instância em fase betting", () => {
      const round = makeRound();
      const bet = round.placeBet("player-1", Money.fromCents(1000));
      expect(round.bets).toHaveLength(1);
      expect(bet.playerId).toBe("player-1");
      expect(bet.status).toBe("pending");
    });

    it("lança RoundNotInBettingPhaseError se status=running", () => {
      const round = makeRound({ status: "running", startedAt: new Date() });
      expect(() => round.placeBet("p", BET_MIN)).toThrow(RoundNotInBettingPhaseError);
    });

    it("lança RoundNotInBettingPhaseError se status=crashed", () => {
      const round = makeRound({ status: "crashed", startedAt: new Date(), crashedAt: new Date() });
      expect(() => round.placeBet("p", BET_MIN)).toThrow(RoundNotInBettingPhaseError);
    });

    it("lança InvalidBetAmountError se amount < mínimo (< R$1,00)", () => {
      const round = makeRound();
      expect(() => round.placeBet("p", Money.fromCents(99))).toThrow(InvalidBetAmountError);
    });

    it("aceita o valor mínimo exato (R$1,00)", () => {
      const round = makeRound();
      expect(() => round.placeBet("p", BET_MIN)).not.toThrow();
    });

    it("lança InvalidBetAmountError se amount > máximo (> R$1.000,00)", () => {
      const round = makeRound();
      expect(() => round.placeBet("p", Money.fromCents(100_001))).toThrow(InvalidBetAmountError);
    });

    it("aceita o valor máximo exato (R$1.000,00)", () => {
      const round = makeRound();
      expect(() => round.placeBet("p", BET_MAX)).not.toThrow();
    });

    it("lança PlayerAlreadyBetError se mesmo player aposta duas vezes", () => {
      const round = makeRound();
      round.placeBet("player-1", BET_MIN);
      expect(() => round.placeBet("player-1", BET_MIN)).toThrow(PlayerAlreadyBetError);
    });

    it("permite dois players diferentes apostarem", () => {
      const round = makeRound();
      round.placeBet("player-1", BET_MIN);
      round.placeBet("player-2", BET_MIN);
      expect(round.bets).toHaveLength(2);
    });
  });

  describe("start", () => {
    it("muda status para running e seta startedAt", () => {
      const round = makeRound();
      round.start();
      expect(round.status).toBe("running");
      expect(round.startedAt).toBeInstanceOf(Date);
    });

    it("lança RoundNotInBettingPhaseError se status=running", () => {
      const round = makeRound({ status: "running", startedAt: new Date() });
      expect(() => round.start()).toThrow(RoundNotInBettingPhaseError);
    });

    it("lança RoundNotInBettingPhaseError se status=crashed", () => {
      const round = makeRound({ status: "crashed", startedAt: new Date(), crashedAt: new Date() });
      expect(() => round.start()).toThrow(RoundNotInBettingPhaseError);
    });
  });

  describe("cashoutPlayer", () => {
    it("realiza cashout da bet do player e retorna a bet", () => {
      const round = makeRound();
      round.placeBet("player-1", Money.fromCents(1000));
      round.start();
      const bet = round.cashoutPlayer("player-1", 2.0);
      expect(bet.status).toBe("cashed_out");
      expect(bet.cashoutMultiplier).toBe(2.0);
      expect(bet.payout!.toCents()).toBe(2000n);
    });

    it("lança RoundNotRunningError se status=betting", () => {
      const round = makeRound();
      round.placeBet("player-1", BET_MIN);
      expect(() => round.cashoutPlayer("player-1", 1.5)).toThrow(RoundNotRunningError);
    });

    it("lança RoundNotRunningError se status=crashed", () => {
      const round = makeRound();
      round.placeBet("player-1", BET_MIN);
      round.start();
      round.crash();
      expect(() => round.cashoutPlayer("player-1", 1.5)).toThrow(RoundNotRunningError);
    });

    it("lança BetNotFoundError se player não apostou", () => {
      const round = makeRound();
      round.start();
      expect(() => round.cashoutPlayer("fantasma", 2.0)).toThrow(BetNotFoundError);
    });
  });

  describe("crash", () => {
    it("muda status para crashed e seta crashedAt", () => {
      const round = makeRound();
      round.start();
      round.crash();
      expect(round.status).toBe("crashed");
      expect(round.crashedAt).toBeInstanceOf(Date);
    });

    it("retorna lista de bets que foram perdidas", () => {
      const round = makeRound();
      round.placeBet("player-1", BET_MIN);
      round.placeBet("player-2", BET_MIN);
      round.start();
      const lost = round.crash();
      expect(lost).toHaveLength(2);
      expect(lost.every((b) => b.status === "lost")).toBeTrue();
    });

    it("bets já cashed_out não são incluídas nas perdidas", () => {
      const round = makeRound();
      round.placeBet("player-1", BET_MIN);
      round.placeBet("player-2", BET_MIN);
      round.start();
      round.cashoutPlayer("player-1", 1.5);
      const lost = round.crash();
      expect(lost).toHaveLength(1);
      expect(lost[0].playerId).toBe("player-2");
    });

    it("retorna array vazio se todos já fizeram cashout", () => {
      const round = makeRound();
      round.placeBet("player-1", BET_MIN);
      round.start();
      round.cashoutPlayer("player-1", 2.0);
      const lost = round.crash();
      expect(lost).toHaveLength(0);
    });

    it("lança RoundNotRunningError se status=betting", () => {
      const round = makeRound();
      expect(() => round.crash()).toThrow(RoundNotRunningError);
    });

    it("lança RoundNotRunningError se status=crashed", () => {
      const round = makeRound();
      round.start();
      round.crash();
      expect(() => round.crash()).toThrow(RoundNotRunningError);
    });
  });
});
