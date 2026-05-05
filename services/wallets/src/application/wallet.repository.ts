import { Wallet } from "../domain/wallet";
import { Money } from "../domain/money";

export const WALLET_REPOSITORY: unique symbol = Symbol("WALLET_REPOSITORY");

export interface WalletRepository {
  create(playerId: string, initialBalance: Money): Promise<Wallet>;

  findByPlayerId(playerId: string): Promise<Wallet | null>;

  atomicDebit(playerId: string, amount: Money): Promise<Wallet | null>;

  atomicCredit(playerId: string, amount: Money): Promise<Wallet | null>;
}
