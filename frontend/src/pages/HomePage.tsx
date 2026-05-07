import { Button } from '../components/Button/Button';
import { WalletBadge } from '../components/WalletBadge/WalletBadge';
import { MultiplierDisplay } from '../components/MultiplierDisplay/MultiplierDisplay';
import { BetPanel } from '../components/BetPanel/BetPanel';
import { BetHistoryCard } from '../components/BetHistoryCard/BetHistoryCard';
import { LiveBetsFeed } from '../components/LiveBetsFeed/LiveBetsFeed';
import { CrashHistoryStrip } from '../components/CrashHistoryStrip/CrashHistoryStrip';
import { SeedBadge } from '../components/SeedBadge/SeedBadge';
import { CurveFormula } from '../components/CurveFormula/CurveFormula';
import { Toast } from '../components/Toast/Toast';
import { useAuth } from '../hooks/useAuth';
import { useGameState } from '../hooks/useGameState';
import { useBetHistory } from '../hooks/useBetHistory';
import { useCrashHistory } from '../hooks/useCrashHistory';
import { useLiveBets } from '../hooks/useLiveBets';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { useToast } from '../hooks/useToast';
import styles from './HomePage.module.css';

export function HomePage() {
  const { user, logout } = useAuth();
  const game = useGameState();
  const { entries, isLoading: historyLoading } = useBetHistory();
  const crashHistory = useCrashHistory();
  const liveBets = useLiveBets(game.roundId);
  const { toasts, addToast, dismiss } = useToast();
  const { playBet, playCashout, playUrgentBeep, muted, toggleMute } = useSoundEffects(game.status);

  return (
    <div className={styles.page}>
      <div className={styles.aurora} aria-hidden="true" />

      <nav className={styles.navbar}>
        <div className={styles.brandWrap}>
          <svg className={styles.brandIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M16.5 3c-2.5 0-5 1.2-7.4 3.6L7.5 8.2 5 9c-.6.2-.8.9-.4 1.4l1.8 2.4-1.2 1.2a1 1 0 0 0 0 1.4l3.4 3.4a1 1 0 0 0 1.4 0l1.2-1.2 2.4 1.8c.5.4 1.2.2 1.4-.4l.8-2.5 1.6-1.6C19.8 12 21 9.5 21 7c0-2.5-1.5-4-4.5-4zm-2 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="url(#brandGrad)"/>
            <defs>
              <linearGradient id="brandGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#FFD700"/>
                <stop offset="0.6" stopColor="#FF6B35"/>
                <stop offset="1" stopColor="#E55B2B"/>
              </linearGradient>
            </defs>
          </svg>
          <span className={styles.brand}>CRASH</span>
          <span className={styles.brandDot} />
          <span className={styles.brandTagline}>real-time</span>
        </div>
        <div className={styles.navRight}>
          <WalletBadge />
          <button
            type="button"
            className={styles.muteBtn}
            onClick={toggleMute}
            aria-label={muted ? 'Ativar sons' : 'Silenciar sons'}
            title={muted ? 'Ativar sons' : 'Silenciar sons'}
          >
            {muted ? (
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0 1 10 4v12a1 1 0 0 1-1.707.707L4.586 13H2a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h2.586l3.707-3.707a1 1 0 0 1 1.09-.217zM12.293 7.293a1 1 0 0 1 1.414 0L15 8.586l1.293-1.293a1 1 0 1 1 1.414 1.414L16.414 10l1.293 1.293a1 1 0 0 1-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 0 1-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 0 1 0-1.414z" clipRule="evenodd"/>
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0 1 10 4v12a1 1 0 0 1-1.707.707L4.586 13H2a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h2.586l3.707-3.707a1 1 0 0 1 1.09-.217zM14.657 2.929a1 1 0 0 1 1.414 0A9.972 9.972 0 0 1 19 10a9.972 9.972 0 0 1-2.929 7.071 1 1 0 0 1-1.414-1.414A7.971 7.971 0 0 0 17 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 0 1 0-1.414zm-2.829 2.828a1 1 0 0 1 1.415 0A5.983 5.983 0 0 1 15 10a5.984 5.984 0 0 1-1.757 4.243 1 1 0 0 1-1.415-1.415A3.984 3.984 0 0 0 13 10a3.983 3.983 0 0 0-1.172-2.828 1 1 0 0 1 0-1.415z" clipRule="evenodd"/>
              </svg>
            )}
          </button>
          <div className={styles.userInfo}>
            <span className={styles.username}>{user?.username}</span>
            <span className={styles.email}>{user?.email}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={logout}>
            Sair
          </Button>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.stack}>
          <CrashHistoryStrip entries={crashHistory} />

          <div className={styles.gameLayout}>
            <div className={styles.leftColumn}>
              <MultiplierDisplay
                value={game.multiplier}
                status={game.status}
                bettingEndsAt={game.bettingEndsAt}
                onUrgentBeep={playUrgentBeep}
              />
              <CurveFormula multiplier={game.multiplier} status={game.status} />
              <SeedBadge
                hash={game.serverSeedHash}
                serverSeed={game.serverSeed}
                status={game.status}
              />
              <BetPanel
                gameStatus={game.status}
                multiplier={game.multiplier}
                roundId={game.roundId}
                onToast={addToast}
                onBetSound={playBet}
                onCashoutSound={playCashout}
              />
            </div>
            <div className={styles.rightColumn}>
              <LiveBetsFeed entries={liveBets} />
              <BetHistoryCard entries={entries} isLoading={historyLoading} />
            </div>
          </div>
        </div>
      </main>

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
