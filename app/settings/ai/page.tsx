'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function AISettingsPage() {
  const [profile, setProfile] = useState({
    language: 'zh',
    interests: '',
    expertise: 'intermediate',
    autoLearn: true,
  });
  const [stats, setStats] = useState({
    thisMonth: { input: 0, output: 0 },
    total: { input: 0, output: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch('/api/chatbot/profile', {
        headers: { Authorization: 'Bearer ' + token },
      }).then((r) => r.json()),
      fetch('/api/chatbot/stats', {
        headers: { Authorization: 'Bearer ' + token },
      }).then((r) => r.json()),
    ])
      .then(([profileData, statsData]) => {
        if (profileData && !profileData.error) {
          setProfile({
            language: profileData.language || 'zh',
            interests: profileData.interests || '',
            expertise: profileData.expertise || 'intermediate',
            autoLearn: profileData.autoLearn !== false,
          });
        }
        if (statsData && !statsData.error) setStats(statsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    const token = localStorage.getItem('token');
    try {
      await fetch('/api/chatbot/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify(profile),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {} finally {
      setSaving(false);
    }
  };

  const handleClearConversations = async () => {
    if (!confirm('确定要清除所有AI对话历史吗？此操作不可撤销。')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/chatbot/conversations', {
        headers: { Authorization: 'Bearer ' + token },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        for (const conv of data) {
          await fetch('/api/chatbot/conversations/' + conv.id, {
            method: 'DELETE',
            headers: { Authorization: 'Bearer ' + token },
          });
        }
      }
      alert('对话历史已清除');
    } catch {
      alert('清除失败');
    }
  };

  const handleResetProfile = async () => {
    if (!confirm('确定要重置AI画像吗？')) return;
    const token = localStorage.getItem('token');
    try {
      await fetch('/api/chatbot/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
          language: 'zh',
          interests: '',
          expertise: 'intermediate',
          autoLearn: true,
        }),
      });
      setProfile({
        language: 'zh',
        interests: '',
        expertise: 'intermediate',
        autoLearn: true,
      });
      alert('画像已重置');
    } catch {
      alert('重置失败');
    }
  };

  return (
    <>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-2">
        AI 助手设置
      </h1>
      <div className="mb-6 h-1 w-16 bg-gradient-to-r from-[#6364FF] to-[#8B83FF] rounded-full" />

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-48 bg-gray-100 rounded-xl" />
          <div className="h-32 bg-gray-100 rounded-xl" />
          <div className="h-24 bg-gray-100 rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* 我的画像 */}
          <Card className="border-[var(--mastodon-border)] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[var(--mastodon-border-light)] bg-gradient-to-r from-[var(--mastodon-bg)] to-[var(--mastodon-surface)]">
              <h2 className="text-base font-bold text-[var(--mastodon-text-primary)]">
                我的画像
              </h2>
              <p className="text-sm text-[var(--mastodon-text-secondary)] mt-1">
                AI 会根据这些信息调整回答方式
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--mastodon-text-primary)] mb-1">
                  使用的语言
                </label>
                <select
                  value={profile.language}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, language: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-[var(--mastodon-border)] rounded-xl bg-[var(--mastodon-surface)] text-sm"
                >
                  <option value="zh">中文</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--mastodon-text-primary)] mb-1">
                  兴趣领域（逗号分隔）
                </label>
                <input
                  type="text"
                  value={profile.interests}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, interests: e.target.value }))
                  }
                  placeholder="Web3, IPFS, 去中心化..."
                  className="w-full px-4 py-2.5 border border-[var(--mastodon-border)] rounded-xl bg-[var(--mastodon-surface)] text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--mastodon-text-primary)] mb-1">
                  技术水平
                </label>
                <select
                  value={profile.expertise}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, expertise: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-[var(--mastodon-border)] rounded-xl bg-[var(--mastodon-surface)] text-sm"
                >
                  <option value="beginner">入门</option>
                  <option value="intermediate">中级</option>
                  <option value="expert">高级</option>
                </select>
              </div>

              <Button
                variant="primary"
                onClick={handleSaveProfile}
                isLoading={saving}
                className="!rounded-xl"
              >
                {saved ? '已保存' : '保存画像'}
              </Button>
            </div>
          </Card>

          {/* AI 行为 */}
          <Card className="border-[var(--mastodon-border)] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[var(--mastodon-border-light)] bg-gradient-to-r from-[var(--mastodon-bg)] to-[var(--mastodon-surface)]">
              <h2 className="text-base font-bold text-[var(--mastodon-text-primary)]">
                AI 行为
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <label className="flex items-center justify-between py-2 cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-[var(--mastodon-text-primary)]">
                    自动学习偏好
                  </p>
                  <p className="text-xs text-[var(--mastodon-text-secondary)]">
                    从对话中自动总结你的兴趣和偏好
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={profile.autoLearn}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      autoLearn: e.target.checked,
                    }))
                  }
                  className="w-5 h-5 rounded text-[#6364FF] focus:ring-[#6364FF]"
                />
              </label>
            </div>
          </Card>

          {/* 数据管理 */}
          <Card className="border-[var(--mastodon-border)] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[var(--mastodon-border-light)] bg-gradient-to-r from-[var(--mastodon-bg)] to-[var(--mastodon-surface)]">
              <h2 className="text-base font-bold text-[var(--mastodon-text-primary)]">
                数据管理
              </h2>
            </div>
            <div className="p-6 space-y-3">
              <Button
                variant="outline"
                onClick={handleClearConversations}
                className="w-full !rounded-xl !justify-start !text-left !text-red-600 !border-red-200 hover:!bg-red-50"
              >
                清除所有对话历史
              </Button>
              <Button
                variant="outline"
                onClick={handleResetProfile}
                className="w-full !rounded-xl !justify-start !text-left"
              >
                重置 AI 画像
              </Button>
            </div>
          </Card>

          {/* 用量统计 */}
          <Card className="border-[var(--mastodon-border)] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[var(--mastodon-border-light)] bg-gradient-to-r from-[var(--mastodon-bg)] to-[var(--mastodon-surface)]">
              <h2 className="text-base font-bold text-[var(--mastodon-text-primary)]">
                用量统计
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[var(--mastodon-bg)] border border-[var(--mastodon-border-light)]">
                  <p className="text-xs text-[var(--mastodon-text-tertiary)] mb-1">
                    本月输入 Token
                  </p>
                  <p className="text-lg font-bold text-[var(--mastodon-text-primary)]">
                    {stats.thisMonth.input.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--mastodon-bg)] border border-[var(--mastodon-border-light)]">
                  <p className="text-xs text-[var(--mastodon-text-tertiary)] mb-1">
                    本月输出 Token
                  </p>
                  <p className="text-lg font-bold text-[var(--mastodon-text-primary)]">
                    {stats.thisMonth.output.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--mastodon-bg)] border border-[var(--mastodon-border-light)]">
                  <p className="text-xs text-[var(--mastodon-text-tertiary)] mb-1">
                    累计输入 Token
                  </p>
                  <p className="text-lg font-bold text-[var(--mastodon-text-primary)]">
                    {stats.total.input.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--mastodon-bg)] border border-[var(--mastodon-border-light)]">
                  <p className="text-xs text-[var(--mastodon-text-tertiary)] mb-1">
                    累计输出 Token
                  </p>
                  <p className="text-lg font-bold text-[var(--mastodon-text-primary)]">
                    {stats.total.output.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
