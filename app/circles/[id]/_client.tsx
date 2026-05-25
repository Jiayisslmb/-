//圈子详情页

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import LinkWithBack from '@/components/common/LinkWithBack';
import { useAuth } from '@/lib/auth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ContentFeed from '@/components/content/ContentFeed';
import BackButton from '@/components/common/BackButton';
import { getCircle, joinCircle, leaveCircle } from '@/lib/api';
import { getIPFSUrl } from '@/lib/ipfs';
import { toast } from '@/lib/toast';


export function CircleDetailPage() {
  const params = useParams();
  const circleId = params.id as string;
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [circle, setCircle] = useState<any>({
    id: circleId,
    name: '',
    description: '',
    avatarCid: '',
    memberCount: 0,
    category: '',
    createdAt: '',
    members: [],
    creatorId: null
  });
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取圈子信息
  useEffect(() => {
    const fetchCircleInfo = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // 获取圈子详情
        const response = await fetch(`/api/circles/${circleId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('获取圈子信息失败');
        }
        
        const data = await response.json();
        setCircle(data);
        
        // 检查当前用户是否已加入圈子
        // API返回的是circlemembers，不是members
        const members = data.circlemembers || data.members || [];
        if (user?.id && members) {
          // 成员数据格式: { userId: number, user: { id: number, ... } }
          const isMember = members.some((m: any) => 
            String(m.userId) === user.id || String(m.user?.id) === user.id
          );
          console.log('成员检查:', { userId: user.id, members, isMember });
          setJoined(isMember);
        }
      } catch (err) {
        setError('获取圈子信息失败');
        console.error('获取圈子信息失败:', err);
      } finally {
        setLoading(false);
      }
    };

    // 等待认证加载完成后再获取圈子信息
    if (!authLoading) {
      fetchCircleInfo();
    } else {
      // 如果认证正在加载，设置loading为true
      setLoading(true);
    }
  }, [circleId, isAuthenticated, authLoading, user?.id]);

  // 当用户信息变化时重新检查成员状态
  useEffect(() => {
    const members = circle.circlemembers || circle.members || [];
    if (user?.id && members.length > 0) {
      const isMember = members.some((m: any) => 
        String(m.userId) === user.id || String(m.user?.id) === user.id
      );
      setJoined(isMember);
    }
  }, [user?.id, circle.circlemembers, circle.members]);

  if (!isAuthenticated && !authLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">请先登录查看圈子</p>
        <Link href="/auth/sign-in">
          <Button variant="primary">前往登录</Button>
        </Link>
      </div>
    );
  }

  if (loading || authLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button variant="primary" onClick={() => router.refresh()}>重新加载</Button>
      </div>
    );
  }

  // 处理加入/离开圈子
  const handleJoinToggle = async () => {
    try {
      if (joined) {
        // 检查是否是创建者
        if (isCreator) {
          toast.warning('创建者不能离开圈子，请先删除圈子');
          return;
        }
        await leaveCircle(circleId);
        setJoined(false);
        setCircle((prev: any) => ({
          ...prev,
          memberCount: Math.max(0, prev.memberCount - 1)
        }));
      } else {
        await joinCircle(circleId);
        setJoined(true);
        setCircle((prev: any) => ({
          ...prev,
          memberCount: prev.memberCount + 1
        }));
      }
    } catch (err: any) {
      console.error('操作失败:', err);
      // 处理创建者不能离开圈子的错误
      if (err.message?.includes('创建者') || err.message?.includes('creator')) {
        toast.warning('创建者不能离开圈子，请先删除圈子');
      } else {
        toast.error(err.message || '操作失败，请重试');
      }
    }
  };

  // 获取头像URL
  const getAvatarUrl = () => {
    if (circle.avatarCid) {
      return getIPFSUrl(circle.avatarCid);
    }
    return 'https://via.placeholder.com/1200x300?text=CircleCover';
  };

  // 检查是否是创建者
  const isCreator = user?.id && String(circle.creatorId) === user.id;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 返回按钮 */}
      <div className="mt-4">
        <BackButton fallback="/circles" />
      </div>

      {/* 圈子信息 */}
      <Card className="p-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            {circle.avatarCid ? (
              <img src={getIPFSUrl(circle.avatarCid)} alt={circle.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl text-gray-400">👥</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold">{circle.name}</h1>
                <p className="text-gray-600">{circle.category || '未分类'}</p>
              </div>
              <div className="flex gap-2">
                {isCreator ? (
                  <Link href={`/circles/${circle.id}/settings`}>
                    <Button variant="secondary">⚙️ 圈子设置</Button>
                  </Link>
                ) : (
                  <Button
                    variant={joined ? 'secondary' : 'primary'}
                    onClick={handleJoinToggle}
                  >
                    {joined ? '已关注' : '关注'}
                  </Button>
                )}
              </div>
            </div>
            <p className="text-gray-700 mb-4">{circle.description || '暂无描述'}</p>
            <div className="flex gap-8 mb-4">
              <div>
                <p className="text-gray-600 text-sm">成员数</p>
                <p className="text-2xl font-bold">{circle.memberCount}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">文章数</p>
                <p className="text-2xl font-bold">{circle.postCount || 0}</p>
              </div>
            </div>
            {circle.user && (
              <div className="text-sm text-gray-500">
                创建者: 
                <LinkWithBack href={`/profile/${circle.user.username}`} className="ml-1 text-blue-600 hover:underline">
                  {circle.user.username}
                </LinkWithBack>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 圈子动态 */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">圈子文章</h3>
          {joined && (
            <Link href={`/content/create/article?circleId=${circleId}`}>
              <Button variant="primary" size="sm">发布文章</Button>
            </Link>
          )}
        </div>
        <ContentFeed type="circle" circleId={circleId} />
      </Card>
    </div>
  );
}
