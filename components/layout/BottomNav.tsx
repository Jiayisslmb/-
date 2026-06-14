'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'text-[#6364FF]' : 'text-gray-400'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 1.5 : 2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function CirclesIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'text-[#6364FF]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 1.5 : 2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 1.5 : 2} d="M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  );
}

function MessageIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'text-[#6364FF]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 1.5 : 2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function CreateIcon() {
  return (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'text-[#6364FF]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 1.5 : 2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  if (pathname.startsWith('/auth') || pathname.startsWith('/admin')) return null;

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 ${
            isActive('/') ? 'text-[#6364FF]' : 'text-gray-400'
          }`}
        >
          <HomeIcon active={isActive('/')} />
          <span className="text-[10px] font-medium">首页</span>
          {isActive('/') && <div className="absolute -bottom-0 w-8 h-0.5 bg-[#6364FF] rounded-full" />}
        </Link>

        <Link
          href="/circles"
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 ${
            isActive('/circles') ? 'text-[#6364FF]' : 'text-gray-400'
          }`}
        >
          <CirclesIcon active={isActive('/circles')} />
          <span className="text-[10px] font-medium">圈子</span>
          {isActive('/circles') && <div className="absolute -bottom-0 w-8 h-0.5 bg-[#6364FF] rounded-full" />}
        </Link>

        {/* Center create button */}
        <Link
          href="/content/create/moment"
          className="relative -mt-6 flex flex-col items-center justify-center"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-[#6364FF] to-[#8B83FF] rounded-full flex items-center justify-center shadow-lg shadow-[#6364FF]/30 hover:shadow-xl hover:shadow-[#6364FF]/40 hover:scale-105 active:scale-95 transition-all duration-200">
            <CreateIcon />
          </div>
          <span className="text-[10px] font-medium text-gray-400 mt-0.5">发布</span>
        </Link>

        <Link
          href="/messages"
          className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 ${
            isActive('/messages') ? 'text-[#6364FF]' : 'text-gray-400'
          }`}
        >
          <MessageIcon active={isActive('/messages')} />
          <span className="text-[10px] font-medium">消息</span>
          {isActive('/messages') && <div className="absolute -bottom-0 w-8 h-0.5 bg-[#6364FF] rounded-full" />}
        </Link>

        <Link
          href={isAuthenticated ? `/profile/${user?.username}` : '/auth/sign-in'}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 ${
            isActive('/profile') ? 'text-[#6364FF]' : 'text-gray-400'
          }`}
        >
          <ProfileIcon active={isActive('/profile')} />
          <span className="text-[10px] font-medium">我的</span>
          {isActive('/profile') && <div className="absolute -bottom-0 w-8 h-0.5 bg-[#6364FF] rounded-full" />}
        </Link>
      </div>
    </nav>
  );
}
