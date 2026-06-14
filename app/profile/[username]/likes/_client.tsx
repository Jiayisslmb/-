//个人主页 - 点赞标签页
// 展示用户点赞的文章和动态

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

export function UserLikesPage() {
  const params = useParams();
  const username = params.username as string;

  const { data: userData } = useUserByUsername(username);
  const userId = userData?.id;

  const {
    data: articleLikes = [],
    isLoading: articleLoading,
    mutate: mutateArticleLikes,
  } = useSWR(
    userId ? `/content/articles/user/${userId}/likes` : null,
    (url) => request<any[]>(url)
  );

  const {
    data: momentLikes = [],
    isLoading: momentLoading,
    mutate: mutateMomentLikes,
  } = useSWR(
    userId ? `/content/moments/user/${userId}/likes` : null,
    (url) => request<any[]>(url)
  );

  const isLoading = !userId || articleLoading || momentLoading;

  const posts = useMemo(() => {
    const allLikes = [
      ...articleLikes.map((p: any) => ({ ...p, _type: 'article' as const })),
      ...momentLikes.map((p: any) => ({ ...p, _type: 'moment' as const })),
    ];
    allLikes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return allLikes;
  }, [articleLikes, momentLikes]);

  if (isLoading) {
    return (
      <ProfileLayout activeTab="likes">
        <div className="text-center py-12">加载中...</div>
      </ProfileLayout>
    );
  }

  const handleShare = (postId: string, newShares: number) => {
    const inArticles = articleLikes.some((p: any) => String(p.id) === postId);
    const updater = (data: any[] | undefined) =>
      (data || []).map((p: any) =>
        String(p.id) === postId ? { ...p, shares: newShares } : p
      );

    if (inArticles) {
      mutateArticleLikes(updater, false);
    } else {
      mutateMomentLikes(updater, false);
    }
  };

  return (
    <ProfileLayout activeTab="likes">
      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post: any) => (
            <PostItem
              key={post.id}
              post={{
                id: String(post.id),
                author: {
                    id: String(post.author?.id || 0),
                    username: post.author?.username || '未知用户',
                    nickname: post.author?.nickname,
                    avatar: getIPFSUrl(post.author?.avatarCid),
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
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-600 py-8">
          <p>暂无点赞内容</p>
        </div>
      )}
    </ProfileLayout>
  );
}
