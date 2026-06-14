'use client';

import { useEffect, ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR, { mutate } from 'swr';
import { request } from '@/lib/fetch-client';
import { useAuth } from '@/lib/auth';
import { getIPFSUrl } from '@/lib/ipfs';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import BackButton from '@/components/common/BackButton';
import LinkWithBack from '@/components/common/LinkWithBack';
import UserDisplay from '@/components/common/UserDisplay';


interface UserProfile {
  id: number;
  username: string;
  nickname?: string;
  avatarCid?: string;
  backgroundCid?: string;
  backgroundColor?: string;
  bio?: string;
  isAdmin?: boolean;
  createdAt?: string;
  allowFollow?: boolean;
  allowMessage?: boolean;
  hideFollowing?: boolean;
  hideFollowers?: boolean;
}

interface UserStats {
  id: number;
  username: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  articleCount: number;
  likesCount: number;
  hideFollowing: boolean;
  hideFollowers: boolean;
}

// 使用相对路径，依赖Next.js的API代理

interface ProfileLayoutProps {
  children: ReactNode;
  activeTab?: 'posts' | 'works' | 'likes' | 'collections';
  hideTabs?: boolean;
}

export default function ProfileLayout({ children, activeTab, hideTabs }: ProfileLayoutProps) {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const username = params.username as string;

  // SWR data fetching with automatic caching and revalidation
  const { data: userData, isLoading: userLoading, error: userError } = useSWR(
    username ? `/users/username/${username}` : null,
    (url) => request<any>(url)
  );

  const userId = userData?.id;

  const { data: statsData } = useSWR(
    userId ? `/users/stats/${userId}` : null,
    (url) => request<any>(url)
  );

  const { data: followData, mutate: mutateFollow } = useSWR(
    userId ? `/users/${userId}/is-following` : null,
    (url) => request<any>(url)
  );

  const { data: blockData } = useSWR(
    userId ? `/users/${userId}/is-blocked` : null,
    (url) => request<any>(url)
  );

  const profile = userData || null;
  const stats = statsData || null;
  const loading = userLoading;
  const error = userError ? (userError instanceof Error ? userError.message : '加载失败') : null;
  const isFollowing = followData?.isFollowing || false;

  // Use SWR mutate() for cache invalidation on profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      mutate(`/users/username/${username}`);
      if (userId) {
        mutate(`/users/stats/${userId}`);
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [username, userId]);

  const handleFollow = async () => {
    if (!profile) return;
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const res = await fetch(`/api/users/${profile.id}/follow`, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (res.ok) {
        mutateFollow();
        if (userId) {
          mutate(`/users/stats/${userId}`);
        }
      }
    } catch (err) {
      console.error('操作失败:', err);
    }
  };

  const handleSendMessage = () => {
    if (profile) {
      router.push(`/messages/${profile.id}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="w-full h-48 rounded-lg skeleton mb-6" />
        <div className="p-6 mb-6 relative -mt-16 bg-white rounded-xl shadow-sm">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full skeleton flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-32 skeleton rounded" />
              <div className="h-4 w-48 skeleton rounded" />
              <div className="flex gap-8">
                <div className="h-10 w-16 skeleton rounded" />
                <div className="h-10 w-16 skeleton rounded" />
                <div className="h-10 w-16 skeleton rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <div className="text-6xl mb-4">😔</div>
        <p className="text-gray-600 mb-6 text-lg">{error || '用户不存在'}</p>
        <Link href="/"><Button variant="primary">返回首页</Button></Link>
      </div>
    );
  }

  const isOwnProfile = currentUser?.username === username;

  const getTabClass = (tab: string) => {
    const baseClass = 'px-3 sm:px-5 py-3 border-b-2 transition-all duration-200 font-medium text-sm sm:text-base flex-shrink-0';
    return activeTab === tab
      ? `${baseClass} border-[#6364FF] text-[#6364FF]`
      : `${baseClass} border-transparent text-gray-600 hover:text-[#6364FF] hover:border-gray-200`;
  };

  return (
    <div className="max-w-3xl mx-auto px-0 sm:px-4">
      <div className="mt-2 mb-2 px-4 sm:px-0">
        <BackButton fallback="/" />
      </div>
      <div
        className="w-full h-32 sm:h-48 mb-6 rounded-lg overflow-hidden relative"
        style={{ backgroundColor: profile.backgroundColor || '#f0f0f0' }}
      >
        {profile.backgroundCid && (
          <img
            src={getIPFSUrl(profile.backgroundCid)}
            alt="封面"
            className="absolute inset-0 w-full h-full object-cover"
            key={profile.backgroundCid}
            onLoad={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onError={(e) => {
              console.error('封面图片加载失败:', profile.backgroundCid, 'URL:', getIPFSUrl(profile.backgroundCid));
              e.currentTarget.style.opacity = '0';
            }}
          />
        )}
      </div>

      <Card className="p-4 sm:p-6 mb-6 relative -mt-12 sm:-mt-16">
        <div>
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-0">
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-6">
              <Avatar
                src={getIPFSUrl(profile.avatarCid)}
                name={profile.username}
                size="xl"
              />
              <div className="flex-1 min-w-0">
                <div className="mb-2">
                  <UserDisplay
                    nickname={profile.nickname}
                    username={profile.username}
                    size="lg"
                    layout="stack"
                    className=""
                  />
                </div>
                {profile.isAdmin && (
                  <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm mb-2">
                    管理员
                  </span>
                )}
                <p className="text-gray-700 mb-4">{profile.bio || '暂无简介'}</p>

                {stats && (
                  <div className="flex flex-wrap gap-4 sm:gap-8 text-sm text-gray-600">
                      <LinkWithBack href={`/social/followers/${profile.id}`} className="hover:text-[#6364FF] transition-colors">
                        <div className="text-center">
                          <div className="font-bold text-gray-900 text-lg">
                            {stats.hideFollowers ? '隐私' : stats.followerCount}
                          </div>
                          <div>粉丝</div>
                        </div>
                      </LinkWithBack>
                      <LinkWithBack href={`/social/following/${profile.id}`} className="hover:text-[#6364FF] transition-colors">
                        <div className="text-center">
                          <div className="font-bold text-gray-900 text-lg">
                            {stats.hideFollowing ? '隐私' : stats.followingCount}
                          </div>
                          <div>关注</div>
                        </div>
                      </LinkWithBack>
                      <LinkWithBack href="/messages?tab=likes" className="hover:text-[#6364FF] transition-colors">
                        <div className="text-center">
                          <div className="font-bold text-gray-900 text-lg">{stats.likesCount || 0}</div>
                          <div>获赞</div>
                        </div>
                      </LinkWithBack>
                    </div>
                )}
              </div>
            </div>

            <div className="flex-shrink-0">
              {isOwnProfile ? (
                <Link href="/settings/profile">
                  <Button variant="primary">编辑资料</Button>
                </Link>
              ) : (
                <div className="flex gap-2">
                  {profile.allowFollow && (
                    <Button
                      variant={isFollowing ? 'secondary' : 'primary'}
                      onClick={handleFollow}
                    >
                      {isFollowing ? '已关注' : '关注'}
                    </Button>
                  )}
                  {profile.allowMessage && (
                    <Button variant="secondary" onClick={handleSendMessage}>
                      私信
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        {/* 移动端可横向滚动、桌面端正常排列 */}
        {!hideTabs && (
        <div className="flex border-b mb-4 overflow-x-auto scrollbar-hide -mx-1 px-1">
          <LinkWithBack href={`/profile/${username}`} className={getTabClass('posts')}>
            动态
          </LinkWithBack>
          <LinkWithBack href={`/profile/${username}/works`} className={getTabClass('works')}>
            文章
          </LinkWithBack>
          <LinkWithBack href={`/profile/${username}/likes`} className={getTabClass('likes')}>
            点赞
          </LinkWithBack>
          <LinkWithBack href={`/profile/${username}/collections`} className={getTabClass('collections')}>
            收藏
          </LinkWithBack>
        </div>
        )}

        {children}
      </Card>
    </div>
  );
}

export type { UserProfile, UserStats };
