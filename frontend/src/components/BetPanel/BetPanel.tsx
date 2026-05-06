import { useState } from 'react';
import clsx from 'clsx';
import { Card } from '../Card/Card';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import styles from './BetPanel.module.css';

interface BetPanelProps {
  className?: string;
}

export function BetPanel({ className }: BetPanelProps) {
  const [amount, setAmount] = useState('10.00');

  function decrement() {
    const current = parseFloat(amount) || 0;
    const next = Math.max(1, current - 5);
    setAmount(next.toFixed(2));
  }

  function increment() {
    const current = parseFloat(amount) || 0;
    setAmount((current + 5).toFixed(2));
  }

  function double() {
    const current = parseFloat(amount) || 0;
    setAmount((current * 2).toFixed(2));
  }

  return (
    <Card variant="highlighted" className={clsx(styles.container, className)}>
      <div className={styles.header}>
        <span className={styles.title}>Apostar</span>
      </div>

      <div className={styles.body}>
        <div className={styles.inputRow}>
          <span className={styles.inputLabel}>Valor da aposta</span>
          <div className={styles.inputGroup}>
            <Button variant="ghost" size="sm" onClick={decrement} className={styles.stepBtn}>
              −
            </Button>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={styles.amountInput}
            />
            <Button variant="ghost" size="sm" onClick={increment} className={styles.stepBtn}>
              +
            </Button>
            <Button variant="secondary" size="sm" onClick={double}>
              Dobrar
            </Button>
          </div>
        </div>

        <Button variant="primary" size="lg" className={styles.betButton}>
          APOSTAR
        </Button>
      </div>
    </Card>
  );
}
