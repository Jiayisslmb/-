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
  { path: '/settings/profile', label: '个人资料' },
  { path: '/settings/privacy', label: '隐私与可达性' },
  { path: '/settings/preferences', label: '偏好设置' },
  { path: '/settings/following', label: '关注管理' },
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
    <div className="flex flex-col md:flex-row min-h-screen bg-white">
      {/* 桌面端左侧导航菜单 */}
      <div className="hidden md:block w-56 lg:w-64 border-r border-gray-200 p-6 shrink-0">
        <nav className="space-y-1 sticky top-24">
          {settingsMenu.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname === item.path
                  ? 'bg-[#F0EFFF] text-[#6364FF] font-semibold shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 pt-6 border-t border-gray-100">
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
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                pathname === item.path
                  ? 'border-[#6364FF] text-[#6364FF]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
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
