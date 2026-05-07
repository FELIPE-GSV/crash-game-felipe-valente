import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import type { MultiplierStatus } from '../MultiplierDisplay/MultiplierDisplay';
import styles from './CurveFormula.module.css';

interface CurveFormulaProps {
  multiplier: number;
  status: MultiplierStatus;
  className?: string;
}

const GROWTH = 0.06; // must match game-loop.service.ts GROWTH_FACTOR

/** Elapsed seconds derived from current multiplier via inverse formula. */
function elapsedFromMultiplier(m: number): number {
  return m <= 1 ? 0 : Math.log(m) / GROWTH;
}

export function CurveFormula({ multiplier, status, className }: CurveFormulaProps) {
  const [tick, setTick] = useState(0);
  const rafRef = useRef<number | null>(null);

  // Drive re-renders at ~10fps while running so elapsed updates smoothly
  useEffect(() => {
    if (status !== 'running') return;
    function loop() {
      setTick((n) => n + 1);
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [status]);

  // suppress unused warning — tick is just a refresh trigger
  void tick;

  const t = elapsedFromMultiplier(multiplier);
  const isActive = status === 'running' || status === 'crashed';

  return (
    <div
      className={clsx(
        styles.wrapper,
        status === 'crashed' && styles.wrapperCrashed,
        className,
      )}
      aria-label={`Fórmula da curva: m de t igual a e elevado a 0.06 vezes t. t atual: ${t.toFixed(1)} segundos`}
    >
      {/* Static formula */}
      <div className={styles.formula}>
        <span className={styles.label}>Fórmula da curva</span>
        <span className={styles.math}>
          <em>m</em>(<em>t</em>) = <em>e</em>
          <sup className={styles.sup}>
            {GROWTH} × <em>t</em>
          </sup>
        </span>
      </div>

      {/* Live values */}
      {isActive && (
        <div className={styles.values}>
          <div className={styles.valueItem}>
            <span className={styles.varLabel}><em>t</em></span>
            <span className={clsx(styles.varValue, styles.tValue)}>
              {t.toFixed(2)}<span className={styles.unit}>s</span>
            </span>
          </div>
          <div className={styles.divider} aria-hidden="true" />
          <div className={styles.valueItem}>
            <span className={styles.varLabel}><em>m</em>(<em>t</em>)</span>
            <span className={clsx(
              styles.varValue,
              status === 'crashed' ? styles.crashed : styles.multiplierValue,
            )}>
              {multiplier.toFixed(2)}<span className={styles.unit}>×</span>
            </span>
          </div>
          {status === 'crashed' && (
            <>
              <div className={styles.divider} aria-hidden="true" />
              <div className={styles.valueItem}>
                <span className={styles.varLabel}>crash</span>
                <span className={clsx(styles.varValue, styles.crashed)}>
                  {t.toFixed(2)}<span className={styles.unit}>s</span>
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
