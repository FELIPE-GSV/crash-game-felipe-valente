import { Money } from "./money";
import { BetAlreadySettledError } from "./errors";

export type BetStatus = "pending" | "cashed_out" | "lost";

export class Bet {
  readonly id: string;
  readonly roundId: string;
  readonly playerId: string;
  readonly amount: Money;
  readonly placedAt: Date;
  private _status: BetStatus;
  private _cashoutMultiplier: number | null;
  private _payout: Money | null;

  constructor(props: {
    id: string;
    roundId: string;
    playerId: string;
    amount: Money;
    placedAt: Date;
    status: BetStatus;
    cashoutMultiplier: number | null;
    payout: Money | null;
  }) {
    this.id = props.id;
    this.roundId = props.roundId;
    this.playerId = props.playerId;
    this.amount = props.amount;
    this.placedAt = props.placedAt;
    this._status = props.status;
    this._cashoutMultiplier = props.cashoutMultiplier;
    this._payout = props.payout;
  }

  get status(): BetStatus {
    return this._status;
  }

  get cashoutMultiplier(): number | null {
    return this._cashoutMultiplier;
  }

  get payout(): Money | null {
    return this._payout;
  }

  isPending(): boolean {
    return this._status === "pending";
  }

  cashout(multiplier: number): void {
    if (!this.isPending()) {
      throw new BetAlreadySettledError();
    }
    this._cashoutMultiplier = multiplier;
    this._payout = this.amount.multiply(multiplier);
    this._status = "cashed_out";
  }

  lose(): void {
    if (!this.isPending()) {
      throw new BetAlreadySettledError();
    }
    this._status = "lost";
  }
}
