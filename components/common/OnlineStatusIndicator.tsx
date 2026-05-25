'use client';

import { useOnlineStatus, formatLastSeen } from '@/lib/hooks/useOnlineStatus';

interface OnlineStatusIndicatorProps {
  userId: number | string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

export default function OnlineStatusIndicator({
  userId,
  showLabel = false,
  size = 'md',
  className = '',
}: OnlineStatusIndicatorProps) {
  const { isOnline, lastSeen, isLoading } = useOnlineStatus(userId, {
    enabled: !!userId,
    refreshInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`${sizeClasses[size]} rounded-full bg-gray-300 animate-pulse`} />
        {showLabel && <span className="text-sm text-gray-400">加载中...</span>}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`
          ${sizeClasses[size]} rounded-full 
          ${isOnline ? 'bg-green-500' : 'bg-gray-400'}
          ${isOnline ? 'animate-pulse' : ''}
          ring-2 ring-white
        `}
        title={isOnline ? '在线' : `离线 - ${formatLastSeen(lastSeen)}`}
      />
      {showLabel && (
        <span className={`text-sm ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
          {isOnline ? '在线' : formatLastSeen(lastSeen)}
        </span>
      )}
    </div>
  );
}

export function OnlineStatusBadge({
  userId,
  className = '',
}: {
  userId: number | string;
  className?: string;
}) {
  const { isOnline, isLoading } = useOnlineStatus(userId);

  if (isLoading || !isOnline) return null;

  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
        bg-green-100 text-green-800
        ${className}
      `}
    >
      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse" />
      在线
    </span>
  );
}

export function ConnectionStatusBar() {
  const { isConnected, isConnecting, reconnectAttempts, reconnect } = useConnectionState();

  if (isConnected) return null;

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 
        px-4 py-2 
        flex items-center justify-center gap-3
        ${isConnecting ? 'bg-yellow-50 text-yellow-800' : 'bg-red-50 text-red-800'}
        border-t ${isConnecting ? 'border-yellow-200' : 'border-red-200'}
        z-50
      `}
    >
      <div className="flex items-center gap-2">
        {isConnecting ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm">正在重新连接...</span>
            {reconnectAttempts > 0 && (
              <span className="text-xs opacity-75">(尝试 {reconnectAttempts})</span>
            )}
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-sm">连接已断开</span>
            <button
              onClick={reconnect}
              className="ml-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-xs font-medium transition-colors"
            >
              重新连接
            </button>
          </>
        )}
      </div>
    </div>
  );
}

import { useConnectionState } from '@/lib/hooks/useOnlineStatus';
