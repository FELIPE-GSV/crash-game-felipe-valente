import { useEffect, useState } from 'react';
import { useSocket } from './useSocket';

const MAX_ENTRIES = 24;

export interface CrashHistoryEntry {
  id: string;
  multiplier: number;
}

export function useCrashHistory(): CrashHistoryEntry[] {
  const socket = useSocket();
  const [history, setHistory] = useState<CrashHistoryEntry[]>([]);

  useEffect(() => {
    if (!socket) return;

    function onCrashed(data: { crashPoint: number; roundId?: string }) {
      const id = data.roundId ?? `${Date.now()}-${Math.random()}`;
      setHistory((prev) => [
        { id, multiplier: data.crashPoint },
        ...prev,
      ].slice(0, MAX_ENTRIES));
    }

    socket.on('round:crashed', onCrashed);
    return () => {
      socket.off('round:crashed', onCrashed);
    };
  }, [socket]);

  return history;
}
