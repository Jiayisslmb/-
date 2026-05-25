//内容管理页

'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/lib/auth';
import { toast } from '@/lib/toast';


interface Content {
  id: number;
  uniqueKey: string;
  title?: string;
  content: string;
  user?: {
    id: number;
    username: string;
    nickname?: string;
  };
  author?: {
    id: number;
    username: string;
    nickname?: string;
  };
  type: 'post' | 'article' | 'moment';
  createdAt: string;
  isDeleted: boolean;
}

export default function ContentManagementPage() {
  const { user } = useAuth();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'removed'>('all');

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/posts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const posts = await response.json();
        
        const articlesResponse = await fetch(`/api/admin/articles`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (articlesResponse.ok) {
          const articles = await articlesResponse.json();
          
          // 合并动态和文章
          const allContents = [
            ...(Array.isArray(posts) ? posts.map((p: any) => ({ ...p, type: 'moment' as const, uniqueKey: `moment-${p.id}` })) : []),
            ...(Array.isArray(articles) ? articles.map((a: any) => ({ ...a, type: 'article' as const, uniqueKey: `article-${a.id}` })) : [])
          ];
          
          setContents(allContents);
        }
      }
    } catch (error) {
      console.error('获取内容列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveContent = async (contentId: number, type: 'post' | 'article' | 'moment') => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = (type === 'post' || type === 'moment')
        ? `/api/admin/posts/${contentId}` 
        : `/api/admin/articles/${contentId}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        fetchContents();
        toast.success('内容已删除');
      } else {
        const error = await response.json();
        toast.error(error.message || '删除失败');
      }
    } catch (error) {
      console.error('删除内容失败:', error);
      toast.error('删除失败');
    }
  };

  const filteredContents = contents.filter(content => {
    const matchesSearch = (content.title || content.content).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'published' && !content.isDeleted) ||
                         (filterStatus === 'removed' && content.isDeleted);
    return matchesSearch && matchesFilter;
  });

  const handleRestoreContent = async (contentId: number, type: 'post' | 'article' | 'moment') => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = (type === 'post' || type === 'moment')
        ? `/api/admin/posts/${contentId}/restore` 
        : `/api/admin/articles/${contentId}/restore`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        fetchContents();
        toast.success('内容已恢复');
      } else {
        const error = await response.json();
        toast.error(error.message || '恢复失败');
      }
    } catch (error) {
      console.error('恢复内容失败:', error);
      toast.error('恢复失败');
    }
  };

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
        <h1 className="text-3xl font-bold mb-2">内容管理</h1>
        <p className="text-white/80 text-lg">审核用户发布的动态和文章，删除违规内容</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-5">
        {[
          { label: '总内容数', value: contents.length, icon: '📊', gradient: 'from-blue-500 to-cyan-500' },
          { label: '已发布', value: contents.filter(c => !c.isDeleted).length, icon: '✅', gradient: 'from-green-500 to-emerald-500' },
          { label: '待审核', value: 0, icon: '⏳', gradient: 'from-yellow-500 to-orange-500' },
          { label: '已删除', value: contents.filter(c => c.isDeleted).length, icon: '🗑️', gradient: 'from-red-500 to-pink-500' }
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

      {/* 搜索和过滤 */}
      <Card className="border-gray-200 shadow-sm p-6 bg-gradient-to-br from-white to-[#FAFBFF]">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              placeholder="搜索内容标题或关键词..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 !pl-11 !rounded-xl"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6364FF]/50 focus:border-[#6364FF] bg-white font-medium text-gray-700 hover:border-gray-300 transition-colors cursor-pointer"
          >
            <option value="all">📋 所有状态</option>
            <option value="published">✅ 已发布</option>
            <option value="flagged">⏳ 待审核</option>
            <option value="removed">🗑️ 已删除</option>
          </select>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500 px-1">
          <span>共找到 <strong className="text-gray-900">{filteredContents.length}</strong> 条记录</span>
          <span className="bg-gray-100 px-3 py-1 rounded-full font-medium">
            {filterStatus === 'all' ? '全部状态' : filterStatus === 'published' ? '已发布' : filterStatus === 'removed' ? '已删除' : '待审核'}
          </span>
        </div>
      </Card>

      {/* 内容列表 */}
      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">标题</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">作者</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">类型</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">状态</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">举报</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredContents.map(content => (
                <tr key={content.uniqueKey} className="border-b border-gray-100 hover:bg-[#F0EFFF]/30 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{content.title || '无标题'}</div>
                    <div className="text-xs text-gray-400 mt-1 truncate max-w-xs">{content.content.substring(0, 60)}...</div>
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const author = content.user || content.author;
                      if (!author) return <span className="text-gray-400">未知</span>;
                      const hasNickname = author.nickname && author.nickname !== author.username;
                      return hasNickname ? (
                        <div>
                          <div className="font-medium text-gray-900">{author.nickname}</div>
                          <div className="text-xs text-gray-500">@{author.username}</div>
                        </div>
                      ) : (
                        <span className="font-medium text-gray-900">@{author.username}</span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                      content.type === 'article' 
                        ? 'bg-purple-100 text-purple-700' 
                        : content.type === 'moment'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}>
                      {content.type === 'article' && '📄'}
                      {content.type === 'moment' && '💬'}
                      {content.type === 'post' && '📝'}
                      {content.type === 'article' ? '文章' : content.type === 'moment' ? '动态' : '帖子'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                      !content.isDeleted 
                        ? 'bg-green-100 text-green-700 ring-1 ring-green-600/20' :
                        'bg-red-100 text-red-700 ring-1 ring-red-600/20'
                    }`}>
                      {!content.isDeleted ? (
                        <>✅ 已发布</>
                      ) : (
                        <>🗑️ 已删除</>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-400 font-medium">0</span>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    {!content.isDeleted && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveContent(content.id, content.type)}
                        className="!rounded-lg !font-semibold"
                      >
                        🗑️ 删除
                      </Button>
                    )}
                    {content.isDeleted && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleRestoreContent(content.id, content.type)}
                        className="!rounded-lg !font-semibold"
                      >
                        ✅ 恢复
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
