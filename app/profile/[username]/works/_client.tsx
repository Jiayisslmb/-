//个人主页 - 文章标签页
// 展示用户的文章(Article)内容
// 文章特性：可关联圈子、可关联话题、出现在首页/搜索/个人主页、支持可见度

'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { request } from '@/lib/fetch-client';
import PostItem from '@/components/content/PostItem';
import ProfileLayout from '@/components/profile/ProfileLayout';
import { getIPFSUrl } from '@/lib/ipfs';
import { useUserByUsername } from '@/lib/swr-config';


interface ArticleData {
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
  shares: number;
  circleId?: number;
  circle?: {
    id: number;
    name: string;
  };
  tags?: string;
}

export function UserWorksPage() {
  const params = useParams();
  const username = params.username as string;

  const { data: userData } = useUserByUsername(username);
  const userId = userData?.id;

  const {
    data: articles = [],
    isLoading,
    mutate,
  } = useSWR(
    userId ? `/content/articles/user/${userId}` : null,
    (url) => request<any[]>(url)
  );

  if (isLoading) {
    return (
      <ProfileLayout activeTab="works">
        <div className="text-center py-12">加载中...</div>
      </ProfileLayout>
    );
  }

  const handleShare = (postId: string, newShares: number) => {
    mutate(
      (currentData) =>
        (currentData || []).map((article: any) =>
          String(article.id) === postId
            ? { ...article, shares: newShares }
            : article
        ),
      false
    );
  };

  return (
    <ProfileLayout activeTab="works">
      {articles.length > 0 ? (
        <div className="space-y-4">
          {articles.filter(a => a.author).map((article) => (
            <PostItem
              key={article.id}
              post={{
                id: String(article.id),
                author: {
                  id: String(article.author.id),
                  username: article.author.username,
                  nickname: article.author.nickname,
                  avatar: getIPFSUrl(article.author.avatarCid),
                },
                title: article.title,
                content: article.content,
                type: 'article',
                mediaUrl: getIPFSUrl(article.mediaCid || article.coverCid),
                mediaCid: getIPFSUrl(article.mediaCid || article.coverCid),
                likes: article.likes || 0,
                comments: article.comments || 0,
                shares: article.shares || 0,
                visibility: article.visibility as 'public' | 'followers' | 'private',
                createdAt: article.createdAt,
                tags: article.tags ? (typeof article.tags === 'string' ? article.tags.split(',').filter(Boolean) : article.tags) : [],
                circleId: article.circleId,
                circleName: article.circle?.name,
              }}
              onShare={handleShare}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-600 py-8">
          <p>暂无文章</p>
        </div>
      )}
    </ProfileLayout>
  );
}
