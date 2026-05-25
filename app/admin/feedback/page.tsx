'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import { getIPFSUrl } from '@/lib/ipfs';
import { toast } from '@/lib/toast';


interface Report {
  id: number;
  type: 'user' | 'post' | 'circle';
  targetId: number;
  reason: string;
  description?: string;
  status: 'pending' | 'processing' | 'resolved';
  reporterId: number;
  reporter?: {
    id: number;
    username: string;
    avatarCid?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function FeedbackPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'user' | 'post' | 'circle'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'processing' | 'resolved'>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/reports`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setReports(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('获取举报列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: number, newStatus: Report['status']) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        fetchReports();
        toast.success('状态已更新');
      } else {
        const error = await response.json();
        toast.error(error.message || '更新失败');
      }
    } catch (error) {
      console.error('更新状态失败:', error);
      toast.error('更新失败');
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.reporter?.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || report.type === filterType;
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'user': return '用户举报';
      case 'post': return '内容举报';
      case 'article': return '文章举报';
      case 'moment': return '动态举报';
      case 'circle': return '圈子举报';
      default: return '其他';
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
        <h1 className="text-3xl font-bold mb-2">反馈与投诉</h1>
        <p className="text-white/80 text-lg">处理用户的举报和建议</p>
      </div>

      <div className="grid grid-cols-4 gap-5">
        {[
          { label: '总举报数', value: reports.length, icon: '📋', gradient: 'from-blue-500 to-cyan-500' },
          { label: '待处理', value: reports.filter(f => f.status === 'pending').length, icon: '⏳', gradient: 'from-red-500 to-orange-500' },
          { label: '处理中', value: reports.filter(f => f.status === 'processing').length, icon: '🔄', gradient: 'from-yellow-500 to-orange-500' },
          { label: '已解决', value: reports.filter(f => f.status === 'resolved').length, icon: '✅', gradient: 'from-green-500 to-emerald-500' }
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
              placeholder="搜索举报原因或举报人..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 !pl-11 !rounded-xl"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6364FF]/50 focus:border-[#6364FF] bg-white font-medium text-gray-700 hover:border-gray-300 transition-colors cursor-pointer"
          >
            <option value="all">📋 所有类型</option>
            <option value="user">👤 用户举报</option>
            <option value="post">📝 内容举报</option>
            <option value="circle">🌐 圈子举报</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6364FF]/50 focus:border-[#6364FF] bg-white font-medium text-gray-700 hover:border-gray-300 transition-colors cursor-pointer"
          >
            <option value="all">📋 所有状态</option>
            <option value="pending">⏳ 待处理</option>
            <option value="processing">🔄 处理中</option>
            <option value="resolved">✅ 已解决</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 px-1">
          <span>共找到 <strong className="text-gray-900">{filteredReports.length}</strong> 条举报</span>
          <span className="bg-gray-100 px-3 py-1 rounded-full font-medium">
            {filterStatus === 'all' ? '全部状态' : filterStatus === 'pending' ? '待处理' : filterStatus === 'processing' ? '处理中' : '已解决'}
          </span>
        </div>
      </Card>

      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">举报类型</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">举报原因</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">举报人</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">状态</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">举报时间</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-600 font-semibold text-lg mb-1">暂无举报数据</p>
                    <p className="text-gray-400 text-sm">所有举报都会在这里显示</p>
                  </td>
                </tr>
              ) : (
                filteredReports.map(report => (
                  <tr key={report.id} className="border-b border-gray-100 hover:bg-[#F0EFFF]/30 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                        report.type === 'user' ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-600/20' :
                        report.type === 'circle' ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-600/20' :
                        'bg-orange-100 text-orange-700 ring-1 ring-orange-600/20'
                      }`}>
                        {report.type === 'user' && '👤'}
                        {report.type === 'circle' && '🌐'}
                        {report.type === 'post' && '📝'}
                        {getTypeLabel(report.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{report.reason}</div>
                      {report.description && (
                        <div className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{report.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar src={getIPFSUrl(report.reporter?.avatarCid)} name={report.reporter?.username || '?'} size="sm" className="!rounded-lg" />
                        <span className="font-medium text-gray-700">@{report.reporter?.username || '未知'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                        report.status === 'pending' ? 'bg-red-100 text-red-700 ring-1 ring-red-600/20' :
                        report.status === 'processing' ? 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-600/20' :
                        'bg-green-100 text-green-700 ring-1 ring-green-600/20'
                      }`}>
                        {report.status === 'pending' && '⏳ 待处理'}
                        {report.status === 'processing' && '🔄 处理中'}
                        {report.status === 'resolved' && '✅ 已解决'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-700">{new Date(report.createdAt).toLocaleDateString('zh-CN')}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{new Date(report.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={report.status}
                          onChange={(e) => handleUpdateStatus(report.id, e.target.value as any)}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6364FF]/50 focus:border-[#6364FF] bg-white cursor-pointer"
                        >
                          <option value="pending">待处理</option>
                          <option value="processing">处理中</option>
                          <option value="resolved">已解决</option>
                        </select>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedReport(report)}
                          className="!rounded-lg !font-semibold"
                        >
                          📋 详情
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <Card className="max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto border-gray-200 shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-gray-900">举报详情</h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                    selectedReport.type === 'user' ? 'bg-blue-100 text-blue-700' :
                    selectedReport.type === 'circle' ? 'bg-purple-100 text-purple-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {getTypeLabel(selectedReport.type)}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                    selectedReport.status === 'pending' ? 'bg-red-100 text-red-700' :
                    selectedReport.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {selectedReport.status === 'pending' && '⏳ 待处理'}
                    {selectedReport.status === 'processing' && '🔄 处理中'}
                    {selectedReport.status === 'resolved' && '✅ 已解决'}
                  </span>
                </div>

                <div>
                  <label className="text-sm text-gray-500 font-medium">举报原因</label>
                  <p className="font-semibold text-gray-900 mt-1">{selectedReport.reason}</p>
                </div>

                {selectedReport.description && (
                  <div>
                    <label className="text-sm text-gray-500 font-medium">详细描述</label>
                    <p className="font-medium text-gray-700 mt-1 bg-gray-50 p-3 rounded-xl">{selectedReport.description}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm text-gray-500 font-medium">举报人</label>
                  <div className="flex items-center gap-3 mt-1">
                    <Avatar src={getIPFSUrl(selectedReport.reporter?.avatarCid)} name={selectedReport.reporter?.username || '?'} size="md" className="!rounded-xl" />
                    <span className="font-semibold text-gray-900">@{selectedReport.reporter?.username || '未知'}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-500 font-medium">举报时间</label>
                  <p className="font-medium text-gray-700 mt-1">{new Date(selectedReport.createdAt).toLocaleString('zh-CN')}</p>
                </div>

                {selectedReport.type === 'post' && (
                  <div>
                    <label className="text-sm text-gray-500 font-medium">原内容</label>
                    <div className="mt-1">
                      <a
                        href={`/content/${selectedReport.targetId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#6364FF] hover:underline font-semibold"
                      >
                        🔗 查看原内容
                      </a>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100 flex gap-3">
                  <Button
                    variant="secondary"
                    className="flex-1 !rounded-xl !font-semibold"
                    onClick={() => setSelectedReport(null)}
                  >
                    关闭
                  </Button>
                  {selectedReport.status !== 'resolved' && (
                    <Button
                      variant="primary"
                      className="flex-1 !rounded-xl !font-semibold"
                      onClick={() => {
                        handleUpdateStatus(selectedReport.id, 'resolved');
                        setSelectedReport(null);
                      }}
                    >
                      ✅ 标记为已解决
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
