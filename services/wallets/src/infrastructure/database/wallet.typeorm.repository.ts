import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Wallet } from "../../domain/wallet";
import { Money } from "../../domain/money";
import type { WalletRepository } from "../../application/wallet.repository";
import { WalletEntity } from "./wallet.entity";

@Injectable()
export class WalletTypeOrmRepository implements WalletRepository {
  constructor(
    @InjectRepository(WalletEntity)
    private readonly repo: Repository<WalletEntity>,
  ) {}

  async create(playerId: string, initialBalance: Money): Promise<Wallet> {
    const entity = this.repo.create({
      playerId,
      balance: initialBalance.toCents().toString(),
    });
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async findByPlayerId(playerId: string): Promise<Wallet | null> {
    const entity = await this.repo.findOne({ where: { playerId } });
    return entity ? this.toDomain(entity) : null;
  }

  async atomicDebit(playerId: string, amount: Money): Promise<Wallet | null> {
    const result = await this.repo
      .createQueryBuilder()
      .update(WalletEntity)
      .set({
        balance: () => `balance - ${amount.toCents().toString()}`,
        updatedAt: () => "now()",
      })
      .where("player_id = :playerId", { playerId })
      .andWhere("balance >= :amount", { amount: amount.toCents().toString() })
      .returning("*")
      .execute();

    const row = result.raw?.[0];
    return row ? this.toDomain(this.normalizeRaw(row)) : null;
  }

  async atomicCredit(playerId: string, amount: Money): Promise<Wallet | null> {
    const result = await this.repo
      .createQueryBuilder()
      .update(WalletEntity)
      .set({
        balance: () => `balance + ${amount.toCents().toString()}`,
        updatedAt: () => "now()",
      })
      .where("player_id = :playerId", { playerId })
      .returning("*")
      .execute();

    const row = result.raw?.[0];
    return row ? this.toDomain(this.normalizeRaw(row)) : null;
  }

  private normalizeRaw(row: Record<string, unknown>): WalletEntity {
    const entity = new WalletEntity();
    entity.id = row.id as string;
    entity.playerId = (row.player_id ?? row.playerId) as string;
    entity.balance = String(row.balance);
    entity.createdAt = new Date(row.created_at as string ?? row.createdAt as string);
    entity.updatedAt = new Date(row.updated_at as string ?? row.updatedAt as string);
    return entity;
  }

  private toDomain(entity: WalletEntity): Wallet {
    return new Wallet({
      id: entity.id,
      playerId: entity.playerId,
      balance: Money.fromCents(entity.balance),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
