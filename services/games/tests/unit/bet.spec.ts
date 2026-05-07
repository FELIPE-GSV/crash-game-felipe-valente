import { describe, it, expect } from "bun:test";
import { Bet } from "../../src/domain/bet";
import { Money } from "../../src/domain/money";
import { BetAlreadySettledError } from "../../src/domain/errors";

function makeBet(overrides: Partial<ConstructorParameters<typeof Bet>[0]> = {}): Bet {
  return new Bet({
    id: "bet-1",
    roundId: "round-1",
    playerId: "player-1",
    amount: Money.fromCents(1000),
    placedAt: new Date(),
    status: "pending",
    cashoutMultiplier: null,
    payout: null,
    ...overrides,
  });
}

describe("Bet", () => {
  describe("isPending", () => {
    it("retorna true para bet nova", () => {
      expect(makeBet().isPending()).toBeTrue();
    });

    it("retorna false após cashout", () => {
      const bet = makeBet();
      bet.cashout(2);
      expect(bet.isPending()).toBeFalse();
    });

    it("retorna false após lose", () => {
      const bet = makeBet();
      bet.lose();
      expect(bet.isPending()).toBeFalse();
    });
  });

  describe("cashout", () => {
    it("seta status cashed_out", () => {
      const bet = makeBet();
      bet.cashout(2.5);
      expect(bet.status).toBe("cashed_out");
    });

    it("seta cashoutMultiplier", () => {
      const bet = makeBet();
      bet.cashout(3.14);
      expect(bet.cashoutMultiplier).toBe(3.14);
    });

    it("calcula payout = amount * multiplier", () => {
      const bet = makeBet(); // amount = 1000 centavos
      bet.cashout(2);
      expect(bet.payout!.toCents()).toBe(2000n);
    });

    it("cashout com multiplicador fracionário", () => {
      const bet = makeBet(); // 1000 centavos
      bet.cashout(1.5);
      expect(bet.payout!.toCents()).toBe(1500n);
    });

    it("lança BetAlreadySettledError se já foi cashed_out", () => {
      const bet = makeBet();
      bet.cashout(2);
      expect(() => bet.cashout(3)).toThrow(BetAlreadySettledError);
    });

    it("lança BetAlreadySettledError se já foi lost", () => {
      const bet = makeBet();
      bet.lose();
      expect(() => bet.cashout(2)).toThrow(BetAlreadySettledError);
    });
  });

  describe("lose", () => {
    it("seta status lost", () => {
      const bet = makeBet();
      bet.lose();
      expect(bet.status).toBe("lost");
    });

    it("payout permanece null após lose", () => {
      const bet = makeBet();
      bet.lose();
      expect(bet.payout).toBeNull();
    });

    it("cashoutMultiplier permanece null após lose", () => {
      const bet = makeBet();
      bet.lose();
      expect(bet.cashoutMultiplier).toBeNull();
    });

    it("lança BetAlreadySettledError se já foi lost", () => {
      const bet = makeBet();
      bet.lose();
      expect(() => bet.lose()).toThrow(BetAlreadySettledError);
    });

    it("lança BetAlreadySettledError se já foi cashed_out", () => {
      const bet = makeBet();
      bet.cashout(2);
      expect(() => bet.lose()).toThrow(BetAlreadySettledError);
    });
  });
});
