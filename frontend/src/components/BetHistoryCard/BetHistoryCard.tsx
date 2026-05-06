import clsx from 'clsx';
import { Card } from '../Card/Card';
import styles from './BetHistoryCard.module.css';

export interface BetHistoryEntry {
  id: number;
  multiplier: number;
  amount: number;
  profit: number;
  won: boolean;
}

interface BetHistoryCardProps {
  entries: BetHistoryEntry[];
  className?: string;
}

export function BetHistoryCard({ entries, className }: BetHistoryCardProps) {
  return (
    <Card variant="default" className={clsx(styles.container, className)}>
      <div className={styles.header}>
        <span className={styles.title}>Histórico</span>
        <span className={styles.count}>{entries.length}</span>
      </div>

      <div className={styles.list}>
        {entries.map((entry) => (
          <div key={entry.id} className={clsx(styles.row, entry.won ? styles.won : styles.lost)}>
            <span className={clsx(styles.multiplier, entry.won ? styles.multiplierWon : styles.multiplierLost)}>
              {entry.multiplier.toFixed(2)}×
            </span>
            <span className={styles.amount}>
              R$ {entry.amount.toFixed(2)}
            </span>
            <span className={clsx(styles.profit, entry.won ? styles.profitWon : styles.profitLost)}>
              {entry.won ? '+' : ''}
              {entry.profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        ))}

        {entries.length === 0 && (
          <p className={styles.empty}>Nenhuma aposta ainda.</p>
        )}
      </div>
    </Card>
  );
}
