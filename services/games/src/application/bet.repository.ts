import { Bet } from "../domain/bet";

export const BET_REPOSITORY: unique symbol = Symbol("BET_REPOSITORY");

export interface BetRepository {
  save(bet: Bet): Promise<void>;
  saveMany(bets: Bet[]): Promise<void>;
  findByRoundAndPlayer(roundId: string, playerId: string): Promise<Bet | null>;
  findByPlayer(playerId: string, page: number, limit: number): Promise<Bet[]>;
}
