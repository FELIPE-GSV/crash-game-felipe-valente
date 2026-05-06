import { Button } from '../components/Button/Button';
import { WalletBadge } from '../components/WalletBadge/WalletBadge';
import { MultiplierDisplay } from '../components/MultiplierDisplay/MultiplierDisplay';
import { BetPanel } from '../components/BetPanel/BetPanel';
import { BetHistoryCard } from '../components/BetHistoryCard/BetHistoryCard';
import { Toast } from '../components/Toast/Toast';
import { useAuth } from '../hooks/useAuth';
import { useGameState } from '../hooks/useGameState';
import { useBetHistory } from '../hooks/useBetHistory';
import { useToast } from '../hooks/useToast';
import styles from './HomePage.module.css';

export function HomePage() {
  const { user, logout } = useAuth();
  const game = useGameState();
  const { entries, isLoading: historyLoading } = useBetHistory();
  const { toasts, addToast, dismiss } = useToast();

  return (
    <div className={styles.page}>
      <nav className={styles.navbar}>
        <span className={styles.brand}>CRASH</span>
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
        <div className={styles.gameLayout}>
          <div className={styles.leftColumn}>
            <MultiplierDisplay
              value={game.multiplier}
              status={game.status}
              bettingEndsAt={game.bettingEndsAt}
            />
            <BetPanel
              gameStatus={game.status}
              multiplier={game.multiplier}
              roundId={game.roundId}
              onToast={addToast}
            />
          </div>
          <div className={styles.rightColumn}>
            <BetHistoryCard entries={entries} isLoading={historyLoading} />
          </div>
        </div>
      </main>

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
