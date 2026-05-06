import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { getCurrentRound } from '../services/betService';
import type { MultiplierStatus } from '../components/MultiplierDisplay/MultiplierDisplay';

export interface GameState {
  status: MultiplierStatus;
  multiplier: number;
  roundId: string | null;
  crashPoint: number | null;
  bettingEndsAt: string | null;
}

const INITIAL: GameState = {
  status: 'waiting',
  multiplier: 1.0,
  roundId: null,
  crashPoint: null,
  bettingEndsAt: null,
};

export function useGameState(): GameState {
  const socket = useSocket();
  const [state, setState] = useState<GameState>(INITIAL);

  const syncFromRound = useCallback(async () => {
    try {
      const round = await getCurrentRound();
      setState({
        status: round.status === 'betting' ? 'waiting'
              : round.status === 'running' ? 'running'
              : 'crashed',
        multiplier: round.crashPoint ?? 1.0,
        roundId: round.id,
        crashPoint: round.crashPoint,
        bettingEndsAt: round.bettingEndsAt ?? null,
      });
    } catch {
      // keep current state on error
    }
  }, []);

  useEffect(() => {
    syncFromRound();
  }, [syncFromRound]);

  useEffect(() => {
    if (!socket) return;

    function onNew(data: { roundId: string; bettingEndsAt: string }) {
      setState({ status: 'waiting', multiplier: 1.0, roundId: data.roundId, crashPoint: null, bettingEndsAt: data.bettingEndsAt });
    }
    function onStarted(data: { roundId: string }) {
      setState((prev) => ({ ...prev, status: 'running', multiplier: 1.0, roundId: data.roundId, bettingEndsAt: null }));
    }
    function onTick(data: { multiplier: number }) {
      setState((prev) => ({ ...prev, multiplier: data.multiplier }));
    }
    function onCrashed(data: { crashPoint: number }) {
      setState((prev) => ({ ...prev, status: 'crashed', multiplier: data.crashPoint, crashPoint: data.crashPoint }));
      // reset to waiting after 3s cooldown
      setTimeout(() => {
        setState((prev) => (prev.status === 'crashed' ? { ...prev, status: 'waiting', multiplier: 1.0 } : prev));
      }, 3000);
    }

    socket.on('round:new', onNew);
    socket.on('round:started', onStarted);
    socket.on('round:tick', onTick);
    socket.on('round:crashed', onCrashed);

    const onReconnect = () => syncFromRound();
    socket.on('connect', onReconnect);

    return () => {
      socket.off('round:new', onNew);
      socket.off('round:started', onStarted);
      socket.off('round:tick', onTick);
      socket.off('round:crashed', onCrashed);
      socket.off('connect', onReconnect);
    };
  }, [socket, syncFromRound]);

  return state;
}
