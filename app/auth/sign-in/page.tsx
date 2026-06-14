/**
 * 用户登录页面组件
 *
 * 文件功能说明：
 * - 提供用户身份认证的登录界面
 * - 支持用户名+密码的基础认证方式
 * - 集成双因素认证（MFA/2FA）安全机制
 * - 实现表单验证和错误提示功能
 * - 登录成功后自动跳转到首页
 *
 * 页面路由：/auth/sign-in
 * 认证流程：
 * ┌─────────────────────────────────────────────────────┐
 * │ 1. 输入用户名和密码                                 │
 * │    ↓                                                │
 * │ 2. 前端Zod验证（格式校验）                         │
 * │    ↓                                                │
 * │ 3. 调用login()函数发送API请求                      │
 * │    ↓                                                │
 * │ 4a. 成功 → 存储Token → 跳转首页                    │
 * │ 4b. 需要MFA → 显示MFA输入框                        │
 * │ 4c. 失败 → 显示错误信息                            │
 * └─────────────────────────────────────────────────────┘
 *
 * 安全特性：
 * ✅ 密码字段使用type="password"隐藏输入
 * ✅ 表单数据经过Zod schema验证
 * ✅ 支持MFA双因素认证（可选启用）
 * ✅ 错误信息不泄露敏感细节
 * ✅ 防止重复提交（loading状态控制）
 *
 * UI组件组成：
 * - Card: 卡片容器，提供阴影和边框样式
 * - Input: 输入框组件，支持错误状态显示
 * - Button: 提交按钮，支持加载状态
 *
 * @module SignInPage
 * @version 2.0.0
 * @requires React Hooks (useState)
 * @requires Next.js Router (useRouter)
 * @requires useAuth 认证上下文钩子
 * @requires Zod 表单验证库
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { loginSchema, validateSchema } from '@/lib/validation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import GitHubLoginButton from '@/components/auth/GitHubLoginButton';

/**
 * 登录页面主组件
 *
 * @function SignInPage
 * @returns {JSX.Element} 渲染的登录表单UI
 *
 * @description 这是应用的入口页面之一，
 * 负责处理用户的身份验证流程。
 *
 * 组件状态说明：
 * - requireMfa: 控制是否显示MFA验证码输入框
 * - formData: 存储表单所有字段的值
 * - errors: 存储各字段的验证错误信息
 * - loading: 控制提交按钮的禁用状态和加载动画
 */
