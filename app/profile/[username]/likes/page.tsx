//个人主页 - 点赞标签页
// 展示用户点赞的文章和动态

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PostItem from '@/components/content/PostItem';
import ProfileLayout from '@/components/profile/ProfileLayout';
import { getIPFSUrl } from '@/lib/ipfs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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

export default function UserLikesPage() {
  const params = useParams();
  const username = params.username as string;

  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserLikes = async () => {
      try {
        const userRes = await fetch(`${API_URL}/users/username/${username}`);
        if (!userRes.ok) throw new Error('用户不存在');
        const userData = await userRes.json();

        const [articleLikes, momentLikes] = await Promise.all([
          fetch(`${API_URL}/content/articles/user/${userData.id}/likes`).then(r => r.ok ? r.json() : []),
          fetch(`${API_URL}/content/moments/user/${userData.id}/likes`).then(r => r.ok ? r.json() : []),
        ]);

        const allLikes = [
          ...(Array.isArray(articleLikes) ? articleLikes : []).map((p: PostData) => ({ ...p, _type: 'article' as const })),
          ...(Array.isArray(momentLikes) ? momentLikes : []).map((p: PostData) => ({ ...p, _type: 'moment' as const })),
        ];

        allLikes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPosts(allLikes);
      } catch (err) {
        console.error('获取点赞内容失败:', err);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchUserLikes();
    }
  }, [username]);

  if (loading) {
    return (
      <ProfileLayout activeTab="likes">
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
