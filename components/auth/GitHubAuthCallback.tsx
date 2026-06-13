'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function GitHubAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const authStatus = searchParams.get('github_auth');
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const userId = searchParams.get('userId');
    const isAdmin = searchParams.get('isAdmin');
    const error = searchParams.get('error');

    if (error) {
      if (error === 'account_frozen') {
        alert('该账号已被冻结，请联系管理员');
      } else {
        alert('GitHub 登录失败，请重试');
      }
      router.replace('/auth/sign-in');
      return;
    }

    if (authStatus === 'success' && token) {
      localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      if (userId) localStorage.setItem('userId', userId);
      document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `isAdmin=${isAdmin || 'false'}; path=/; max-age=604800; SameSite=Lax`;

      router.replace('/');
    }
  }, [searchParams, router]);

  return null;
}