export default function SignInPage() {
  /**
   * Next.js路由器实例
   *
   * @constant {useRouter} router
   * @description 用于编程式导航，登录成功后跳转到首页
   */
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (error === 'github_auth_failed') {
      setErrors({ submit: 'GitHub 登录失败，请重试或使用用户名密码登录' });
    } else if (error === 'account_frozen') {
      setErrors({ submit: '该账号已被冻结，请联系管理员' });
    }
  }, []);

  /**
   * 本地状态定义
   *
   * @state {boolean} requireMfa - 是否需要双因素认证
   *   - false: 正常登录流程（默认）
   *   - true: 后端返回requireMfa标志，需输入MFA验证码
   *
   * @state {Object} formData - 表单数据对象
   *   - username: 用户名（必填）
   *   - password: 密码（必填）
   *   - mfaToken: MFA验证码（条件必填）
   *
   * @state {Object} errors - 字段级错误信息
   *   - key: 字段名（username/password/mfaToken/submit）
   *   - value: 错误提示文本
   *
   * @state {boolean} loading - 提交加载状态
   *   - true: 请求进行中，按钮禁用并显示加载动画
   *   - false: 空闲状态，可以提交表单
   */
  const [loginMode, setLoginMode] = useState<'password' | 'code'>('password');
  const [requireMfa, setRequireMfa] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', mfaToken: '', email: '', code: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);

  /**
   * 表单输入变更处理器
   *
   * @function handleChange
   * @param {React.ChangeEvent<HTMLInputElement>} e - 输入事件对象
   * @returns {void}
   *
   * @description 处理所有input元素的onChange事件
   *
   * 执行逻辑：
   * 1. 从事件对象解构出name和value
   * 2. 清除该字段的现有错误信息（用户体验优化）
   * 3. 更新formData中对应字段的值
   *
   * @example
   * // 当用户输入用户名时触发
   * // e.target.name = "username"
   * // e.target.value = "john_doe"
   * // 结果：formData.username = "john_doe", errors.username = ""
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: '' }));
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * 表单提交处理器
   *
   * @async
   * @function handleSubmit
   * @param {React.FormEvent} e - 表单提交事件
   * @returns {Promise<void>}
   *
   * @description 处理登录表单的完整提交流程
   *
   * 执行步骤：
   *
   * **步骤1：阻止默认表单提交行为**
   * - 使用e.preventDefault()防止页面刷新
   *
   * **步骤2：条件性表单验证**
   * - 如果需要MFA（requireMfa === true）：
   *   - 仅验证mfaToken字段是否非空
   * - 如果不需要MFA（正常登录）：
   *   - 使用Zod schema验证username和password
   *   - 验证规则在lib/validation.ts的loginSchema中定义
   *
   * **步骤3：调用认证API**
   * - 设置loading为true，禁用提交按钮
   * - 调用useAuth提供的login()方法
   * - 传入username、password和可选的mfaToken
   *
   * **步骤4：处理响应结果**
   * - 情况A：需要MFA认证
   *   - 设置requireMfa为true，显示MFA输入框
   *   - 清除之前的错误信息
   *   - 重置loading状态
   * - 情况B：登录成功
   *   - 使用router.push('/')跳转到首页
   * - 情况C：登录失败
   *   - 捕获异常并设置submit字段错误
   *   - 显示友好的错误提示信息
   *
   * **步骤5：清理工作**
   * - 在finally块中重置loading状态
   * - 无论成功失败都执行，确保UI恢复正常
   *
   * @security 安全注意事项：
   * - 密码不会记录到日志或错误消息中
   * - MFA Token一次性使用，有效期短
   * - 错误信息模糊化，不透露具体原因
   *
   * @throws {Error} 网络错误或认证失败时抛出异常
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // 阻止浏览器默认的表单提交行为

    if (requireMfa) {
      // MFA模式：仅验证验证码是否已填写
      if (!formData.mfaToken) {
        setErrors({ mfaToken: '请输入双因素认证验证码' });
        return;
      }
    } else {
      // 正常模式：使用Zod schema进行完整的表单验证
      const validation = validateSchema(loginSchema, {
        username: formData.username,
        password: formData.password,
      });

      if (!validation.success) {
        // 验证失败，设置字段级错误信息
        setErrors(validation.errors || {});
        return; // 中止提交
      }
    }

    // 开始加载状态，防止重复提交
    setLoading(true);

    try {
      // 调用认证服务执行登录
      const result = await login(
        formData.username,
        formData.password,
        requireMfa ? formData.mfaToken : undefined, // 仅在MFA模式下传递验证码
      );

      // 检查是否需要MFA二次验证
      if (result && result.requireMfa) {
        setRequireMfa(true); // 切换到MFA输入界面
        setErrors({});       // 清除之前的错误
        setLoading(false);    // 重置加载状态
        return;              // 提前退出，等待用户输入MFA
      }

      // 登录成功：重定向到首页
      router.push('/');
    } catch (error: any) {
      // 登录失败：显示错误提示
      // error.message来自后端API的错误响应
      // 如果没有message则使用默认错误文本
      setErrors({
        submit: error.message || '登录失败，请检查用户名和密码',
      });
    } finally {
      // 无论成功或失败，都重置加载状态
      setLoading(false);
    }
  };

  // 发送邮箱验证码
  const handleSendCode = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      setErrors({ email: '请输入有效的邮箱地址' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-login-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      if (res.ok) {
        setCodeSent(true);
        setCodeCountdown(60);
        const timer = setInterval(() => {
          setCodeCountdown((prev) => {
            if (prev <= 1) { clearInterval(timer); return 0; }
            return prev - 1;
          });
        }, 1000);
        setErrors({});
      } else {
        const data = await res.json().catch(() => ({}));
        setErrors({ email: data.message || '发送失败' });
      }
    } catch {
      setErrors({ email: '网络错误，请重试' });
    } finally {
      setLoading(false);
    }
  };

  // 验证码登录
  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || formData.code.length !== 6) {
      setErrors({ code: '请输入6位验证码' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login-with-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: formData.code }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('userId', String(data.user.id));
        document.cookie = `token=${data.accessToken}; path=/; max-age=604800; SameSite=Lax`;
        router.push('/');
      } else {
        const data = await res.json().catch(() => ({}));
        setErrors({ code: data.message || '验证码错误' });
      }
    } catch {
      setErrors({ code: '网络错误，请重试' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] py-12 px-4">
      <div className="w-full max-w-md animate-fadeIn">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">欢迎回来</h1>
          <p className="text-gray-500 text-base">登录到 DeSocial</p>
        </div>

        <Card className="p-8 shadow-sm border-gray-200">
          {/* 登录方式切换 */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => { setLoginMode('password'); setErrors({}); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                loginMode === 'password' ? 'bg-white text-[#6364FF] shadow-sm' : 'text-gray-500'
              }`}
            >
              密码登录
            </button>
            <button
              type="button"
              onClick={() => { setLoginMode('code'); setErrors({}); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                loginMode === 'code' ? 'bg-white text-[#6364FF] shadow-sm' : 'text-gray-500'
              }`}
            >
              验证码登录
            </button>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-start gap-3 animate-slideDown">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{errors.submit}</span>
            </div>
          )}

          {loginMode === 'password' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {!requireMfa ? (
                <>
                  <Input
                    label="用户名或邮箱"
                    name="username"
                    type="text"
                    placeholder="输入你的用户名或邮箱"
                    value={formData.username}
                    onChange={handleChange}
                    error={errors.username}
                  />

                  <div>
                    <Input
                      label="密码"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      error={errors.password}
                    />
                    <div className="text-right mt-1">
                      <Link href="/auth/forgot-password" className="text-xs text-[#6364FF] hover:underline">
                        忘记密码？
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-[#F0EFFF] border border-[#6364FF]/20 text-[#6364FF] px-4 py-4 rounded-xl mb-6 flex items-center gap-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="font-medium">双因素认证已启用，请输入验证码</span>
                </div>
              )}

              {requireMfa && (
                <Input
                  label="验证码"
                  name="mfaToken"
                  type="text"
                  placeholder="000000"
                  value={formData.mfaToken}
                  onChange={handleChange}
                  error={errors.mfaToken}
                  helperText="请打开 Google Authenticator 获取 6 位验证码"
                />
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={loading}
                className="w-full !rounded-xl shadow-md hover:shadow-lg"
              >
                登录
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCodeLogin} className="space-y-5">
              <Input
                label="邮箱地址"
                name="email"
                type="email"
                placeholder="输入你的注册邮箱"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
              />

              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    label="验证码"
                    name="code"
                    type="text"
                    placeholder="6位数字"
                    value={formData.code}
                    onChange={handleChange}
                    error={errors.code}
                    maxLength={6}
                  />
                </div>
                <div className="pt-7">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSendCode}
                    disabled={codeCountdown > 0 || loading}
                    className="!rounded-lg whitespace-nowrap"
                  >
                    {codeCountdown > 0 ? `${codeCountdown}s` : codeSent ? '重新发送' : '获取验证码'}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={loading}
                className="w-full !rounded-xl shadow-md hover:shadow-lg"
              >
                登录
              </Button>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-400">或</span>
              </div>
            </div>
            <div className="mt-4">
              <GitHubLoginButton />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center space-y-4">
            <p className="text-sm text-gray-600">
              还没有账户？
              <Link href="/auth/sign-up" className="text-[#6364FF] hover:text-[#5558DD] font-semibold ml-1 transition-colors duration-200">
                立即注册 →
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

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            继续使用即表示你同意我们的
            <span className="text-gray-500 mx-1 cursor-default">服务条款</span>
            和
            <span className="text-gray-500 mx-1 cursor-default">隐私政策</span>
          </p>
        </div>
      </div>
    </div>
  );
}
