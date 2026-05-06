import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Card } from '../Card/Card';
import styles from './MultiplierDisplay.module.css';

export type MultiplierStatus = 'waiting' | 'running' | 'crashed';

interface MultiplierDisplayProps {
  value: number;
  status: MultiplierStatus;
  bettingEndsAt?: string | null;
  className?: string;
}

const STATUS_LABEL: Record<MultiplierStatus, string> = {
  waiting: 'AGUARDANDO...',
  running: 'EM ANDAMENTO',
  crashed: 'CRASHED!',
};

function getMultiplierTier(value: number): 'low' | 'mid' | 'high' {
  if (value >= 5) return 'high';
  if (value >= 2) return 'mid';
  return 'low';
}

function BettingTimer({ endsAt }: { endsAt: string }) {
  const [progress, setProgress] = useState(100);
  const [urgent, setUrgent] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const end = new Date(endsAt).getTime();
    const TOTAL = 10_000;

    function tick() {
      const remaining = end - Date.now();
      const pct = Math.max(0, Math.min(100, (remaining / TOTAL) * 100));
      setProgress(pct);
      setUrgent(remaining <= 3000);
      if (remaining > 0) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [endsAt]);

  return (
    <div className={styles.timerBar} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={clsx(styles.timerFill, urgent && styles.timerUrgent)}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export function MultiplierDisplay({ value, status, bettingEndsAt, className }: MultiplierDisplayProps) {
  const tier = status === 'running' ? getMultiplierTier(value) : null;

  return (
    <Card variant="elevated" className={clsx(styles.container, className)}>
      <div className={clsx(styles.valueWrapper, styles[status])}>
        <span className={clsx(
          styles.value,
          styles[`value_${status}`],
          tier && styles[`tier_${tier}`],
        )}>
          {value.toFixed(2)}×
        </span>
        <span className={clsx(styles.statusLabel, styles[`label_${status}`])}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      {status === 'waiting' && bettingEndsAt && (
        <BettingTimer endsAt={bettingEndsAt} />
      )}

      {status === 'crashed' && (
        <div className={styles.crashOverlay} />
      )}
    </Card>
  );
}
