import { useState, useEffect, useCallback } from 'react';
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
  className?: string;
  onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const MIN_AMOUNT = 1;
const MAX_AMOUNT = 1000;

export function BetPanel({ gameStatus, multiplier, className, onToast }: BetPanelProps) {
  const socket = useSocket();
  const { user } = useAuth();
  const { updateBalance } = useWalletContext();

  const [amount, setAmount] = useState('10.00');
  const [panelStatus, setPanelStatus] = useState<PanelStatus>('betting');
  const [isLoading, setIsLoading] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [cashoutGain, setCashoutGain] = useState<number | null>(null);

  // Sync panel status with game status
  useEffect(() => {
    if (gameStatus === 'crashed') {
      setPanelStatus('betting');
    } else if (gameStatus === 'waiting' && panelStatus !== 'waiting') {
      // only reset to betting if we weren't waiting for round start
      if (panelStatus !== 'waiting') setPanelStatus('betting');
    } else if (gameStatus === 'running' && panelStatus === 'waiting') {
      setPanelStatus('running');
    } else if (gameStatus === 'running' && panelStatus === 'betting') {
      setPanelStatus('idle');
    }
  }, [gameStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen to bet events for this player
  useEffect(() => {
    if (!socket || !user) return;

    function onBetPlaced(data: { playerId: string }) {
      if (data.playerId !== user!.id) return;
      setPanelStatus('waiting');
    }

    function onCashedOut(data: { playerId: string; multiplier: number; payoutCents: number }) {
      if (data.playerId !== user!.id) return;
      const gained = centsToReais(data.payoutCents);
      setCashoutGain(gained);
      setPanelStatus('idle');
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
      updateBalance(-val);
      onToast?.(`Aposta de R$ ${val.toFixed(2)} feita!`, 'info');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      const text = msg?.includes('insufficient') ? 'Saldo insuficiente' : 'Erro ao apostar';
      onToast?.(text, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [amount, updateBalance, onToast]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCashout = useCallback(async () => {
    setIsLoading(true);
    try {
      const bet = await cashout();
      const payout = centsToReais(bet.payout ?? '0');
      const gained = payout - centsToReais(bet.amount);
      updateBalance(payout);
      onToast?.(`Sacou R$ ${payout.toFixed(2)} em ${multiplier.toFixed(2)}×!`, 'success');
      setCashoutGain(gained);
      setTimeout(() => setCashoutGain(null), 1500);
    } catch {
      onToast?.('Erro ao sacar', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [multiplier, updateBalance, onToast]);

  function decrement() {
    const current = parseFloat(amount) || 0;
    setAmount(Math.max(MIN_AMOUNT, current - 5).toFixed(2));
    setAmountError(null);
  }
  function increment() {
    const current = parseFloat(amount) || 0;
    setAmount(Math.min(MAX_AMOUNT, current + 5).toFixed(2));
    setAmountError(null);
  }
  function double() {
    const current = parseFloat(amount) || 0;
    setAmount(Math.min(MAX_AMOUNT, current * 2).toFixed(2));
    setAmountError(null);
  }

  const canBet = panelStatus === 'betting' && !isLoading;
  const canCashout = panelStatus === 'running' && !isLoading;

  // Cashout button intensity: lerp color from orange→red as multiplier rises
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
            >
              −
            </Button>
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
            >
              +
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={double}
              disabled={panelStatus !== 'betting'}
            >
              Dobrar
            </Button>
          </div>
        </div>

        <div className={styles.actionArea}>
          {/* APOSTAR */}
          {(panelStatus === 'betting' || panelStatus === 'waiting') && (
            <Button
              variant="primary"
              size="lg"
              className={clsx(
                styles.betButton,
                panelStatus === 'betting' && styles.betButtonActive,
              )}
              onClick={handleBet}
              disabled={!canBet}
              loading={isLoading && panelStatus === 'betting'}
            >
              {panelStatus === 'waiting' ? 'AGUARDANDO...' : 'APOSTAR'}
            </Button>
          )}

          {/* SACAR */}
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
              {panelStatus === 'idle' ? 'AGUARDANDO PRÓXIMA RODADA' : `SACAR ${multiplier.toFixed(2)}×`}
            </Button>
          )}
        </div>

        {/* Cashout gain animation */}
        {cashoutGain !== null && (
          <div className={styles.gainPopup} aria-live="polite">
            +{cashoutGain.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        )}
      </div>
    </Card>
  );
}
