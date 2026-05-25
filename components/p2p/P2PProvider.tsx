'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { P2PManager, type PeerInfo } from '@/lib/p2p';

interface P2PState {
  peerId: string | null;
  isReady: boolean;
  connectedPeers: PeerInfo[];
  peerCount: number;
  addresses: string[];
  error: string | null;
  init: () => Promise<string | null>;
}

const P2PContext = createContext<P2PState | undefined>(undefined);

export function P2PProvider({ children }: { children: ReactNode }) {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [connectedPeers, setConnectedPeers] = useState<PeerInfo[]>([]);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refreshState = useCallback(() => {
    const p2p = P2PManager.getInstance();
    setIsReady(p2p.isReady());
    setConnectedPeers(p2p.getConnectedPeers());
    setAddresses(p2p.getMultiaddrs());
  }, []);

  const init = useCallback(async () => {
    try {
      const p2p = P2PManager.getInstance();
      const id = await p2p.init();
      if (id) {
        setPeerId(id);
        setError(null);
        refreshState();
      } else {
        setError('P2P节点初始化失败');
      }
      return id;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'P2P初始化异常';
      setError(msg);
      return null;
    }
  }, [refreshState]);

  useEffect(() => {
    init();

    const interval = setInterval(refreshState, 15000);
    return () => clearInterval(interval);
  }, [init, refreshState]);

  const peerCount = connectedPeers.length;

  return (
    <P2PContext.Provider value={{ peerId, isReady, connectedPeers, peerCount, addresses, error, init }}>
      {children}
    </P2PContext.Provider>
  );
}

export function useP2P() {
  const ctx = useContext(P2PContext);
  if (!ctx) throw new Error('useP2P must be used within P2PProvider');
  return ctx;
}
