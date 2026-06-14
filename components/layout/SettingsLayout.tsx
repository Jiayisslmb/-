// 设置页面布局组件

'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import Button from '@/components/ui/Button';

interface SettingsLayoutProps {
  children: React.ReactNode;
  title: string;
}

const settingsMenu = [
  {
    path: '/settings/profile',
    label: '个人资料',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    path: '/settings/privacy',
    label: '隐私与可达性',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    path: '/settings/preferences',
    label: '偏好设置',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    path: '/settings/following',
    label: '关注管理',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    path: '/settings/password',
    label: '修改密码',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    path: '/settings/notifications',
    label: '通知偏好',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    path: '/settings/blocks',
    label: '屏蔽管理',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  },
  {
    path: '/settings/about',
    label: '关于',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function SettingsLayout({ children, title }: SettingsLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    logout();
    router.push('/auth/sign-in');
  };

  return (
    <div className="flex flex-col md:flex-row bg-white">
      {/* 桌面端左侧导航菜单 — sticky 固定高度，内部溢出可滚 */}
      <div className="hidden md:flex flex-col w-56 lg:w-64 border-r border-gray-200 shrink-0 sticky top-24 h-[calc(100vh-6rem)]">
        <nav className="space-y-1 flex-1 overflow-y-auto p-6 pb-2">
          {settingsMenu.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname === item.path
                  ? 'bg-[#F0EFFF] text-[#6364FF] font-semibold shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className={pathname === item.path ? 'text-[#6364FF]' : 'text-gray-400'}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-6 pb-6 pt-3 border-t border-gray-200 shrink-0">
          <Button
            variant="danger"
            onClick={handleLogout}
            className="w-full"
          >
            退出登录
          </Button>
        </div>
      </div>

      {/* 移动端顶部 Tab 导航 */}
      <div className="md:hidden border-b border-gray-200 bg-white sticky top-16 z-10">
        <div className="flex overflow-x-auto scrollbar-hide px-2">
          {settingsMenu.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                pathname === item.path
                  ? 'border-[#6364FF] text-[#6364FF]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className={pathname === item.path ? 'text-[#6364FF]' : 'text-gray-400'}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* 右侧内容区域 */}
      <div className="flex-1 p-4 md:p-8 min-w-0">
        <div className="max-w-3xl">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-2">{title}</h1>
          <div className="mb-6 h-1 w-16 bg-gradient-to-r from-[#6364FF] to-[#8B83FF] rounded-full"></div>
          {children}
        </div>
      </div>
    </div>
  );
}
