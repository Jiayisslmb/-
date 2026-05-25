//点赞按钮组件

'use client';

import { useState } from 'react';

interface LikeButtonProps {
  postId: string;
  initialLikes?: number;
  initialLiked?: boolean;
}

export default function LikeButton({ postId, initialLikes = 0, initialLiked = false }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (loading) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/content/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        if (liked) {
          setLikes(prev => prev - 1);
          setLiked(false);
        } else {
          setLikes(prev => prev + 1);
          setLiked(true);
        }
      }
    } catch (error) {
      console.error('点赞失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`flex items-center gap-1 px-3 py-1 rounded-full transition ${
        liked 
          ? 'text-red-600 hover:text-red-700' 
          : 'text-gray-500 hover:text-red-600'
      }`}
    >
      <svg
        className="w-5 h-5"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span>{likes}</span>
    </button>
  );
}
