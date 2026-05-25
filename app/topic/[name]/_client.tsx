//话题详情页面

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PostItem, { Post } from '@/components/content/PostItem';
import Link from 'next/link';
import { getIPFSUrl } from '@/lib/ipfs';


interface Topic {
  id: number;
  name: string;
  description?: string;
  postCount: number;
  createdAt: string;
}

export function TopicPage() {
  const params = useParams();
  const router = useRouter();
  const topicName = params.name as string;
  
  const [topic, setTopic] = useState<Topic | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTopicData = async () => {
      try {
        setLoading(true);
        
        const topicRes = await fetch(`/api/topics/${encodeURIComponent(topicName)}`);
        if (!topicRes.ok) {
          setError('话题不存在');
          setLoading(false);
          return;
        }
        
        const text = await topicRes.text();
        if (!text) {
          setError('话题不存在');
          setLoading(false);
          return;
        }
        
        let topicData;
        try {
          topicData = JSON.parse(text);
        } catch (parseError) {
          console.error('JSON解析失败:', parseError);
          setError('数据格式错误');
          setLoading(false);
          return;
        }
        
        if (!topicData) {
          setError('话题不存在');
          setLoading(false);
          return;
        }
        
        setTopic({
          id: topicData.id,
          name: topicData.name,
          description: topicData.description,
          postCount: topicData.postCount,
          createdAt: topicData.createdAt,
        });

        const allPosts: Post[] = [];

        if (topicData.articletopic && Array.isArray(topicData.articletopic)) {
          topicData.articletopic.forEach((at: any) => {
            const article = at.article;
            if (!article) return;
            allPosts.push({
              id: String(article.id),
              author: {
                id: String(article.user?.id || 0),
                username: article.user?.username || '未知用户',
                nickname: article.user?.nickname,
                avatar: getIPFSUrl(article.user?.avatarCid),
              },
              title: article.title,
              content: article.content,
              type: 'article',
              mediaUrl: getIPFSUrl(article.mediaCid || article.coverCid),
              likes: article.articlelike?.length || 0,
              comments: article.articlecomment?.length || 0,
              shares: article.articlerepost?.length || 0,
              visibility: (article.visibility || 'public') as 'public' | 'followers',
              createdAt: article.createdAt,
              tags: article.tags ? (typeof article.tags === 'string' ? article.tags.split(',').filter(Boolean) : article.tags) : [],
              circleId: article.circleId ? Number(article.circleId) : undefined,
              circleName: article.circle?.name,
            });
          });
        }

        if (topicData.momenttopic && Array.isArray(topicData.momenttopic)) {
          topicData.momenttopic.forEach((mt: any) => {
            const moment = mt.moment;
            if (!moment) return;
            allPosts.push({
              id: String(moment.id),
              author: {
                id: String(moment.user?.id || 0),
                username: moment.user?.username || '未知用户',
                nickname: moment.user?.nickname,
                avatar: getIPFSUrl(moment.user?.avatarCid),
              },
              content: moment.content,
              type: 'moment',
              mediaUrl: getIPFSUrl(moment.mediaCid),
              likes: moment.momentlike?.length || 0,
              comments: moment.momentcomment?.length || 0,
              shares: moment.momentrepost?.length || 0,
              visibility: (moment.visibility || 'public') as 'public' | 'followers',
              createdAt: moment.createdAt,
              tags: [],
            });
          });
        }

        allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPosts(allPosts);
      } catch (err) {
        setError('加载失败');
        console.error('加载话题失败:', err);
      } finally {
        setLoading(false);
      }
    };

    if (topicName) {
      fetchTopicData();
    }
  }, [topicName]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Button variant="secondary" onClick={() => router.push('/search')}>
            返回搜索
          </Button>
        </div>
      </div>
    );
  }

  const handleShare = (postId: string, newShares: number) => {
    setPosts(prev => prev.map(post =>
      post.id === postId
        ? { ...post, shares: newShares }
        : post
    ));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link href="/search" className="inline-flex items-center gap-2 text-gray-600 hover:text-[#6364FF] transition-all mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回搜索
        </Link>
      </div>

      <Card variant="elevated" className="p-6 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">#</span>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{topic?.name}</h1>
          </div>
          <div className="mt-2 h-1 w-16 bg-gradient-to-r from-[#6364FF] to-[#8B83FF] rounded-full"></div>
          {topic?.description && (
            <p className="text-gray-600 mt-2">{topic.description}</p>
          )}
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
            <span>{topic?.postCount} 条帖子</span>
            <span>创建于 {new Date(topic?.createdAt || '').toLocaleDateString()}</span>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <Link href={`/content/create/article?topic=${encodeURIComponent(topicName)}`}>
              <Button variant="primary">
                参与话题
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map(post => (
            <PostItem key={post.id} post={post} onShare={handleShare} />
          ))
        ) : (
          <Card className="p-6">
            <div className="text-center py-12 text-gray-500">
              暂无相关帖子，成为第一个参与话题的人吧！
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
