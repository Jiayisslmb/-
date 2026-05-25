//活动列表页 - 专注于活动展示，避免与首页重复

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/PageHeader';
import BackButton from '@/components/common/BackButton';


interface Activity {
  id: string;
  title: string;
  description: string;
  type: 'discussion' | 'contest' | 'meetup' | 'workshop';
  startDate: string;
  endDate?: string;
  participantCount: number;
  maxParticipants?: number;
  status: 'upcoming' | 'ongoing' | 'ended';
  creator: {
    username: string;
    avatarCid?: string;
  };
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'ended'>('all');

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(`/api/activities`);
        if (response.ok) {
          const data = await response.json();
          setActivities(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('获取活动失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    return activity.status === filter;
  });

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: { text: string; color: string } } = {
      discussion: { text: '讨论', color: 'bg-blue-100 text-blue-700' },
      contest: { text: '竞赛', color: 'bg-red-100 text-red-700' },
      meetup: { text: '聚会', color: 'bg-green-100 text-green-700' },
      workshop: { text: '工作坊', color: 'bg-purple-100 text-purple-700' }
    };
    return labels[type] || { text: type, color: 'bg-gray-100 text-gray-700' };
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { text: string; className: string } } = {
      upcoming: { text: '即将开始', className: 'bg-gray-100 text-gray-700' },
      ongoing: { text: '进行中', className: 'bg-green-100 text-green-700' },
      ended: { text: '已结束', className: 'bg-gray-50 text-gray-500' }
    };
    const badge = (badges[status] ?? badges.upcoming) as { text: string; className: string };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">探索活动</h1>
            <div className="mt-2 h-1 w-16 bg-gradient-to-r from-[#6364FF] to-[#8B83FF] rounded-full"></div>
          </div>
          <Link href="/activities/create">
            <Button variant="primary">发起活动</Button>
          </Link>
        </div>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all' as const, label: '全部活动' },
          { key: 'upcoming' as const, label: '即将开始' },
          { key: 'ongoing' as const, label: '进行中' },
          { key: 'ended' as const, label: '已结束' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200 ${
              filter === tab.key
                ? 'bg-[#6364FF] text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </Card>
          ))}
        </div>
      ) : filteredActivities.length === 0 ? (
        <Card variant="elevated" className="text-center py-16">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {filter === 'all' ? '暂无活动' : `暂无${filter === 'upcoming' ? '即将开始的' : filter === 'ongoing' ? '进行中的' : '已结束的'}活动`}
          </h3>
          <p className="text-gray-500 mb-6">
            {filter === 'all' 
              ? '成为第一个发起活动的人吧！' 
              : '切换其他筛选条件查看更多活动'}
          </p>
          {filter === 'all' && (
            <Link href="/activities/create">
              <Button variant="primary">创建活动</Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredActivities.map((activity) => (
            <Link key={activity.id} href={`/activities/${activity.id}`}>
              <Card hoverable className="p-6 h-full flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getTypeLabel(activity.type).color}`}>
                    {getTypeLabel(activity.type).text}
                  </span>
                  {getStatusBadge(activity.status)}
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 flex-1">
                  {activity.title}
                </h3>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
                  {activity.description || '暂无描述'}
                </p>

                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>开始时间：{formatDate(activity.startDate)}</span>
                  </div>

                  {activity.endDate && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>结束时间：{formatDate(activity.endDate)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{activity.participantCount} 人参与</span>
                      {activity.maxParticipants && (
                        <span className="text-gray-400">/ {activity.maxParticipants}</span>
                      )}
                    </div>

                    {activity.status !== 'ended' && (
                      <span className="text-xs font-medium text-[#6364FF]">
                        查看详情 →
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
