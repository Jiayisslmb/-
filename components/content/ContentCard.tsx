//内容卡片：展示文章/动态摘要 - Mastodon风格
// 帖子(Post) = 文章(Article) + 动态(Moment)

'use client';

import React, { memo } from 'react';
import type { PostDTO } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import LinkWithBack from '@/components/common/LinkWithBack';
import { formatDate } from '@/lib/utils';
import LikeButton from './LikeButton';
import CommentButton from './CommentButton';
import Avatar from '@/components/ui/Avatar';

interface ContentCardProps {
  post: PostDTO;
}

const ContentCard = memo(function ContentCard({ post }: ContentCardProps) {
  const isArticle = post.type === 'article';
  const author = post.author;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-300 group">
      <div className="flex items-center mb-3">
        {author && (
          <LinkWithBack href={`/profile/${author.username}`} className="flex items-center gap-3">
            <Avatar src={author.avatar} alt={author.username} size="sm" />
            <span className="font-semibold text-gray-900 group-hover:text-[#6364FF] transition-colors duration-200">{author.username}</span>
          </LinkWithBack>
        )}
        <span className="text-gray-400 text-sm ml-auto">
          {formatDate(post.createdAt)}
        </span>
        {isArticle ? (
          <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-xs font-medium ml-2">文章</span>
        ) : (
          <span className="bg-green-50 text-green-600 px-2.5 py-1 rounded-full text-xs font-medium ml-2">动态</span>
        )}
      </div>
      
      <LinkWithBack href={`/content/${post.id}`}>
        {isArticle && post.title && (
          <h3 className="text-lg font-bold mb-2 text-gray-900 group-hover:text-[#6364FF] transition-colors duration-200">{post.title}</h3>
        )}
        <p className="mb-3 whitespace-pre-wrap text-gray-700 leading-relaxed group-hover:text-[#6364FF] transition-colors duration-200">{post.content}</p>
        
        {(post.mediaUrl || post.mediaCid) && (
          <div className="rounded-xl overflow-hidden mb-3 shadow-sm group-hover:shadow-md transition-shadow duration-300">
            <Image
              src={post.mediaUrl || post.mediaCid || ''}
              alt="media"
              width={600}
              height={400}
              className="object-cover w-full"
            />
          </div>
        )}
      </LinkWithBack>

      {post.tags && post.tags.length > 0 && (
        <div className="mb-3 flex gap-2 flex-wrap">
          {post.tags.map(tag => (
            <Link
              key={tag}
              href={`/search?q=${encodeURIComponent(tag)}`}
              className="text-[#6364FF] hover:bg-[#F0EFFF] px-2.5 py-1 rounded-full text-sm font-medium transition-all duration-200"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-3 border-t border-gray-100 mt-3">
        <LikeButton postId={post.id} initialLikes={post.likes} initialLiked={post.isLiked} />
        <CommentButton postId={post.id} count={post.comments} />
      </div>
    </div>
  );
});

export default ContentCard;
