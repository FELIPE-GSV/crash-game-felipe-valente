import { describe, it, expect } from "bun:test";
import { Money } from "../../src/domain/money";

describe("Money", () => {
  describe("fromCents", () => {
    it("aceita bigint", () => {
      expect(Money.fromCents(100n).toCents()).toBe(100n);
    });

    it("aceita number", () => {
      expect(Money.fromCents(250).toCents()).toBe(250n);
    });

    it("aceita string", () => {
      expect(Money.fromCents("500").toCents()).toBe(500n);
    });
  });

  describe("zero", () => {
    it("retorna 0 centavos", () => {
      expect(Money.zero().toCents()).toBe(0n);
    });
  });

  describe("add", () => {
    it("soma dois valores", () => {
      const a = Money.fromCents(300);
      const b = Money.fromCents(200);
      expect(a.add(b).toCents()).toBe(500n);
    });
  });

  describe("subtract", () => {
    it("subtrai dois valores", () => {
      const a = Money.fromCents(500);
      const b = Money.fromCents(200);
      expect(a.subtract(b).toCents()).toBe(300n);
    });
  });

  describe("multiply", () => {
    it("multiplica por inteiro", () => {
      expect(Money.fromCents(1000).multiply(3).toCents()).toBe(3000n);
    });

    it("multiplica por decimal (2.5x)", () => {
      expect(Money.fromCents(1000).multiply(2.5).toCents()).toBe(2500n);
    });

    it("arredonda resultado fracionário (sem float leak)", () => {
      // 0.1 * 0.2 em float = 0.020000000000000004, aqui deve ser inteiro
      const result = Money.fromCents(10).multiply(0.2).toCents();
      expect(typeof result).toBe("bigint");
      expect(result).toBe(2n);
    });
  });

  describe("comparadores", () => {
    it("isLessThan", () => {
      expect(Money.fromCents(100).isLessThan(Money.fromCents(200))).toBeTrue();
      expect(Money.fromCents(200).isLessThan(Money.fromCents(100))).toBeFalse();
    });

    it("isGreaterThan", () => {
      expect(Money.fromCents(200).isGreaterThan(Money.fromCents(100))).toBeTrue();
      expect(Money.fromCents(100).isGreaterThan(Money.fromCents(200))).toBeFalse();
    });

    it("isNegative", () => {
      expect(Money.fromCents(-1).isNegative()).toBeTrue();
      expect(Money.fromCents(0).isNegative()).toBeFalse();
    });

    it("isZeroOrNegative", () => {
      expect(Money.fromCents(0).isZeroOrNegative()).toBeTrue();
      expect(Money.fromCents(-5).isZeroOrNegative()).toBeTrue();
      expect(Money.fromCents(1).isZeroOrNegative()).toBeFalse();
    });
  });

  describe("toString", () => {
    it("serializa em centavos como string", () => {
      expect(Money.fromCents(999).toString()).toBe("999");
    });
  });
});
