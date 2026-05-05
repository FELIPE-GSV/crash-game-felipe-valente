import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";

import { WalletsController } from "./presentation/controllers/wallets.controller";
import { DomainErrorFilter } from "./presentation/filters/domain-error.filter";

import { WalletService } from "./application/wallet.service";
import { WALLET_REPOSITORY } from "./application/wallet.repository";

import { dataSourceOptions } from "./infrastructure/database/data-source";
import { WalletEntity } from "./infrastructure/database/wallet.entity";
import { WalletTypeOrmRepository } from "./infrastructure/database/wallet.typeorm.repository";
import { JwtStrategy } from "./infrastructure/auth/jwt.strategy";
import { WalletRmqController } from "./infrastructure/messaging/wallet.rmq.controller";

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    TypeOrmModule.forFeature([WalletEntity]),
    PassportModule.register({ defaultStrategy: "jwt" }),
  ],
  controllers: [WalletsController, WalletRmqController],
  providers: [
    WalletService,
    JwtStrategy,
    { provide: WALLET_REPOSITORY, useClass: WalletTypeOrmRepository },
    { provide: APP_FILTER, useClass: DomainErrorFilter },
  ],
})
export class AppModule {}
