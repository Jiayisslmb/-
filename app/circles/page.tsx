//圈子广场页面
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LinkWithBack from '@/components/common/LinkWithBack';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { getIPFSUrl } from '@/lib/ipfs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Circle {
  id: number;
  name: string;
  description?: string;
  avatarCid?: string;
  category: string;
  creatorId: number;
  user?: {
    id: number;
    username: string;
    avatarCid?: string;
  };
  memberCount: number;
  postCount: number;
  createdAt: string;
}

export default function CirclesPage() {
  const { user, isAuthenticated } = useAuth();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinedCircles, setJoinedCircles] = useState<number[]>([]);

  useEffect(() => {
    fetchCircles();
    if (isAuthenticated && user) {
      fetchJoinedCircles();
    }
  }, [isAuthenticated, user?.id]);

  const fetchCircles = async () => {
    try {
      const response = await fetch(`${API_URL}/circles`);
      if (response.ok) {
        const data = await response.json();
        setCircles(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('获取圈子失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJoinedCircles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/circles/user/${user?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const ids = data.map((m: any) => m.circleId);
        setJoinedCircles(ids);
      }
    } catch (error) {
      console.error('获取已加入圈子失败:', error);
    }
  };

  const handleJoin = async (circleId: number) => {
    if (!isAuthenticated) {
      alert('请先登录');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/circles/${circleId}/join`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setJoinedCircles([...joinedCircles, circleId]);
        fetchCircles();
        alert('加入成功！');
      } else {
        const error = await response.json();
        alert(error.message || '加入失败');
      }
    } catch (error) {
      console.error('加入圈子失败:', error);
      alert('加入失败');
    }
  };

  const handleLeave = async (circleId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/circles/${circleId}/leave`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setJoinedCircles(joinedCircles.filter(id => id !== circleId));
        fetchCircles();
        alert('已退出圈子');
      } else {
        const error = await response.json();
        alert(error.message || '退出失败');
      }
    } catch (error) {
      console.error('退出圈子失败:', error);
      alert('退出失败');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">圈子广场</h1>
        <div className="text-center py-12">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="inline-flex items-center gap-2 px-2 py-1.5 rounded-lg text-gray-600 hover:text-[#6364FF] hover:bg-gray-100 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">圈子广场</h1>
            <div className="mt-1 h-1 w-16 bg-gradient-to-r from-[#6364FF] to-[#8B83FF] rounded-full"></div>
          </div>
        </div>
        <div className="flex gap-2">
          {isAuthenticated && (
            <Link href="/circles/create">
              <Button variant="primary">创建圈子</Button>
            </Link>
          )}
        </div>
      </div>

      {circles.length === 0 ? (
        <Card className="p-6">
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">暂无圈子</p>
            {isAuthenticated && (
              <Link href="/circles/create">
                <Button variant="primary">创建第一个圈子</Button>
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {circles.map(circle => (
            <Card key={circle.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                  {circle.avatarCid ? (
                    <img
                      src={getIPFSUrl(circle.avatarCid)}
                      alt={circle.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    circle.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <LinkWithBack href={`/circles/${circle.id}`}>
                    <h3 className="text-lg font-bold hover:text-blue-600">{circle.name}</h3>
                  </LinkWithBack>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                    {circle.description || '暂无简介'}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>👥 {circle.memberCount} 成员</span>
                    <span>📝 {circle.postCount} 文章</span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                      {circle.category}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center pt-4 border-t">
                <span className="text-sm text-gray-400">
                  创建者: {circle.user?.username || '未知'}
                </span>
                {isAuthenticated && (
                  joinedCircles.includes(circle.id) ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleLeave(circle.id)}
                    >
                      退出圈子
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleJoin(circle.id)}
                    >
                      加入圈子
                    </Button>
                  )
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
