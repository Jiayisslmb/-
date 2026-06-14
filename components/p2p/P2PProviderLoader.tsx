'use client';

import dynamic from 'next/dynamic';

/**
 * P2PProvider 延迟加载包装器
 *
 * 在 Client Component 中使用 dynamic() + ssr: false，
 * 将 libp2p (~600KB+) 从首屏 JS Bundle 中移除。
 */
const P2PProvider = dynamic(
  () => import('./P2PProvider').then((m) => ({ default: m.P2PProvider })),
  { ssr: false },
);

export function P2PProviderLoader({ children }: { children: React.ReactNode }) {
  return <P2PProvider>{children}</P2PProvider>;
}
