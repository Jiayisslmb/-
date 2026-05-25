'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { chatClient, UserStatusInfo, ConnectionState } from '@/lib/chat';

interface UseOnlineStatusOptions {
  enabled?: boolean;
  refreshInterval?: number;
}

export function useOnlineStatus(userId?: number | string, options: UseOnlineStatusOptions = {}) {
  const { enabled = true, refreshInterval = 30000 } = options;
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [lastSeen, setLastSeen] = useState<string | undefined>(undefined);
  const [deviceCount, setDeviceCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkStatus = useCallback(() => {
    if (!userId || !enabled) return;
    
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(numericUserId)) return;

    const status = chatClient.getUserStatus(numericUserId);
    if (status) {
      setIsOnline(status.isOnline);
      setLastSeen(status.lastSeen);
      setDeviceCount(status.deviceCount || 0);
    } else {
      const online = chatClient.isUserOnline(numericUserId);
      setIsOnline(online);
    }
    setIsLoading(false);
  }, [userId, enabled]);

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(numericUserId)) {
      return;
    }

    checkStatus();

    const unsubscribe = chatClient.onUserStatus((status) => {
      if (status.userId === numericUserId) {
        setIsOnline(status.isOnline);
        setLastSeen(status.lastSeen);
        if (status.deviceCount !== undefined) {
          setDeviceCount(status.deviceCount);
        }
      }
    });

    intervalRef.current = setInterval(() => {
      if (chatClient.isSocketConnected()) {
        chatClient.getUserStatusBatch([numericUserId]);
      }
    }, refreshInterval);

    return () => {
      unsubscribe();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId, enabled, refreshInterval, checkStatus]);

  return {
    isOnline,
    lastSeen,
    deviceCount,
    isLoading,
    refresh: checkStatus,
  };
}

export function useMultipleOnlineStatus(userIds: (number | string)[], options: UseOnlineStatusOptions = {}) {
  const { enabled = true, refreshInterval = 30000 } = options;
  const [statuses, setStatuses] = useState<Map<number, UserStatusInfo>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const numericUserIds = useMemo(() => {
    return userIds
      .map(id => typeof id === 'string' ? parseInt(id, 10) : id)
      .filter(id => !isNaN(id));
  }, [userIds]);

  const refresh = useCallback(() => {
    if (!enabled || numericUserIds.length === 0) {
      setIsLoading(false);
      return;
    }

    const currentStatuses = new Map<number, UserStatusInfo>();
    numericUserIds.forEach(id => {
      const status = chatClient.getUserStatus(id);
      if (status) {
        currentStatuses.set(id, status);
      } else {
        currentStatuses.set(id, {
          userId: id,
          isOnline: chatClient.isUserOnline(id),
        });
      }
    });
    setStatuses(currentStatuses);
    setIsLoading(false);
  }, [numericUserIds, enabled]);

  useEffect(() => {
    if (!enabled || numericUserIds.length === 0) {
      return;
    }

    refresh();

    const unsubscribe = chatClient.onUserStatuses((newStatuses) => {
      setStatuses(prev => {
        const updated = new Map(prev);
        newStatuses.forEach(status => {
          if (numericUserIds.includes(status.userId)) {
            updated.set(status.userId, status);
          }
        });
        return updated;
      });
    });

    intervalRef.current = setInterval(() => {
      if (chatClient.isSocketConnected() && numericUserIds.length > 0) {
        chatClient.getUserStatusBatch(numericUserIds);
      }
    }, refreshInterval);

    return () => {
      unsubscribe();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [numericUserIds, enabled, refreshInterval, refresh]);

  return {
    statuses,
    isLoading,
    refresh,
    getStatus: (userId: number) => statuses.get(userId),
  };
}

export function useConnectionState() {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    lastPing: 0,
    reconnectAttempts: 0,
  });

  useEffect(() => {
    const unsubscribe = chatClient.onConnectionStateChange((state) => {
      setConnectionState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    ...connectionState,
    reconnect: () => chatClient.reconnect(),
  };
}

export function useOnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = chatClient.onOnlineUsersUpdate((userIds) => {
      setOnlineUsers(userIds);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    onlineUsers,
    isLoading,
    isUserOnline: (userId: number) => onlineUsers.includes(userId),
  };
}

export function formatLastSeen(lastSeen?: string): string {
  if (!lastSeen) return '未知';
  
  const date = new Date(lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}
