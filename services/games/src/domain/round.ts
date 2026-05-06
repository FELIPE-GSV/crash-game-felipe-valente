import { Bet } from "./bet";
import { Money } from "./money";
import {
  BetNotFoundError,
  InvalidBetAmountError,
  PlayerAlreadyBetError,
  RoundNotInBettingPhaseError,
  RoundNotRunningError,
} from "./errors";

export type RoundStatus = "betting" | "running" | "crashed";

const MIN_BET = Money.fromCents(100);
const MAX_BET = Money.fromCents(100_000);

export class Round {
  readonly id: string;
  readonly crashPoint: number;
  readonly serverSeed: string;
  readonly serverSeedHash: string;
  readonly createdAt: Date;
  private _status: RoundStatus;
  private _startedAt: Date | null;
  private _crashedAt: Date | null;
  private _bets: Bet[];

  constructor(props: {
    id: string;
    status: RoundStatus;
    crashPoint: number;
    serverSeed: string;
    serverSeedHash: string;
    startedAt: Date | null;
    crashedAt: Date | null;
    createdAt: Date;
    bets: Bet[];
  }) {
    this.id = props.id;
    this._status = props.status;
    this.crashPoint = props.crashPoint;
    this.serverSeed = props.serverSeed;
    this.serverSeedHash = props.serverSeedHash;
    this._startedAt = props.startedAt;
    this._crashedAt = props.crashedAt;
    this.createdAt = props.createdAt;
    this._bets = props.bets;
  }

  get status(): RoundStatus {
    return this._status;
  }

  get startedAt(): Date | null {
    return this._startedAt;
  }

  get crashedAt(): Date | null {
    return this._crashedAt;
  }

  get bets(): ReadonlyArray<Bet> {
    return this._bets;
  }

  placeBet(playerId: string, amount: Money): Bet {
    if (this._status !== "betting") {
      throw new RoundNotInBettingPhaseError();
    }
    if (amount.isLessThan(MIN_BET) || amount.isGreaterThan(MAX_BET)) {
      throw new InvalidBetAmountError();
    }
    if (this._bets.some((b) => b.playerId === playerId)) {
      throw new PlayerAlreadyBetError();
    }

    const bet = new Bet({
      id: crypto.randomUUID(),
      roundId: this.id,
      playerId,
      amount,
      placedAt: new Date(),
      status: "pending",
      cashoutMultiplier: null,
      payout: null,
    });

    this._bets.push(bet);
    return bet;
  }

  start(): void {
    if (this._status !== "betting") {
      throw new RoundNotInBettingPhaseError();
    }
    this._status = "running";
    this._startedAt = new Date();
  }

  cashoutPlayer(playerId: string, currentMultiplier: number): Bet {
    if (this._status !== "running") {
      throw new RoundNotRunningError();
    }
    const bet = this._bets.find((b) => b.playerId === playerId);
    if (!bet) {
      throw new BetNotFoundError();
    }
    bet.cashout(currentMultiplier);
    return bet;
  }

  crash(): Bet[] {
    if (this._status !== "running") {
      throw new RoundNotRunningError();
    }
    this._status = "crashed";
    this._crashedAt = new Date();

    const lost: Bet[] = [];
    for (const bet of this._bets) {
      if (bet.isPending()) {
        bet.lose();
        lost.push(bet);
      }
    }
    return lost;
  }
}
