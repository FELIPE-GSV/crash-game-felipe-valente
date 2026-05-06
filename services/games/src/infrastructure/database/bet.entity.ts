import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { RoundEntity } from "./round.entity";

export type BetStatus = "pending" | "cashed_out" | "lost";

@Entity({ name: "bets" })
export class BetEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "round_id", type: "uuid" })
  roundId!: string;

  @Index()
  @Column({ name: "player_id", type: "uuid" })
  playerId!: string;

  @Column({ type: "bigint" })
  amount!: string;

  @Column({ type: "varchar", default: "pending" })
  status!: BetStatus;

  @Column({ name: "cashout_multiplier", type: "numeric", precision: 10, scale: 2, nullable: true })
  cashoutMultiplier!: string | null;

  @Column({ type: "bigint", nullable: true })
  payout!: string | null;

  @CreateDateColumn({ name: "placed_at" })
  placedAt!: Date;

  @ManyToOne(() => RoundEntity, (round) => round.bets)
  round!: RoundEntity;
}
