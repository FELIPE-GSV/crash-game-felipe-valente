import { Button } from '../components/Button/Button';
import { WalletBadge } from '../components/WalletBadge/WalletBadge';
import { MultiplierDisplay } from '../components/MultiplierDisplay/MultiplierDisplay';
import { BetPanel } from '../components/BetPanel/BetPanel';
import { BetHistoryCard } from '../components/BetHistoryCard/BetHistoryCard';
import { LiveBetsFeed } from '../components/LiveBetsFeed/LiveBetsFeed';
import { CrashHistoryStrip } from '../components/CrashHistoryStrip/CrashHistoryStrip';
import { SeedBadge } from '../components/SeedBadge/SeedBadge';
import { Toast } from '../components/Toast/Toast';
import { useAuth } from '../hooks/useAuth';
import { useGameState } from '../hooks/useGameState';
import { useBetHistory } from '../hooks/useBetHistory';
import { useCrashHistory } from '../hooks/useCrashHistory';
import { useLiveBets } from '../hooks/useLiveBets';
import { useToast } from '../hooks/useToast';
import styles from './HomePage.module.css';

export function HomePage() {
  const { user, logout } = useAuth();
  const game = useGameState();
  const { entries, isLoading: historyLoading } = useBetHistory();
  const crashHistory = useCrashHistory();
  const liveBets = useLiveBets(game.roundId);
  const { toasts, addToast, dismiss } = useToast();

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
              />
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
