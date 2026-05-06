import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useWalletContext } from '../../context/WalletContext';
import styles from './WalletBadge.module.css';

interface WalletBadgeProps {
  className?: string;
}

function useAnimatedBalance(balance: number) {
  const [displayed, setDisplayed] = useState(balance);
  const prevRef = useRef(balance);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevRef.current;
    const end = balance;
    if (start === end) return;

    const duration = 600;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(start + (end - start) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = end;
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [balance]);

  return displayed;
}

export function WalletBadge({ className }: WalletBadgeProps) {
  const { balance, isLoading } = useWalletContext();
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevBalance = useRef(balance);
  const displayed = useAnimatedBalance(balance);

  useEffect(() => {
    if (isLoading || prevBalance.current === balance) return;
    const dir = balance > prevBalance.current ? 'up' : 'down';
    prevBalance.current = balance;
    setFlash(dir);
    const t = setTimeout(() => setFlash(null), 800);
    return () => clearTimeout(t);
  }, [balance, isLoading]);

  const formatted = displayed.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  if (isLoading) {
    return (
      <div className={clsx(styles.badge, styles.skeleton, className)}>
        <div className={styles.skeletonInner} />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        styles.badge,
        flash === 'up' && styles.flashUp,
        flash === 'down' && styles.flashDown,
        className,
      )}
    >
      <svg className={styles.icon} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M4 4a2 2 0 0 0-2 2v1h16V6a2 2 0 0 0-2-2H4z" />
        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zm-5 3a1 1 0 1 0 2 0 1 1 0 0 0-2 0zm-3 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0z" clipRule="evenodd" />
      </svg>
      <span className={styles.balance}>{formatted}</span>
    </div>
  );
}
