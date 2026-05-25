//关注列表页面（通过userId查询）
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import BackButton from '@/components/common/BackButton';
import { getIPFSUrl } from '@/lib/ipfs';

interface User {
  id: number;
  username: string;
  nickname?: string;
  avatarCid?: string;
  bio?: string;
}


export default function FollowingPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const userId = params.userId as string;

  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingSet, setFollowingSet] = useState<Set<number>>(new Set());
  const [profileUsername, setProfileUsername] = useState<string>('');
  const [privacyBlocked, setPrivacyBlocked] = useState<string | null>(null);

  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        setLoading(true);

        const userRes = await fetch(`/api/users/${userId}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          setProfileUsername(userData.username);

          const isOwnProfile = currentUser && String(currentUser.id) === String(userId);
          if (userData.hideFollowing && !isOwnProfile) {
            setPrivacyBlocked('该用户已隐藏关注列表');
            setLoading(false);
            return;
          }
        }

        const res = await fetch(`/api/users/${userId}/following`, {
          headers: currentUser
            ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
            : {},
        });
        if (res.ok) {
          const data = await res.json();
          const formattedData = Array.isArray(data) ? data : [];
          setFollowing(formattedData);

          if (currentUser) {
            const followRes = await fetch(
              `/api/users/${currentUser.id}/following`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
              }
            );
            if (followRes.ok) {
              const followData = await followRes.json();
              const followingIds = new Set<number>(
                Array.isArray(followData) ? followData.map((u: User) => u.id) : []
              );
              setFollowingSet(followingIds);
            }
          }
        } else {
          console.error('获取关注列表失败:', await res.text());
          setFollowing([]);
        }
      } catch (err) {
        console.error('加载关注列表失败:', err);
        setFollowing([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchFollowing();
    }
  }, [userId, currentUser]);

  const handleFollowToggle = async (targetUserId: number) => {
    if (!currentUser) {
      router.push('/auth/sign-in');
      return;
    }

    try {
      const isFollowing = followingSet.has(targetUserId);
      const method = isFollowing ? 'DELETE' : 'POST';
      const res = await fetch(`/api/users/${targetUserId}/follow`, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (res.ok) {
        const newFollowingSet = new Set(followingSet);
        if (isFollowing) {
          newFollowingSet.delete(targetUserId);
        } else {
          newFollowingSet.add(targetUserId);
        }
        setFollowingSet(newFollowingSet);
      }
    } catch (err) {
      console.error('操作失败:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (privacyBlocked) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-8">
          <BackButton />
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">关注列表</h1>
            <div className="mt-2 h-1 w-16 bg-gradient-to-r from-[#6364FF] to-[#8B83FF] rounded-full"></div>
          </div>
        </div>
        <Card variant="elevated">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔒</div>
            <p className="text-gray-600 text-lg font-medium mb-2">{privacyBlocked}</p>
            <p className="text-gray-400 text-sm">该用户已设置隐私保护，无法查看其关注列表</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-8">
        <BackButton />
        <div className="mt-4 flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">关注列表</h1>
            <div className="mt-2 h-1 w-16 bg-gradient-to-r from-[#6364FF] to-[#8B83FF] rounded-full"></div>
          </div>
          {profileUsername && (
            <span className="text-gray-500 text-lg">@{profileUsername}</span>
          )}
          <span className="px-3 py-1 bg-[#F0EFFF] text-[#6364FF] rounded-full text-sm font-semibold">
            {following.length} 位关注
          </span>
        </div>
      </div>

      {following.length === 0 ? (
        <Card variant="elevated" className="text-center py-16">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无关注</h3>
          <p className="text-gray-500 text-sm">去发现更多有趣的人吧！</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {following.map(user => (
            <Card key={user.id} hoverable className="p-5 transition-all duration-200">
              <div className="flex justify-between items-center">
                <Link
                  href={`/profile/${user.username}`}
                  className="flex-1 flex gap-4 items-center group"
                >
                  <Avatar
                    src={getIPFSUrl(user.avatarCid)}
                    name={user.username}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 group-hover:text-[#6364FF] transition-colors truncate">
                      {user.nickname && user.nickname !== user.username
                        ? `${user.nickname}`
                        : `@${user.username}`
                      }
                    </h3>
                    {user.nickname && user.nickname !== user.username && (
                      <p className="text-xs text-gray-400">@{user.username}</p>
                    )}
                    <p className="text-gray-600 text-sm mt-1 line-clamp-1">{user.bio || '暂无简介'}</p>
                  </div>
                </Link>
                {currentUser && String(currentUser.id) !== String(user.id) && (
                  <Button
                    variant={followingSet.has(user.id) ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => handleFollowToggle(user.id)}
                    className="!rounded-lg ml-4"
                  >
                    {followingSet.has(user.id) ? '✓ 已关注' : '+ 关注'}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
