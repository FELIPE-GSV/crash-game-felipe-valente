import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PassportModule } from "@nestjs/passport";
import { ClientsModule, Transport } from "@nestjs/microservices";

import { dataSourceOptions } from "./infrastructure/database/data-source";
import { RoundEntity } from "./infrastructure/database/round.entity";
import { BetEntity } from "./infrastructure/database/bet.entity";
import { RoundTypeOrmRepository } from "./infrastructure/database/round.typeorm.repository";
import { BetTypeOrmRepository } from "./infrastructure/database/bet.typeorm.repository";
import { JwtStrategy } from "./infrastructure/auth/jwt.strategy";
import { GameLoopService } from "./infrastructure/scheduler/game-loop.service";

import { ROUND_REPOSITORY } from "./application/round.repository";
import { BET_REPOSITORY } from "./application/bet.repository";
import { GameService, WALLET_CLIENT } from "./application/game.service";

import { GamesController, RoundsController, BetsController } from "./presentation/controllers/games.controller";
import { DomainErrorFilter } from "./presentation/filters/domain-error.filter";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(dataSourceOptions),
    TypeOrmModule.forFeature([RoundEntity, BetEntity]),
    PassportModule.register({ defaultStrategy: "jwt" }),
    ClientsModule.registerAsync([
      {
        name: WALLET_CLIENT,
        useFactory: () => ({
          transport: Transport.RMQ,
          options: {
            urls: [process.env.RABBITMQ_URL ?? "amqp://admin:admin@rabbitmq:5672"],
            queue: process.env.WALLET_QUEUE ?? "wallet.commands",
            queueOptions: { durable: true },
          },
        }),
      },
    ]),
  ],
  controllers: [GamesController, RoundsController, BetsController],
  providers: [
    GameService,
    JwtStrategy,
    GameLoopService,
    { provide: ROUND_REPOSITORY, useClass: RoundTypeOrmRepository },
    { provide: BET_REPOSITORY, useClass: BetTypeOrmRepository },
    { provide: APP_FILTER, useClass: DomainErrorFilter },
  ],
})
export class AppModule {}
