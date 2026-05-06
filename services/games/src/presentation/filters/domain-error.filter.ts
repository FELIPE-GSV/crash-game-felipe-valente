import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { GameDomainError } from "../../domain/errors";

const STATUS_BY_CODE: Record<string, number> = {
  ROUND_NOT_IN_BETTING_PHASE: HttpStatus.CONFLICT,
  ROUND_NOT_RUNNING: HttpStatus.CONFLICT,
  PLAYER_ALREADY_BET: HttpStatus.CONFLICT,
  BET_NOT_FOUND: HttpStatus.NOT_FOUND,
  BET_ALREADY_SETTLED: HttpStatus.CONFLICT,
  INVALID_BET_AMOUNT: HttpStatus.BAD_REQUEST,
  INSUFFICIENT_FUNDS: HttpStatus.UNPROCESSABLE_ENTITY,
  ROUND_NOT_FOUND: HttpStatus.NOT_FOUND,
};

@Catch(GameDomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(error: GameDomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = STATUS_BY_CODE[error.code] ?? HttpStatus.BAD_REQUEST;

    response.status(status).json({
      statusCode: status,
      error: error.code,
      message: error.message,
    });
  }
}
