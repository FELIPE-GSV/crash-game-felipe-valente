import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Min, Max } from "class-validator";

export class PlaceBetDto {
  @ApiProperty({ description: "Valor da aposta em centavos", example: 1000, minimum: 100, maximum: 100000 })
  @IsInt()
  @Min(100)
  @Max(100000)
  amount!: number;
}
