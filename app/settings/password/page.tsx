// 修改密码页面

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (errorMessage) setErrorMessage('');
    if (successMessage) setSuccessMessage('');
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.oldPassword) {
      newErrors.oldPassword = '请输入当前密码';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = '请输入新密码';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = '新密码至少需要6个字符';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认新密码';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('登录已过期，请重新登录');
        return;
      }

      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || '修改密码失败');
      }

      setSuccessMessage('密码修改成功');
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setErrors({});
    } catch (error: any) {
      setErrorMessage(error.message || '修改密码失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-2">修改密码</h1>
        <div className="mb-6 h-1 w-16 bg-gradient-to-r from-[#6364FF] to-[#8B83FF] rounded-full" />
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4 font-medium">请先登录</p>
          <Button variant="primary" onClick={() => router.push('/auth/sign-in')} className="!rounded-xl shadow-md hover:shadow-lg">
            前往登录
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-2">修改密码</h1>
      <div className="mb-6 h-1 w-16 bg-gradient-to-r from-[#6364FF] to-[#8B83FF] rounded-full" />
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-6 py-3 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-3 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-gray-100">
          <div className="p-6 space-y-3 hover:bg-gray-50/50 transition-colors duration-200">
            <label htmlFor="oldPassword" className="block text-sm font-bold text-gray-900 mb-1">
              当前密码
            </label>
            <Input
              id="oldPassword"
              name="oldPassword"
              type="password"
              value={formData.oldPassword}
              onChange={handleChange}
              placeholder="请输入当前密码"
              error={errors.oldPassword}
              helperText="请输入你当前使用的密码以验证身份"
            />
          </div>

          <div className="p-6 space-y-3 hover:bg-gray-50/50 transition-colors duration-200">
            <label htmlFor="newPassword" className="block text-sm font-bold text-gray-900 mb-1">
              新密码
            </label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="请输入新密码（至少6个字符）"
              error={errors.newPassword}
              helperText="密码长度至少6个字符，建议包含字母、数字和特殊字符"
            />
          </div>

          <div className="p-6 space-y-3 hover:bg-gray-50/50 transition-colors duration-200">
            <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-900 mb-1">
              确认新密码
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="请再次输入新密码"
              error={errors.confirmPassword}
              helperText="请确保两次输入的密码完全一致"
            />
          </div>

          <div className="p-6 bg-gray-50/50 flex gap-4">
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              isLoading={loading}
              className="flex-1 !rounded-xl shadow-md hover:shadow-lg"
            >
              修改密码
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1 !rounded-xl"
              onClick={() => router.back()}
            >
              取消
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
