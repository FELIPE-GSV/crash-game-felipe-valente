import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";

import { GameService } from "../../application/game.service";
import { JwtAuthGuard } from "../../infrastructure/auth/jwt-auth.guard";
import { CurrentPlayer } from "../../infrastructure/auth/current-player.decorator";

import { PlaceBetDto } from "../dtos/place-bet.dto";
import { RoundResponseDto } from "../dtos/round-response.dto";
import { BetResponseDto } from "../dtos/bet-response.dto";
import { VerifyResponseDto } from "../dtos/verify-response.dto";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";

@ApiTags("health")
@Controller()
export class GamesController {
  constructor(private readonly gameService: GameService) {}

  @Get("health")
  @ApiOperation({ summary: "Health check do serviço" })
  @ApiOkResponse({ type: HealthCheckResponseDto })
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "games" };
  }
}

@ApiTags("rounds")
@Controller("rounds")
export class RoundsController {
  constructor(private readonly gameService: GameService) {}

  @Get("current")
  @ApiOperation({ summary: "Estado da rodada atual" })
  @ApiOkResponse({ type: RoundResponseDto })
  async getCurrent(): Promise<RoundResponseDto | null> {
    const round = await this.gameService.getCurrentRound();
    return round ? RoundResponseDto.fromDomain(round) : null;
  }

  @Get("history")
  @ApiOperation({ summary: "Histórico paginado de rodadas" })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 20 })
  @ApiOkResponse({ type: [RoundResponseDto] })
  async getHistory(
    @Query("page") page = 1,
    @Query("limit") limit = 20,
  ): Promise<RoundResponseDto[]> {
    const rounds = await this.gameService.getHistory(Number(page), Number(limit));
    return rounds.map(RoundResponseDto.fromDomain);
  }

  @Get(":roundId/verify")
  @ApiOperation({ summary: "Dados de verificação provably fair" })
  @ApiOkResponse({ type: VerifyResponseDto })
  async verify(@Param("roundId") roundId: string): Promise<VerifyResponseDto> {
    const round = await this.gameService.getRoundForVerification(roundId);
    return VerifyResponseDto.fromDomain(round);
  }
}

@ApiTags("bets")
@Controller()
export class BetsController {
  constructor(private readonly gameService: GameService) {}

  @Get("bets/me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("bearer")
  @ApiOperation({ summary: "Histórico de apostas do jogador autenticado" })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 20 })
  @ApiOkResponse({ type: [BetResponseDto] })
  async getMyBets(
    @CurrentPlayer() playerId: string,
    @Query("page") page = 1,
    @Query("limit") limit = 20,
  ): Promise<BetResponseDto[]> {
    const bets = await this.gameService.getPlayerBets(playerId, Number(page), Number(limit));
    return bets.map(BetResponseDto.fromDomain);
  }

  @Post("bet")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("bearer")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Fazer aposta na rodada atual" })
  @ApiOkResponse({ type: BetResponseDto })
  async placeBet(
    @CurrentPlayer() playerId: string,
    @Body() dto: PlaceBetDto,
  ): Promise<BetResponseDto> {
    const bet = await this.gameService.placeBet(playerId, dto.amount);
    return BetResponseDto.fromDomain(bet);
  }

  @Post("bet/cashout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("bearer")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Sacar no multiplicador atual" })
  @ApiOkResponse({ type: BetResponseDto })
  async cashout(@CurrentPlayer() playerId: string): Promise<BetResponseDto> {
    const bet = await this.gameService.cashout(playerId);
    return BetResponseDto.fromDomain(bet);
  }
}
