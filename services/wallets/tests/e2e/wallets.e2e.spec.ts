import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Test } from "@nestjs/testing";
import { ExecutionContext, INestApplication } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import request from "supertest";

import { WalletsController } from "../../src/presentation/controllers/wallets.controller";
import { DomainErrorFilter } from "../../src/presentation/filters/domain-error.filter";
import { WalletService } from "../../src/application/wallet.service";
import { WALLET_REPOSITORY } from "../../src/application/wallet.repository";
import type { WalletRepository } from "../../src/application/wallet.repository";
import { Wallet } from "../../src/domain/wallet";
import { Money } from "../../src/domain/money";
import { JwtAuthGuard } from "../../src/infrastructure/auth/jwt-auth.guard";

class FakeRepo implements WalletRepository {
  private wallets = new Map<string, Wallet>();

  async create(playerId: string, initialBalance: Money): Promise<Wallet> {
    const wallet = new Wallet({
      id: `wallet-${playerId}`,
      playerId,
      balance: initialBalance,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.wallets.set(playerId, wallet);
    return wallet;
  }

  async findByPlayerId(playerId: string): Promise<Wallet | null> {
    return this.wallets.get(playerId) ?? null;
  }

  async atomicDebit(playerId: string, amount: Money): Promise<Wallet | null> {
    const w = this.wallets.get(playerId);
    if (!w || w.balance.isLessThan(amount)) return null;
    w.debit(amount);
    return w;
  }

  async atomicCredit(playerId: string, amount: Money): Promise<Wallet | null> {
    const w = this.wallets.get(playerId);
    if (!w) return null;
    w.credit(amount);
    return w;
  }
}

const FAKE_PLAYER_ID = "00000000-0000-0000-0000-000000000001";

describe("Wallets HTTP (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.INITIAL_BALANCE_CENTS = "5000";

    const moduleRef = await Test.createTestingModule({
      controllers: [WalletsController],
      providers: [
        WalletService,
        { provide: WALLET_REPOSITORY, useClass: FakeRepo },
        { provide: APP_FILTER, useClass: DomainErrorFilter },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          ctx.switchToHttp().getRequest().user = { sub: FAKE_PLAYER_ID };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health responde 200", async () => {
    const res = await request(app.getHttpServer()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", service: "wallets" });
  });

  it("POST /wallets cria carteira com saldo inicial", async () => {
    const res = await request(app.getHttpServer()).post("/wallets");
    expect(res.status).toBe(201);
    expect(res.body.playerId).toBe(FAKE_PLAYER_ID);
    expect(res.body.balance).toBe("5000");
  });

  it("POST /wallets duas vezes → 409", async () => {
    const res = await request(app.getHttpServer()).post("/wallets");
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("WALLET_ALREADY_EXISTS");
  });

  it("GET /wallets/me retorna o saldo atual", async () => {
    const res = await request(app.getHttpServer()).get("/wallets/me");
    expect(res.status).toBe(200);
    expect(res.body.balance).toBe("5000");
  });
});
