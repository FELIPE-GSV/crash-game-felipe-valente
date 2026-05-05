export class WalletDomainError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "WalletDomainError";
  }
}

export class InsufficientFundsError extends WalletDomainError {
  constructor() {
    super("INSUFFICIENT_FUNDS", "Saldo insuficiente para realizar a operação.");
  }
}

export class InvalidAmountError extends WalletDomainError {
  constructor() {
    super("INVALID_AMOUNT", "O valor da operação deve ser maior que zero.");
  }
}

export class WalletAlreadyExistsError extends WalletDomainError {
  constructor() {
    super("WALLET_ALREADY_EXISTS", "Jogador já possui uma carteira.");
  }
}

export class WalletNotFoundError extends WalletDomainError {
  constructor() {
    super("WALLET_NOT_FOUND", "Carteira não encontrada.");
  }
}
