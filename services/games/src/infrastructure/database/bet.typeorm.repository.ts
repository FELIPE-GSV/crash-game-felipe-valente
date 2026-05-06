import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Bet } from "../../domain/bet";
import { Money } from "../../domain/money";
import type { BetRepository } from "../../application/bet.repository";
import { BetEntity } from "./bet.entity";

@Injectable()
export class BetTypeOrmRepository implements BetRepository {
  constructor(
    @InjectRepository(BetEntity)
    private readonly repo: Repository<BetEntity>,
  ) {}

  async save(bet: Bet): Promise<void> {
    await this.repo.save(this.toEntity(bet));
  }

  async saveMany(bets: Bet[]): Promise<void> {
    if (bets.length === 0) return;
    await this.repo.save(bets.map((b) => this.toEntity(b)));
  }

  async findByRoundAndPlayer(roundId: string, playerId: string): Promise<Bet | null> {
    const entity = await this.repo.findOne({ where: { roundId, playerId } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByPlayer(playerId: string, page: number, limit: number): Promise<Bet[]> {
    const entities = await this.repo.find({
      where: { playerId },
      order: { placedAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toEntity(bet: Bet): BetEntity {
    const entity = new BetEntity();
    entity.id = bet.id;
    entity.roundId = bet.roundId;
    entity.playerId = bet.playerId;
    entity.amount = bet.amount.toCents().toString();
    entity.status = bet.status;
    entity.cashoutMultiplier = bet.cashoutMultiplier?.toString() ?? null;
    entity.payout = bet.payout?.toCents().toString() ?? null;
    return entity;
  }

  private toDomain(entity: BetEntity): Bet {
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
