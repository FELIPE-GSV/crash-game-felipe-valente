import { useState, useEffect, useCallback, useMemo } from 'react';
import clsx from 'clsx';
import { Card } from '../Card/Card';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import { useWalletContext } from '../../context/WalletContext';
import { placeBet, cashout, centsToReais } from '../../services/betService';
import styles from './BetPanel.module.css';

type PanelStatus = 'betting' | 'waiting' | 'running' | 'idle';

interface BetPanelProps {
  gameStatus: 'waiting' | 'running' | 'crashed';
  multiplier: number;
  roundId: string | null;
  className?: string;
  onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const MIN_AMOUNT = 1;
const MAX_AMOUNT = 1000;

export function BetPanel({ gameStatus, multiplier, roundId, className, onToast }: BetPanelProps) {
  const socket = useSocket();
  const { user } = useAuth();
  const { updateBalance } = useWalletContext();

  const [amount, setAmount] = useState('10.00');
  const [isLoading, setIsLoading] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [cashoutGain, setCashoutGain] = useState<number | null>(null);

  // Rastreia qual roundId tem aposta ativa e se já sacou
  const [activeBetRoundId, setActiveBetRoundId] = useState<string | null>(null);
  const [hasCashedOut, setHasCashedOut] = useState(false);

  // Deriva o status do painel a partir do estado do jogo + apostas do jogador
  const panelStatus: PanelStatus = useMemo(() => {
    if (gameStatus === 'crashed') return 'betting';
    if (gameStatus === 'waiting') return activeBetRoundId ? 'waiting' : 'betting';
    // running
    if (activeBetRoundId && !hasCashedOut) return 'running';
    return 'idle';
  }, [gameStatus, activeBetRoundId, hasCashedOut]);

  // Reseta estado ao iniciar nova rodada
  useEffect(() => {
    if (gameStatus === 'waiting') {
      setActiveBetRoundId(null);
      setHasCashedOut(false);
    }
  }, [roundId, gameStatus]);

  // Eventos de socket específicos do jogador
  useEffect(() => {
    if (!socket || !user) return;

    function onBetPlaced(data: { playerId: string; roundId: string }) {
      if (data.playerId !== user!.id) return;
      setActiveBetRoundId(data.roundId);
    }

    function onCashedOut(data: { playerId: string; multiplier: number; payoutCents: number }) {
      if (data.playerId !== user!.id) return;
      setHasCashedOut(true);
      const gained = centsToReais(data.payoutCents);
      setCashoutGain(gained);
      setTimeout(() => setCashoutGain(null), 1500);
    }

    socket.on('bet:placed', onBetPlaced);
    socket.on('bet:cashedout', onCashedOut);
    return () => {
      socket.off('bet:placed', onBetPlaced);
      socket.off('bet:cashedout', onCashedOut);
    };
  }, [socket, user]);

  function validateAmount(): number | null {
    const val = parseFloat(amount);
    if (isNaN(val) || val < MIN_AMOUNT) {
      setAmountError(`Mínimo R$ ${MIN_AMOUNT.toFixed(2)}`);
      return null;
    }
    if (val > MAX_AMOUNT) {
      setAmountError(`Máximo R$ ${MAX_AMOUNT.toFixed(2)}`);
      return null;
    }
    setAmountError(null);
    return val;
  }

  const handleBet = useCallback(async () => {
    const val = validateAmount();
    if (val === null) return;
    setIsLoading(true);
    try {
      await placeBet(val);
      // Atualização otimista: débito imediato enquanto aguarda confirmação do servidor
      updateBalance(-val);
      onToast?.(`Aposta de R$ ${val.toFixed(2)} feita!`, 'info');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
      const text = msg.toLowerCase().includes('insufficient') || msg.toLowerCase().includes('saldo')
        ? 'Saldo insuficiente'
        : 'Erro ao apostar. Tente novamente.';
      onToast?.(text, 'error');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, updateBalance, onToast]);

  const handleCashout = useCallback(async () => {
    setIsLoading(true);
    try {
      const bet = await cashout();
      const payout = centsToReais(bet.payout ?? '0');
      const betAmount = centsToReais(bet.amount);
      const gained = payout - betAmount;
      // Atualização otimista: crédito imediato do payout
      updateBalance(payout);
      setCashoutGain(gained);
      setTimeout(() => setCashoutGain(null), 1500);
      onToast?.(`Sacou R$ ${payout.toFixed(2)} em ${bet.cashoutMultiplier?.toFixed(2) ?? multiplier.toFixed(2)}×!`, 'success');
    } catch {
      onToast?.('Erro ao sacar. Tente novamente.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [multiplier, updateBalance, onToast]);

  function decrement() {
    setAmount((prev) => Math.max(MIN_AMOUNT, (parseFloat(prev) || 0) - 5).toFixed(2));
    setAmountError(null);
  }
  function increment() {
    setAmount((prev) => Math.min(MAX_AMOUNT, (parseFloat(prev) || 0) + 5).toFixed(2));
    setAmountError(null);
  }
  function double() {
    setAmount((prev) => Math.min(MAX_AMOUNT, (parseFloat(prev) || 0) * 2).toFixed(2));
    setAmountError(null);
  }

  const canBet = panelStatus === 'betting' && !isLoading;
  const canCashout = panelStatus === 'running' && !isLoading;
  const cashoutDanger = Math.min(1, (multiplier - 1) / 9);

  return (
    <Card variant="highlighted" className={clsx(styles.container, className)}>
      <div className={styles.header}>
        <span className={styles.title}>Apostar</span>
        {panelStatus === 'running' && (
          <span className={styles.multiplierBadge}>{multiplier.toFixed(2)}×</span>
        )}
      </div>

      <div className={styles.body}>
        <div className={clsx(styles.inputRow, amountError && styles.inputRowError)}>
          <span className={styles.inputLabel}>Valor da aposta</span>
          <div className={styles.inputGroup}>
            <Button
              variant="ghost"
              size="sm"
              onClick={decrement}
              disabled={panelStatus !== 'betting'}
              className={styles.stepBtn}
              aria-label="Diminuir valor"
            >−</Button>
            <Input
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setAmountError(null); }}
              disabled={panelStatus !== 'betting'}
              error={amountError ?? undefined}
              className={styles.amountInput}
              aria-label="Valor da aposta"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={increment}
              disabled={panelStatus !== 'betting'}
              className={styles.stepBtn}
              aria-label="Aumentar valor"
            >+</Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={double}
              disabled={panelStatus !== 'betting'}
            >Dobrar</Button>
          </div>
        </div>

        <div className={styles.actionArea}>
          {(panelStatus === 'betting' || panelStatus === 'waiting') && (
            <Button
              variant="primary"
              size="lg"
              className={clsx(styles.betButton, panelStatus === 'betting' && styles.betButtonActive)}
              onClick={handleBet}
              disabled={!canBet}
              loading={isLoading && panelStatus === 'betting'}
            >
              {panelStatus === 'waiting' ? 'AGUARDANDO INÍCIO...' : 'APOSTAR'}
            </Button>
          )}

          {(panelStatus === 'running' || panelStatus === 'idle') && (
            <Button
              variant="primary"
              size="lg"
              className={styles.cashoutButton}
              style={{ '--cashout-danger': cashoutDanger } as React.CSSProperties}
              onClick={handleCashout}
              disabled={!canCashout}
              loading={isLoading && panelStatus === 'running'}
            >
              {panelStatus === 'idle'
                ? 'AGUARDANDO PRÓXIMA RODADA'
                : `SACAR ${multiplier.toFixed(2)}×`}
            </Button>
          )}
        </div>

        {cashoutGain !== null && (
          <div className={styles.gainPopup} aria-live="polite">
            +{cashoutGain.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        )}
      </div>
    </Card>
  );
}
