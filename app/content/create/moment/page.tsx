'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import PostCreator from '@/components/content/PostCreator';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import BackButton from '@/components/common/BackButton';

export default function CreateMomentPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">请先登录以发布动态</p>
        <Link href="/auth/sign-in">
          <Button variant="primary">前往登录</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <BackButton />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">发布新动态</h1>
        <div className="mt-2 h-1 w-16 bg-gradient-to-r from-[#6364FF] to-[#8B83FF] rounded-full"></div>
        <p className="text-gray-500 mt-3">分享你的想法，动态将展示在你的个人主页</p>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <div className="p-6">
          <PostCreator />
        </div>
      </Card>
    </div>
  );
}
