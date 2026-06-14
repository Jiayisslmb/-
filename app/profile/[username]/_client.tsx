/**
 * 用户个人主页 - 客户端标签页切换组件
 *
 * 核心改进：将 动态/文章/点赞/收藏 标签页切换从 Next.js 路由导航
 * 改为纯客户端状态切换，避免完整页面重载和冗余数据请求。
 *
 * ProfileLayout 只挂载一次（不会被重新挂载），标签按钮和内容区
 * 均在本组件内管理。原有的路由级别页面（posts/page.tsx 等）保
 * 留不变，供直接 URL 访问使用。
 *
 * 数据获取：通过 SWR hooks 进行客户端数据请求，自带缓存、
 * 去重和错误重试。
 *
 * @module ProfileDetailPage
 */

'use client';

import { useState, Suspense, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import PostItem from '@/components/content/PostItem';
import ProfileLayout from '@/components/profile/ProfileLayout';
import { getIPFSUrl } from '@/lib/ipfs';
import {
  fetcher,
  defaultConfig,
  useMoments,
  useUserByUsername,
} from '@/lib/swr-config';

/* ================================================================
   类型定义 — 匹配后端 API 实际返回的数据形状
   （区别于 @/types 中的 DTO 类型，后者 id 字段为 string）
   ================================================================ */

interface RawAuthor {
  id: number;
  username: string;
  nickname?: string;
  avatarCid?: string;
}

interface RawPost {
  id: number;
  title?: string;
  content: string;
  mediaCid?: string;
  coverCid?: string;
  visibility: string;
  createdAt: string;
  author?: RawAuthor;
  likes: number;
  comments: number;
  shares?: number;
  circleId?: number;
  circle?: { id: number; name: string };
  tags?: string | string[];
  _type?: 'article' | 'moment';
}

type TabKey = 'posts' | 'works' | 'likes' | 'collections';

/* ================================================================
   PostSkeleton — 加载占位卡片（3 个脉冲动画卡片）
   ================================================================ */

function PostSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl p-4 shadow-sm animate-pulse"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-3 w-16 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-3/4 bg-gray-200 rounded" />
            <div className="h-20 w-full bg-gray-200 rounded mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================================================================
   工具函数 — 将后端返回的原始数据映射为 PostItem props 格式
   ================================================================ */

function mapRawToPostItem(
  raw: RawPost,
  type?: 'article' | 'moment',
) {
  const resolvedType =
    type || raw._type || (raw.title ? 'article' : 'moment');

  return {
    id: String(raw.id),
    author: {
      id: String(raw.author?.id ?? 0),
      username: raw.author?.username ?? '未知用户',
      nickname: raw.author?.nickname,
      avatar: getIPFSUrl(raw.author?.avatarCid),
    },
    title: raw.title,
    content: raw.content,
    type: resolvedType,
    mediaUrl: getIPFSUrl(raw.mediaCid || raw.coverCid),
    mediaCid: getIPFSUrl(raw.mediaCid || raw.coverCid),
    likes: raw.likes ?? 0,
    comments: raw.comments ?? 0,
    shares: raw.shares ?? 0,
    visibility: raw.visibility as 'public' | 'followers' | 'private',
    createdAt: raw.createdAt,
    tags: raw.tags
      ? typeof raw.tags === 'string'
        ? raw.tags.split(',').filter(Boolean)
        : raw.tags
      : [],
    circleId: raw.circleId,
    circleName: raw.circle?.name,
  };
}

/* ================================================================
   标签页组件
   ================================================================ */

/** 动态标签页 */
function PostsTab({
  userId,
  isOwnProfile,
  username,
}: {
  userId: string;
  isOwnProfile: boolean;
  username: string;
}) {
  const { data: moments, error, isLoading } = useMoments(userId);
  const { mutate } = useSWRConfig();

  const handleDeletePost = useCallback(
    async (postId: string) => {
      try {
        const res = await fetch(`/api/content/moments/${postId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (res.ok) {
          mutate(`/content/moments/user/${userId}`);
        }
      } catch (err) {
        console.error('删除动态失败:', err);
      }
    },
    [userId, mutate],
  );

  const handleShare = useCallback(
    (postId: string, newShares: number) => {
      mutate(
        `/content/moments/user/${userId}`,
        (data: RawPost[] | undefined) => {
          if (!data) return data;
          return data.map((item) =>
            String(item.id) === postId
              ? { ...item, shares: newShares }
              : item,
          );
        },
        false,
      );
    },
    [userId, mutate],
  );

  if (isLoading) return <PostSkeleton />;

  if (error) {
    return (
      <div className="text-center py-8 text-gray-500">
        加载失败，请稍后重试
      </div>
    );
  }

  const list = Array.isArray(moments) ? moments : [];

  if (list.length === 0) {
    return (
      <div className="text-center text-gray-600 py-8">
        <p>暂无动态</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {list.map((raw: any) => (
        <PostItem
          key={raw.id}
          post={mapRawToPostItem(raw as RawPost, 'moment')}
          onDelete={isOwnProfile ? handleDeletePost : undefined}
          onShare={handleShare}
        />
      ))}
    </div>
  );
}

/** 文章标签页 */
function WorksTab({
  userId,
  username,
}: {
  userId: string;
  username: string;
}) {
  const {
    data: articles,
    error,
    isLoading,
  } = useSWR<RawPost[]>(
    userId ? `/content/articles/user/${userId}` : null,
    fetcher,
    defaultConfig,
  );
  const { mutate } = useSWRConfig();

  const handleShare = useCallback(
    (postId: string, newShares: number) => {
      mutate(
        `/content/articles/user/${userId}`,
        (data: RawPost[] | undefined) => {
          if (!data) return data;
          return data.map((item) =>
            String(item.id) === postId
              ? { ...item, shares: newShares }
              : item,
          );
        },
        false,
      );
    },
    [userId, mutate],
  );

  if (isLoading) return <PostSkeleton />;

  if (error) {
    return (
      <div className="text-center py-8 text-gray-500">
        加载失败，请稍后重试
      </div>
    );
  }

  const list = Array.isArray(articles) ? articles : [];

  if (list.length === 0) {
    return (
      <div className="text-center text-gray-600 py-8">
        <p>暂无文章</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {list
        .filter((a) => a.author)
        .map((raw) => (
          <PostItem
            key={raw.id}
            post={mapRawToPostItem(raw, 'article')}
            onShare={handleShare}
          />
        ))}
    </div>
  );
}

/** 点赞标签页 — 合并用户点赞的文章和动态 */
function LikesTab({ userId }: { userId: string }) {
  const { data: articleLikes, isLoading: alLoading } = useSWR<RawPost[]>(
    userId ? `/content/articles/user/${userId}/likes` : null,
    fetcher,
    defaultConfig,
  );
  const { data: momentLikes, isLoading: mlLoading } = useSWR<RawPost[]>(
    userId ? `/content/moments/user/${userId}/likes` : null,
    fetcher,
    defaultConfig,
  );

  const isLoading = alLoading || mlLoading;

  if (isLoading) return <PostSkeleton />;

  const combined: RawPost[] = [
    ...(Array.isArray(articleLikes)
      ? articleLikes.map((p) => ({ ...p, _type: 'article' as const }))
      : []),
    ...(Array.isArray(momentLikes)
      ? momentLikes.map((p) => ({ ...p, _type: 'moment' as const }))
      : []),
  ];

  combined.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (combined.length === 0) {
    return (
      <div className="text-center text-gray-600 py-8">
        <p>暂无点赞内容</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {combined.map((raw: any) => (
        <PostItem
          key={`${raw._type || 'item'}-${raw.id}`}
          post={mapRawToPostItem(raw as RawPost)}
          onShare={() => {}}
        />
      ))}
    </div>
  );
}

/** 收藏标签页 — 合并用户收藏的文章和动态 */
function CollectionsTab({ userId }: { userId: string }) {
  const { data: articleCols, isLoading: acLoading } = useSWR<RawPost[]>(
    userId ? `/content/articles/user/${userId}/collections` : null,
    fetcher,
    defaultConfig,
  );
  const { data: momentCols, isLoading: mcLoading } = useSWR<RawPost[]>(
    userId ? `/content/moments/user/${userId}/collections` : null,
    fetcher,
    defaultConfig,
  );

  const isLoading = acLoading || mcLoading;

  if (isLoading) return <PostSkeleton />;

  const combined: RawPost[] = [
    ...(Array.isArray(articleCols)
      ? articleCols.map((p) => ({ ...p, _type: 'article' as const }))
      : []),
    ...(Array.isArray(momentCols)
      ? momentCols.map((p) => ({ ...p, _type: 'moment' as const }))
      : []),
  ];

  combined.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (combined.length === 0) {
    return (
      <div className="text-center text-gray-600 py-8">
        <p>暂无收藏内容</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {combined.map((raw: RawPost) => {
        if (!raw.author) return null;
        return (
          <PostItem
            key={`${raw._type || 'item'}-${raw.id}`}
            post={mapRawToPostItem(raw)}
            onShare={() => {}}
          />
        );
      })}
    </div>
  );
}

/* ================================================================
   主组件 — ProfileDetailPage
   ================================================================ */

export function ProfileDetailPage() {
  const params = useParams();
  const username = (params.username as string) || '';

  /* ---- 客户端标签页状态 ---- */
  const [activeTab, setActiveTab] = useState<TabKey>('posts');

  /* ---- 通过 SWR 获取目标用户 ID ---- */
  const { data: userData } = useUserByUsername(username || null);
  const userId: string | null = userData?.id ? String(userData.id) : null;

  /* ---- 判断是否本人主页 ---- */
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  useEffect(() => {
    if (!userId) return;
    const currentUserId =
      typeof window !== 'undefined'
        ? localStorage.getItem('userId')
        : null;
    setIsOwnProfile(String(userId) === currentUserId);
  }, [userId]);

  /* ---- 标签按钮样式（与 ProfileLayout 内置 getTabClass 完全一致） ---- */
  const getTabClass = (tab: TabKey) => {
    const base =
      'px-3 sm:px-5 py-3 border-b-2 transition-all duration-200 font-medium text-sm sm:text-base flex-shrink-0 bg-transparent border-t-0 border-l-0 border-r-0 cursor-pointer';
    return activeTab === tab
      ? `${base} border-[#6364FF] text-[#6364FF]`
      : `${base} border-transparent text-gray-600 hover:text-[#6364FF] hover:border-gray-200`;
  };

  /* ---- 渲染 ---- */
  return (
    <ProfileLayout activeTab={activeTab} hideTabs>
      {/* ===== 客户端标签按钮（替代路由导航 Link） ===== */}
      <div className="flex border-b mb-4 overflow-x-auto scrollbar-hide -mx-1 px-1">
        <button
          onClick={() => setActiveTab('posts')}
          className={getTabClass('posts')}
        >
          动态
        </button>
        <button
          onClick={() => setActiveTab('works')}
          className={getTabClass('works')}
        >
          文章
        </button>
        <button
          onClick={() => setActiveTab('likes')}
          className={getTabClass('likes')}
        >
          点赞
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          className={getTabClass('collections')}
        >
          收藏
        </button>
      </div>

      {/* ===== 标签内容区 ===== */}
      {userId ? (
        <>
          {activeTab === 'posts' && (
            <Suspense fallback={<PostSkeleton />}>
              <PostsTab
                userId={userId}
                isOwnProfile={isOwnProfile}
                username={username}
              />
            </Suspense>
          )}
          {activeTab === 'works' && (
            <Suspense fallback={<PostSkeleton />}>
              <WorksTab userId={userId} username={username} />
            </Suspense>
          )}
          {activeTab === 'likes' && (
            <Suspense fallback={<PostSkeleton />}>
              <LikesTab userId={userId} />
            </Suspense>
          )}
          {activeTab === 'collections' && (
            <Suspense fallback={<PostSkeleton />}>
              <CollectionsTab userId={userId} />
            </Suspense>
          )}
        </>
      ) : (
        <PostSkeleton />
      )}
    </ProfileLayout>
  );
}
