import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md p-8">
        <div className="text-6xl mb-4">404</div>
        <h2 className="text-2xl font-bold mb-2">页面未找到</h2>
        <p className="text-gray-500 mb-6 text-sm">你访问的页面不存在或已被移除</p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-[#6364FF] text-white rounded-lg hover:bg-[#5558DD] transition"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
