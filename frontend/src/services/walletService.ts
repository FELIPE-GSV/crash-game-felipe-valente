import { api } from '../lib/axios';

export interface WalletResponse {
  id: string;
  playerId: string;
  balance: string;
  createdAt: string;
  updatedAt: string;
}

export async function getMyWallet(): Promise<WalletResponse> {
  const { data } = await api.get<WalletResponse>('/wallets/wallets/me');
  return data;
}

export async function createWallet(): Promise<WalletResponse> {
  const { data } = await api.post<WalletResponse>('/wallets/wallets');
  return data;
}

export function centsToReais(cents: string | number): number {
  return Number(cents) / 100;
}
