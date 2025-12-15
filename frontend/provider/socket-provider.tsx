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
  emit: (event: string, ...args: any[]) => void; // ✅ Add emit for debugging
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000;

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { toast } = useToast();
  const reconnectAttemptRef = useRef(0);

  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    const socketUrl = env.NEXT_PUBLIC_BACKEND_URL || 'ws://localhost:3001';
    console.log('🐞 SOCKET: Initializing connection to', socketUrl);
    
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: RECONNECT_DELAY,
      timeout: 10000,
      autoConnect: true,
      // ✅ Force immediate connection
      forceNew: true,
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      reconnectAttemptRef.current = 0;
      console.log('✅ SOCKET: Connected successfully, ID:', socketInstance.id);
    });

    socketInstance.on('disconnect', (reason) => {
      setConnected(false);
      console.log('❌ SOCKET: Disconnected. Reason:', reason);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('SOCKET: Connection error:', error.message);
      reconnectAttemptRef.current++;
    });

    socketInstance.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 SOCKET: Reconnection attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS}`);
    });

    // ✅ CRITICAL: Log ALL incoming events
    socketInstance.onAny((event, ...args) => {
      console.log('📥 SOCKET: Received event:', event, 'Data:', args);
    });

    setSocket(socketInstance);

    return () => {
      console.log('🔌 SOCKET: Cleaning up connection');
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
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
  }, [socket]);

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

  // ✅ Allow direct emission for debugging
  const emit = useCallback((event: string, ...args: any[]) => {
    if (!socket) return;
    socket.emit(event, ...args);
  }, [socket]);

  const value: SocketContextType = {
    socket,
    connected,
    subscribeToIntent,
    subscribeToWallet,
    onAgentLog,
    emit,
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