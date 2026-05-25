'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md p-8">
        <div className="text-6xl mb-4">⚠</div>
        <h2 className="text-2xl font-bold mb-2">页面出现错误</h2>
        <p className="text-gray-500 mb-6 text-sm">{error.message || '未知错误'}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-[#6364FF] text-white rounded-lg hover:bg-[#5558DD] transition"
          >
            重试
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
