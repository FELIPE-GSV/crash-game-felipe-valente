import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWalletsTable1714900000000 implements MigrationInterface {
  name = "CreateWalletsTable1714900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE "wallets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "player_id" uuid NOT NULL,
        "balance" bigint NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wallets_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_wallets_player_id" UNIQUE ("player_id"),
        CONSTRAINT "CHK_wallets_balance_non_negative" CHECK ("balance" >= 0)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_wallets_player_id" ON "wallets" ("player_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_wallets_player_id"`);
    await queryRunner.query(`DROP TABLE "wallets"`);
  }
}
