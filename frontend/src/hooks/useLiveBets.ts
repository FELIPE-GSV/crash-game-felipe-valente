import { useEffect, useRef, useState } from 'react';
import { useSocket } from './useSocket';

const MAX_ENTRIES = 20;

export interface LiveBetEntry {
  id: string;
  playerId: string;
  username: string;
  amountCents: number;
  status: 'pending' | 'cashed_out';
  cashoutMultiplier: number | null;
  payoutCents: number | null;
  isNew?: boolean;
}

export function useLiveBets(roundId: string | null): LiveBetEntry[] {
  const socket = useSocket();
  const [bets, setBets] = useState<LiveBetEntry[]>([]);
  const prevRoundId = useRef<string | null>(null);

  // Reset on new round
  useEffect(() => {
    if (roundId !== prevRoundId.current) {
      prevRoundId.current = roundId;
      setBets([]);
    }
  }, [roundId]);

  useEffect(() => {
    if (!socket) return;

    function onBetPlaced(data: {
      roundId: string;
      playerId: string;
      username: string;
      amountCents: number;
    }) {
      const entry: LiveBetEntry = {
        id: `${data.playerId}:${data.roundId}`,
        playerId: data.playerId,
        username: data.username,
        amountCents: data.amountCents,
        status: 'pending',
        cashoutMultiplier: null,
        payoutCents: null,
        isNew: true,
      };

      setBets((prev) => [entry, ...prev].slice(0, MAX_ENTRIES));

      // Clear isNew after animation
      setTimeout(() => {
        setBets((prev) =>
          prev.map((b) => (b.id === entry.id ? { ...b, isNew: false } : b)),
        );
      }, 800);
    }

    function onCashedOut(data: {
      playerId: string;
      roundId: string;
      username: string;
      multiplier: number;
      payoutCents: number;
    }) {
      const id = `${data.playerId}:${data.roundId}`;
      setBets((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                status: 'cashed_out',
                cashoutMultiplier: data.multiplier,
                payoutCents: data.payoutCents,
              }
            : b,
        ),
      );
    }

    socket.on('bet:placed', onBetPlaced);
    socket.on('bet:cashedout', onCashedOut);
    return () => {
      socket.off('bet:placed', onBetPlaced);
      socket.off('bet:cashedout', onCashedOut);
    };
  }, [socket]);

  return bets;
}
