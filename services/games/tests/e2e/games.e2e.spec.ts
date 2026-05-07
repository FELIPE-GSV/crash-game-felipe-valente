import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { Test } from "@nestjs/testing";
import { ExecutionContext, INestApplication, ValidationPipe } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import request from "supertest";
import { of } from "rxjs";

import { RoundsController, BetsController, GamesController } from "../../src/presentation/controllers/games.controller";
import { DomainErrorFilter } from "../../src/presentation/filters/domain-error.filter";
import { GameService, WALLET_CLIENT } from "../../src/application/game.service";
import { ROUND_REPOSITORY } from "../../src/application/round.repository";
import { BET_REPOSITORY } from "../../src/application/bet.repository";
import { JwtAuthGuard } from "../../src/infrastructure/auth/jwt-auth.guard";
import { GameGateway } from "../../src/infrastructure/websocket/game.gateway";
import { Round } from "../../src/domain/round";
import { Bet } from "../../src/domain/bet";
import { Money } from "../../src/domain/money";
import type { RoundRepository } from "../../src/application/round.repository";
import type { BetRepository } from "../../src/application/bet.repository";
import { createHash } from "crypto";

// ---- fakes (idênticos aos de unit, duplicação intencional — e2e é independente) ----

class FakeRoundRepo implements RoundRepository {
  rounds: Round[] = [];

  async save(round: Round): Promise<void> {
    const idx = this.rounds.findIndex((r) => r.id === round.id);
    if (idx >= 0) this.rounds[idx] = round;
    else this.rounds.push(round);
  }

  async findCurrent(): Promise<Round | null> {
    return this.rounds.at(-1) ?? null;
  }

  async findById(id: string): Promise<Round | null> {
    return this.rounds.find((r) => r.id === id) ?? null;
  }

  async findHistory(_page: number, _limit: number): Promise<Round[]> {
    return [...this.rounds].reverse();
  }
}

class FakeBetRepo implements BetRepository {
  bets: Bet[] = [];

  async save(bet: Bet): Promise<void> {
    const idx = this.bets.findIndex((b) => b.id === bet.id);
    if (idx >= 0) this.bets[idx] = bet;
    else this.bets.push(bet);
  }

  async saveMany(bets: Bet[]): Promise<void> {
    for (const b of bets) await this.save(b);
  }

  async findByRoundAndPlayer(roundId: string, playerId: string): Promise<Bet | null> {
    return this.bets.find((b) => b.roundId === roundId && b.playerId === playerId) ?? null;
  }

  async findByPlayer(playerId: string, _page: number, _limit: number): Promise<Bet[]> {
    return this.bets.filter((b) => b.playerId === playerId);
  }
}

// ---- constantes ----

const PLAYER_ID = "00000000-0000-0000-0000-000000000001";
const PLAYER_ID_2 = "00000000-0000-0000-0000-000000000002";

// ---- setup ----

let app: INestApplication;
let roundRepo: FakeRoundRepo;
let betRepo: FakeBetRepo;
let currentPlayerId = PLAYER_ID;

async function buildApp(walletClient: any = null) {
  roundRepo = new FakeRoundRepo();
  betRepo = new FakeBetRepo();

  const builder = Test.createTestingModule({
    controllers: [GamesController, RoundsController, BetsController],
    providers: [
      GameService,
      { provide: ROUND_REPOSITORY, useValue: roundRepo },
      { provide: BET_REPOSITORY, useValue: betRepo },
      { provide: APP_FILTER, useClass: DomainErrorFilter },
      { provide: GameGateway, useValue: { emitBetPlaced: () => {}, emitBetCashedOut: () => {} } },
      ...(walletClient ? [{ provide: WALLET_CLIENT, useValue: walletClient }] : []),
    ],
  }).overrideGuard(JwtAuthGuard).useValue({
    canActivate: (ctx: ExecutionContext) => {
      ctx.switchToHttp().getRequest().user = { sub: currentPlayerId };
      return true;
    },
  });

  const moduleRef = await builder.compile();
  const instance = moduleRef.createNestApplication();
  instance.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  await instance.init();
  return instance;
}

// helpers

let _roundSeq = 0;
function seedBettingRound(crashPoint = 5.0) {
  const id = `round-${++_roundSeq}`;
  const round = new Round({
    id,
    status: "betting",
    crashPoint,
    serverSeed: "test-server-seed-123",
    serverSeedHash: createHash("sha256").update("test-server-seed-123").digest("hex"),
    startedAt: null,
    crashedAt: null,
    createdAt: new Date(),
    bets: [],
  });
  roundRepo.rounds.push(round);
  return round;
}

function advanceRoundToRunning(round: Round, elapsedMs = 5000) {
  round.start();
  (round as any)._startedAt = new Date(Date.now() - elapsedMs);
}

// ============================
// Cenário 1: bet → cashout → saldo
// ============================

describe("Cenário 1: apostar → cashout → saldo atualizado", () => {
  beforeAll(async () => {
    app = await buildApp(null);
  });
  afterAll(() => app.close());

  it("POST /bet cria bet com status pending", async () => {
    seedBettingRound();
    const res = await request(app.getHttpServer())
      .post("/bet")
      .send({ amount: 1000 });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("pending");
    expect(res.body.amount).toBe("1000");
  });

  it("POST /bet/cashout retorna bet cashed_out com payout", async () => {
    const round = roundRepo.rounds.at(-1)!;
    advanceRoundToRunning(round, 5000);

    const res = await request(app.getHttpServer()).post("/bet/cashout");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("cashed_out");
    expect(parseFloat(res.body.cashoutMultiplier)).toBeGreaterThan(1.0);
    expect(BigInt(res.body.payout)).toBeGreaterThan(1000n);
  });
});

