'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';
import { AgentLog } from '@/types';
import { env } from '@/config/env';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  subscribedWallet: string | null;
  subscribeToIntent: (intentId: string) => void;
  subscribeToWallet: (wallet: string) => void;
  onAgentLog: (handler: (log: AgentLog) => void) => () => void;
  emitWalletSubscription: (wallet: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000;

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [subscribedWallet, setSubscribedWallet] = useState<string | null>(null);
  const { toast } = useToast();
  const reconnectAttemptRef = useRef(0);
  const mountedRef = useRef(true);

  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    mountedRef.current = true;
    
    const socketUrl = env.NEXT_PUBLIC_BACKEND_URL || 'ws://localhost:3001';
    console.log('🐞 SOCKET: Initializing connection to', socketUrl);
    
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: RECONNECT_DELAY,
      timeout: 10000,
      autoConnect: true,
      forceNew: false, // Critical: false for React StrictMode
    });

    socketInstance.on('connect', () => {
      if (!mountedRef.current) return;
      setConnected(true);
      reconnectAttemptRef.current = 0;
      console.log('✅ SOCKET: Connected successfully, ID:', socketInstance.id);
      
      // Auto-subscribe to wallet if available in localStorage
      const wallet = localStorage.getItem('connected_wallet');
      if (wallet) {
        const normalizedWallet = wallet.toLowerCase();
        socketInstance.emit('subscribe:user', normalizedWallet);
        setSubscribedWallet(normalizedWallet);
        console.log('📡 SOCKET: Auto-subscribed to wallet from storage:', normalizedWallet);
      }
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ SOCKET: Disconnected. Reason:', reason);
      if (mountedRef.current) {
        setConnected(false);
        setSubscribedWallet(null);
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('SOCKET: Connection error:', error.message);
      reconnectAttemptRef.current++;
      
      if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
        toastRef.current({
          title: 'Connection Failed',
          description: 'Could not connect to server. Please refresh.',
          variant: 'destructive',
        });
      }
    });

    socketInstance.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 SOCKET: Reconnection attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS}`);
    });

    socketInstance.onAny((event, ...args) => {
      console.log('📥 SOCKET: Received event:', event, 'Data:', args);
    });

    if (mountedRef.current) {
      setSocket(socketInstance);
    }

    return () => {
      console.log('🔌 SOCKET: Cleaning up connection');
      mountedRef.current = false;
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
      setSubscribedWallet(null);
    };
  }, []);

  const subscribeToIntent = useCallback((intentId: string) => {
    if (!socket || !intentId) {
      console.warn('🐞 SOCKET: Cannot subscribe - no socket or intentId');
      return;
    }
    console.log('📡 SOCKET: Subscribing to intent:', intentId);
    socket.emit('subscribe:intent', intentId);
  }, [socket]);

  const subscribeToWallet = useCallback((wallet: string) => {
    if (!socket || !wallet) {
      console.warn('🐞 SOCKET: Cannot subscribe - no socket or wallet');
      return;
    }
    const normalizedWallet = wallet.toLowerCase();
    console.log('📡 SOCKET: Subscribing to wallet:', normalizedWallet);
    socket.emit('subscribe:user', normalizedWallet);
    setSubscribedWallet(normalizedWallet);
    localStorage.setItem('connected_wallet', wallet);
  }, [socket]);

  const emitWalletSubscription = useCallback((wallet: string) => {
    subscribeToWallet(wallet);
  }, [subscribeToWallet]);

  const onAgentLog = useCallback((handler: (log: AgentLog) => void) => {
    if (!socket) return () => {};
    
    console.log('🐞 SOCKET: Attaching agent:log listener');
    const wrappedHandler = (log: AgentLog) => {
      console.log('📥 SOCKET: Received agent:log:', log);
      handler(log);
    };
    
    socket.on('agent:log', wrappedHandler);
    return () => {
      socket.off('agent:log', wrappedHandler);
    };
  }, [socket]);

  const value: SocketContextType = {
    socket,
    connected,
    subscribedWallet,
    subscribeToIntent,
    subscribeToWallet,
    onAgentLog,
    emitWalletSubscription,
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