//内容流组件 - 首页展示文章，个人主页展示动态
// 帖子(Post) = 文章(Article) + 动态(Moment)
// - 文章：出现在首页/搜索/个人主页
// - 动态：仅出现在个人主页

'use client';

import { useState, useEffect } from 'react';
import type { PostDTO } from '@/types';
import PostItem, { Post } from './PostItem';
import { motion, AnimatePresence } from 'framer-motion';
import { request } from '@/lib/fetch-client';
import { getIPFSUrl } from '@/lib/ipfs';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/StateRenderer';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { stagger, staggerItem } from '@/lib/animations';

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

export default function ContentFeed({ type = 'recommended', userId, searchQuery, circleId }: ContentFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      let endpoint = '/content/articles/feed';

      if (type === 'user' && userId) {
        endpoint = `/content/articles/user/${userId}`;
      } else if (type === 'search' && searchQuery) {
        endpoint = `/content/search?q=${encodeURIComponent(searchQuery)}`;
      } else if (type === 'circle' && circleId) {
        endpoint = `/circles/${circleId}/posts`;
      }

      const data = await request<Array<Record<string, unknown>>>(endpoint);
      if (Array.isArray(data)) {
        setPosts(data.map(mapApiPost));
      } else {
        setPosts([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取内容失败';
      setError(message);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [type, userId, searchQuery, circleId]);

  const handleLike = (postId: string) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p)));
  };

  const handleDelete = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleShare = (postId: string, newShares: number) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, shares: newShares } : p)));
  };

  if (loading) return <ListSkeleton count={4} />;

  if (error) return <ErrorState message="加载失败" detail={error} onRetry={fetchPosts} />;

  if (posts.length === 0) return <EmptyState />;

  return (
    <ErrorBoundary severity="section">
      <motion.div className="space-y-4" variants={stagger} initial="hidden" animate="visible">
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
    </ErrorBoundary>
  );
}
