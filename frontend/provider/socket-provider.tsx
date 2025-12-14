'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';
import { AgentLog } from '@/types';
import { env } from '@/config/env';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  subscribeToIntent: (intentId: string) => void;
  subscribeToWallet: (wallet: string) => void;
  onAgentLog: (handler: (log: AgentLog) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000;

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { toast } = useToast();
  const reconnectAttemptRef = useRef(0);

  useEffect(() => {
    const socketUrl = env.NEXT_PUBLIC_BACKEND_URL || 'ws://localhost:3001';
    
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'], // Fallback to polling
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: RECONNECT_DELAY,
      timeout: 10000, // 10s connection timeout
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      reconnectAttemptRef.current = 0;
      console.log('✅ Socket connected to:', socketUrl);
    });

    socketInstance.on('disconnect', (reason) => {
      setConnected(false);
      console.log('❌ Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        toast({
          title: 'Session Ended',
          description: 'You have been disconnected from the server',
          variant: 'destructive',
        });
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      reconnectAttemptRef.current++;
      
      if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
        toast({
          title: 'Connection Failed',
          description: 'Could not connect to server. Please refresh.',
          variant: 'destructive',
        });
      }
    });

    socketInstance.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 Reconnection attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS}`);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [toast]);

  // Memoized handlers to prevent recreation
  const subscribeToIntent = useCallback((intentId: string) => {
    socket?.emit('subscribe:intent', intentId);
  }, [socket]);

  const subscribeToWallet = useCallback((wallet: string) => {
    socket?.emit('subscribe:user', wallet);
  }, [socket]);

  const onAgentLog = useCallback((handler: (log: AgentLog) => void) => {
    socket?.on('agent:log', handler);
    return () => {
      socket?.off('agent:log', handler);
    };
  }, [socket]);

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