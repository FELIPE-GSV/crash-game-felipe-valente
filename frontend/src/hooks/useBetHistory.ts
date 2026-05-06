import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';
import { getMyBets, centsToReais, type BetResponse } from '../services/betService';
import type { BetHistoryEntry } from '../components/BetHistoryCard/BetHistoryCard';

export const BETS_KEY = ['bets'] as const;

const MAX_ENTRIES = 50;

function mapBet(bet: BetResponse, index: number): BetHistoryEntry {
  const won = bet.status === 'cashed_out';
  const amount = centsToReais(bet.amount);
  const payout = bet.payout ? centsToReais(bet.payout) : 0;
  return {
    id: index,
    multiplier: bet.cashoutMultiplier ?? 0,
    amount,
    profit: won ? payout - amount : -amount,
    won,
    isNew: false,
  };
}

export function useBetHistory() {
  const socket = useSocket();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Entradas otimistas adicionadas via socket (aparecem imediatamente)
  const [optimisticEntries, setOptimisticEntries] = useState<BetHistoryEntry[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: BETS_KEY,
    queryFn: getMyBets,
    staleTime: Infinity,
    retry: 1,
  });

  useEffect(() => {
    if (!socket || !user) return;

    function onCashedOut(event: { playerId: string; multiplier: number; payoutCents: number }) {
      if (event.playerId !== user!.id) return;

      const entry: BetHistoryEntry = {
        id: Date.now(),
        multiplier: event.multiplier,
        amount: 0,
        profit: centsToReais(event.payoutCents),
        won: true,
        isNew: true,
      };

      setOptimisticEntries((prev) => [entry, ...prev]);

      // Remove flag isNew após animação
      setTimeout(() => {
        setOptimisticEntries((prev) =>
          prev.map((e) => (e.id === entry.id ? { ...e, isNew: false } : e)),
        );
      }, 400);

      // Invalida para buscar dados precisos (amount real) em background
      queryClient.invalidateQueries({ queryKey: BETS_KEY });
    }

    function onCrashed() {
      // Após crash, invalida para incluir apostas perdidas com dados corretos
      queryClient.invalidateQueries({ queryKey: BETS_KEY });
    }

    function onConnect() {
      queryClient.invalidateQueries({ queryKey: BETS_KEY });
    }

    socket.on('bet:cashedout', onCashedOut);
    socket.on('round:crashed', onCrashed);
    socket.on('connect', onConnect);
    return () => {
      socket.off('bet:cashedout', onCashedOut);
      socket.off('round:crashed', onCrashed);
      socket.off('connect', onConnect);
    };
  }, [socket, user, queryClient]);

  // Quando o React Query retorna dados frescos, limpa entradas otimistas duplicadas
  useEffect(() => {
    if (data && data.length > 0) {
      setOptimisticEntries([]);
    }
  }, [data]);

  const serverEntries = (data ?? []).slice(0, MAX_ENTRIES).map(mapBet);
  const entries = [...optimisticEntries, ...serverEntries].slice(0, MAX_ENTRIES);

  return { entries, isLoading };
}
