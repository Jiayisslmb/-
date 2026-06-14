//用户管理页

'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import { useAuth } from '@/lib/auth';
import { getIPFSUrl } from '@/lib/ipfs';
import UserDisplay from '@/components/common/UserDisplay';
import { toast } from '@/lib/toast';


interface User {
  id: number;
  username: string;
  nickname?: string;
  avatarCid?: string;
  bio?: string;
  isAdmin: boolean;
  isFrozen: boolean;
  createdAt: string;
  lastActivity?: string;
}

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'frozen'>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFreezeUser = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}/freeze`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        fetchUsers();
        toast.success('用户已冻结');
      } else {
        const error = await response.json();
        toast.error(error.message || '操作失败');
      }
    } catch (error) {
      console.error('冻结用户失败:', error);
      toast.error('操作失败');
    }
  };

  const handleUnfreezeUser = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}/unfreeze`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        fetchUsers();
        toast.success('用户已解冻');
      } else {
        const error = await response.json();
        toast.error(error.message || '操作失败');
      }
    } catch (error) {
      console.error('解冻用户失败:', error);
      toast.error('操作失败');
    }
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = user.username.toLowerCase().includes(query) ||
                         (user.nickname && user.nickname.toLowerCase().includes(query));
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'active' && !user.isFrozen) ||
                         (filterStatus === 'frozen' && user.isFrozen);
    return matchesSearch && matchesFilter;
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
        <h1 className="text-3xl font-bold mb-2">用户管理</h1>
        <p className="text-white/80 text-lg">管理平台用户账号，处理违规账户</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        {[
          { label: '总用户数', value: users.length, icon: '👥', gradient: 'from-blue-500 to-cyan-500' },
          { label: '活跃用户', value: users.filter(u => !u.isFrozen).length, icon: '✨', gradient: 'from-green-500 to-emerald-500' },
          { label: '管理员', value: users.filter(u => u.isAdmin).length, icon: '🛡️', gradient: 'from-purple-500 to-pink-500' },
          { label: '已冻结', value: users.filter(u => u.isFrozen).length, icon: '❄️', gradient: 'from-red-500 to-orange-500' }
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
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              placeholder="搜索用户名或关键词..."
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
            <option value="active">✅ 活跃</option>
            <option value="frozen">❄️ 已冻结</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 px-1">
          <span>共找到 <strong className="text-gray-900">{filteredUsers.length}</strong> 位用户</span>
          <span className="bg-gray-100 px-3 py-1 rounded-full font-medium">
            {filterStatus === 'all' ? '全部状态' : filterStatus === 'active' ? '活跃用户' : '已冻结'}
          </span>
        </div>
      </Card>

      {/* 用户列表 */}
      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">用户信息</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">加入时间</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">状态</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-600 font-semibold text-lg mb-1">暂无用户数据</p>
                    <p className="text-gray-400 text-sm">尝试调整筛选条件或搜索关键词</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-[#F0EFFF]/30 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={getIPFSUrl(user.avatarCid)} name={user.nickname || user.username} size="md" className="!rounded-xl ring-2 ring-gray-100" />
                        <div>
                          <div className="flex items-center gap-2">
                            <UserDisplay
                              nickname={user.nickname}
                              username={user.username}
                              size="sm"
                              layout="stack"
                              className=""
                            />
                            {user.isAdmin && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full ring-1 ring-purple-600/20">
                                🛡️ 管理员
                              </span>
                            )}
                          </div>
                          {user.bio && (
                            <div className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{user.bio}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-700">{new Date(user.createdAt).toLocaleDateString('zh-CN')}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{new Date(user.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                        user.isFrozen 
                          ? 'bg-red-100 text-red-700 ring-1 ring-red-600/20' 
                          : 'bg-green-100 text-green-700 ring-1 ring-green-600/20'
                      }`}>
                        {user.isFrozen ? <>❄️ 已冻结</> : <>✅ 活跃</>}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.id.toString() !== currentUser?.id ? (
                        user.isFrozen ? (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleUnfreezeUser(user.id)}
                            className="!rounded-lg !font-semibold"
                          >
                            🔓 解冻
                          </Button>
                        ) : (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleFreezeUser(user.id)}
                            className="!rounded-lg !font-semibold"
                          >
                            ❄️ 冻结
                          </Button>
                        )
                      ) : (
                        <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">当前账号</span>
                      )}
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
