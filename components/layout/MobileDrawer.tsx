'use client';

import { useEffect, useCallback } from 'react';
import Link from 'next/link';
import LinkWithBack from '@/components/common/LinkWithBack';
import { useAuth } from '@/lib/auth';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const navLinks = [
    { href: '/', label: '首页', icon: '🏠' },
    { href: '/circles', label: '圈子', icon: '🌐' },
    { href: '/search', label: '探索', icon: '🔍' },
    { href: '/messages', label: '消息', icon: '💬' },
    ...(isAuthenticated && user
      ? [{ href: `/profile/${user.username}`, label: '个人主页', icon: '👤' }]
      : []),
    { href: '/settings', label: '设置', icon: '⚙️' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            className="fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[85vw] bg-white shadow-2xl md:hidden flex flex-col"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <Link href="/" className="flex items-center gap-2" onClick={onClose}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6364FF] to-[#8B83FF] flex items-center justify-center">
                  <span className="text-white text-sm font-bold">D</span>
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-[#6364FF] to-[#8B83FF] bg-clip-text text-transparent">
                  DeSocial
                </span>
              </Link>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="关闭菜单"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User info */}
            {isAuthenticated && user && (
              <div className="p-4 border-b border-gray-50 bg-gradient-to-r from-[#F0EFFF] to-white">
                <LinkWithBack
                  href={`/profile/${user.username}`}
                  className="flex items-center gap-3"
                  onClick={onClose}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6364FF]/20 to-[#8B83FF]/20 flex items-center justify-center text-[#6364FF] font-bold text-sm">
                    {(user.nickname || user.username)[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {user.nickname || user.username}
                    </p>
                    <p className="text-xs text-gray-500">@{user.username}</p>
                  </div>
                </LinkWithBack>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                导航
              </div>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    pathname === link.href
                      ? 'bg-[#F0EFFF] text-[#6364FF]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>

            {/* Footer actions */}
            <div className="p-4 border-t border-gray-100">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="w-full py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  退出登录
                </button>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/auth/sign-in"
                    onClick={onClose}
                    className="flex-1 py-2.5 text-center text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    登录
                  </Link>
                  <Link
                    href="/auth/sign-up"
                    onClick={onClose}
                    className="flex-1 py-2.5 text-center text-sm font-medium text-white bg-[#6364FF] rounded-lg hover:bg-[#5558DD] transition-colors"
                  >
                    注册
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
