import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';
import { getMyBets, centsToReais } from '../services/betService';
import type { BetHistoryEntry } from '../components/BetHistoryCard/BetHistoryCard';

const MAX_ENTRIES = 50;

function mapBet(bet: { id: string; cashoutMultiplier: number | null; amount: string; payout: string | null; status: string }, index: number): BetHistoryEntry {
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
  const [entries, setEntries] = useState<BetHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  const fetchHistory = useCallback(async () => {
    try {
      const bets = await getMyBets();
      if (isMounted.current) {
        setEntries(bets.slice(0, MAX_ENTRIES).map(mapBet));
      }
    } catch {
      // silent — history is non-critical
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchHistory();
    return () => { isMounted.current = false; };
  }, [fetchHistory]);

  useEffect(() => {
    if (!socket || !user) return;

    function addNewEntry(entry: BetHistoryEntry) {
      setEntries((prev) => {
        const updated = [{ ...entry, isNew: true }, ...prev].slice(0, MAX_ENTRIES);
        // clear isNew flag after animation duration
        setTimeout(() => {
          setEntries((cur) => cur.map((e) => (e.id === entry.id ? { ...e, isNew: false } : e)));
        }, 500);
        return updated;
      });
    }

    function onCashedOut(data: { playerId: string; multiplier: number; payoutCents: number; roundId: string }) {
      if (data.playerId !== user!.id) return;
      addNewEntry({
        id: Date.now(),
        multiplier: data.multiplier,
        amount: 0, // will be updated on next full fetch
        profit: centsToReais(data.payoutCents),
        won: true,
        isNew: true,
      });
    }

    function onCrashed() {
      // refetch so lost bets show up accurately
      fetchHistory();
    }

    socket.on('bet:cashedout', onCashedOut);
    socket.on('round:crashed', onCrashed);
    return () => {
      socket.off('bet:cashedout', onCashedOut);
      socket.off('round:crashed', onCrashed);
    };
  }, [socket, user, fetchHistory]);

  return { entries, isLoading };
}
