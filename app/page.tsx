//默认页面

import { Suspense, lazy } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import ContentFeed from '@/components/content/ContentFeed';
import Loading from './loading';
import GitHubAuthCallback from '@/components/auth/GitHubAuthCallback';

const TrendingTopics = lazy(() => import('@/components/content/TrendingTopics'));

export default function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <GitHubAuthCallback />
      </Suspense>
      <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Sidebar - hidden on mobile, visible on lg+ */}
      <div className="hidden lg:block w-64 shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Feed */}
      <div className="flex-1 min-w-0">
        <Suspense fallback={<Loading />}>
          <ContentFeed type="recommended" />
        </Suspense>
      </div>

      {/* Right Sidebar - hidden on mobile, shown on md+ */}
      <div className="hidden md:block w-full md:w-80 shrink-0">
        <div className="sticky top-24 space-y-4">
          <Suspense fallback={<div className="animate-pulse h-64 bg-gray-100 rounded-xl" />}>
            <TrendingTopics />
          </Suspense>
        </div>
      </div>
    </div>
    </>
  );
}
