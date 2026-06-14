'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PostDetail from '@/components/content/PostDetail';
import type { DetailPost } from '@/components/content/PostDetail';

function mapPost(data: any, type: 'article' | 'moment'): DetailPost {
  return {
    id: String(data.id),
    author: {
      id: String(data.user?.id || data.author?.id),
      username: data.user?.username || data.author?.username,
      nickname: data.user?.nickname || data.author?.nickname,
      avatarCid: data.user?.avatarCid || data.author?.avatarCid,
    },
    title: data.title,
    content: data.content,
    mediaCid: data.mediaCid || data.coverCid,
    likes: data._count?.articlelike || data._count?.momentlike || data.likes || 0,
    comments: data._count?.articlecomment || data._count?.momentcomment || data.comments || 0,
    shares: data._count?.articlerepost || data._count?.momentrepost || data.shares || 0,
    visibility: data.visibility || 'public',
    createdAt: data.createdAt,
    circleId: data.circleId,
    circleName: data.circle?.name,
    tags: data.tags
      ? typeof data.tags === 'string'
        ? data.tags.split(',').filter(Boolean)
        : data.tags
      : [],
  };
}

export function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<DetailPost | null>(null);
  const [type, setType] = useState<'article' | 'moment'>('article');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;
    (async () => {
      try {
        setLoading(true);
        let data: any = null;
        let detectedType: 'article' | 'moment' = 'article';

        try {
          const res = await fetch(`/api/content/articles/${postId}`);
          if (res.ok) { data = await res.json(); detectedType = 'article'; }
        } catch {}

        if (!data) {
          try {
            const res = await fetch(`/api/content/moments/${postId}`);
            if (res.ok) { data = await res.json(); detectedType = 'moment'; }
          } catch {}
        }

        if (!data) throw new Error('内容不存在');

        setType(detectedType);
        setPost(mapPost(data, detectedType));
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [postId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <div className="inline-flex items-center gap-3 px-6 py-4 bg-[#F0EFFF]/50 rounded-2xl">
          <svg className="animate-spin h-5 w-5 text-[#6364FF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-gray-600 font-medium">加载中...</span>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <div className="border border-gray-200 rounded-2xl shadow-sm p-10 bg-white">
          <p className="text-gray-500 mb-2 text-lg">😔</p>
          <p className="text-gray-600 mb-6">{error || '内容不存在'}</p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center px-5 py-2.5 bg-[#6364FF] text-white rounded-xl font-medium text-sm hover:bg-[#5558DD] transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return <PostDetail post={post} type={type} onDelete={() => router.push('/')} />;
}
