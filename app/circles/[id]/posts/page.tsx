//圈子文章页
// 圈子只能关联文章，不能关联动态

'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import ContentFeed from '@/components/content/ContentFeed';
import Button from '@/components/ui/Button';

export default function CirclePostsPage() {
  const params = useParams();
  const circleId = params.id as string;
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">请先登录查看圈子内容</p>
        <Link href="/auth/sign-in">
          <Button variant="primary">前往登录</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href={`/circles/${circleId}`} className="text-blue-600 hover:underline mb-2 inline-block">
            ← 返回圈子
          </Link>
          <h1 className="text-2xl font-bold">圈子文章</h1>
        </div>
        <Link href={`/content/create/article?circleId=${circleId}`}>
          <Button variant="primary">发布文章</Button>
        </Link>
      </div>

      <ContentFeed type="circle" circleId={circleId} />
    </div>
  );
}
