//创建活动页面（增加时间/规则字段）

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

export default function CreateActivityPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'discussion',
    startDate: '',
    endDate: '',
    maxParticipants: '',
    rules: '',
    rewards: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/activities');
      } else {
        const error = await response.json().catch(() => ({}));
        alert((error as any).message || '创建失败，请稍后重试');
      }
    } catch (error) {
      console.error('创建失败:', error);
      alert('网络错误，请检查后端服务是否启动');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">请先登录以创建活动</p>
        <Link href="/auth/sign-in">
          <Button variant="primary">前往登录</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/activities" className="text-blue-600 hover:underline mb-6 inline-block">
        ← 返回活动列表
      </Link>

      <h1 className="text-3xl font-bold mb-6">创建新活动</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="活动标题"
            name="title"
            placeholder="输入活动标题..."
            value={formData.title}
            onChange={handleChange}
            required
          />

          <div className="w-full">
            <label className="block text-sm font-medium mb-2">活动描述</label>
            <textarea
              name="description"
              placeholder="描述你的活动..."
              value={formData.description}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
            />
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium mb-2">活动类型</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="discussion">讨论</option>
              <option value="voting">投票</option>
              <option value="competition">竞赛</option>
              <option value="workshop">工作坊</option>
              <option value="meetup">线下聚会</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="开始时间"
              name="startDate"
              type="datetime-local"
              value={formData.startDate}
              onChange={handleChange}
              required
            />

            <Input
              label="结束时间"
              name="endDate"
              type="datetime-local"
              value={formData.endDate}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            label="最大参与人数"
            name="maxParticipants"
            type="number"
            placeholder="不限制请留空"
            value={formData.maxParticipants}
            onChange={handleChange}
            helperText="留空表示不限制参与人数"
          />

          <div className="w-full">
            <label className="block text-sm font-medium mb-2">活动规则</label>
            <textarea
              name="rules"
              placeholder="输入活动规则和要求..."
              value={formData.rules}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
            />
            <p className="text-sm text-gray-500 mt-1">例如：参与条件、评选标准等</p>
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium mb-2">奖励设置（可选）</label>
            <textarea
              name="rewards"
              placeholder="活动奖励说明..."
              value={formData.rewards}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
            />
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <Button variant="primary" type="submit" isLoading={loading}>
              创建活动
            </Button>
            <Link href="/activities">
              <Button variant="secondary">取消</Button>
            </Link>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t">
          <h3 className="font-bold mb-3">创建活动注意事项</h3>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li>✓ 活动标题应简明扼要，清晰表达活动主题</li>
            <li>✓ 详细说明活动规则，确保参与者了解要求</li>
            <li>✓ 合理设置活动时间，给予参与者足够准备时间</li>
            <li>✓ 遵守社区准则，不得发布违规活动</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
