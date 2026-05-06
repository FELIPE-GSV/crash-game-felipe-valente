import { type HTMLAttributes } from 'react';
import clsx from 'clsx';
import styles from './Card.module.css';

type Variant = 'default' | 'elevated' | 'highlighted';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

export function Card({ variant = 'default', children, className, ...props }: CardProps) {
  return (
    <div className={clsx(styles.card, variant !== 'default' && styles[variant], className)} {...props}>
      {children}
    </div>
  );
}
