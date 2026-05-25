'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { toast } from '@/lib/toast';


interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'user' | 'post' | 'circle' | 'article' | 'moment';
  targetId: number;
  targetName?: string;
}

const REPORT_REASONS = [
  { value: 'spam', label: '垃圾信息/广告' },
  { value: 'harassment', label: '骚扰/欺凌' },
  { value: 'inappropriate', label: '不当内容' },
  { value: 'violence', label: '暴力/仇恨言论' },
  { value: 'copyright', label: '侵犯版权' },
  { value: 'other', label: '其他' },
];

export default function ReportModal({
  isOpen,
  onClose,
  type,
  targetId,
  targetName,
}: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const getTypeLabel = () => {
    switch (type) {
      case 'user': return '用户';
      case 'post': return '帖子';
      case 'circle': return '圈子';
      case 'article': return '文章';
      case 'moment': return '动态';
      default: return '内容';
    }
  };

  const handleSubmit = async () => {
    if (!reason) {
      toast.warning('请选择举报原因');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';

      switch (type) {
        case 'user':
          endpoint = `/api/users/${targetId}/report`;
          break;
        case 'post':
          endpoint = `/api/content/posts/${targetId}/report`;
          break;
        case 'article':
          endpoint = `/api/content/articles/${targetId}/report`;
          break;
        case 'moment':
          endpoint = `/api/content/moments/${targetId}/report`;
          break;
        case 'circle':
          endpoint = `/api/content/circles/${targetId}/report`;
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason, description }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setReason('');
          setDescription('');
        }, 1500);
      } else {
        const error = await response.json();
        toast.error(error.message || '举报失败');
      }
    } catch (error) {
      console.error('举报失败:', error);
      toast.error('举报失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold">举报{getTypeLabel()}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="text-green-500 text-5xl mb-4">✓</div>
              <p className="text-lg font-medium">举报成功</p>
              <p className="text-gray-500 text-sm mt-2">我们会尽快处理您的举报</p>
            </div>
          ) : (
            <div className="space-y-4">
              {targetName && (
                <div>
                  <label className="text-sm text-gray-500">举报对象</label>
                  <p className="font-medium">{targetName}</p>
                </div>
              )}

              <div>
                <label className="text-sm text-gray-500 block mb-2">举报原因 *</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择举报原因</option>
                  {REPORT_REASONS.map((r) => (
                    <option key={r.value} value={r.label}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-500 block mb-2">详细描述（可选）</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="请描述具体情况..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="pt-4 border-t flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={onClose}
                  disabled={loading}
                >
                  取消
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={loading || !reason}
                >
                  {loading ? '提交中...' : '提交举报'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
