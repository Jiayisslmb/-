// 设置页布局 — 对齐管理员面板架构
// 侧边栏 + 内容区各自独立，内容区自然滚动

'use client';

import SettingsSidebar, { SettingsMobileTabs } from '@/components/layout/SettingsSidebar';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 px-4 md:px-0">
      <div className="hidden md:block w-56 lg:w-64 shrink-0">
        <SettingsSidebar />
      </div>
      <SettingsMobileTabs />
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
