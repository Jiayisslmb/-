//个人主页 - 全部动态列表页
// 展示用户的所有动态(Moment)

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import PostItem from '@/components/content/PostItem';
import { getIPFSUrl } from '@/lib/ipfs';


interface PostData {
  id: number;
  content: string;
  mediaCid?: string;
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
  shares: number;
}

export default function UserPostsPage() {
  const params = useParams();
  const username = params.username as string;

  const [moments, setMoments] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndMoments = async () => {
      try {
        const userRes = await fetch(`/api/users/username/${username}`);
        if (!userRes.ok) throw new Error('用户不存在');
        const userData = await userRes.json();

        const momentsRes = await fetch(`/api/content/moments/user/${userData.id}`);
        if (momentsRes.ok) {
          setMoments(await momentsRes.json());
        }
      } catch (err) {
        console.error('获取动态失败:', err);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchUserAndMoments();
    }
  }, [username]);

  if (loading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  const handleDeletePost = (postId: string) => {
    setMoments(prev => prev.filter(m => m.id.toString() !== postId));
  };

  const handleSharePost = (postId: string, newShares: number) => {
    setMoments(prev => prev.map(m =>
      m.id.toString() === postId
        ? { ...m, shares: newShares }
        : m
    ));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <div className="flex border-b mb-4">
          <Link href={`/profile/${username}`} className="px-5 py-3 border-b-2 border-[#6364FF] text-[#6364FF] font-medium transition-all duration-200">
            动态
          </Link>
          <Link href={`/profile/${username}/works`} className="px-5 py-3 border-b-2 border-transparent text-gray-600 hover:text-[#6364FF] hover:border-gray-200 font-medium transition-all duration-200">
            文章
          </Link>
          <Link href={`/profile/${username}/likes`} className="px-5 py-3 border-b-2 border-transparent text-gray-600 hover:text-[#6364FF] hover:border-gray-200 font-medium transition-all duration-200">
            点赞
          </Link>
          <Link href={`/profile/${username}/collections`} className="px-5 py-3 border-b-2 border-transparent text-gray-600 hover:text-[#6364FF] hover:border-gray-200 font-medium transition-all duration-200">
            收藏
          </Link>
        </div>

        {moments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            暂无动态
          </div>
        ) : (
          <div className="space-y-4">
            {moments.map((moment) => (
              <PostItem
                key={moment.id}
                post={{
                  id: String(moment.id),
                  author: {
                    id: String(moment.author.id),
                    username: moment.author.username,
                    nickname: moment.author.nickname,
                    avatar: getIPFSUrl(moment.author.avatarCid),
                  },
                  content: moment.content,
                  type: 'moment',
                  mediaUrl: getIPFSUrl(moment.mediaCid),
                  likes: moment.likes || 0,
                  comments: moment.comments || 0,
                  shares: moment.shares || 0,
                  visibility: moment.visibility as 'public' | 'followers',
                  createdAt: moment.createdAt,
                  tags: [],
                }}
                onDelete={handleDeletePost}
                onShare={handleSharePost}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
