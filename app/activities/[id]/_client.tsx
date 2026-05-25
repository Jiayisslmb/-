'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';


interface Activity {
  id: string;
  title: string;
  description: string;
  type: string;
  startDate: string;
  endDate?: string;
  participantCount: number;
  maxParticipants?: number;
  status: string;
  rules?: string;
  rewards?: string;
  creator: { username: string; avatarCid?: string };
}

export function ActivityPage() {
  const params = useParams();
  const { isAuthenticated } = useAuth();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch(`/api/activities/${params.id}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setActivity(data);
        } else if (response.status === 404) {
          setError('活动不存在');
        } else {
          setError('加载失败，请稍后重试');
        }
      } catch {
        setError('网络错误，请检查后端服务是否启动');
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="p-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <div className="text-5xl mb-4">📋</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{error}</h2>
        <p className="text-gray-500 mb-6">
          {error.includes('网络') ? '请确保后端服务已启动' : '该活动可能已被删除或链接无效'}
        </p>
        <Link href="/activities">
          <Button variant="primary">返回活动列表</Button>
        </Link>
      </div>
    );
  }

  if (!activity) return null;

  const typeLabels: Record<string, { text: string; color: string }> = {
    discussion: { text: '讨论', color: 'bg-blue-100 text-blue-700' },
    voting: { text: '投票', color: 'bg-yellow-100 text-yellow-700' },
    competition: { text: '竞赛', color: 'bg-red-100 text-red-700' },
    workshop: { text: '工作坊', color: 'bg-purple-100 text-purple-700' },
    meetup: { text: '线下聚会', color: 'bg-green-100 text-green-700' },
  };

  const typeLabel = typeLabels[activity.type] || { text: activity.type, color: 'bg-gray-100 text-gray-700' };
  const statusLabels: Record<string, string> = {
    upcoming: '即将开始', ongoing: '进行中', ended: '已结束',
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/activities" className="text-[#6364FF] hover:underline mb-6 inline-block">
        ← 返回活动列表
      </Link>

      <Card className="p-8">
        <div className="flex items-start justify-between mb-4">
          <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${typeLabel.color}`}>
            {typeLabel.text}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {statusLabels[activity.status] || activity.status}
          </span>
        </div>

        <h1 className="text-3xl font-bold mb-4">{activity.title}</h1>
        <p className="text-gray-600 mb-6 whitespace-pre-wrap">{activity.description}</p>

        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <span className="text-xs text-gray-500">开始时间</span>
            <p className="font-medium">{new Date(activity.startDate).toLocaleString('zh-CN')}</p>
          </div>
          {activity.endDate && (
            <div>
              <span className="text-xs text-gray-500">结束时间</span>
              <p className="font-medium">{new Date(activity.endDate).toLocaleString('zh-CN')}</p>
            </div>
          )}
          <div>
            <span className="text-xs text-gray-500">参与人数</span>
            <p className="font-medium">
              {activity.participantCount}
              {activity.maxParticipants ? ` / ${activity.maxParticipants}` : ' 人'}
            </p>
          </div>
        </div>

        {activity.rules && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">活动规则</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{activity.rules}</p>
          </div>
        )}

        {activity.rewards && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">奖励设置</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{activity.rewards}</p>
          </div>
        )}

        {activity.status !== 'ended' && (
          <div className="pt-4 border-t">
            {isAuthenticated ? (
              <Button variant="primary">参加活动</Button>
            ) : (
              <Link href="/auth/sign-in">
                <Button variant="primary">登录后参加</Button>
              </Link>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
