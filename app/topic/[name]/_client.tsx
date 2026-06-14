'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PostItem, { Post } from '@/components/content/PostItem';
import Link from 'next/link';
import { getIPFSUrl } from '@/lib/ipfs';
import { request, ApiError } from '@/lib/fetch-client';

interface Topic {
  id: number;
  name: string;
  description?: string;
  postCount: number;
  createdAt: string;
}

export default function TopicPage() {
  const params = useParams();
  const router = useRouter();
  const topicName = decodeURIComponent((params.name as string) || '');

  const [topic, setTopic] = useState<Topic | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTopicData = async () => {
      try {
        setLoading(true);
        setError('');

        const topicData = await request<any>(`/topics/${encodeURIComponent(topicName)}`);

        if (!topicData || !topicData.id) {
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

        const articleTopics = topicData.articletopic;
        if (articleTopics && Array.isArray(articleTopics)) {
          for (const at of articleTopics) {
            const article = at.article;
            if (!article || !article.user || !article.user.id) continue;

            allPosts.push({
              id: String(article.id),
              author: {
                id: String(article.user.id),
                username: article.user.username || '未知用户',
                nickname: article.user.nickname,
                avatar: getIPFSUrl(article.user.avatarCid),
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
              tags: article.tags
                ? typeof article.tags === 'string'
                  ? article.tags.split(',').filter(Boolean)
                  : article.tags
                : [],
              circleId: article.circleId ? Number(article.circleId) : undefined,
              circleName: article.circle?.name,
            });
          }
        }

        const momentTopics = topicData.momenttopic;
        if (momentTopics && Array.isArray(momentTopics)) {
          for (const mt of momentTopics) {
            const moment = mt.moment;
            if (!moment || !moment.user || !moment.user.id) continue;

            allPosts.push({
              id: String(moment.id),
              author: {
                id: String(moment.user.id),
                username: moment.user.username || '未知用户',
                nickname: moment.user.nickname,
                avatar: getIPFSUrl(moment.user.avatarCid),
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
          }
        }

        allPosts.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setPosts(allPosts);
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 404) {
            setError('话题不存在');
          } else {
            setError(`加载失败：${err.message}`);
          }
        } else {
          setError('网络连接失败，请检查网络后重试');
        }
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
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="space-y-3 mt-6">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Button variant="secondary" onClick={() => router.back()}>返回</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {topic && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">#{topic.name}</h1>
          {topic.description && (
            <p className="text-gray-500 mb-2">{topic.description}</p>
          )}
          <p className="text-sm text-gray-400">
            {topic.postCount} 条内容
          </p>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          该话题下暂无内容
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostItem key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
