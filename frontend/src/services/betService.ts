import { api } from '../lib/axios';

export interface BetResponse {
  id: string;
  roundId: string;
  playerId: string;
  amount: string;
  status: 'pending' | 'cashed_out' | 'lost';
  cashoutMultiplier: number | null;
  payout: string | null;
  placedAt: string;
}

export interface RoundResponse {
  id: string;
  status: 'betting' | 'running' | 'crashed';
  serverSeedHash: string;
  crashPoint: number | null;
  startedAt: string | null;
  crashedAt: string | null;
  bettingEndsAt?: string | null;
  bets: BetResponse[];
}

export async function placeBet(amountReais: number): Promise<BetResponse> {
  const amountCents = Math.round(amountReais * 100);
  const { data } = await api.post<BetResponse>('/games/bet', { amount: amountCents });
  return data;
}

export async function cashout(): Promise<BetResponse> {
  const { data } = await api.post<BetResponse>('/games/bet/cashout');
  return data;
}

export async function getMyBets(): Promise<BetResponse[]> {
  const { data } = await api.get<BetResponse[]>('/games/bets/me');
  return data;
}

export async function getCurrentRound(): Promise<RoundResponse> {
  const { data } = await api.get<RoundResponse>('/games/rounds/current');
  return data;
}

export function centsToReais(cents: string | number): number {
  return Number(cents) / 100;
}
