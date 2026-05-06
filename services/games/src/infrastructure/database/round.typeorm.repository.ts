import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Round } from "../../domain/round";
import { Bet } from "../../domain/bet";
import { Money } from "../../domain/money";
import type { RoundRepository } from "../../application/round.repository";
import { RoundEntity } from "./round.entity";
import { BetEntity } from "./bet.entity";

@Injectable()
export class RoundTypeOrmRepository implements RoundRepository {
  constructor(
    @InjectRepository(RoundEntity)
    private readonly repo: Repository<RoundEntity>,
  ) {}

  async save(round: Round): Promise<void> {
    await this.repo.save(this.toEntity(round));
  }

  async findCurrent(): Promise<Round | null> {
    const entity = await this.repo.findOne({
      where: [{ status: "betting" }, { status: "running" }],
      relations: ["bets"],
      order: { createdAt: "DESC" },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findById(id: string): Promise<Round | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ["bets"],
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findHistory(page: number, limit: number): Promise<Round[]> {
    const entities = await this.repo.find({
      where: { status: "crashed" },
      order: { crashedAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toEntity(round: Round): RoundEntity {
    const entity = new RoundEntity();
    entity.id = round.id;
    entity.status = round.status;
    entity.crashPoint = round.crashPoint.toString();
    entity.serverSeed = round.serverSeed;
    entity.serverSeedHash = round.serverSeedHash;
    entity.startedAt = round.startedAt;
    entity.crashedAt = round.crashedAt;
    return entity;
  }

  private toDomain(entity: RoundEntity): Round {
    const bets = (entity.bets ?? []).map((b) => this.betToDomain(b));
    return new Round({
      id: entity.id,
      status: entity.status,
      crashPoint: parseFloat(entity.crashPoint),
      serverSeed: entity.serverSeed,
      serverSeedHash: entity.serverSeedHash,
      startedAt: entity.startedAt,
      crashedAt: entity.crashedAt,
      createdAt: entity.createdAt,
      bets,
    });
  }

  private betToDomain(entity: BetEntity): Bet {
    return new Bet({
      id: entity.id,
      roundId: entity.roundId,
      playerId: entity.playerId,
      amount: Money.fromCents(entity.amount),
      placedAt: entity.placedAt,
      status: entity.status,
      cashoutMultiplier: entity.cashoutMultiplier ? parseFloat(entity.cashoutMultiplier) : null,
      payout: entity.payout ? Money.fromCents(entity.payout) : null,
    });
  }
}
