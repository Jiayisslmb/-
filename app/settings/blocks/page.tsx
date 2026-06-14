'use client';

import { useState, useEffect, useCallback } from 'react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface BlockedUser {
  id: number;
  username: string;
  nickname?: string;
  avatarCid?: string;
}

export default function BlocksPage() {
  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBlocked = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users/blocked/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        setError('加载失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlocked();
  }, [fetchBlocked]);

  const handleUnblock = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/${userId}/block`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch {
      // ignore
    }
  };

  return (
    <>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-2">屏蔽管理</h1>
      <div className="mb-6 h-1 w-16 bg-gradient-to-r from-[#6364FF] to-[#8B83FF] rounded-full" />
      <Card className="border-[var(--mastodon-border)] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[var(--mastodon-border-light)] bg-gradient-to-r from-[var(--mastodon-bg)] to-[var(--mastodon-surface)]">
          <h2 className="text-base font-bold text-[var(--mastodon-text-primary)]">
            已屏蔽的用户
          </h2>
          <p className="text-sm text-[var(--mastodon-text-secondary)] mt-1">
            被屏蔽的用户无法关注你、给你发私信或查看你的内容
          </p>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-[var(--mastodon-border)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 bg-[var(--mastodon-border)] rounded" />
                  <div className="h-2 w-16 bg-[var(--mastodon-border)] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-500 mb-3">{error}</p>
            <Button variant="secondary" onClick={fetchBlocked}>重试</Button>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🛡️</div>
            <p className="text-[var(--mastodon-text-primary)] font-medium mb-1">
              你没有屏蔽任何用户
            </p>
            <p className="text-sm text-[var(--mastodon-text-secondary)]">
              当你屏蔽某个用户后，他们会出现在这里
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--mastodon-border-light)]">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 hover:bg-[var(--mastodon-bg)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={user.avatarCid ? `https://gateway.pinata.cloud/ipfs/${user.avatarCid}` : undefined}
                    name={user.nickname || user.username}
                    size="sm"
                  />
                  <div>
                    <p className="font-medium text-[var(--mastodon-text-primary)] text-sm">
                      {user.nickname || user.username}
                    </p>
                    <p className="text-xs text-[var(--mastodon-text-tertiary)]">
                      @{user.username}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnblock(user.id)}
                  className="!rounded-lg !text-red-500 !border-red-200 hover:!bg-red-50"
                >
                  解除屏蔽
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
