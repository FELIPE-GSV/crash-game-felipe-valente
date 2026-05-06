import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button/Button';
import { useAuth } from '../hooks/useAuth';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div>
          <p className={styles.logo}>CRASH</p>
          <p className={styles.subtitle}>Jungle Gaming</p>
        </div>

        <div className={styles.divider} />

        <p className={styles.description}>
          Entre com sua conta para começar a jogar.
          <br />
          O multiplicador não espera ninguém.
        </p>

        <Button
          className={styles.loginBtn}
          size="lg"
          onClick={login}
          loading={isLoading}
        >
          Entrar
        </Button>

        <p className={styles.footer}>
          Autenticação segura via Keycloak · +18
        </p>
      </div>
    </div>
  );
}
