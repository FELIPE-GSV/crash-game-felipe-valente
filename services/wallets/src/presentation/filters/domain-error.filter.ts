import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import {
  InsufficientFundsError,
  InvalidAmountError,
  WalletAlreadyExistsError,
  WalletDomainError,
  WalletNotFoundError,
} from "../../domain/errors";

const STATUS_BY_ERROR: Record<string, number> = {
  WALLET_ALREADY_EXISTS: HttpStatus.CONFLICT,
  WALLET_NOT_FOUND: HttpStatus.NOT_FOUND,
  INSUFFICIENT_FUNDS: HttpStatus.UNPROCESSABLE_ENTITY,
  INVALID_AMOUNT: HttpStatus.BAD_REQUEST,
};

@Catch(
  WalletDomainError,
  InsufficientFundsError,
  InvalidAmountError,
  WalletAlreadyExistsError,
  WalletNotFoundError,
)
export class DomainErrorFilter implements ExceptionFilter {
  catch(error: WalletDomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = STATUS_BY_ERROR[error.code] ?? HttpStatus.BAD_REQUEST;

    response.status(status).json({
      statusCode: status,
      error: error.code,
      message: error.message,
    });
  }
}
