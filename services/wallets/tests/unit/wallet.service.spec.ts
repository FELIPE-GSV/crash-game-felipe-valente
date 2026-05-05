import { describe, it, expect, beforeEach } from "bun:test";
import { WalletService } from "../../src/application/wallet.service";
import type { WalletRepository } from "../../src/application/wallet.repository";
import { Wallet } from "../../src/domain/wallet";
import { Money } from "../../src/domain/money";
import {
  InsufficientFundsError,
  WalletAlreadyExistsError,
  WalletNotFoundError,
} from "../../src/domain/errors";

class InMemoryWalletRepository implements WalletRepository {
  private wallets = new Map<string, Wallet>();

  async create(playerId: string, initialBalance: Money): Promise<Wallet> {
    const wallet = new Wallet({
      id: `wallet-${playerId}`,
      playerId,
      balance: initialBalance,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.wallets.set(playerId, wallet);
    return wallet;
  }

  async findByPlayerId(playerId: string): Promise<Wallet | null> {
    return this.wallets.get(playerId) ?? null;
  }

  async atomicDebit(playerId: string, amount: Money): Promise<Wallet | null> {
    const wallet = this.wallets.get(playerId);
    if (!wallet) return null;
    if (wallet.balance.isLessThan(amount)) return null;
    wallet.debit(amount);
    return wallet;
  }

  async atomicCredit(playerId: string, amount: Money): Promise<Wallet | null> {
    const wallet = this.wallets.get(playerId);
    if (!wallet) return null;
    wallet.credit(amount);
    return wallet;
  }
}

describe("WalletService", () => {
  let service: WalletService;
  let repo: InMemoryWalletRepository;

  beforeEach(() => {
    repo = new InMemoryWalletRepository();
    service = new WalletService(repo);
    process.env.INITIAL_BALANCE_CENTS = "1000";
  });

  it("cria carteira com saldo inicial vindo do env", async () => {
    const wallet = await service.createWallet("player-1");
    expect(wallet.balance.toCents()).toBe(1_000n);
  });

  it("recusa criar carteira duplicada pro mesmo player", async () => {
    await service.createWallet("player-1");
    await expect(service.createWallet("player-1")).rejects.toBeInstanceOf(
      WalletAlreadyExistsError,
    );
  });

  it("getByPlayerId lança quando não existe", async () => {
    await expect(service.getByPlayerId("missing")).rejects.toBeInstanceOf(
      WalletNotFoundError,
    );
  });

  it("debit lança InsufficientFundsError quando saldo insuficiente", async () => {
    await service.createWallet("player-1");
    await expect(
      service.debit("player-1", Money.fromCents(2_000n)),
    ).rejects.toBeInstanceOf(InsufficientFundsError);
  });

  it("credit aumenta o saldo e retorna a carteira atualizada", async () => {
    await service.createWallet("player-1");
    const updated = await service.credit("player-1", Money.fromCents(500n));
    expect(updated.balance.toCents()).toBe(1_500n);
  });
});
