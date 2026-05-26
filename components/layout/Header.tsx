'use client';

import Link from 'next/link';
import LinkWithBack from '@/components/common/LinkWithBack';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { useState, useEffect, useRef } from 'react';
import { request } from '@/lib/fetch-client';

interface HotSearchItem {
  id: number;
  keyword: string;
  searchCount: number;
  rank: number;
  isHot?: boolean;
  isNew?: boolean;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHotSearch, setShowHotSearch] = useState(false);
  const [hotSearches, setHotSearches] = useState<HotSearchItem[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const hotSearchFetched = useRef(false);

  useEffect(() => {
    const fetchHotSearches = async () => {
      try {
        const data = await request<Array<Record<string, unknown>>>('/topics/hot-search?limit=10');
        setHotSearches(data.map((item, index) => ({
          id: (item.id as number) || index + 1,
          keyword: (item.keyword as string) || (item.name as string),
          searchCount: (item.searchCount as number) || (item.count as number) || 0,
          rank: (item.rank as number) || index + 1,
          isHot: (item.isHot as boolean) || ((item.searchCount as number) || (item.count as number) || 0) >= 5,
          isNew: (item.isNew as boolean) || false,
        })));
      } catch (err) {
        console.error('获取热搜数据失败:', err);
      }
    };

    if (!hotSearchFetched.current) {
      fetchHotSearches();
      hotSearchFetched.current = true;
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowHotSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (pathname.startsWith('/auth')) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowHotSearch(false);
    }
  };

  const handleHotSearchClick = (keyword: string) => {
    setSearchQuery(keyword);
    router.push(`/search?q=${encodeURIComponent(keyword)}`);
    setShowHotSearch(false);
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex justify-between items-center">
        <Link href="/" className="flex items-center group" title="回到首页">
          <span className="text-2xl font-bold bg-gradient-to-r from-[#6364FF] to-[#8B83FF] bg-clip-text text-transparent group-hover:from-[#5558DD] group-hover:to-[#7C7BF7] transition-all duration-300">
            DeSocial
          </span>
        </Link>

        <div className="flex-1 mx-6 max-w-lg hidden md:block" ref={searchRef}>
          <div className="relative group">
            <input
              type="text"
              placeholder="搜索用户、内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowHotSearch(true)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-[#6364FF] focus:bg-white focus:ring-2 focus:ring-[#6364FF]/20 placeholder-gray-400 transition-all duration-200"
            />
            <button 
              onClick={handleSearch}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-[#6364FF] transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {showHotSearch && hotSearches.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-scaleIn origin-top">
                <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-[#F9FAFB] to-white">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    🔥 今日热搜
                    <span className="text-xs text-gray-500 font-normal">实时更新</span>
                  </h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {hotSearches.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleHotSearchClick(item.keyword)}
                      className="w-full px-4 py-2.5 hover:bg-[#F0EFFF]/50 transition-all duration-150 flex items-center gap-3 group border-b border-gray-50 last:border-b-0"
                    >
                      <span className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                        index < 3
                          ? 'bg-gradient-to-br from-[#EF4444] to-[#DC2626] text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0 text-left">
                        <span className="font-medium text-gray-900 group-hover:text-[#6364FF] truncate transition-colors text-sm">
                          {item.keyword}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {item.isHot && (
                          <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded">热</span>
                        )}
                        {item.isNew && (
                          <span className="px-1.5 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded">新</span>
                        )}
                        <span className="text-[10px] text-gray-400">{item.searchCount}次</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <div className="relative">
                <button
                  onClick={() => setShowCreateMenu(!showCreateMenu)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#6364FF] hover:bg-[#F0EFFF] rounded-lg transition-all duration-200"
                >
                  发布
                </button>
                {showCreateMenu && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-scaleIn origin-top-right">
                    <LinkWithBack
                      href="/content/create/article"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F0EFFF] transition-colors duration-150"
                      onClick={() => setShowCreateMenu(false)}
                    >
                      <span className="text-lg">📝</span>
                      <span className="font-medium text-sm">发布文章</span>
                    </LinkWithBack>
                    <LinkWithBack
                      href="/content/create/moment"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F0EFFF] transition-colors duration-150"
                      onClick={() => setShowCreateMenu(false)}
                    >
                      <span className="text-lg">💬</span>
                      <span className="font-medium text-sm">发布动态</span>
                    </LinkWithBack>
                  </div>
                )}
              </div>
              
              <LinkWithBack 
                href="/messages" 
                className="p-2.5 text-gray-600 hover:text-[#6364FF] hover:bg-[#F0EFFF] rounded-lg transition-all duration-200 relative"
                title="消息"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </LinkWithBack>
              
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-full transition-all duration-200"
                >
                  <Avatar
                    src={user?.avatarCid ? user.avatar : undefined}
                    name={user?.nickname || user?.username || 'User'}
                    size="sm"
                  />
                  <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-scaleIn origin-top-right">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="font-semibold text-gray-900">{user?.nickname || user?.username}</div>
                      <div className="text-sm text-gray-500">@{user?.username}</div>
                    </div>
                    
                    <LinkWithBack
                      href={`/profile/${user?.username}`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F0EFFF] transition-colors duration-150"
                      onClick={() => setShowDropdown(false)}
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium text-sm">个人主页</span>
                    </LinkWithBack>
                    
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F0EFFF] transition-colors duration-150"
                      onClick={() => setShowDropdown(false)}
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium text-sm">设置</span>
                    </Link>
                    
                    {user?.isAdmin && (
                      <Link
                        href="/admin/user"
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F0EFFF] transition-colors duration-150"
                        onClick={() => setShowDropdown(false)}
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="font-medium text-sm">管理面板</span>
                      </Link>
                    )}
                    
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 w-full hover:bg-red-50 text-red-600 transition-colors duration-150 rounded-lg mx-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="font-medium text-sm">退出登录</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/sign-in">
                <Button variant="ghost" size="sm">登录</Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button variant="primary" size="sm">注册</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
