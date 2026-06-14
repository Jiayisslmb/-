//个人主页 - 收藏标签页
// 展示用户收藏的文章和动态

'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { request } from '@/lib/fetch-client';
import PostItem from '@/components/content/PostItem';
import ProfileLayout from '@/components/profile/ProfileLayout';
import { getIPFSUrl } from '@/lib/ipfs';
import { useUserByUsername } from '@/lib/swr-config';


interface PostData {
  id: number;
  title?: string;
  content: string;
  mediaCid?: string;
  coverCid?: string;
  visibility: string;
  createdAt: string;
  author: {
    id: number;
    username: string;
    nickname?: string;
    avatarCid?: string;
  };
  likes: number;
  comments: number;
  circleId?: number;
  circle?: {
    id: number;
    name: string;
  };
  tags?: string;
}

export function UserCollectionsPage() {
  const params = useParams();
  const username = params.username as string;

  const { data: userData } = useUserByUsername(username);
  const userId = userData?.id;

  const {
    data: articleCollections = [],
    isLoading: articleLoading,
    mutate: mutateArticleCollections,
  } = useSWR(
    userId ? `/content/articles/user/${userId}/collections` : null,
    (url) => request<any[]>(url)
  );

  const {
    data: momentCollections = [],
    isLoading: momentLoading,
    mutate: mutateMomentCollections,
  } = useSWR(
    userId ? `/content/moments/user/${userId}/collections` : null,
    (url) => request<any[]>(url)
  );

  const isLoading = !userId || articleLoading || momentLoading;

  const posts = useMemo(() => {
    const allCollections = [
      ...articleCollections.map((p: any) => ({ ...p, _type: 'article' as const })),
      ...momentCollections.map((p: any) => ({ ...p, _type: 'moment' as const })),
    ];
    allCollections.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return allCollections;
  }, [articleCollections, momentCollections]);

  if (isLoading) {
    return (
      <ProfileLayout activeTab="collections">
        <div className="text-center py-12">加载中...</div>
      </ProfileLayout>
    );
  }

  const handleShare = (postId: string, newShares: number) => {
    const inArticles = articleCollections.some((p: any) => String(p.id) === postId);
    const updater = (data: any[] | undefined) =>
      (data || []).map((p: any) =>
        String(p.id) === postId ? { ...p, shares: newShares } : p
      );

    if (inArticles) {
      mutateArticleCollections(updater, false);
    } else {
      mutateMomentCollections(updater, false);
    }
  };

  return (
    <ProfileLayout activeTab="collections">
      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post: any) => {
            if (!post.author) {
              return null;
            }

            return (
              <PostItem
                key={post.id}
                post={{
                  id: String(post.id),
                  author: {
                    id: String(post.author.id),
                    username: post.author.username,
                    nickname: post.author.nickname,
                    avatar: getIPFSUrl(post.author.avatarCid),
                  },
                  title: post.title,
                  content: post.content,
                  type: post._type || (post.title ? 'article' : 'moment'),
                  mediaUrl: getIPFSUrl(post.mediaCid || post.coverCid),
                  mediaCid: getIPFSUrl(post.mediaCid || post.coverCid),
                  likes: post.likes || 0,
                  comments: post.comments || 0,
                  shares: post.shares || 0,
                  visibility: post.visibility as 'public' | 'followers',
                  createdAt: post.createdAt,
                  tags: post.tags ? (typeof post.tags === 'string' ? post.tags.split(',').filter(Boolean) : post.tags) : [],
                  circleId: post.circleId,
                  circleName: post.circle?.name,
                }}
                onShare={handleShare}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center text-gray-600 py-8">
          <p>暂无收藏内容</p>
        </div>
      )}
    </ProfileLayout>
  );
}
