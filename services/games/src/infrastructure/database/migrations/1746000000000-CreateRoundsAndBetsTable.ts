import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRoundsAndBetsTable1746000000000 implements MigrationInterface {
  name = "CreateRoundsAndBetsTable1746000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE "rounds" (
        "id"               uuid        NOT NULL DEFAULT uuid_generate_v4(),
        "status"           varchar     NOT NULL DEFAULT 'betting',
        "crash_point"      numeric(10,2) NOT NULL,
        "server_seed"      varchar     NOT NULL,
        "server_seed_hash" varchar     NOT NULL,
        "started_at"       timestamptz,
        "crashed_at"       timestamptz,
        "created_at"       timestamptz NOT NULL DEFAULT now(),
        "updated_at"       timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_rounds_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_rounds_status" ON "rounds" ("status")
    `);

    await queryRunner.query(`
      CREATE TABLE "bets" (
        "id"                 uuid        NOT NULL DEFAULT uuid_generate_v4(),
        "round_id"           uuid        NOT NULL,
        "player_id"          uuid        NOT NULL,
        "amount"             bigint      NOT NULL,
        "status"             varchar     NOT NULL DEFAULT 'pending',
        "cashout_multiplier" numeric(10,2),
        "payout"             bigint,
        "placed_at"          timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bets_id"            PRIMARY KEY ("id"),
        CONSTRAINT "UQ_bets_round_player"  UNIQUE ("round_id", "player_id"),
        CONSTRAINT "FK_bets_round_id"      FOREIGN KEY ("round_id") REFERENCES "rounds" ("id"),
        CONSTRAINT "CHK_bets_amount"       CHECK ("amount" >= 100),
        CONSTRAINT "CHK_bets_amount_max"   CHECK ("amount" <= 100000)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_bets_round_id"  ON "bets" ("round_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_bets_player_id" ON "bets" ("player_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_bets_player_id"`);
    await queryRunner.query(`DROP INDEX "IDX_bets_round_id"`);
    await queryRunner.query(`DROP TABLE "bets"`);
    await queryRunner.query(`DROP INDEX "IDX_rounds_status"`);
    await queryRunner.query(`DROP TABLE "rounds"`);
  }
}
