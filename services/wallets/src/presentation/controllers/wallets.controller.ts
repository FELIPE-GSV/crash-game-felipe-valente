import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { WalletService } from "../../application/wallet.service";
import { JwtAuthGuard } from "../../infrastructure/auth/jwt-auth.guard";
import { CurrentPlayer } from "../../infrastructure/auth/current-player.decorator";
import { WalletResponseDto } from "../dtos/wallet-response.dto";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";

@ApiTags("wallets")
@Controller()
export class WalletsController {
  constructor(private readonly walletService: WalletService) {}

  @Get("health")
  @ApiOperation({ summary: "Health check do serviço" })
  @ApiResponse({ status: 200, type: HealthCheckResponseDto })
  health(): HealthCheckResponseDto {
    return { status: "ok", service: "wallets" };
  }

  @Post("wallets")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Cria a carteira do jogador autenticado" })
  @ApiResponse({ status: 201, type: WalletResponseDto })
  @ApiResponse({ status: 401, description: "Sem token / token inválido" })
  @ApiResponse({ status: 409, description: "Jogador já possui carteira" })
  async create(@CurrentPlayer() playerId: string): Promise<WalletResponseDto> {
    const wallet = await this.walletService.createWallet(playerId);
    return WalletResponseDto.fromDomain(wallet);
  }

  @Get("wallets/me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Retorna a carteira do jogador autenticado" })
  @ApiResponse({ status: 200, type: WalletResponseDto })
  @ApiResponse({ status: 401, description: "Sem token / token inválido" })
  @ApiResponse({ status: 404, description: "Carteira não encontrada" })
  async getMine(@CurrentPlayer() playerId: string): Promise<WalletResponseDto> {
    const wallet = await this.walletService.getByPlayerId(playerId);
    return WalletResponseDto.fromDomain(wallet);
  }
}
