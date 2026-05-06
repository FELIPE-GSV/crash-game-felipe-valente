import { Button } from '../components/Button/Button';
import { useAuth } from '../hooks/useAuth';
import styles from './HomePage.module.css';

export function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className={styles.page}>
      <nav className={styles.navbar}>
        <span className={styles.brand}>CRASH</span>
        <div className={styles.navRight}>
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
        <div className={styles.placeholder}>
          <span className={styles.multiplier}>1.00×</span>
          <p className={styles.placeholderText}>
            O jogo está sendo construído.
            <br />
            Em breve o multiplicador vai decolar.
          </p>
        </div>
      </main>
    </div>
  );
}
