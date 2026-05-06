import { Button } from '../components/Button/Button';
import { WalletBadge } from '../components/WalletBadge/WalletBadge';
import { MultiplierDisplay } from '../components/MultiplierDisplay/MultiplierDisplay';
import { BetPanel } from '../components/BetPanel/BetPanel';
import { BetHistoryCard, type BetHistoryEntry } from '../components/BetHistoryCard/BetHistoryCard';
import { useAuth } from '../hooks/useAuth';
import styles from './HomePage.module.css';

const MOCK_HISTORY: BetHistoryEntry[] = [
  { id: 1, multiplier: 5.67, amount: 20, profit: 93.40, won: true },
  { id: 2, multiplier: 2.34, amount: 20, profit: 26.80, won: true },
  { id: 3, multiplier: 1.00, amount: 10, profit: -10.00, won: false },
  { id: 4, multiplier: 3.12, amount: 25, profit: 53.00, won: true },
  { id: 5, multiplier: 8.90, amount: 15, profit: 118.50, won: true },
  { id: 6, multiplier: 1.00, amount: 30, profit: -30.00, won: false },
];

export function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className={styles.page}>
      <nav className={styles.navbar}>
        <span className={styles.brand}>CRASH</span>
        <div className={styles.navRight}>
          <WalletBadge balance={1250.00} />
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
            <MultiplierDisplay value={12.54} status="running" />
            <BetPanel />
          </div>
          <div className={styles.rightColumn}>
            <BetHistoryCard entries={MOCK_HISTORY} />
          </div>
        </div>
      </main>
    </div>
  );
}
