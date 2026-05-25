//创建圈子页面

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import BackButton from '@/components/common/BackButton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function CreateCirclePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/circles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '创建失败');
      }

      const circle = await response.json();
      router.push(`/circles/${circle.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">请先登录以创建圈子</p>
        <Link href="/auth/sign-in">
          <Button variant="primary">前往登录</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <BackButton />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">创建新圈子</h1>
        <div className="mt-2 h-1 w-16 bg-gradient-to-r from-[#6364FF] to-[#8B83FF] rounded-full"></div>
        <p className="text-gray-500 mt-3">创建一个属于你的圈子，聚集志同道合的人</p>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">圈子名称</label>
            <input
              name="name"
              placeholder="输入圈子名称..."
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#6364FF] focus:ring-2 focus:ring-[#6364FF]/20 focus:bg-white transition-all duration-200 text-lg font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">圈子描述</label>
            <textarea
              name="description"
              placeholder="介绍你的圈子..."
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#6364FF] focus:ring-2 focus:ring-[#6364FF]/20 focus:bg-white min-h-[120px] transition-all duration-200 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#6364FF] focus:ring-2 focus:ring-[#6364FF]/20 focus:bg-white transition-all duration-200"
            >
              <option value="">选择分类</option>
              <option value="技术">技术</option>
              <option value="金融">金融</option>
              <option value="艺术">艺术</option>
              <option value="教育">教育</option>
              <option value="社区">社区</option>
              <option value="娱乐">娱乐</option>
              <option value="生活">生活</option>
            </select>
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-6 border-t border-gray-100">
            <Button variant="primary" type="submit" disabled={loading} className="flex-1">
              {loading ? '创建中...' : '创建圈子'}
            </Button>
            <Link href="/circles">
              <Button variant="secondary">
                取消
              </Button>
            </Link>
          </div>
        </form>

        <div className="p-6 pt-0">
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="font-bold mb-3 text-gray-900">创建圈子的注意事项</h3>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>✓ 圈子名称应简明扼要，易于理解</li>
              <li>✓ 描述应清楚说明圈子的目的和主题</li>
              <li>✓ 遵守社区准则，不能发布违规内容</li>
              <li>✓ 圈子创建后不能直接删除，请谨慎创建</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
