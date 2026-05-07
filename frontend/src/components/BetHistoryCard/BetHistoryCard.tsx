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
        <span className={styles.title}>
          <svg className={styles.titleIcon} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 1.6c-4.6 0-8.4 3.7-8.4 8.4 0 4.6 3.7 8.4 8.4 8.4 4.6 0 8.4-3.7 8.4-8.4 0-4.6-3.7-8.4-8.4-8.4zm.6 4v4.4l3.5 2c.3.2.4.6.2.9-.2.3-.6.4-.9.2L9.4 11A.6.6 0 0 1 9 10.4V5.6a.6.6 0 0 1 1.2 0z"/>
          </svg>
          Suas apostas
        </span>
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
            <span className={clsx(styles.statusIcon, entry.won ? styles.statusWon : styles.statusLost)} aria-hidden="true">
              {entry.won ? (
                <svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : (
                <svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/></svg>
              )}
            </span>
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
          <div className={styles.emptyState}>
            <svg viewBox="0 0 32 32" className={styles.emptyIcon} aria-hidden="true">
              <path d="M22 4c-4 0-8 2-12 6L8 12l-4 1c-1 0-1.4 1.4-.8 2.2l3 4-2 2c-.6.6-.6 1.6 0 2.2l4 4c.6.6 1.6.6 2.2 0l2-2 4 3c.8.6 2.2.2 2.2-.8l1-4 2-2c4-4 6-8 6-12 0-4-2-6-6-6zM20 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" fill="currentColor"/>
            </svg>
            <p className={styles.empty}>Nenhuma aposta ainda.</p>
            <p className={styles.emptyHint}>Faça sua primeira aposta para decolar.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
