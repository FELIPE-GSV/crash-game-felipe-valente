import clsx from 'clsx';
import styles from './WalletBadge.module.css';

interface WalletBadgeProps {
  balance: number;
  className?: string;
}

export function WalletBadge({ balance, className }: WalletBadgeProps) {
  const formatted = balance.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return (
    <div className={clsx(styles.badge, className)}>
      <span className={styles.icon}>💰</span>
      <span className={styles.balance}>{formatted}</span>
    </div>
  );
}
