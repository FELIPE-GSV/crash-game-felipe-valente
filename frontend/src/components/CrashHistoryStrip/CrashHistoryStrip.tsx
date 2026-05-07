import clsx from 'clsx';
import type { CrashHistoryEntry } from '../../hooks/useCrashHistory';
import styles from './CrashHistoryStrip.module.css';

interface CrashHistoryStripProps {
  entries: CrashHistoryEntry[];
  className?: string;
}

type Tier = 'low' | 'mid' | 'high' | 'mythic';

function tierFor(m: number): Tier {
  if (m >= 10) return 'mythic';
  if (m >= 5) return 'high';
  if (m >= 2) return 'mid';
  return 'low';
}

export function CrashHistoryStrip({ entries, className }: CrashHistoryStripProps) {
  return (
    <div
      className={clsx(styles.strip, className)}
      role="list"
      aria-label="Histórico das últimas rodadas"
    >
      <span className={styles.label} aria-hidden="true">ÚLTIMAS</span>
      <div className={styles.scroll}>
        {entries.length === 0 && (
          <span className={styles.placeholder}>Sem rodadas ainda</span>
        )}
        {entries.map((entry, idx) => {
          const tier = tierFor(entry.multiplier);
          return (
            <span
              key={entry.id}
              role="listitem"
              className={clsx(
                styles.pill,
                styles[`pill_${tier}`],
                idx === 0 && styles.pillNew,
              )}
              aria-label={`Rodada terminou em ${entry.multiplier.toFixed(2)} vezes`}
            >
              {entry.multiplier.toFixed(2)}×
            </span>
          );
        })}
      </div>
    </div>
  );
}
