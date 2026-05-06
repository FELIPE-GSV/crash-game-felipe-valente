import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from '../lib/socket';
import { useAuth } from '../hooks/useAuth';

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      disconnectSocket();
      setSocket(null);
      return;
    }

    const s = getSocket(token);
    setSocket(s);

    return () => {
      disconnectSocket();
      setSocket(null);
    };
  }, [isAuthenticated, token]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket(): Socket | null {
  return useContext(SocketContext);
}
