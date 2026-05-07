import { useState } from 'react';
import clsx from 'clsx';
import styles from './SeedBadge.module.css';

interface SeedBadgeProps {
  hash: string | null;
  serverSeed?: string | null;
  status: 'waiting' | 'running' | 'crashed';
  className?: string;
}

function truncate(s: string) {
  return `${s.slice(0, 6)}...${s.slice(-4)}`;
}

export function SeedBadge({ hash, serverSeed, status, className }: SeedBadgeProps) {
  const [copied, setCopied] = useState(false);

  if (!hash) return null;

  function copyHash() {
    navigator.clipboard.writeText(hash!).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const isRevealed = status === 'crashed' && !!serverSeed;

  return (
    <div className={clsx(styles.wrapper, isRevealed && styles.wrapperRevealed, className)}>
      <div className={styles.row}>
        <svg className={styles.lockIcon} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          {isRevealed ? (
            <path d="M8 1a3 3 0 0 0-3 3v1H3.5A1.5 1.5 0 0 0 2 6.5v7A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 12.5 5H11V4a3 3 0 0 0-3-3zm0 1.5A1.5 1.5 0 0 1 9.5 4v1h-3V4A1.5 1.5 0 0 1 8 2.5zM8 9a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
          ) : (
            <path d="M8 1a3 3 0 0 0-3 3v1H3.5A1.5 1.5 0 0 0 2 6.5v7A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 12.5 5H11V4A3 3 0 0 0 8 1zm0 1.5A1.5 1.5 0 0 1 9.5 4v1h-3V4A1.5 1.5 0 0 1 8 2.5zM8 9a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
          )}
        </svg>

        <div className={styles.content}>
          <span className={styles.label}>
            {isRevealed ? 'Seed revelada — verificável' : 'Hash da seed desta rodada'}
          </span>
          <span
            className={styles.hash}
            title={hash}
            aria-label={`Hash: ${hash}`}
          >
            {truncate(hash)}
          </span>
        </div>

        <button
          type="button"
          className={styles.copyBtn}
          onClick={copyHash}
          aria-label="Copiar hash"
        >
          {copied ? (
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 1 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/>
              <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/>
            </svg>
          )}
        </button>
      </div>

      {isRevealed && (
        <div className={styles.verifyRow}>
          <span className={styles.verifyLabel}>Verifique:</span>
          <code className={styles.formula}>sha256(<span className={styles.seedValue}>{serverSeed!.slice(0, 8)}…</span>) = {truncate(hash)}</code>
        </div>
      )}
    </div>
  );
}
