'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function GitHubAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const processedRef = useRef(false);

  useEffect(() => {
    // 防止 React StrictMode 双重执行
    if (processedRef.current) return;

    const authStatus = searchParams.get('github_auth');
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      processedRef.current = true;
      if (error === 'account_frozen') {
        alert('该账号已被冻结，请联系管理员');
      } else {
        alert('GitHub 登录失败，请重试');
      }
      router.replace('/auth/sign-in');
      return;
    }

    if (authStatus === 'success' && code) {
      processedRef.current = true;

      // 用临时授权码交换 Token（不再从 URL 直接读取 Token）
      const exchangeToken = async () => {
        try {
          const res = await fetch('/api/auth/github/exchange', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          });

          if (!res.ok) {
            throw new Error('Token 交换失败');
          }

          const data = await res.json();

          if (!data.success || !data.accessToken) {
            throw new Error(data.message || '授权码无效或已过期');
          }

          localStorage.setItem('token', data.accessToken);
          if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
          if (data.userId) localStorage.setItem('userId', String(data.userId));
          document.cookie = `token=${data.accessToken}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `isAdmin=${data.isAdmin || false}; path=/; max-age=604800; SameSite=Lax`;

          router.replace('/');
        } catch (err) {
          console.error('GitHub OAuth exchange failed:', err);
          // 如果已有 token 说明第一次交换成功（React 双重渲染导致第二次失败）
          if (localStorage.getItem('token')) {
            router.replace('/');
            return;
          }
          alert('GitHub 登录失败，请重试');
          router.replace('/auth/sign-in');
        }
      };

      exchangeToken();
    }
  }, [searchParams, router]);

  return null;
}
