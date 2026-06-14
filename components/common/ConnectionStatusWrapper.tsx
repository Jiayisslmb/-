'use client';

import { useAuth } from '@/lib/auth';
import { ConnectionStatusBar } from './OnlineStatusIndicator';

export default function ConnectionStatusWrapper() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  return <ConnectionStatusBar />;
}
