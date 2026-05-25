
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LinkWithBack from '@/components/common/LinkWithBack';
import { useAuth } from '@/lib/auth';
import { useMultipleOnlineStatus, formatLastSeen } from '@/lib/hooks/useOnlineStatus';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import SettingsLayout from '@/components/layout/SettingsLayout';
import OnlineStatusIndicator from '@/components/common/OnlineStatusIndicator';
import { getIPFSUrl } from '@/lib/ipfs';

// 使用相对路径，依赖Next.js的API代理

interface User {
  id: number;
  username: string;
  nickname?: string;
  avatarCid?: string;
  isFollowing: boolean;
  isFollowedBy: boolean;
  isFrozen: boolean;
  lastActivity?: string;
  followedAt?: string;
}

type RelationshipType = 'following' | 'followers' | 'mutual';
type ActivityStatus = 'all' | 'inactive';
type SortOption = 'recentActivity' | 'recentStatus' | 'alphabetical';

export default function FollowingManagementPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('following');
  const [activityStatus, setActivityStatus] = useState<ActivityStatus>('all');
  const [sortOption, setSortOption] = useState<SortOption>('recentActivity');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  
  // 获取所有用户的ID列表
  const userIds = useMemo(() => {
    return allUsers.map(u => u.id);
  }, [allUsers]);
  
  // 获取多个用户的在线状态
  const { statuses, isLoading: statusLoading } = useMultipleOnlineStatus(userIds, {
    enabled: userIds.length > 0,
    refreshInterval: 15000, // 每15秒刷新一次
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchFollowingData();
    }
  }, [isAuthenticated, user]);

  const fetchFollowingData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const userResponse = await fetch('/api/users/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (userResponse.ok) {
        const currentUser = await userResponse.json();
        const userId = currentUser.id;
        
        const [followingRes, followersRes] = await Promise.all([
          fetch(`/api/users/${userId}/following`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/users/${userId}/followers`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const followingData = followingRes.ok ? await followingRes.json() : [];
        const followersData = followersRes.ok ? await followersRes.json() : [];

        const followingSet = new Set(followingData.map((u: any) => u.id));
        const followersSet = new Set(followersData.map((u: any) => u.id));

        const allUsersMap = new Map<number, User>();

        followingData.forEach((user: any) => {
          allUsersMap.set(user.id, {
            id: user.id,
            username: user.username,
            nickname: user.nickname,
            avatarCid: user.avatarCid,
            isFollowing: true,
            isFollowedBy: followersSet.has(user.id),
            isFrozen: user.isFrozen || false,
            followedAt: new Date().toISOString(),
          });
        });

        followersData.forEach((user: any) => {
          if (!allUsersMap.has(user.id)) {
            allUsersMap.set(user.id, {
              id: user.id,
              username: user.username,
              nickname: user.nickname,
              avatarCid: user.avatarCid,
              isFollowing: false,
              isFollowedBy: true,
              isFrozen: user.isFrozen || false,
            });
          }
        });

        setAllUsers(Array.from(allUsersMap.values()));
      }
    } catch (error) {
      console.error('获取关注数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = [...allUsers];

    if (relationshipType === 'following') {
      filtered = filtered.filter(u => u.isFollowing);
    } else if (relationshipType === 'followers') {
      filtered = filtered.filter(u => u.isFollowedBy);
    } else if (relationshipType === 'mutual') {
      filtered = filtered.filter(u => u.isFollowing && u.isFollowedBy);
    }

    if (activityStatus === 'inactive') {
      filtered = filtered.filter(u => u.isFrozen);
    }

    return filtered.sort((a, b) => {
      switch (sortOption) {
        case 'alphabetical':
          return (a.nickname || a.username).localeCompare(b.nickname || b.username);
        case 'recentStatus':
          return (a.isFrozen ? 1 : 0) - (b.isFrozen ? 1 : 0);
        case 'recentActivity':
        default:
          if (a.followedAt && b.followedAt) {
            return new Date(b.followedAt).getTime() - new Date(a.followedAt).getTime();
          }
          return 0;
      }
    });
  }, [allUsers, relationshipType, activityStatus, sortOption]);

  const handleUnfollow = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        fetchFollowingData();
      }
    } catch (error) {
      console.error('取关操作失败:', error);
    }
  };

  const handleBatchUnfollow = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      const token = localStorage.getItem('token');
      for (const userId of selectedUsers) {
        await fetch(`/api/users/${userId}/follow`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setSelectedUsers([]);
      fetchFollowingData();
    } catch (error) {
      console.error('批量取关操作失败:', error);
    }
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const getOfflineDuration = (lastActivity?: string) => {
    if (!lastActivity) return '离线';
    
    const now = new Date();
    const last = new Date(lastActivity);
    const diffMs = now.getTime() - last.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays}天前离线`;
    } else if (diffHours > 0) {
      return `${diffHours}小时前离线`;
    } else {
      return '刚刚离线';
    }
  };

  if (!isAuthenticated) {
    return (
      <SettingsLayout title="关注管理">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">请先登录</p>
          <Button variant="primary" onClick={() => router.push('/auth/sign-in')}>
            前往登录
          </Button>
        </div>
      </SettingsLayout>
    );
  }

  if (loading) {
    return <SettingsLayout title="关注管理"><div className="text-center py-12">加载中...</div></SettingsLayout>;
  }

  return (
    <SettingsLayout title="关注管理">
      <div className="space-y-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" role="tablist">
            {[
              { key: 'following', label: '正在关注' },
              { key: 'followers', label: '被关注' },
              { key: 'mutual', label: '互相关注' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setRelationshipType(tab.key as RelationshipType)}
                role="tab"
                aria-selected={relationshipType === tab.key}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
                  relationshipType === tab.key
                    ? 'border-[#6364FF] text-[#6364FF]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex flex-wrap gap-6 items-center p-5 bg-gradient-to-r from-[#F9FAFB] to-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">账号状态：</span>
            <div className="flex gap-2">
              {[
                { key: 'all', label: '全部' },
                { key: 'inactive', label: '休眠' },
              ].map((status) => (
                <Button
                  key={status.key}
                  variant={activityStatus === status.key ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setActivityStatus(status.key as ActivityStatus)}
                  className="!rounded-lg"
                >
                  {status.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">排序方式：</span>
            <div className="flex gap-2">
              {[
                { key: 'recentActivity', label: '最近活动' },
                { key: 'recentStatus', label: '最近状态' },
                { key: 'alphabetical', label: '首字母' },
              ].map((sort) => (
                <Button
                  key={sort.key}
                  variant={sortOption === sort.key ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setSortOption(sort.key as SortOption)}
                  className="!rounded-lg"
                >
                  {sort.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {selectedUsers.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">已选择 {selectedUsers.length} 个用户</span>
              <Button variant="danger" onClick={handleBatchUnfollow}>
                取消关注所选用户
              </Button>
            </div>
          </Card>
        )}

        <Card className="p-6 border-gray-200 shadow-sm">
          {filteredAndSortedUsers.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500 font-medium">暂无用户</p>
              <p className="text-gray-400 text-sm mt-1">切换其他标签查看</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedUsers.map((userItem) => (
                <div
                  key={userItem.id}
                  className="group p-4 hover:bg-[#F0EFFF]/30 rounded-xl border border-gray-100 hover:border-[#6364FF]/20 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    {(relationshipType === 'following' || relationshipType === 'followers' || relationshipType === 'mutual') && (
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(userItem.id)}
                        onChange={() => toggleUserSelection(userItem.id)}
                        className="rounded-md border-gray-300 text-[#6364FF] focus:ring-[#6364FF] w-4 h-4 cursor-pointer"
                      />
                    )}
                    
                    <div className="relative">
                      <Avatar
                        src={getIPFSUrl(userItem.avatarCid)}
                        name={userItem.nickname || userItem.username}
                        size="md"
                      />
                      <OnlineStatusIndicator
                        userId={userItem.id}
                        size="sm"
                      />
                    </div>

                    <div className="flex-1">
                      <LinkWithBack href={`/profile/${userItem.username}`} className="block hover:bg-gray-50 rounded p-2 -m-2">
                        <div className="font-semibold text-gray-900 text-lg">
                          {userItem.nickname && userItem.nickname !== userItem.username ? userItem.nickname : `@${userItem.username}`}
                        </div>
                        {userItem.nickname && userItem.nickname !== userItem.username && (
                          <div className="text-gray-500 text-sm">
                            @{userItem.username}
                          </div>
                        )}
                      </LinkWithBack>
                      <div className="flex items-center gap-2 mt-1">
                        {(() => {
                          const status = statuses.get(userItem.id);
                          if (status?.isOnline) {
                            return <span className="text-xs text-green-600">在线</span>;
                          } else if (status?.lastSeen) {
                            return <span className="text-xs text-gray-500">{formatLastSeen(status.lastSeen)}</span>;
                          } else {
                            return <span className="text-xs text-gray-500">离线</span>;
                          }
                        })()}
                        {userItem.isFollowing && userItem.isFollowedBy && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            互相关注
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </SettingsLayout>
  );
}

