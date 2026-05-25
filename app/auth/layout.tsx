import '../globals.css';
import type { Metadata } from 'next';
import GlobalBackground from '@/components/layout/GlobalBackground';

export const metadata: Metadata = {
  title: '登录 / 注册 - DeSocial',
  description: '登录或注册你的 DeSocial 账户',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GlobalBackground />
      <main className="min-h-screen">
        {children}
      </main>
    </>
  );
}
