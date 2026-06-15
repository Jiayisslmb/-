'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface Device {
  id: number;
  deviceName: string;
  deviceType: string | null;
  deviceUUID: string | null;
  os: string;
  browser: string;
  ipAddress: string;
  location: string | null;
  isActive: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
}

const DEVICE_ICONS: Record<string, string> = {
  mobile: '📱',
  tablet: '📋',
  desktop: '🖥️',
};

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
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const maskIP = (ip: string) => {
    const parts = ip.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.*.*`;
    return ip;
  };

  return (
    <>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-2">设备管理</h1>
      <div className="mb-6 h-1 w-16 bg-gradient-to-r from-[#6364FF] to-[#8B83FF] rounded-full" />
      <p className="text-gray-500 mb-6">管理你的登录设备，发现异常设备可立即移除，移除后该设备需重新登录。</p>

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
          <span className="text-5xl block mb-3">🖥️</span>
          暂无设备记录——请打开聊天页面建立连接，然后刷新本页。
        </div>
      )}

      <div className="space-y-3">
        {devices.map((device) => (
          <Card key={device.id} className="p-5 border-gray-200 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                  device.isActive ? 'bg-green-50 ring-2 ring-green-200' : 'bg-gray-50'
                }`}>
                  {DEVICE_ICONS[device.deviceType || 'desktop'] || '🖥️'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm md:text-base truncate">
                      {device.deviceName}
                    </span>
                    {device.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex-shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        当前在线
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
                        离线
                      </span>
                    )}
                    {device.deviceType && (
                      <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded flex-shrink-0">
                        {device.deviceType === 'mobile' ? '手机' : device.deviceType === 'tablet' ? '平板' : '电脑'}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-2 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{maskIP(device.ipAddress)}</span>
                      {device.location && <span className="text-gray-400">· {device.location}</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>首次: {formatTime(device.firstSeenAt)} · 最近: {formatTime(device.lastSeenAt)}</span>
                    </div>
                    {device.deviceUUID && (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        <span className="font-mono text-xs text-gray-400">ID: {device.deviceUUID.slice(0, 8)}...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="danger"
                size="sm"
                disabled={revoking === device.id}
                isLoading={revoking === device.id}
                onClick={() => handleRevoke(device.id)}
                className="!rounded-lg flex-shrink-0"
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
