//个人主页 - 收藏标签页
// 展示用户收藏的文章和动态

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PostItem from '@/components/content/PostItem';
import ProfileLayout from '@/components/profile/ProfileLayout';
import { getIPFSUrl } from '@/lib/ipfs';


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

export default function UserCollectionsPage() {
  const params = useParams();
  const username = params.username as string;

  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserCollections = async () => {
      try {
        const userRes = await fetch(`/api/users/username/${username}`);
        if (!userRes.ok) throw new Error('用户不存在');
        const userData = await userRes.json();

        const [articleCollections, momentCollections] = await Promise.all([
          fetch(`/api/content/articles/user/${userData.id}/collections`).then(r => r.ok ? r.json() : []),
          fetch(`/api/content/moments/user/${userData.id}/collections`).then(r => r.ok ? r.json() : []),
        ]);

        const allCollections = [
          ...(Array.isArray(articleCollections) ? articleCollections : []).map((p: PostData) => ({ ...p, _type: 'article' as const })),
          ...(Array.isArray(momentCollections) ? momentCollections : []).map((p: PostData) => ({ ...p, _type: 'moment' as const })),
        ];

        allCollections.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPosts(allCollections);
      } catch (err) {
        console.error('获取收藏内容失败:', err);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchUserCollections();
    }
  }, [username]);

  if (loading) {
    return (
      <ProfileLayout activeTab="collections">
        <div className="text-center py-12">加载中...</div>
      </ProfileLayout>
    );
  }

  const handleShare = (postId: string, newShares: number) => {
    setPosts(prev => prev.map(post =>
      post.id.toString() === postId
        ? { ...post, shares: newShares }
        : post
    ));
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
