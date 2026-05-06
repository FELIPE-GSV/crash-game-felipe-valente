import { ApiProperty } from "@nestjs/swagger";
import { Bet } from "../../domain/bet";

export class BetResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() roundId!: string;
  @ApiProperty() playerId!: string;
  @ApiProperty() amount!: string;
  @ApiProperty() status!: string;
  @ApiProperty({ nullable: true }) cashoutMultiplier!: number | null;
  @ApiProperty({ nullable: true }) payout!: string | null;
  @ApiProperty() placedAt!: Date;

  static fromDomain(bet: Bet): BetResponseDto {
    const dto = new BetResponseDto();
    dto.id = bet.id;
    dto.roundId = bet.roundId;
    dto.playerId = bet.playerId;
    dto.amount = bet.amount.toCents().toString();
    dto.status = bet.status;
    dto.cashoutMultiplier = bet.cashoutMultiplier;
    dto.payout = bet.payout?.toCents().toString() ?? null;
    dto.placedAt = bet.placedAt;
    return dto;
  }
}
