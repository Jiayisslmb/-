'use client';

import React, { memo } from 'react';
import type { PostDTO } from '@/types';
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
  const displayName = author?.nickname || author?.username || '未知用户';

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4 hover:shadow-md hover:border-[#6364FF]/20 hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden">
      {/* Decorative gradient line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#6364FF]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Author row */}
      <div className="flex items-center mb-3">
        {author && (
          <LinkWithBack href={`/profile/${author.username}`} className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar src={author.avatar} alt={displayName} size="sm" />
            <div className="min-w-0">
              <span className="font-semibold text-gray-900 group-hover:text-[#6364FF] transition-colors duration-200 text-sm">
                {displayName}
              </span>
              {author.nickname && author.nickname !== author.username && (
                <span className="text-gray-400 text-xs ml-1.5">@{author.username}</span>
              )}
            </div>
          </LinkWithBack>
        )}
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="text-gray-400 text-xs">{formatDate(post.createdAt)}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            isArticle
              ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200/50'
              : 'bg-green-50 text-green-600 ring-1 ring-green-200/50'
          }`}>
            {isArticle ? '文章' : '动态'}
          </span>
        </div>
      </div>

      {/* Content */}
      <LinkWithBack href={`/content/${post.id}`} className="block">
        {isArticle && post.title && (
          <h3 className="text-lg font-bold mb-2 text-gray-900 group-hover:text-[#6364FF] transition-colors duration-200 leading-snug">
            {post.title}
          </h3>
        )}
        <p className="mb-3 whitespace-pre-wrap text-gray-700 leading-relaxed text-sm line-clamp-4">
          {post.content}
        </p>

        {/* Media */}
        {(post.mediaUrl || post.mediaCid) && (
          <div className="rounded-xl overflow-hidden mb-3 shadow-sm group-hover:shadow-md transition-shadow duration-300 border border-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.mediaUrl || post.mediaCid || ''}
              alt="media"
              className="object-cover w-full max-h-80"
              loading="lazy"
            />
          </div>
        )}
      </LinkWithBack>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="mb-3 flex gap-1.5 flex-wrap">
          {post.tags.map(tag => (
            <Link
              key={tag}
              href={`/search?q=${encodeURIComponent(tag)}`}
              className="text-[#6364FF] hover:bg-[#F0EFFF] px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-200"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-1 pt-3 border-t border-gray-50 mt-2">
        <LikeButton postId={post.id} initialLikes={post.likes} initialLiked={post.isLiked} />
        <CommentButton postId={post.id} count={post.comments} />
      </div>
    </div>
  );
});

export default ContentCard;
