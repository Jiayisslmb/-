//全局加载状态

import Card from '@/components/ui/Card';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card>
        <div className="text-center p-12">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6364FF]"></div>
          </div>
          <p className="mt-4 text-gray-600 text-lg">加载中...</p>
        </div>
      </Card>
    </div>
  );
}
