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
    <div className="flex min-h-screen bg-white">
      {/* 左侧导航菜单 */}
      <div className="w-64 border-r border-gray-200 p-6">
        <div className="mb-8">
          {/* 移除图标和应用名称 */}
        </div>

        <nav className="space-y-1">
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

        <div className="mt-auto pt-8">
          <Button 
            variant="danger" 
            onClick={handleLogout}
            className="w-full"
          >
            退出登录
          </Button>
        </div>
      </div>

      {/* 右侧内容区域 */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">{title}</h1>
          <div className="mb-6 h-1 w-16 bg-gradient-to-r from-[#6364FF] to-[#8B83FF] rounded-full"></div>
          {children}
        </div>
      </div>
    </div>
  );
}
