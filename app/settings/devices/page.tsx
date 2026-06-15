'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface Device {
  id: number;
  deviceName: string;
  os: string;
  browser: string;
  ipAddress: string;
  location: string;
  isActive: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
}

export default function DevicesPage() {
  const { isAuthenticated } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revoking, setRevoking] = useState<number | null>(null);

  const fetchDevices = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/users/devices', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('获取设备列表失败');
      const data = await res.json();
      setDevices(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchDevices();
  }, [isAuthenticated]);

  const handleRevoke = async (deviceId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setRevoking(deviceId);
    try {
      const res = await fetch(`/api/users/devices/${deviceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('移除失败');
      setDevices(prev => prev.filter(d => d.id !== deviceId));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRevoking(null);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-2">设备管理</h1>
      <div className="mb-6 h-1 w-16 bg-gradient-to-r from-[#6364FF] to-[#8B83FF] rounded-full" />
      <p className="text-gray-500 mb-6">管理你的登录设备和会话，发现异常设备可立即移除。</p>

      {loading && (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
          <button className="ml-3 underline" onClick={fetchDevices}>重试</button>
        </div>
      )}

      {!loading && devices.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          暂无设备记录，请打开聊天页面建立 WebSocket 连接后刷新本页。
        </div>
      )}

      <div className="space-y-3">
        {devices.map((device) => (
          <Card key={device.id} className="p-5 border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  device.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{device.deviceName}</span>
                    {device.isActive && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        当前在线
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                    <div>
                      IP: {device.ipAddress}{device.location ? ` (${device.location})` : ''}
                    </div>
                    <div>
                      首次登录: {formatTime(device.firstSeenAt)} · 最近活跃: {formatTime(device.lastSeenAt)}
                    </div>
                  </div>
                </div>
              </div>
              <Button
                variant="danger"
                size="sm"
                disabled={revoking === device.id}
                isLoading={revoking === device.id}
                onClick={() => handleRevoke(device.id)}
                className="!rounded-lg flex-shrink-0 ml-4"
              >
                移除
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
