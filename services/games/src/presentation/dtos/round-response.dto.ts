import { ApiProperty } from "@nestjs/swagger";
import { Round } from "../../domain/round";
import { BetResponseDto } from "./bet-response.dto";

const BETTING_DURATION_MS = 10_000;

export class RoundResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() status!: string;
  @ApiProperty() serverSeedHash!: string;
  @ApiProperty({ nullable: true }) crashPoint!: number | null;
  @ApiProperty({ nullable: true }) startedAt!: Date | null;
  @ApiProperty({ nullable: true }) crashedAt!: Date | null;
  @ApiProperty({ nullable: true }) bettingEndsAt!: string | null;
  @ApiProperty({ type: [BetResponseDto] }) bets!: BetResponseDto[];

  static fromDomain(round: Round): RoundResponseDto {
    const dto = new RoundResponseDto();
    dto.id = round.id;
    dto.status = round.status;
    dto.serverSeedHash = round.serverSeedHash;
    dto.crashPoint = round.status === "crashed" ? round.crashPoint : null;
    dto.startedAt = round.startedAt;
    dto.crashedAt = round.crashedAt;
    dto.bettingEndsAt =
      round.status === "betting"
        ? new Date(round.createdAt.getTime() + BETTING_DURATION_MS).toISOString()
        : null;
    dto.bets = round.bets.map((b) => BetResponseDto.fromDomain(b));
    return dto;
  }
}
