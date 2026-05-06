import { Round } from "../domain/round";

export const ROUND_REPOSITORY: unique symbol = Symbol("ROUND_REPOSITORY");

export interface RoundRepository {
  save(round: Round): Promise<void>;
  findCurrent(): Promise<Round | null>;
  findById(id: string): Promise<Round | null>;
  findHistory(page: number, limit: number): Promise<Round[]>;
}
