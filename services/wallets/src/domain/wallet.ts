import { Money } from "./money";
import { InsufficientFundsError, InvalidAmountError } from "./errors";

export class Wallet {
  readonly id: string;
  readonly playerId: string;
  private _balance: Money;
  readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: {
    id: string;
    playerId: string;
    balance: Money;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = props.id;
    this.playerId = props.playerId;
    this._balance = props.balance;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  get balance(): Money {
    return this._balance;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  credit(amount: Money): void {
    if (amount.isZeroOrNegative()) {
      throw new InvalidAmountError();
    }
    this._balance = this._balance.add(amount);
    this._updatedAt = new Date();
  }

  debit(amount: Money): void {
    if (amount.isZeroOrNegative()) {
      throw new InvalidAmountError();
    }
    if (this._balance.isLessThan(amount)) {
      throw new InsufficientFundsError();
    }
    this._balance = this._balance.subtract(amount);
    this._updatedAt = new Date();
  }
}
