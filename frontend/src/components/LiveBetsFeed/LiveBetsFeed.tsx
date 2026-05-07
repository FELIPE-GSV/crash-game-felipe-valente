import clsx from 'clsx';
import { Card } from '../Card/Card';
import type { LiveBetEntry } from '../../hooks/useLiveBets';
import styles from './LiveBetsFeed.module.css';

interface LiveBetsFeedProps {
  entries: LiveBetEntry[];
  className?: string;
}

function tierClass(multiplier: number): string {
  if (multiplier >= 10) return styles.tierMythic;
  if (multiplier >= 5) return styles.tierHigh;
  if (multiplier >= 2) return styles.tierMid;
  return styles.tierLow;
}

function Avatar({ username }: { username: string }) {
  const initial = username.charAt(0).toUpperCase();
  return (
    <span className={styles.avatar} aria-hidden="true">
      {initial}
    </span>
  );
}

export function LiveBetsFeed({ entries, className }: LiveBetsFeedProps) {
  return (
    <Card variant="default" className={clsx(styles.container, className)}>
      <div className={styles.header}>
        <span className={styles.title}>
          <svg className={styles.titleIcon} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-7 9a7 7 0 1 1 14 0H3z" clipRule="evenodd"/>
          </svg>
          Apostas ao vivo
        </span>
        <span className={styles.count} aria-label={`${entries.length} apostas ativas`}>
          {entries.length}
        </span>
      </div>

      <div className={styles.list} role="list" aria-label="Apostas da rodada atual">
        {entries.length === 0 && (
          <p className={styles.empty}>Aguardando apostas...</p>
        )}
        {entries.map((entry) => (
          <div
            key={entry.id}
            role="listitem"
            className={clsx(
              styles.row,
              entry.status === 'cashed_out' && styles.rowCashedOut,
              entry.isNew && styles.rowNew,
            )}
            aria-label={
              entry.status === 'cashed_out'
                ? `${entry.username} sacou em ${entry.cashoutMultiplier?.toFixed(2)}×`
                : `${entry.username} apostou`
            }
          >
            <Avatar username={entry.username} />

            <span className={styles.username}>{entry.username}</span>

            <span className={styles.amount}>
              {(entry.amountCents / 100).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 2,
              })}
            </span>

            <span className={clsx(styles.status, entry.status === 'cashed_out' && styles.statusCashedOut)}>
              {entry.status === 'cashed_out' && entry.cashoutMultiplier !== null ? (
                <span className={clsx(styles.cashoutBadge, tierClass(entry.cashoutMultiplier))}>
                  <svg className={styles.cashoutIcon} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M8 1.5a.5.5 0 0 1 .5.5v10.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 12.793V2a.5.5 0 0 1 .5-.5z"/>
                  </svg>
                  {entry.cashoutMultiplier.toFixed(2)}×
                </span>
              ) : (
                <span className={styles.pendingDot} aria-label="Em jogo">
                  <span className={styles.dot} />
                  <span className={styles.dot} style={{ animationDelay: '200ms' }} />
                  <span className={styles.dot} style={{ animationDelay: '400ms' }} />
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
