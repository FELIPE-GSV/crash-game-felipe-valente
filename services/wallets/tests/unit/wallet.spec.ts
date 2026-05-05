import { describe, it, expect } from "bun:test";
import { Wallet } from "../../src/domain/wallet";
import { Money } from "../../src/domain/money";
import {
  InsufficientFundsError,
  InvalidAmountError,
} from "../../src/domain/errors";

function makeWallet(balanceCents: bigint = 0n): Wallet {
  const now = new Date();
  return new Wallet({
    id: "wallet-id",
    playerId: "player-id",
    balance: Money.fromCents(balanceCents),
    createdAt: now,
    updatedAt: now,
  });
}

describe("Wallet — credit", () => {
  it("incrementa o saldo", () => {
    const wallet = makeWallet(1_000n);
    wallet.credit(Money.fromCents(500n));
    expect(wallet.balance.toCents()).toBe(1_500n);
  });

  it("rejeita valor zero", () => {
    const wallet = makeWallet(1_000n);
    expect(() => wallet.credit(Money.zero())).toThrow(InvalidAmountError);
  });

  it("rejeita valor negativo", () => {
    const wallet = makeWallet(1_000n);
    expect(() => wallet.credit(Money.fromCents(-1n))).toThrow(InvalidAmountError);
  });
});

describe("Wallet — debit", () => {
  it("decrementa o saldo quando há fundos", () => {
    const wallet = makeWallet(1_000n);
    wallet.debit(Money.fromCents(300n));
    expect(wallet.balance.toCents()).toBe(700n);
  });

  it("rejeita débito quando saldo é insuficiente", () => {
    const wallet = makeWallet(100n);
    expect(() => wallet.debit(Money.fromCents(101n))).toThrow(
      InsufficientFundsError,
    );
    // Saldo intacto após erro
    expect(wallet.balance.toCents()).toBe(100n);
  });

  it("permite debitar exatamente o saldo (zera)", () => {
    const wallet = makeWallet(500n);
    wallet.debit(Money.fromCents(500n));
    expect(wallet.balance.toCents()).toBe(0n);
  });

  it("rejeita débito de valor zero", () => {
    const wallet = makeWallet(1_000n);
    expect(() => wallet.debit(Money.zero())).toThrow(InvalidAmountError);
  });
});
