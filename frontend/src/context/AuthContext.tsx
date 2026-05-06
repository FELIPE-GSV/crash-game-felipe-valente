import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import keycloak from '../lib/keycloak';

interface AuthUser {
  id: string;
  username: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    keycloak
      .init({ onLoad: 'check-sso', silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html` })
      .then((authenticated) => {
        if (authenticated) {
          syncState();
        }
      })
      .finally(() => setIsLoading(false));

    // renova o token 60s antes de expirar
    const interval = setInterval(() => {
      keycloak.updateToken(60).then((refreshed) => {
        if (refreshed) syncState();
      });
    }, 30_000);

    return () => clearInterval(interval);
  }, []);

  function syncState() {
    const parsed = keycloak.tokenParsed;
    setToken(keycloak.token ?? null);
    setUser(
      parsed
        ? {
            id: parsed.sub ?? '',
            username: parsed.preferred_username ?? '',
            email: parsed.email ?? '',
          }
        : null,
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: keycloak.authenticated ?? false,
        isLoading,
        login: () => keycloak.login(),
        logout: () => keycloak.logout({ redirectUri: window.location.origin }),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
