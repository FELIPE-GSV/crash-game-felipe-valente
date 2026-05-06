import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { GamesController } from "./presentation/controllers/games.controller";
import { dataSourceOptions } from "./infrastructure/database/data-source";
import { RoundEntity } from "./infrastructure/database/round.entity";
import { BetEntity } from "./infrastructure/database/bet.entity";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(dataSourceOptions),
    TypeOrmModule.forFeature([RoundEntity, BetEntity]),
  ],
  controllers: [GamesController],
})
export class AppModule {}
