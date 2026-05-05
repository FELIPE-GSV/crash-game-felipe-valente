import { describe, it, expect } from "bun:test";
import { Money } from "../../src/domain/money";

describe("Money", () => {
  it("soma valores em centavos sem perder precisão", () => {
    const a = Money.fromCents(10_000n); // R$ 100,00
    const b = Money.fromCents(50n);     // R$ 0,50
    expect(a.add(b).toCents()).toBe(10_050n);
  });

  it("subtrai valores corretamente", () => {
    const a = Money.fromCents(10_000n);
    const b = Money.fromCents(2_500n);
    expect(a.subtract(b).toCents()).toBe(7_500n);
  });

  it("compara isLessThan", () => {
    expect(Money.fromCents(100n).isLessThan(Money.fromCents(200n))).toBe(true);
    expect(Money.fromCents(200n).isLessThan(Money.fromCents(100n))).toBe(false);
    expect(Money.fromCents(200n).isLessThan(Money.fromCents(200n))).toBe(false);
  });

  it("aceita string e number como entrada", () => {
    expect(Money.fromCents("12345").toCents()).toBe(12_345n);
    expect(Money.fromCents(99).toCents()).toBe(99n);
  });

  it("zero é zero", () => {
    expect(Money.zero().toCents()).toBe(0n);
  });

  it("isZeroOrNegative detecta inválidos", () => {
    expect(Money.zero().isZeroOrNegative()).toBe(true);
    expect(Money.fromCents(-1n).isZeroOrNegative()).toBe(true);
    expect(Money.fromCents(1n).isZeroOrNegative()).toBe(false);
  });

  it("toString devolve string em centavos (não float)", () => {
    expect(Money.fromCents(123_456n).toString()).toBe("123456");
  });
});
