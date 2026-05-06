export class GameDomainError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "GameDomainError";
  }
}

export class RoundNotInBettingPhaseError extends GameDomainError {
  constructor() {
    super("ROUND_NOT_IN_BETTING_PHASE", "Apostas só são aceitas durante a fase de apostas.");
  }
}

export class RoundNotRunningError extends GameDomainError {
  constructor() {
    super("ROUND_NOT_RUNNING", "Cash out só é permitido durante uma rodada em andamento.");
  }
}

export class PlayerAlreadyBetError extends GameDomainError {
  constructor() {
    super("PLAYER_ALREADY_BET", "Jogador já realizou uma aposta nesta rodada.");
  }
}

export class BetNotFoundError extends GameDomainError {
  constructor() {
    super("BET_NOT_FOUND", "Aposta não encontrada para este jogador nesta rodada.");
  }
}

export class BetAlreadySettledError extends GameDomainError {
  constructor() {
    super("BET_ALREADY_SETTLED", "Esta aposta já foi encerrada.");
  }
}

export class InvalidBetAmountError extends GameDomainError {
  constructor() {
    super("INVALID_BET_AMOUNT", "Aposta deve ser entre R$ 1,00 e R$ 1.000,00.");
  }
}
