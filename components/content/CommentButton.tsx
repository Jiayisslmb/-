//评论按钮组件

'use client';

import LinkWithBack from '@/components/common/LinkWithBack';

interface CommentButtonProps {
  postId: string;
  count?: number;
}

export default function CommentButton({ postId, count = 0 }: CommentButtonProps) {
  return (
    <LinkWithBack
      href={`/content/${postId}#comments`}
      className="flex items-center gap-1 px-3 py-1 rounded-full text-gray-500 hover:text-blue-600 transition"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      <span>{count}</span>
    </LinkWithBack>
  );
}
