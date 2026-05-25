'use client';

import Link from 'next/link';
import LinkWithBack from '@/components/common/LinkWithBack';
import { useAuth } from '@/lib/auth';
import Card from '@/components/ui/Card';
import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Circle {
  id: number;
  name: string;
  circle: {
    id: number;
    name: string;
  };
}

export default function Sidebar() {
  const { isAuthenticated, user } = useAuth();
  const [joinedCircles, setJoinedCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJoinedCircles = async () => {
      if (isAuthenticated && user) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_URL}/circles/user/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setJoinedCircles(Array.isArray(data) ? data : []);
          }
        } catch (err) {
          console.error('获取加入的圈子失败:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchJoinedCircles();
  }, [isAuthenticated, user]);

  return (
    <div className="space-y-4 sticky top-24">
      <Card className="border-gray-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-[#F9FAFB] to-white">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">🧭 导航</h3>
        </div>
        <nav className="p-2 space-y-0.5">
          <Link href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-900 hover:bg-[#F0EFFF] hover:text-[#6364FF] transition-all duration-200 group">
            <span className="text-lg group-hover:scale-110 transition-transform">🏠</span>
            <span>首页</span>
          </Link>
          {isAuthenticated && (
            <LinkWithBack href={`/profile/${user?.username}`}
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-900 hover:bg-[#F0EFFF] hover:text-[#6364FF] transition-all duration-200 group">
              <span className="text-lg group-hover:scale-110 transition-transform">👤</span>
              <span>我的</span>
            </LinkWithBack>
          )}
        </nav>
      </Card>

      {isAuthenticated && (
        <Card className="border-gray-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-[#F9FAFB] to-white flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">📌 我的圈子</h3>
            <LinkWithBack href="/circles"
              className="text-xs text-[#6364FF] hover:text-[#5558DD] font-semibold transition-colors">查看全部</LinkWithBack>
          </div>
          <div className="p-3 max-h-[320px] overflow-y-auto">
            {loading ? (
              <div className="px-3 py-8 text-gray-500 flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                加载中...
              </div>
            ) : joinedCircles.length > 0 ? (
              <nav className="space-y-0.5">
                {joinedCircles.map((member) => (
                  <LinkWithBack key={member.id}
                    href={`/circles/${member.circle?.id || member.id}`}
                    className="block px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-[#F0EFFF]/50 hover:text-[#6364FF] transition-all duration-200">
                    📌 {member.circle?.name || '未知圈子'}
                  </LinkWithBack>
                ))}
              </nav>
            ) : (
              <div className="px-3 py-8 text-center">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-gray-400 text-xs">还没有关注任何圈子</p>
              </div>
            )}
          </div>
        </Card>
      )}

      <Card className="border-gray-200/80 shadow-sm p-5 bg-gradient-to-br from-[#F0EFFF] to-white border-[#6364FF]/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6364FF] to-[#8B83FF] flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-white text-lg font-bold">D</span>
          </div>
          <div>
            <p className="font-bold text-[#6364FF] text-sm">DeSocial</p>
            <p className="text-xs text-gray-600 leading-relaxed mt-0.5">去中心化社交平台</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
