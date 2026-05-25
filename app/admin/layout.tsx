//管理员布局

'use client';

import AdminSidebar from '@/components/layout/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-6">
      <div className="w-full md:w-64 shrink-0">
        <AdminSidebar />
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
