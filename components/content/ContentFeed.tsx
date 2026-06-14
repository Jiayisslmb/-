//内容流组件 - 首页展示文章，个人主页展示动态
// 帖子(Post) = 文章(Article) + 动态(Moment)
// - 文章：出现在首页/搜索/个人主页
// - 动态：仅出现在个人主页

'use client';

import { useRef, useCallback, useEffect } from 'react';
import type { PostDTO } from '@/types';
import PostItem, { Post } from './PostItem';
import { motion, AnimatePresence } from 'framer-motion';
import { request } from '@/lib/fetch-client';
import { getIPFSUrl } from '@/lib/ipfs';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/common/StateRenderer';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { stagger, staggerItem } from '@/lib/animations';
import useSWRInfinite from 'swr/infinite';

interface ContentFeedProps {
  type?: 'recommended' | 'following' | 'user' | 'search' | 'circle';
  userId?: string;
  searchQuery?: string;
  circleId?: string;
}

function mapApiPost(item: Record<string, unknown>): Post {
  const author = (item.user || item.author || {}) as Record<string, unknown>;
  const counts = (item._count || {}) as Record<string, number>;
  return {
    id: String(item.id),
    author: {
      id: String(author.id || 0),
      username: (author.username as string) || '未知用户',
      nickname: author.nickname as string | undefined,
      avatar: getIPFSUrl(author.avatarCid as string | undefined),
      avatarCid: author.avatarCid as string | undefined,
    },
    title: item.title as string | undefined,
    content: item.content as string,
    type: 'article',
    mediaUrl: getIPFSUrl((item.mediaCid || item.coverCid) as string | undefined),
    mediaCid: (item.mediaCid || item.coverCid) as string | undefined,
    likes: counts.articlelike || (item.likes as number) || 0,
    comments: counts.articlecomment || (item.comments as number) || 0,
    shares: counts.articlerepost || (item.shares as number) || (item.reposts as number) || 0,
    visibility: (item.visibility as PostDTO['visibility']) || 'public',
    createdAt: item.createdAt as string,
    tags: Array.isArray(item.tags)
      ? item.tags as string[]
      : typeof item.tags === 'string'
        ? (item.tags as string).split(',').filter(Boolean)
        : [],
    circleId: item.circleId ? Number(item.circleId) : undefined,
    circleName: (item.circle as Record<string, unknown>)?.name as string | undefined,
  };
}

const PAGE_SIZE_FIRST = 5;
const PAGE_SIZE = 10;

function getEndpoint(type: string, userId?: string, searchQuery?: string, circleId?: string) {
  if (type === 'user' && userId) return `/content/articles/user/${userId}`;
  if (type === 'search' && searchQuery) return `/content/search?q=${encodeURIComponent(searchQuery)}`;
  if (type === 'circle' && circleId) return `/circles/${circleId}/posts`;
  return '/content/articles/feed';
}

export default function ContentFeed({ type = 'recommended', userId, searchQuery, circleId }: ContentFeedProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const getKey = useCallback(
    (pageIndex: number, previousPageData: Post[] | null) => {
      if (previousPageData && previousPageData.length === 0) return null; // reached end
      const take = pageIndex === 0 ? PAGE_SIZE_FIRST : PAGE_SIZE;
      const skip = pageIndex === 0 ? 0 : PAGE_SIZE_FIRST + (pageIndex - 1) * PAGE_SIZE;
      const base = getEndpoint(type, userId, searchQuery, circleId);
      const sep = base.includes('?') ? '&' : '?';
      return `${base}${sep}skip=${skip}&take=${take}`;
    },
    [type, userId, searchQuery, circleId],
  );

  const fetcher = useCallback(
    async (url: string): Promise<Post[]> => {
      const data = await request<Array<Record<string, unknown>>>(url);
      if (!Array.isArray(data)) return [];
      return data.map(mapApiPost);
    },
    [],
  );

  const { data, error, size, setSize, isValidating, mutate } = useSWRInfinite<Post[]>(getKey, fetcher, {
    revalidateOnFocus: false,
    revalidateFirstPage: false,
    initialSize: 1,
  });

  // Flatten pages into single array
  const posts = data?.flat() ?? [];
  const isLoading = !data && !error;
  const isLoadingMore = isValidating && data && data.length > 0;
  const isEmpty = data?.[0]?.length === 0;
  const isReachingEnd = data && data[data.length - 1]?.length === 0;

  // IntersectionObserver: load next page when sentinel enters viewport
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry?.isIntersecting && !isValidating && !isReachingEnd) {
        setSize(size + 1);
      }
    },
    [isValidating, isReachingEnd, setSize, size],
  );

  // Observe sentinel for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(handleObserver, { rootMargin: '200px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleObserver]);

  const handleLike = (postId: string) => {
    mutate((pages) =>
      pages?.map((page) =>
        page.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p)),
      ),
      false,
    );
  };

  const handleDelete = (postId: string) => {
    mutate((pages) =>
      pages?.map((page) => page.filter((p) => p.id !== postId)),
      false,
    );
  };

  const handleShare = (postId: string, newShares: number) => {
    mutate((pages) =>
      pages?.map((page) =>
        page.map((p) => (p.id === postId ? { ...p, shares: newShares } : p)),
      ),
      false,
    );
  };

  // Initial loading
  if (isLoading) return <ListSkeleton count={4} />;

  // Error state
  if (error && !data) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-red-500 mb-4 font-medium">加载失败</p>
        <p className="text-gray-500 text-sm mb-4">{error.message || '请检查网络连接'}</p>
        <button
          onClick={() => mutate()}
          className="px-5 py-2.5 bg-[#6364FF] text-white rounded-xl text-sm font-medium hover:bg-[#5558DD] transition-colors"
        >
          点击重试
        </button>
      </div>
    );
  }

  // Empty state
  if (isEmpty) return <EmptyState />;

  return (
    <ErrorBoundary severity="section">
      <motion.div variants={stagger} initial="hidden" animate="visible">
        <AnimatePresence mode="popLayout">
          {posts.map((post) => (
            <motion.div
              key={post.id}
              variants={staggerItem}
              layout
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            >
              <PostItem
                post={post}
                onLike={handleLike}
                onDelete={handleDelete}
                onShare={handleShare}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-1" />

      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="flex justify-center py-6">
          <div className="flex items-center gap-2 text-gray-400">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">加载更多...</span>
          </div>
        </div>
      )}

      {/* No more content */}
      {isReachingEnd && posts.length > 0 && (
        <div className="text-center py-8">
          <div className="inline-block px-4 py-2 bg-gray-50 rounded-full text-sm text-gray-400">
            没有更多了
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
}
