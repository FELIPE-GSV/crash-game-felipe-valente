import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";

@WebSocketGateway({ cors: { origin: "*" } })
export class GameGateway {
  @WebSocketServer()
  private readonly server: Server;

  emitRoundNew(payload: { roundId: string; serverSeedHash: string; bettingEndsAt: string }): void {
    this.server.emit("round:new", payload);
  }

  emitRoundStarted(payload: { roundId: string; startedAt: string }): void {
    this.server.emit("round:started", payload);
  }

  emitTick(payload: { roundId: string; multiplier: number; elapsedMs: number }): void {
    this.server.emit("round:tick", payload);
  }

  emitRoundCrashed(payload: { roundId: string; crashPoint: number; crashedAt: string }): void {
    this.server.emit("round:crashed", payload);
  }

  emitBetPlaced(payload: { roundId: string; playerId: string; amountCents: number }): void {
    this.server.emit("bet:placed", payload);
  }

  emitBetCashedOut(payload: {
    roundId: string;
    playerId: string;
    multiplier: number;
    payoutCents: number;
  }): void {
    this.server.emit("bet:cashedout", payload);
  }
}
