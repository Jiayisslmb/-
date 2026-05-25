'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import { getIPFSUrl } from '@/lib/ipfs';
import UserDisplay from '@/components/common/UserDisplay';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Circle {
  id: number;
  name: string;
  description?: string;
  category: string;
  avatarCid?: string;
  creatorId: number;
  user?: {
    id: number;
    username: string;
    nickname?: string;
    avatarCid?: string;
  };
  memberCount: number;
  postCount: number;
  createdAt: string;
}

export default function CirclesManagementPage() {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    fetchCircles();
  }, []);

  const fetchCircles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/circles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCircles(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('获取圈子列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCircle = async (circleId: number) => {
    if (!confirm('确定要删除这个圈子吗？此操作不可恢复。')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/circles/${circleId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        fetchCircles();
        alert('圈子已删除');
      } else {
        const error = await response.json();
        alert(error.message || '删除失败');
      }
    } catch (error) {
      console.error('删除圈子失败:', error);
      alert('删除失败');
    }
  };

  const categories = ['all', ...new Set(circles.map(c => c.category))];

  const filteredCircles = circles.filter(circle => {
    const matchesSearch = circle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           circle.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || circle.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#6364FF] to-[#8B83FF] rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">圈子管理</h1>
        <p className="text-white/80 text-lg">管理平台上的圈子，处理违规内容</p>
      </div>

      <div className="grid grid-cols-4 gap-5">
        {[
          { label: '圈子总数', value: circles.length, icon: '🌐', gradient: 'from-blue-500 to-cyan-500' },
          { label: '总成员数', value: circles.reduce((sum, c) => sum + c.memberCount, 0), icon: '👥', gradient: 'from-green-500 to-emerald-500' },
          { label: '总帖子数', value: circles.reduce((sum, c) => sum + c.postCount, 0), icon: '📝', gradient: 'from-purple-500 to-pink-500' },
          { label: '分类数', value: new Set(circles.map(c => c.category)).size, icon: '🏷️', gradient: 'from-orange-500 to-red-500' }
        ].map(stat => (
          <Card key={stat.label} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group">
            <div className="relative">
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.gradient}`}></div>
              <div className="p-6 pt-7">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600 font-medium">{stat.label}</span>
                  <span className="text-2xl opacity-70 group-hover:opacity-100 transition-opacity">{stat.icon}</span>
                </div>
                <p className={`text-4xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                  {stat.value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="border-gray-200 shadow-sm p-6 bg-gradient-to-br from-white to-[#FAFBFF]">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              placeholder="搜索圈子名称或分类..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 !pl-11 !rounded-xl"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6364FF]/50 focus:border-[#6364FF] bg-white font-medium text-gray-700 hover:border-gray-300 transition-colors cursor-pointer"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? '📋 全部分类' : `🏷️ ${cat}`}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 px-1">
          <span>共找到 <strong className="text-gray-900">{filteredCircles.length}</strong> 个圈子</span>
          <span className="bg-gray-100 px-3 py-1 rounded-full font-medium">
            {filterCategory === 'all' ? '全部分类' : filterCategory}
          </span>
        </div>
      </Card>

      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">圈子</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">分类</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">成员数</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">帖子数</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">创建者</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">创建时间</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredCircles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-600 font-semibold text-lg mb-1">暂无圈子数据</p>
                    <p className="text-gray-400 text-sm">尝试调整筛选条件或搜索关键词</p>
                  </td>
                </tr>
              ) : (
                filteredCircles.map(circle => (
                  <tr key={circle.id} className="border-b border-gray-100 hover:bg-[#F0EFFF]/30 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={getIPFSUrl(circle.avatarCid)} name={circle.name} size="md" className="!rounded-xl ring-2 ring-gray-100" />
                        <div>
                          <div className="font-semibold text-gray-900">{circle.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">
                            {circle.description || '暂无简介'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 ring-1 ring-purple-600/20">
                        🏷️ {circle.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-700">{circle.memberCount}</div>
                      <div className="text-xs text-gray-400 mt-0.5">成员</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-700">{circle.postCount}</div>
                      <div className="text-xs text-gray-400 mt-0.5">帖子</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {circle.user?.avatarCid && (
                          <img
                            src={getIPFSUrl(circle.user.avatarCid)}
                            alt={circle.user.username}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <UserDisplay
                            nickname={circle.user?.nickname}
                            username={circle.user?.username || '未知'}
                            size="sm"
                            layout="stack"
                            className=""
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-700">{new Date(circle.createdAt).toLocaleDateString('zh-CN')}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{new Date(circle.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteCircle(circle.id)}
                        className="!rounded-lg !font-semibold"
                      >
                        🗑️ 删除
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
