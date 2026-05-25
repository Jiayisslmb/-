'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { getIPFSUrl } from '@/lib/ipfs';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import BackButton from '@/components/common/BackButton';
import LinkWithBack from '@/components/common/LinkWithBack';
import UserDisplay from '@/components/common/UserDisplay';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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
  activeTab: 'posts' | 'works' | 'likes' | 'collections';
}

export default function ProfileLayout({ children, activeTab }: ProfileLayoutProps) {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const username = params.username as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users/username/${username}?t=${Date.now()}`);
      if (!res.ok) throw new Error('用户不存在');
      const data = await res.json();
      setProfile(data);

      const statsRes = await fetch(`/api/users/stats/${data.id}`);
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      if (currentUser) {
        const followRes = await fetch(
          `/api/users/${data.id}/is-following`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        if (followRes.ok) {
          const followData = await followRes.json();
          setIsFollowing(followData.isFollowing);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username, currentUser, refreshKey]);

  useEffect(() => {
    const handleProfileUpdate = () => {
      setRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

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
        setIsFollowing(!isFollowing);
        if (stats) {
          setStats({
            ...stats,
            followerCount: isFollowing ? stats.followerCount - 1 : stats.followerCount + 1,
          });
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
    return <div className="text-center py-12">加载中...</div>;
  }

  if (error || !profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">{error || '用户不存在'}</p>
        <Link href="/"><Button variant="primary">返回首页</Button></Link>
      </div>
    );
  }

  const isOwnProfile = currentUser?.username === username;

  const getTabClass = (tab: string) => {
    const baseClass = 'px-5 py-3 border-b-2 transition-all duration-200 font-medium';
    return activeTab === tab
      ? `${baseClass} border-[#6364FF] text-[#6364FF]`
      : `${baseClass} border-transparent text-gray-600 hover:text-[#6364FF] hover:border-gray-200`;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mt-2 mb-2">
        <BackButton fallback="/" />
      </div>
      <div 
        className="w-full h-48 mb-6 rounded-lg overflow-hidden relative"
        style={{ backgroundColor: profile.backgroundColor || '#f0f0f0' }}
      >
        {profile.backgroundCid && (
          <img
            src={getIPFSUrl(profile.backgroundCid)}
            alt="封面"
            className="absolute inset-0 w-full h-full object-cover"
            key={refreshKey}
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
      
      <Card className="p-6 mb-6 relative -mt-16">
        <div>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              <Avatar
                src={getIPFSUrl(profile.avatarCid)}
                name={profile.username}
                size="xl"
              />
              <div className="flex-1">
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
                  <div className="flex gap-8 text-sm text-gray-600">
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
      </Card>

      <Card className="p-6">
        <div className="flex border-b mb-4">
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
        
        {children}
      </Card>
    </div>
  );
}

export type { UserProfile, UserStats };
export { API_URL };
