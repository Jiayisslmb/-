import dynamic from 'next/dynamic';
import PageSkeleton from '@/components/ui/Skeleton';

type DynamicImport<T> = () => Promise<{ default: T }>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyPage(importFn: DynamicImport<any>, options?: { ssr?: boolean }) {
  return dynamic(importFn, {
    loading: () => <PageSkeleton />,
    ssr: options?.ssr ?? true,
  });
}
