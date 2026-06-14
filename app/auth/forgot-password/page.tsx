'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Step 1: Send verification code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) { setErrors({ email: '请输入有效邮箱' }); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStep('code');
        setErrors({});
      } else {
        const data = await res.json().catch(() => ({}));
        setErrors({ email: data.message || '发送失败' });
      }
    } catch {
      setErrors({ email: '网络错误' });
    } finally { setLoading(false); }
  };

  // Step 2: Verify code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) { setErrors({ code: '请输入6位验证码' }); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      if (res.ok) {
        const data = await res.json();
        setResetToken(data.resetToken);
        setStep('password');
        setErrors({});
      } else {
        const data = await res.json().catch(() => ({}));
        setErrors({ code: data.message || '验证码错误' });
      }
    } catch {
      setErrors({ code: '网络错误' });
    } finally { setLoading(false); }
  };

  // Step 3: Set new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { setErrors({ password: '密码至少8位，包含字母和数字' }); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      if (res.ok) {
        router.push('/auth/sign-in?reset=success');
      } else {
        const data = await res.json().catch(() => ({}));
        setErrors({ password: data.message || '重置失败' });
      }
    } catch {
      setErrors({ password: '网络错误' });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] py-12 px-4">
      <div className="w-full max-w-md animate-fadeIn">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">找回密码</h1>
          <p className="text-gray-500 text-base">
            {step === 'email' && '输入注册邮箱以接收验证码'}
            {step === 'code' && '输入发送到邮箱的6位验证码'}
            {step === 'password' && '设置新的登录密码'}
          </p>
        </div>

        <Card className="p-8 shadow-sm border-gray-200">
          {/* Progress steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {['email', 'code', 'password'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === s ? 'bg-[#6364FF] text-white' :
                  ['email', 'code', 'password'].indexOf(step) > i ? 'bg-green-100 text-green-600' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {['email', 'code', 'password'].indexOf(step) > i ? '✓' : i + 1}
                </div>
                {i < 2 && <div className="w-8 h-0.5 bg-gray-200" />}
              </div>
            ))}
          </div>

          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-5">
              <Input
                label="注册邮箱"
                name="email"
                type="email"
                placeholder="输入你的注册邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
              />
              <Button type="submit" variant="primary" size="lg" isLoading={loading} className="w-full !rounded-xl">
                发送验证码
              </Button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <p className="text-sm text-gray-500">验证码已发送至 <strong>{email}</strong></p>
              <Input
                label="验证码"
                name="code"
                type="text"
                placeholder="6位数字"
                value={code}
                onChange={(e) => setCode(e.target.value.slice(0, 6))}
                error={errors.code}
                maxLength={6}
              />
              <Button type="submit" variant="primary" size="lg" isLoading={loading} className="w-full !rounded-xl">
                验证
              </Button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <Input
                label="新密码"
                name="password"
                type="password"
                placeholder="至少8位，包含字母和数字"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={errors.password}
                helperText="密码长度至少8位，需包含字母和数字"
              />
              <Button type="submit" variant="primary" size="lg" isLoading={loading} className="w-full !rounded-xl">
                重置密码
              </Button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <Link href="/auth/sign-in" className="text-sm text-[#6364FF] hover:underline">
              ← 返回登录
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
