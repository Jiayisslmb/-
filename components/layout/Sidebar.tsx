'use client';

import Link from 'next/link';
import LinkWithBack from '@/components/common/LinkWithBack';
import { useAuth } from '@/lib/auth';
import Card from '@/components/ui/Card';
import { useState, useEffect } from 'react';

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
  const [stats, setStats] = useState({ following: 0, followers: 0, posts: 0 });

  useEffect(() => {
    const fetchJoinedCircles = async () => {
      if (isAuthenticated && user) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/circles/user/${user.id}`, {
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

    const fetchStats = async () => {
      if (isAuthenticated && user) {
        try {
          const token = localStorage.getItem('token');
          const [followingRes, followersRes] = await Promise.all([
            fetch(`/api/users/${user.id}/following`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`/api/users/${user.id}/followers`, { headers: { Authorization: `Bearer ${token}` } }),
          ]);
          if (followingRes.ok) {
            const data = await followingRes.json();
            setStats(prev => ({ ...prev, following: (Array.isArray(data) ? data.length : 0) }));
          }
          if (followersRes.ok) {
            const data = await followersRes.json();
            setStats(prev => ({ ...prev, followers: (Array.isArray(data) ? data.length : 0) }));
          }
        } catch {}
      }
    };

    fetchJoinedCircles();
    fetchStats();
  }, [isAuthenticated, user]);

  const navLinks = [
    { href: '/', label: '首页', icon: '🏠', desc: '推荐内容' },
    ...(isAuthenticated ? [{ href: `/profile/${user?.username}`, label: '个人主页', icon: '👤', desc: '我的内容' }] : []),
    { href: '/circles', label: '圈子', icon: '🌐', desc: '发现圈子' },
    { href: '/search', label: '探索', icon: '🔍', desc: '搜索发现' },
  ];

  return (
    <div className="space-y-4 sticky top-24">
      {/* 导航卡片 */}
      <Card className="border-gray-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-[#F9FAFB] to-white">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">🧭 导航</h3>
        </div>
        <nav className="p-2 space-y-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-700 hover:bg-[#F0EFFF] hover:text-[#6364FF] transition-all duration-200 group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform flex-shrink-0">{link.icon}</span>
              <div className="min-w-0">
                <span className="text-sm">{link.label}</span>
                <p className="text-xs text-gray-400 group-hover:text-[#6364FF]/60">{link.desc}</p>
              </div>
            </Link>
          ))}
        </nav>
      </Card>

      {/* 用户统计卡片 */}
      {isAuthenticated && (
        <Card className="border-gray-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-[#F0EFFF] to-white">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">📊 我的数据</h3>
          </div>
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            {[
              { label: '关注', value: stats.following, href: `/social/following/${user?.id}` },
              { label: '粉丝', value: stats.followers, href: `/social/followers/${user?.id}` },
              { label: '圈子', value: joinedCircles.length, href: '/circles' },
            ].map((stat) => (
              <LinkWithBack
                key={stat.label}
                href={stat.href}
                className="p-4 text-center hover:bg-[#F0EFFF]/30 transition-colors duration-200 group"
              >
                <p className="text-2xl font-bold text-[#6364FF] group-hover:scale-110 transition-transform">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </LinkWithBack>
            ))}
          </div>
        </Card>
      )}

      {/* 我的圈子 */}
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
                {joinedCircles.slice(0, 8).map((member) => (
                  <LinkWithBack key={member.id}
                    href={`/circles/${member.circle?.id || member.id}`}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-[#F0EFFF]/50 hover:text-[#6364FF] transition-all duration-200">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6364FF]/20 to-[#8B83FF]/20 flex items-center justify-center text-xs">
                      {(member.circle?.name || '?')[0]}
                    </span>
                    <span className="truncate">{member.circle?.name || '未知圈子'}</span>
                  </LinkWithBack>
                ))}
              </nav>
            ) : (
              <div className="px-3 py-8 text-center">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-gray-400 text-xs">还没有关注任何圈子</p>
                <Link href="/circles" className="text-[#6364FF] text-xs font-medium hover:underline mt-2 inline-block">
                  去发现圈子 →
                </Link>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 品牌卡片 */}
      <Card className="border-gray-200/80 shadow-sm p-5 bg-gradient-to-br from-[#F0EFFF] to-white border-[#6364FF]/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6364FF] to-[#8B83FF] flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-white text-lg font-bold">D</span>
          </div>
          <div>
            <p className="font-bold text-[#6364FF] text-sm">DeSocial</p>
            <p className="text-xs text-gray-600 leading-relaxed mt-0.5">去中心化社交平台 · 让社交回归用户</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
