import { type InputHTMLAttributes } from 'react';
import clsx from 'clsx';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, disabled, className, ...props }: InputProps) {
  return (
    <div className={clsx(styles.group, className)}>
      {label && <label className={styles.label}>{label}</label>}
      <div
        className={clsx(styles.wrapper, {
          [styles.hasError]: !!error,
          [styles.isDisabled]: disabled,
        })}
      >
        <input className={styles.input} disabled={disabled} {...props} />
      </div>
      {error && <p className={styles.errorText}>{error}</p>}
      {hint && !error && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}
