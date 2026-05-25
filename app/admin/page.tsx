//管理员首页（跳转到用户管理）
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) {
      router.push('/');
    } else {
      router.push('/admin/user');
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="text-center py-12">
      <p className="text-gray-600">跳转中...</p>
    </div>
  );
}
