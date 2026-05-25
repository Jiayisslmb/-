//默认页面

import { Suspense, lazy } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import ContentFeed from '@/components/content/ContentFeed';
import Loading from './loading';

const TrendingTopics = lazy(() => import('@/components/content/TrendingTopics'));

export default function HomePage() {
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-64 shrink-0">
        <Sidebar />
      </div>

      <div className="flex-1">
        <Suspense fallback={<Loading />}>
          <ContentFeed type="recommended" />
        </Suspense>
      </div>

      <div className="w-full md:w-80 shrink-0 hidden md:block">
        <div className="sticky top-24">
          <Suspense fallback={<div className="animate-pulse h-64 bg-gray-100 rounded-xl" />}>
            <TrendingTopics />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