// ============================
// Cenário 2: bet → crash → aposta perdida
// ============================

describe("Cenário 2: apostar → crash → aposta perdida", () => {
  beforeAll(async () => {
    app = await buildApp(null);
  });
  afterAll(() => app.close());

  it("aposta é registrada e após crash fica lost", async () => {
    const round = seedBettingRound(1.5);

    // aposta
    const betRes = await request(app.getHttpServer())
      .post("/bet")
      .send({ amount: 2000 });
    expect(betRes.status).toBe(201);

    // iniciar + crashar via service diretamente (sem HTTP, não há endpoint público)
    advanceRoundToRunning(round, 500);
    await (app as any).get(GameService).crashRound(round.id);

    // verificar histórico
    const histRes = await request(app.getHttpServer()).get("/bets/me");
    expect(histRes.status).toBe(200);
    const lostBet = histRes.body[0];
    expect(lostBet.status).toBe("lost");
    expect(lostBet.payout).toBeNull();
  });
});

// ============================
// Cenário 3: saldo insuficiente (wallet client retorna erro)
// ============================

describe("Cenário 3: saldo insuficiente", () => {
  beforeAll(async () => {
    const failClient = { send: () => of({ ok: false, error: "INSUFFICIENT_FUNDS" }) };
    app = await buildApp(failClient);
  });
  afterAll(() => app.close());

  it("POST /bet → 422 INSUFFICIENT_FUNDS, bet não persiste", async () => {
    seedBettingRound();
    const res = await request(app.getHttpServer())
      .post("/bet")
      .send({ amount: 50000 });
    expect(res.status).toBe(422);
    expect(res.body.error).toBe("INSUFFICIENT_FUNDS");
    expect(betRepo.bets).toHaveLength(0);
  });
});

// ============================
// Cenário 4: aposta dupla (mesmo player)
// ============================

describe("Cenário 4: aposta dupla", () => {
  beforeAll(async () => { app = await buildApp(); });
  afterAll(() => app.close());

  it("POST /bet duas vezes → 409 PLAYER_ALREADY_BET", async () => {
    seedBettingRound();
    await request(app.getHttpServer()).post("/bet").send({ amount: 1000 });
    const res = await request(app.getHttpServer()).post("/bet").send({ amount: 1000 });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("PLAYER_ALREADY_BET");
  });
});

// ============================
// Cenário 5: aposta durante rodada ativa
// ============================

describe("Cenário 5: aposta durante rodada running", () => {
  beforeAll(async () => { app = await buildApp(); });
  afterAll(() => app.close());

  it("POST /bet em round running → 409 ROUND_NOT_IN_BETTING_PHASE", async () => {
    const round = seedBettingRound();
    advanceRoundToRunning(round);

    const res = await request(app.getHttpServer())
      .post("/bet")
      .send({ amount: 1000 });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ROUND_NOT_IN_BETTING_PHASE");
  });
});

// ============================
// Cenário 6: cashout sem aposta
// ============================

describe("Cenário 6: cashout sem aposta", () => {
  beforeAll(async () => { app = await buildApp(); });
  afterAll(() => app.close());

  it("POST /bet/cashout sem aposta prévia → 404 BET_NOT_FOUND", async () => {
    const round = seedBettingRound();
    advanceRoundToRunning(round);

    const res = await request(app.getHttpServer()).post("/bet/cashout");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("BET_NOT_FOUND");
  });
});

// ============================
// Cenário 7: cashout em fase de apostas
// ============================

describe("Cenário 7: cashout em fase de apostas", () => {
  beforeAll(async () => { app = await buildApp(); });
  afterAll(() => app.close());

  it("POST /bet/cashout em betting → 409 ROUND_NOT_RUNNING", async () => {
    seedBettingRound();
    const res = await request(app.getHttpServer()).post("/bet/cashout");
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ROUND_NOT_RUNNING");
  });
});

// ============================
// Cenário 8: provably fair — GET /rounds/:roundId/verify
// ============================

describe("Cenário 8: provably fair verify", () => {
  beforeAll(async () => { app = await buildApp(); });
  afterAll(() => app.close());

  it("GET /rounds/:id/verify retorna serverSeed, serverSeedHash e crashPoint", async () => {
    const round = seedBettingRound(3.14);
    advanceRoundToRunning(round);
    await (app as any).get(GameService).crashRound(round.id);

    const res = await request(app.getHttpServer()).get(`/rounds/${round.id}/verify`);
    expect(res.status).toBe(200);
    expect(res.body.serverSeed).toBe("test-server-seed-123");
    expect(res.body.serverSeedHash).toHaveLength(64);
    expect(res.body.crashPoint).toBe(3.14);
  });

  it("sha256(serverSeed) === serverSeedHash (verificabilidade)", async () => {
    const round = seedBettingRound(2.0);
    advanceRoundToRunning(round);
    await (app as any).get(GameService).crashRound(round.id);

    const res = await request(app.getHttpServer()).get(`/rounds/${round.id}/verify`);
    const recalcHash = createHash("sha256").update(res.body.serverSeed).digest("hex");
    expect(recalcHash).toBe(res.body.serverSeedHash);
  });

  it("GET /rounds/:id/verify com roundId inexistente → 404", async () => {
    const res = await request(app.getHttpServer()).get("/rounds/nao-existe/verify");
    expect(res.status).toBe(404);
  });
});
