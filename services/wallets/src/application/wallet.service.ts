import { Inject, Injectable } from "@nestjs/common";
import { Wallet } from "../domain/wallet";
import { Money } from "../domain/money";
import {
  InsufficientFundsError,
  WalletAlreadyExistsError,
  WalletNotFoundError,
} from "../domain/errors";
import { WALLET_REPOSITORY } from "./wallet.repository";
import type { WalletRepository } from "./wallet.repository";

@Injectable()
export class WalletService {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly repository: WalletRepository,
  ) {}

  async createWallet(playerId: string): Promise<Wallet> {
    const existing = await this.repository.findByPlayerId(playerId);
    if (existing) {
      throw new WalletAlreadyExistsError();
    }

    const initialCents = process.env.INITIAL_BALANCE_CENTS ?? "0";
    const initialBalance = Money.fromCents(initialCents);

    return this.repository.create(playerId, initialBalance);
  }

  async getByPlayerId(playerId: string): Promise<Wallet> {
    const wallet = await this.repository.findByPlayerId(playerId);
    if (!wallet) {
      throw new WalletNotFoundError();
    }
    return wallet;
  }

  async debit(playerId: string, amount: Money): Promise<Wallet> {
    const wallet = await this.repository.findByPlayerId(playerId);
    if (!wallet) {
      throw new WalletNotFoundError();
    }

    const updated = await this.repository.atomicDebit(playerId, amount);
    if (!updated) {
      throw new InsufficientFundsError();
    }
    return updated;
  }

  async credit(playerId: string, amount: Money): Promise<Wallet> {
    const updated = await this.repository.atomicCredit(playerId, amount);
    if (!updated) {
      throw new WalletNotFoundError();
    }
    return updated;
  }
}
