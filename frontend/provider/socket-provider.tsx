'use client';

import { env } from '@/config/env';
import { AgentLog } from '@/types/common';
import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';


interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  subscribeToIntent: (intentId: string) => void;
  subscribeToWallet: (wallet: string) => void;
  onAgentLog: (handler: (log: AgentLog) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(env.NEXT_PUBLIC_BACKEND_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      console.log('Socket connected');
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
      console.log('Socket disconnected');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const subscribeToIntent = (intentId: string) => {
    socket?.emit('subscribe:intent', intentId);
  };

  const subscribeToWallet = (wallet: string) => {
    socket?.emit('subscribe:user', wallet);
  };

  const onAgentLog = (handler: (log: AgentLog) => void) => {
    socket?.on('agent:log', handler);
    // Return unsubscribe function
    return () => {
      socket?.off('agent:log', handler);
    };
  };

  const value: SocketContextType = {
    socket,
    connected,
    subscribeToIntent,
    subscribeToWallet,
    onAgentLog,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}