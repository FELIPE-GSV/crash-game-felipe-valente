import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { BetEntity } from "./bet.entity";

export type RoundStatus = "betting" | "running" | "crashed";

@Entity({ name: "rounds" })
export class RoundEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", default: "betting" })
  status!: RoundStatus;

  @Column({ name: "crash_point", type: "numeric", precision: 10, scale: 2 })
  crashPoint!: string;

  @Column({ name: "server_seed", type: "varchar" })
  serverSeed!: string;

  @Column({ name: "server_seed_hash", type: "varchar" })
  serverSeedHash!: string;

  @Column({ name: "started_at", type: "timestamptz", nullable: true })
  startedAt!: Date | null;

  @Column({ name: "crashed_at", type: "timestamptz", nullable: true })
  crashedAt!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => BetEntity, (bet) => bet.round)
  bets!: BetEntity[];
}
