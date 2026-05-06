import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket } from './useSocket';
import { getMyWallet, createWallet, centsToReais, type WalletResponse } from '../services/walletService';

export const WALLET_KEY = ['wallet'] as const;

export interface UseWalletReturn {
  balance: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  /** delta em Reais (positivo = crédito, negativo = débito) */
  updateBalance: (deltaReais: number) => void;
}

export function useWallet(): UseWalletReturn {
  const socket = useSocket();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: WALLET_KEY,
    queryFn: async (): Promise<WalletResponse> => {
      try {
        return await getMyWallet();
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) return await createWallet();
        throw err;
      }
    },
    staleTime: Infinity,
    retry: 1,
  });

  // Invalidate após eventos que alteram o saldo no servidor
  useEffect(() => {
    if (!socket) return;
    const invalidate = () => queryClient.invalidateQueries({ queryKey: WALLET_KEY });
    socket.on('bet:cashedout', invalidate);
    socket.on('bet:placed', invalidate);
    socket.on('connect', invalidate);
    return () => {
      socket.off('bet:cashedout', invalidate);
      socket.off('bet:placed', invalidate);
      socket.off('connect', invalidate);
    };
  }, [socket, queryClient]);

  // Atualização otimista: modifica diretamente o cache sem ir ao servidor
  const updateBalance = useCallback((deltaReais: number) => {
    queryClient.setQueryData<WalletResponse>(WALLET_KEY, (old) => {
      if (!old) return old;
      const current = BigInt(old.balance);
      const delta = BigInt(Math.round(deltaReais * 100));
      const next = current + delta;
      return { ...old, balance: String(next < 0n ? 0n : next) };
    });
  }, [queryClient]);

  return {
    balance: data ? centsToReais(data.balance) : 0,
    isLoading,
    error: error ? 'Erro ao carregar saldo' : null,
    refetch,
    updateBalance,
  };
}
