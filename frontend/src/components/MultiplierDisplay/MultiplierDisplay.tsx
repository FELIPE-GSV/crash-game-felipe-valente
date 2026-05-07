import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Card } from '../Card/Card';
import styles from './MultiplierDisplay.module.css';

export type MultiplierStatus = 'waiting' | 'running' | 'crashed';

interface MultiplierDisplayProps {
  value: number;
  status: MultiplierStatus;
  bettingEndsAt?: string | null;
  className?: string;
}

const STATUS_LABEL: Record<MultiplierStatus, string> = {
  waiting: 'AGUARDANDO RODADA',
  running: 'EM VOO',
  crashed: 'CRASHED',
};

type Tier = 'low' | 'mid' | 'high' | 'mythic';

function getMultiplierTier(value: number): Tier {
  if (value >= 10) return 'mythic';
  if (value >= 5) return 'high';
  if (value >= 2) return 'mid';
  return 'low';
}

const CURVE_MAX = 10;

/**
 * Maps a raw multiplier (>=1) to a normalized [0,1] progress value
 * along the trajectory. Eased so the rocket accelerates upward over time.
 */
function multiplierToProgress(m: number): number {
  const linear = Math.min(1, Math.max(0, (m - 1) / (CURVE_MAX - 1)));
  return 1 - Math.pow(1 - linear, 2.2);
}

function BettingTimer({ endsAt }: { endsAt: string }) {
  const [progress, setProgress] = useState(100);
  const [urgent, setUrgent] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const end = new Date(endsAt).getTime();
    const TOTAL = 10_000;

    function tick() {
      const remaining = end - Date.now();
      const pct = Math.max(0, Math.min(100, (remaining / TOTAL) * 100));
      setProgress(pct);
      setUrgent(remaining <= 3000);
      if (remaining > 0) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [endsAt]);

  return (
    <div className={styles.timerBar} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={clsx(styles.timerFill, urgent && styles.timerUrgent)}
        style={{ width: `${progress}%` }}
      />
      <span className={clsx(styles.timerText, urgent && styles.timerTextUrgent)}>
        {urgent ? 'FECHANDO APOSTAS' : 'JANELA DE APOSTAS ABERTA'}
      </span>
    </div>
  );
}

interface RocketProps {
  status: MultiplierStatus;
  tier: Tier;
  progress: number;
}

/**
 * SVG rocket positioned along the trajectory.
 * Position math: x goes 8% → 85%, y goes 90% → 15% of stage height.
 * Rotation tilts up as progress increases.
 */
function Rocket({ status, tier, progress }: RocketProps) {
  const x = 8 + progress * 77;
  const y = 90 - progress * 75;
  const rot = -45 - progress * 20;

  return (
    <div
      className={clsx(
        styles.rocket,
        styles[`rocket_${tier}`],
        status === 'crashed' && styles.rocket_crashed,
      )}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) rotate(${rot}deg)`,
      }}
      aria-hidden="true"
    >
      <div className={styles.flame} />
      <div className={styles.flameInner} />
      <svg className={styles.rocketSvg} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* body */}
        <path
          d="M40 6c8 5 14 13 16 24-1 6-3 12-7 16l-9 4-12-3-7-7-3-12 4-9c4-4 10-7 18-13z"
          fill="url(#rocketBody)"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.2"
        />
        {/* window */}
        <circle cx="36" cy="26" r="5" fill="#0F1419" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" />
        <circle cx="34.5" cy="24.5" r="1.6" fill="rgba(255,255,255,0.85)" />
        {/* fin */}
        <path
          d="M22 38l-8 6 6 1 6-3z"
          fill="url(#rocketFin)"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1"
        />
        <path
          d="M30 46l-3 8 7-2 1-7z"
          fill="url(#rocketFin)"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1"
        />
        <defs>
          <linearGradient id="rocketBody" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.5" stopColor="#E0E0E0" />
            <stop offset="1" stopColor="#9A9A9A" />
          </linearGradient>
          <linearGradient id="rocketFin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FF6B35" />
            <stop offset="1" stopColor="#E55B2B" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/**
 * SVG trajectory curve under the rocket.
 * Uses a quadratic bezier from the start (bottom-left) to the rocket tip,
 * with a control point that bends the curve for an exponential-feeling arc.
 */
function Trajectory({ progress, tier }: { progress: number; tier: Tier }) {
  // Convert percentage units to viewBox 100x100.
  const startX = 8;
  const startY = 90;
  const endX = 8 + progress * 77;
  const endY = 90 - progress * 75;
  // Bezier control: skewed toward the bottom-right so the path bends upward.
  const ctrlX = startX + (endX - startX) * 0.7;
  const ctrlY = startY;

  const path = `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;

  return (
    <svg
      className={clsx(styles.trajectory, styles[`trajectory_${tier}`])}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="trailGradient" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="0.6" stopColor="currentColor" stopOpacity="0.45" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      <path d={path} className={styles.trajectoryGlow} />
      <path d={path} stroke="url(#trailGradient)" />
    </svg>
  );
}

function Starfield({ active }: { active: boolean }) {
  return (
    <div className={clsx(styles.starfield, active && styles.starfieldActive)} aria-hidden="true">
      <div className={clsx(styles.starLayer, styles.starLayerFar)} />
      <div className={clsx(styles.starLayer, styles.starLayerNear)} />
    </div>
  );
}

/**
 * Subtle impact ring rendered at the rocket's last position.
 * Replaces the previous centered skull + double-ring combo, which
 * collided visually with the multiplier and the trajectory.
 */
function CrashImpact({ progress }: { progress: number }) {
  const x = 8 + progress * 77;
  const y = 90 - progress * 75;
  return (
    <div
      className={styles.impact}
      style={{ left: `${x}%`, top: `${y}%` }}
      aria-hidden="true"
    >
      <span className={styles.impactRing} />
    </div>
  );
}

export function MultiplierDisplay({ value, status, bettingEndsAt, className }: MultiplierDisplayProps) {
  const tier = getMultiplierTier(value);
  const progress = status === 'running' ? multiplierToProgress(value) : status === 'crashed' ? 1 : 0;

  return (
    <Card variant="elevated" className={clsx(styles.container, styles[`container_${status}`], className)}>
      <Starfield active={status === 'running'} />

      {(status === 'running' || status === 'crashed') && (
        <Trajectory progress={progress} tier={tier} />
      )}

      {(status === 'running' || status === 'crashed') && (
        <Rocket status={status} tier={tier} progress={progress} />
      )}

      <div className={clsx(styles.valueWrapper, styles[status])}>
        <span
          className={clsx(
            styles.value,
            styles[`value_${status}`],
            status === 'running' && styles[`tier_${tier}`],
          )}
          aria-live="polite"
        >
          {value.toFixed(2)}<span className={styles.valueX}>×</span>
        </span>
        <span className={clsx(styles.statusLabel, styles[`label_${status}`])}>
          {status === 'running' && (
            <svg className={styles.statusDot} viewBox="0 0 8 8" aria-hidden="true"><circle cx="4" cy="4" r="3" fill="currentColor" /></svg>
          )}
          {STATUS_LABEL[status]}
        </span>
      </div>

      {status === 'waiting' && bettingEndsAt && (
        <BettingTimer endsAt={bettingEndsAt} />
      )}

      {status === 'crashed' && (
        <>
          <div className={styles.crashOverlay} />
          <CrashImpact progress={progress} />
        </>
      )}
    </Card>
  );
}
