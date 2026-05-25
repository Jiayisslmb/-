'use client';

import type { ReactNode } from 'react';
import type { AsyncState } from '@/lib/hooks/useSafeAsync';

interface StateRendererProps<T> {
  state: AsyncState<T>;
  loading?: ReactNode;
  error?: (error: Error, retry: () => void) => ReactNode;
  empty?: ReactNode;
  children: (data: T) => ReactNode;
}

function DefaultLoading() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-20 bg-gray-100 rounded-xl" />
      ))}
    </div>
  );
}

function DefaultError({ error }: { error: Error; retry: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">⚠</div>
      <p className="text-gray-600 mb-2">加载失败</p>
      <p className="text-gray-400 text-sm">{error.message}</p>
    </div>
  );
}

function DefaultEmpty() {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">📭</div>
      <p className="text-gray-500">暂无内容</p>
    </div>
  );
}

export function StateRenderer<T>({
  state,
  loading,
  error,
  empty,
  children,
}: StateRendererProps<T>) {
  switch (state.status) {
    case 'idle':
      return loading ?? <DefaultLoading />;
    case 'loading':
      return loading ?? <DefaultLoading />;
    case 'error':
      return error
        ? error(state.error, () => {})
        : <DefaultError error={state.error} retry={() => {}} />;
    case 'success': {
      const isArray = Array.isArray(state.data);
      if (isArray && (state.data as unknown[]).length === 0) {
        return empty ?? <DefaultEmpty />;
      }
      return <>{children(state.data)}</>;
    }
    default:
      return null;
  }
}

export function EmptyState({ message = '暂无内容' }: { message?: string }) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">📭</div>
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

export function ErrorState({
  message = '加载失败',
  detail,
  onRetry,
}: {
  message?: string;
  detail?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">⚠</div>
      <p className="text-gray-600 mb-2">{message}</p>
      {detail && <p className="text-gray-400 text-sm">{detail}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-5 py-2 bg-[#6364FF] text-white rounded-lg hover:bg-[#5558DD] transition text-sm"
        >
          重试
        </button>
      )}
    </div>
  );
}
