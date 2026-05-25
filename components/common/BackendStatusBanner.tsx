'use client';

import { useState, useEffect, useCallback } from 'react';

export default function BackendStatusBanner() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const checkBackend = useCallback(async () => {
    setChecking(true);
    try {
      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      setIsOnline(response.ok);
    } catch {
      setIsOnline(false);
    } finally {
      setChecking(false);
    }
  }, [API_URL]);

  useEffect(() => {
    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, [checkBackend]);

  if (checking && isOnline === null) return null;

  if (isOnline === false) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white text-center py-2.5 px-4 text-sm font-medium shadow-lg">
        <div className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>后端服务未连接 — 部分功能可能不可用</span>
          <button
            onClick={checkBackend}
            className="ml-2 underline hover:no-underline text-xs"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return null;
}
