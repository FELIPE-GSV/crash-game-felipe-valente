import { ApiProperty } from "@nestjs/swagger";
import { Round } from "../../domain/round";
import { BetResponseDto } from "./bet-response.dto";

export class RoundResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() status!: string;
  @ApiProperty() serverSeedHash!: string;
  @ApiProperty({ nullable: true }) crashPoint!: number | null;
  @ApiProperty({ nullable: true }) startedAt!: Date | null;
  @ApiProperty({ nullable: true }) crashedAt!: Date | null;
  @ApiProperty({ type: [BetResponseDto] }) bets!: BetResponseDto[];

  static fromDomain(round: Round): RoundResponseDto {
    const dto = new RoundResponseDto();
    dto.id = round.id;
    dto.status = round.status;
    dto.serverSeedHash = round.serverSeedHash;
    dto.crashPoint = round.status === "crashed" ? round.crashPoint : null;
    dto.startedAt = round.startedAt;
    dto.crashedAt = round.crashedAt;
    dto.bets = round.bets.map((b) => BetResponseDto.fromDomain(b));
    return dto;
  }
}
