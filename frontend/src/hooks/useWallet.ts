import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { getMyWallet, createWallet, centsToReais } from '../services/walletService';

export interface UseWalletReturn {
  balance: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  updateBalance: (delta: number) => void;
}

export function useWallet(): UseWalletReturn {
  const socket = useSocket();
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const fetchBalance = useCallback(async () => {
    try {
      setError(null);
      let wallet;
      try {
        wallet = await getMyWallet();
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          wallet = await createWallet();
        } else {
          throw err;
        }
      }
      if (isMounted.current) {
        setBalance(centsToReais(wallet.balance));
      }
    } catch {
      if (isMounted.current) setError('Erro ao carregar saldo');
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchBalance();
    return () => { isMounted.current = false; };
  }, [fetchBalance]);

  useEffect(() => {
    if (!socket) return;
    const onUpdate = () => fetchBalance();
    socket.on('bet:cashedout', onUpdate);
    socket.on('bet:placed', onUpdate);
    return () => {
      socket.off('bet:cashedout', onUpdate);
      socket.off('bet:placed', onUpdate);
    };
  }, [socket, fetchBalance]);

  const updateBalance = useCallback((delta: number) => {
    setBalance((prev) => Math.max(0, prev + delta));
  }, []);

  return { balance, isLoading, error, refetch: fetchBalance, updateBalance };
}
