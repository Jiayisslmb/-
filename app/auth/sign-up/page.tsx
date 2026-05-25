'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { registerSchema, validateSchema } from '@/lib/validation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function SignUpPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    captchaAnswer: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [captcha, setCaptcha] = useState<{ key: string; question: string } | null>(null);
  const [captchaLoading, setCaptchaLoading] = useState(true);

  const fetchCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/captcha`);
      if (response.ok) {
        const data = await response.json();
        setCaptcha({ key: data.key, question: data.question });
      }
    } catch (error) {
      console.error('获取验证码失败:', error);
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: '' }));
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const validation = validateSchema(registerSchema, {
      username: formData.username,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });

    if (!validation.success) {
      Object.assign(newErrors, validation.errors || {});
    }

    if (!formData.nickname || formData.nickname.trim().length < 1) {
      newErrors.nickname = '请输入昵称';
    } else if (formData.nickname.length > 20) {
      newErrors.nickname = '昵称长度不能超过20个字符';
    }

    if (!agreeTerms) {
      newErrors.terms = '请同意服务条款和隐私政策';
    }

    if (!captcha) {
      newErrors.submit = '请等待验证码加载完成';
    } else if (!formData.captchaAnswer) {
      newErrors.captcha = '请输入验证码';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await register({
        username: formData.username,
        nickname: formData.nickname,
        password: formData.password,
        captchaKey: captcha!.key,
        captchaAnswer: formData.captchaAnswer,
      } as any);
      router.push('/');
    } catch (error: any) {
      const errorMessage = error.message || '注册失败，请稍后重试';
      setErrors({ submit: errorMessage });
      fetchCaptcha();
      setFormData(prev => ({ ...prev, captchaAnswer: '' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] py-12 px-4">
      <div className="w-full max-w-md animate-fadeIn">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">加入 DeSocial</h1>
          <p className="text-gray-500 text-base">创建你的去中心化身份</p>
        </div>

        <Card className="p-8 shadow-sm border-gray-200">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-start gap-3 animate-slideDown">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{errors.submit}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="用户名"
              name="username"
              type="text"
              placeholder="输入用户名"
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
              helperText="3-20个字符，支持字母、数字和下划线，不可修改"
            />

            <Input
              label="昵称"
              name="nickname"
              type="text"
              placeholder="输入昵称"
              value={formData.nickname}
              onChange={handleChange}
              error={errors.nickname}
              helperText="用于展示的名称，可以随时修改"
            />

            <Input
              label="密码"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              helperText="至少6个字符，建议使用字母、数字和符号组合"
            />

            <Input
              label="确认密码"
              name="confirmPassword"
              type="password"
              placeholder="再次输入密码"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
            />

            <div>
              {captchaLoading ? (
                <div className="h-16 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 text-gray-400">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>加载验证码...</span>
                  </div>
                </div>
              ) : captcha ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-gray-700">验证码</label>
                    <button
                      type="button"
                      onClick={fetchCaptcha}
                      className="text-xs text-[#6364FF] hover:text-[#5558DD] font-medium transition-colors duration-200 flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      刷新
                    </button>
                  </div>
                  <div className="bg-gradient-to-r from-[#F0EFFF] to-[#EDE9FE] px-4 py-3 rounded-xl border border-[#6364FF]/10 font-mono font-bold text-[#6364FF] text-center select-none">
                    {captcha.question}
                  </div>
                  <Input
                    name="captchaAnswer"
                    type="number"
                    placeholder="输入计算结果"
                    value={formData.captchaAnswer}
                    onChange={handleChange}
                    error={errors.captcha}
                  />
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-xl flex items-center justify-between">
                  <span className="text-red-600 text-sm font-medium">验证码加载失败</span>
                  <button
                    type="button"
                    onClick={fetchCaptcha}
                    className="text-xs text-[#6364FF] hover:text-[#5558DD] font-semibold transition-colors duration-200"
                  >
                    重试
                  </button>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded-md border-gray-300 text-[#6364FF] focus:ring-[#6364FF] focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-900 transition-colors duration-200">
                  我已阅读并同意
                  <span className="text-gray-500 font-semibold mx-1 cursor-default">服务条款</span>
                  和
                  <span className="text-gray-500 font-semibold mx-1 cursor-default">隐私政策</span>
                </span>
              </label>
              {errors.terms && (
                <p className="text-red-500 text-sm mt-2 ml-8 animate-slideDown">{errors.terms}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full !rounded-xl shadow-md hover:shadow-lg"
            >
              创建账户
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center space-y-4">
            <p className="text-sm text-gray-600">
              已有账户？
              <Link href="/auth/sign-in" className="text-[#6364FF] hover:text-[#5558DD] font-semibold ml-1 transition-colors duration-200">
                立即登录 →
              </Link>
            </p>
            <Link 
              href="/" 
              className="block text-sm text-gray-500 hover:text-[#6364FF] transition-colors duration-200"
            >
              ← 返回首页
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
