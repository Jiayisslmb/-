//管理员布局

'use client';

import AdminSidebar from '@/components/layout/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 px-4 md:px-0">
      <div className="w-full md:w-56 lg:w-64 shrink-0">
        <AdminSidebar />
      </div>
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
