import clsx from 'clsx';
import { Card } from '../Card/Card';
import styles from './BetHistoryCard.module.css';

export interface BetHistoryEntry {
  id: number;
  multiplier: number;
  amount: number;
  profit: number;
  won: boolean;
  isNew?: boolean;
}

interface BetHistoryCardProps {
  entries: BetHistoryEntry[];
  isLoading?: boolean;
  className?: string;
}

function SkeletonRow() {
  return (
    <div className={styles.skeletonRow}>
      <div className={clsx(styles.skeletonCell, styles.skeletonShort)} />
      <div className={clsx(styles.skeletonCell, styles.skeletonMid)} />
      <div className={clsx(styles.skeletonCell, styles.skeletonShort)} />
    </div>
  );
}

export function BetHistoryCard({ entries, isLoading, className }: BetHistoryCardProps) {
  return (
    <Card variant="default" className={clsx(styles.container, className)}>
      <div className={styles.header}>
        <span className={styles.title}>Histórico</span>
        <span className={styles.count}>{entries.length}</span>
      </div>

      <div className={styles.list}>
        {isLoading && [1, 2, 3, 4].map((n) => <SkeletonRow key={n} />)}

        {!isLoading && entries.map((entry) => (
          <div
            key={entry.id}
            className={clsx(
              styles.row,
              entry.won ? styles.won : styles.lost,
              entry.isNew && styles.rowNew,
            )}
          >
            <span className={clsx(styles.multiplier, entry.won ? styles.multiplierWon : styles.multiplierLost)}>
              {entry.multiplier > 0 ? `${entry.multiplier.toFixed(2)}×` : '1.00×'}
            </span>
            <span className={styles.amount}>
              {entry.amount > 0
                ? entry.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : '—'}
            </span>
            <span className={clsx(styles.profit, entry.won ? styles.profitWon : styles.profitLost)}>
              {entry.won ? '+' : ''}
              {entry.profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        ))}

        {!isLoading && entries.length === 0 && (
          <p className={styles.empty}>Nenhuma aposta ainda.</p>
        )}
      </div>
    </Card>
  );
}
