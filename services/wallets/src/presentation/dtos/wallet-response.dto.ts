import { ApiProperty } from "@nestjs/swagger";
import { Wallet } from "../../domain/wallet";

export class WalletResponseDto {
  @ApiProperty({ example: "9c1f6b6f-4e3c-4e9f-bbd5-1a2c3d4e5f60" })
  id!: string;

  @ApiProperty({ example: "b7e9c2f1-0d3a-4e5b-9c7f-1234567890ab" })
  playerId!: string;

  @ApiProperty({
    description: "Saldo em centavos (BIGINT serializado como string).",
    example: "1000000",
  })
  balance!: string;

  @ApiProperty({ example: "2026-05-05T10:00:00.000Z" })
  createdAt!: string;

  @ApiProperty({ example: "2026-05-05T10:00:00.000Z" })
  updatedAt!: string;

  static fromDomain(wallet: Wallet): WalletResponseDto {
    return {
      id: wallet.id,
      playerId: wallet.playerId,
      balance: wallet.balance.toString(),
      createdAt: wallet.createdAt.toISOString(),
      updatedAt: wallet.updatedAt.toISOString(),
    };
  }
}
