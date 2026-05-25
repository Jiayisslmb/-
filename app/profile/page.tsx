//个人资料页面
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user?.username) {
      router.push(`/profile/${user.username}`);
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">请先登录</p>
        <Link href="/auth/sign-in">
          <Button variant="primary">前往登录</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <p className="text-gray-600">载入中...</p>
    </div>
  );
}
