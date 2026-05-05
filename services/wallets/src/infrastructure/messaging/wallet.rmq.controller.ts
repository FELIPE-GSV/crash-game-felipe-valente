import { Controller, Logger } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { WalletService } from "../../application/wallet.service";
import { Money } from "../../domain/money";
import { WalletDomainError } from "../../domain/errors";

interface WalletCommandPayload {
  playerId: string;
  amount: string | number;
  reason?: string;
  correlationId?: string;
}

interface WalletCommandReply {
  ok: boolean;
  balance?: string;
  error?: string;
  correlationId?: string;
}

@Controller()
export class WalletRmqController {
  private readonly logger = new Logger(WalletRmqController.name);

  constructor(private readonly walletService: WalletService) {}

  @MessagePattern("wallet.debit")
  async onDebit(@Payload() payload: WalletCommandPayload): Promise<WalletCommandReply> {
    try {
      const wallet = await this.walletService.debit(
        payload.playerId,
        Money.fromCents(payload.amount.toString()),
      );
      return {
        ok: true,
        balance: wallet.balance.toString(),
        correlationId: payload.correlationId,
      };
    } catch (err) {
      return this.toReply(err, payload.correlationId);
    }
  }

  @MessagePattern("wallet.credit")
  async onCredit(@Payload() payload: WalletCommandPayload): Promise<WalletCommandReply> {
    try {
      const wallet = await this.walletService.credit(
        payload.playerId,
        Money.fromCents(payload.amount.toString()),
      );
      return {
        ok: true,
        balance: wallet.balance.toString(),
        correlationId: payload.correlationId,
      };
    } catch (err) {
      return this.toReply(err, payload.correlationId);
    }
  }

  private toReply(err: unknown, correlationId?: string): WalletCommandReply {
    if (err instanceof WalletDomainError) {
      this.logger.warn(`[${correlationId}] ${err.code}: ${err.message}`);
      return { ok: false, error: err.code, correlationId };
    }
    this.logger.error(`[${correlationId}] erro inesperado`, err as Error);
    return { ok: false, error: "INTERNAL_ERROR", correlationId };
  }
}
