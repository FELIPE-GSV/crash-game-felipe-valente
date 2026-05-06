import { ApiProperty } from "@nestjs/swagger";
import { Round } from "../../domain/round";

export class VerifyResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() serverSeed!: string;
  @ApiProperty() serverSeedHash!: string;
  @ApiProperty() crashPoint!: number;
  @ApiProperty() status!: string;

  static fromDomain(round: Round): VerifyResponseDto {
    const dto = new VerifyResponseDto();
    dto.id = round.id;
    dto.serverSeed = round.serverSeed;
    dto.serverSeedHash = round.serverSeedHash;
    dto.crashPoint = round.crashPoint;
    dto.status = round.status;
    return dto;
  }
}
