import clsx from 'clsx';
import { Card } from '../Card/Card';
import styles from './MultiplierDisplay.module.css';

export type MultiplierStatus = 'waiting' | 'running' | 'crashed';

interface MultiplierDisplayProps {
  value: number;
  status: MultiplierStatus;
  className?: string;
}

const STATUS_LABEL: Record<MultiplierStatus, string> = {
  waiting: 'AGUARDANDO...',
  running: 'EM ANDAMENTO',
  crashed: 'CRASHED!',
};

export function MultiplierDisplay({ value, status, className }: MultiplierDisplayProps) {
  return (
    <Card variant="elevated" className={clsx(styles.container, className)}>
      <div className={clsx(styles.valueWrapper, styles[status])}>
        <span className={clsx(styles.value, styles[`value_${status}`])}>
          {value.toFixed(2)}×
        </span>
        <span className={clsx(styles.statusLabel, styles[`label_${status}`])}>
          {STATUS_LABEL[status]}
        </span>
      </div>
    </Card>
  );
}
