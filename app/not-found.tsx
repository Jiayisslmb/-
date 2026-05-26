'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-md p-8">
        <div className="text-8xl font-bold bg-gradient-to-r from-[#6364FF] to-[#8B83FF] bg-clip-text text-transparent mb-4">
          404
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">页面未找到</h2>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          你访问的页面不存在或已被移除，请检查链接是否正确
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-medium"
          >
            返回上一页
          </button>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-[#6364FF] text-white rounded-lg hover:bg-[#5558DD] transition font-medium"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
