import { Round } from "@/domain/round"

export interface RoundRepository {
  save(round: Round): Promise<void>
  findCurrent(): Promise<Round | null>
  findById(id: string): Promise<Round | null>
  findHistory(page: number, limit: number): Promise<Round[]>
}

