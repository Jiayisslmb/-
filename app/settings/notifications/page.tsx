// 通知偏好设置页面

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { toast } from '@/lib/toast';

interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  likeNotification: boolean;
  commentNotification: boolean;
  followNotification: boolean;
  messageNotification: boolean;
  systemNotification: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  pushEnabled: true,
  emailEnabled: true,
  likeNotification: true,
  commentNotification: true,
  followNotification: true,
  messageNotification: true,
  systemNotification: true,
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (user) {
      try {
        if ((user as any).notificationPreferences) {
          const saved =
            typeof (user as any).notificationPreferences === 'string'
              ? JSON.parse((user as any).notificationPreferences)
              : (user as any).notificationPreferences;
          setPreferences({ ...DEFAULT_PREFERENCES, ...saved });
        }
      } catch {
        // Use defaults if parsing fails
      }
    }
  }, [user]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('登录已失效，请重新登录');
        return;
      }

      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notificationPreferences: JSON.stringify(preferences),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || '保存失败');
      }

      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error: any) {
      toast.error(error.message || '保存通知偏好失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-2">通知偏好</h1>
        <div className="mb-6 h-1 w-16 bg-gradient-to-r from-[#6364FF] to-[#8B83FF] rounded-full" />
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4 font-medium">请先登录</p>
          <Button variant="primary" onClick={() => router.push('/auth/sign-in')} className="!rounded-xl shadow-md hover:shadow-lg">
            前往登录
          </Button>
        </div>
      </>
    );
  }

  // Inline ToggleSwitch component
  const ToggleSwitch = ({
    checked,
    onChange,
    label,
    description,
  }: {
    checked: boolean;
    onChange: () => void;
    label: string;
    description?: string;
  }) => (
    <label className="flex items-center justify-between py-3 cursor-pointer group">
      <div className="flex-1 pr-4">
        <span className="text-sm font-medium text-gray-900 group-hover:text-[#6364FF] transition-colors duration-200">
          {label}
        </span>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#6364FF] focus:ring-offset-2 ${
          checked ? 'bg-[#6364FF]' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );

  return (
    <>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-2">通知偏好</h1>
      <div className="mb-6 h-1 w-16 bg-gradient-to-r from-[#6364FF] to-[#8B83FF] rounded-full" />
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 animate-slideDown">
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">通知偏好已保存</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* 通知方式 */}
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">通知方式</h2>
            <p className="text-xs text-gray-500 mt-1">选择接收通知的方式</p>
          </div>
          <div className="p-6 space-y-1">
            <ToggleSwitch
              label="推送通知"
              description="通过浏览器推送接收通知"
              checked={preferences.pushEnabled}
              onChange={() => handleToggle('pushEnabled')}
            />
            <div className="border-b border-gray-50" />
            <ToggleSwitch
              label="邮件通知"
              description="通过电子邮件接收通知"
              checked={preferences.emailEnabled}
              onChange={() => handleToggle('emailEnabled')}
            />
          </div>
        </Card>

        {/* 通知类型 */}
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">通知类型</h2>
            <p className="text-xs text-gray-500 mt-1">选择需要接收的通知类型</p>
          </div>
          <div className="p-6 space-y-1">
            <ToggleSwitch
              label="点赞"
              description="有人给你的内容点赞时通知"
              checked={preferences.likeNotification}
              onChange={() => handleToggle('likeNotification')}
            />
            <div className="border-b border-gray-50" />
            <ToggleSwitch
              label="评论"
              description="有人评论你的内容时通知"
              checked={preferences.commentNotification}
              onChange={() => handleToggle('commentNotification')}
            />
            <div className="border-b border-gray-50" />
            <ToggleSwitch
              label="关注"
              description="有人关注你时通知"
              checked={preferences.followNotification}
              onChange={() => handleToggle('followNotification')}
            />
            <div className="border-b border-gray-50" />
            <ToggleSwitch
              label="私信"
              description="收到新的私信时通知"
              checked={preferences.messageNotification}
              onChange={() => handleToggle('messageNotification')}
            />
            <div className="border-b border-gray-50" />
            <ToggleSwitch
              label="系统通知"
              description="系统维护、更新等公告"
              checked={preferences.systemNotification}
              onChange={() => handleToggle('systemNotification')}
            />
          </div>
        </Card>

        {/* 操作按钮 */}
        <div className="flex gap-4">
          <Button
            variant="primary"
            disabled={loading}
            isLoading={loading}
            onClick={handleSave}
            className="flex-1 !rounded-xl shadow-md hover:shadow-lg"
          >
            保存更改
          </Button>
          <Button
            variant="secondary"
            className="flex-1 !rounded-xl"
            onClick={() => router.back()}
          >
            取消
          </Button>
        </div>
      </div>
    </>
  );
}
