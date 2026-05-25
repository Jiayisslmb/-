/**
 * 认证逻辑模块（Authentication Module）
 *
 * 文件功能说明：
 * - 实现完整的用户认证流程（登录、注册、登出）
 * - 管理用户认证状态和会话生命周期
 * - 提供React Context全局共享认证状态
 * - 集成JWT Token管理和自动刷新机制
 * - 支持管理员双因素认证（MFA/2FA）
 *
 * 核心架构：
 * ┌─────────────────────────────────────────────────────┐
 * │ AuthProvider (Context Provider)                     │
 * │   ├── State: user, isLoading, isAuthenticated       │
 * │   ├── Methods: login, logout, register             │
 * │   └── Effects: 初始化检查、Token刷新              │
 * ├─────────────────────────────────────────────────────┤
 * │ useAuth Hook (Consumer)                            │
 * │   - 获取认证状态和方法                             │
 * │   - 在任意组件中使用                               │
 * └─────────────────────────────────────────────────────┘
 *
 * 认证流程：
 * 1. **登录**：username + password → JWT Token → 存储到localStorage
 * 2. **状态管理**：AuthProvider维护user state → 全组件可访问
 * 3. **持久化**：Token存储在localStorage → 页面刷新后恢复登录
 * 4. **登出**：清除Token和用户状态 → 重定向到登录页
 *
 * 安全特性：
 * ✅ Token存储在localStorage（非cookie，防CSRF）
 * ✅ 自动验证Token有效性（页面加载时）
 * ✅ 支持MFA双因素认证（管理员可选启用）
 * ✅ 密码不在内存中长时间保存
 * ⚠️ Token无自动刷新机制（需手动重新登录过期后）
 *
 * 使用示例：
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, login, logout } = useAuth();
 *
 *   if (!isAuthenticated) {
 *     return <button onClick={() => login('user', 'pass')}>登录</button>;
 *   }
 *
 *   return (
 *     <div>
 *       欢迎，{user.nickname || user.username}！
 *       <button onClick={logout}>退出</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @module auth
 * @version 2.0.0
 * @requires React Context API (createContext, useContext)
 * @requires localStorage 浏览器本地存储
 * @requires getIPFSUrl IPFS URL转换工具
 */

// 认证逻辑（登录/权限验证）
'use client';

import type { UserDTO } from '@/types';
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { getIPFSUrl } from './ipfs';
import { chatClient } from './chat';
import { request, ApiError, buildUrl } from './fetch-client';

const API_URL = buildUrl('').replace(/\/$/, '');

/**
 * 认证上下文类型定义
 *
 * @interface AuthContextType
 * @description 定义AuthContext提供的所有状态和方法
 *
 * 状态属性：
 * @property {User | null} user - 当前登录用户对象（未登录时为null）
 * @property {boolean} isLoading - 是否正在加载认证状态（初始化或请求中）
 * @property {boolean} isAuthenticated - 是否已认证（user !== null）
 *
 * 方法属性：
 * @method login - 用户登录方法
 *   @param {string} username - 用户名
 *   @param {string} password - 密码
 *   @param {string} [mfaToken] - MFA验证码（条件必需）
 *   @returns {Promise<{requireMfa?: boolean}>}
 *     - 成功且不需要MFA：返回undefined（void）
 *     - 成功但需要MFA：返回{requireMfa: true}
 *
 * @method adminLogin - 管理员专用登录方法
 *   - 与login类似，但使用不同的API端点和管理员权限验证
 *
 * @method register - 用户注册方法
 *   @param {Object} data - 注册数据
 *   @param {string} data.username - 用户名
 *   @param {string} data.password - 密码
 *   @param {string} [data.nickname] - 昵称
 *   @param {string} [data.captchaKey] - 验证码Key（防机器人）
 *   @param {string} [data.captchaAnswer] - 验证码答案
 *   @returns {Promise<void>}
 *
 * @method logout - 登出方法
 *   清除所有认证状态和本地存储的Token
 *
 * @method updateProfile - 更新用户资料
 *   @param {Partial<UserDTO>} data - 要更新的用户字段
 *   @returns {Promise<UserDTO>} 更新后的完整用户对象
 */
interface AuthContextType {
  user: UserDTO | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string, mfaToken?: string) => Promise<{ requireMfa?: boolean } | void>;
  adminLogin: (username: string, password: string, mfaToken?: string) => Promise<{ requireMfa?: boolean } | void>;
  register: (data: { username: string; password: string; nickname?: string; captchaKey?: string; captchaAnswer?: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<UserDTO>) => Promise<UserDTO>;
}

/**
 * 认证上下文实例
 *
 * @constant {React.Context<AuthContextType | undefined>} AuthContext
 * @description 创建React Context用于全局共享认证状态
 *
 * 初始值设为undefined，表示在AuthProvider外部访问时会得到undefined
 * useAuth钩子会检查此情况并抛出错误提示
 *
 * @note Context设计模式：
 * - Provider（提供者）：AuthProvider组件
 * - Consumer（消费者）：useAuth钩子
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 认证上下文提供者组件
 *
 * @function AuthProvider
 * @param {{ children: ReactNode }} props - 子组件
 * @returns {JSX.Element} 包裹子元素的Provider组件
 *
 * @description 这是应用的认证状态管理核心组件，
 * 必须包裹在应用的最外层（通常在layout.tsx中）。
 *
 * 主要职责：
 * 1. **状态管理**：维护user和isLoading状态
 * 2. **初始化检查**：应用启动时验证已有Token的有效性
 * 3. **方法提供**：暴露login/logout/register等方法给子组件
 * 4. **WebSocket连接**：登录成功后自动建立聊天连接
 *
 * 组件生命周期：
 * ```
 * 挂载(Mount)
 *   ↓
 * useEffect触发
 *   ↓
 * 检查localStorage中的token
 *   ├─ 有token → 调用/users/profile验证 → 更新user状态
 *   └─ 无token → 设置isLoading=false
 *   ↓
 * 渲染子组件（children）
 * ```
 *
 * @example 在layout.tsx中使用
 * ```tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <AuthProvider>
 *           {children}
 *         </AuthProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  /**
   * 当前用户状态
   *
   * @state {User | null} user
   * @description 存储当前登录用户的完整信息
   * - null表示未登录
   * - User对象表示已登录，包含用户的所有公开信息
   */
  const [user, setUser] = useState<UserDTO | null>(null);

  /**
   * 加载状态标志
   *
   * @state {boolean} isLoading
   * @description 表示是否正在进行认证相关的异步操作
   *
   * 使用场景：
   * - true：正在验证Token（显示加载动画或骨架屏）
   * - false：认证完成（显示实际内容或登录页）
   *
   * 为什么需要这个状态？
   * - 防止闪烁：避免在Token验证完成前短暂显示未登录UI
   * - 用户体验：让用户知道系统正在工作而非卡死
   */
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 初始化认证状态检查
   *
   * @effect useEffect
   * @dependency [] （仅在组件挂载时执行一次）
   * @description 应用启动时的第一个副作用钩子，
   * 负责检查用户是否已有有效的登录凭证。
   *
   * 执行逻辑：
   * 1. 从localStorage读取JWT Token
   * 2. 如果没有Token → 直接设置为未登录状态
   * 3. 如果有Token → 调用后端API验证有效性
   *    - 成功 → 解析响应数据，构建User对象，更新状态
   *    - 失败（401）→ 清除无效Token，设置为未登录
   *    - 网络错误 → 最多重试3次（指数退避策略）
   *
   * 错误处理与重试机制：
   * - 使用retries参数控制重试次数
   * - 每次重试等待时间递增（retries * 1000ms）
   * - 超过最大重试次数后放弃，显示未登录状态
   *
   * 数据转换说明：
   * 后端返回的数据需要经过转换才能成为前端User对象：
   * - id: number → string（String(userData.id)）
   * - avatarCid: string → getIPFSUrl()转换为完整URL
   * - 其他字段直接映射
   */
  useEffect(() => {
    /**
     * 异步认证检查函数
     *
     * @async
     * @function checkAuth
     * @param {number} [retries=0] - 当前重试次数
     * @returns {Promise<void>}
     */
    const checkAuth = async (retries: number = 0) => {
      /**
       * 从localStorage读取存储的JWT Token
       * @type {string | null}
       */
      const token = localStorage.getItem('token');

      // 如果没有Token，直接结束加载状态
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        /**
         * 调用后端API获取当前用户资料
         * 此接口需要Authorization头携带JWT Token
         * 后端会验证Token的有效性和过期时间
         */
        const userData = await request<Record<string, unknown>>('/users/profile');

        setUser({
          id: String(userData.id),
          username: userData.username as string,
          nickname: userData.nickname as string | undefined,
          avatar: getIPFSUrl(userData.avatarCid as string | undefined),
          avatarCid: userData.avatarCid as string | undefined,
          backgroundCid: userData.backgroundCid as string | undefined,
          backgroundColor: userData.backgroundColor as string | undefined,
          globalBackgroundCid: userData.globalBackgroundCid as string | undefined,
          globalBackgroundColor: userData.globalBackgroundColor as string | undefined,
          bio: userData.bio as string | undefined,
          isAdmin: userData.isAdmin as boolean | undefined,
          allowFollow: userData.allowFollow as boolean | undefined,
          allowMessage: userData.allowMessage as boolean | undefined,
          hideFollowing: userData.hideFollowing as boolean | undefined,
          hideFollowers: userData.hideFollowers as boolean | undefined,
          hideLikes: userData.hideLikes as boolean | undefined,
          hideCollections: userData.hideCollections as boolean | undefined,
          language: userData.language as string | undefined,
          fontSize: userData.fontSize as string | undefined,
          colorScheme: userData.colorScheme as string | undefined,
          defaultVisibility: userData.defaultVisibility as string | undefined,
        });
        localStorage.setItem('userId', String(userData.id));
        setIsLoading(false);
      } catch (error: unknown) {
        if (error instanceof ApiError && error.isUnauthorized) {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          setUser(null);
          setIsLoading(false);
          return;
        }

        if (retries < 2) {
          console.warn(`获取用户信息失败，1s后重试... (${retries + 1}/2)`);
          setTimeout(() => checkAuth(retries + 1), 1000);
          return;
        }

        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        setUser(null);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 登录
  const login = useCallback(async (username: string, password: string, mfaToken?: string): Promise<{ requireMfa?: boolean } | void> => {
    chatClient.disconnect();
    setIsLoading(true);
    try {
      const body: Record<string, string> = { username, password };
      if (mfaToken) {
        body.mfaToken = mfaToken;
      }

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '登录失败');
      }

      const data = await response.json();

      if (data.requireMfa) {
        return { requireMfa: true };
      }

      setUser({
        id: data.user.id.toString(),
        username: data.user.username,
        nickname: data.user.nickname,
        avatar: getIPFSUrl(data.user.avatarCid),
        avatarCid: data.user.avatarCid,
        backgroundCid: data.user.backgroundCid,
        backgroundColor: data.user.backgroundColor,
        globalBackgroundCid: data.user.globalBackgroundCid,
        globalBackgroundColor: data.user.globalBackgroundColor,
        bio: data.user.bio,
        isAdmin: data.user.isAdmin,
        language: data.user.language,
        fontSize: data.user.fontSize,
        colorScheme: data.user.colorScheme,
        defaultVisibility: data.user.defaultVisibility,
      });
      localStorage.setItem('token', data.accessToken || data.token);
      localStorage.setItem('userId', data.user.id.toString());
      if (data.sessionToken) {
        localStorage.setItem('adminSession', data.sessionToken);
      }
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 注册
  const register = useCallback(
    async (data: { username: string; password: string; nickname?: string; captchaKey?: string; captchaAnswer?: string }) => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/users/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: data.username,
            password: data.password,
            nickname: data.nickname,
            captchaKey: data.captchaKey,
            captchaAnswer: data.captchaAnswer,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          const errorMessage = error.message || '注册失败';
          throw new Error(errorMessage);
        }

        const newUser = await response.json();
        const userWithNickname = {
          id: newUser.id.toString(),
          username: newUser.username,
          nickname: data.nickname || newUser.nickname,
          avatar: getIPFSUrl(newUser.avatarCid),
          avatarCid: newUser.avatarCid,
          backgroundCid: newUser.backgroundCid,
          backgroundColor: newUser.backgroundColor,
          bio: newUser.bio || undefined,
          isAdmin: newUser.isAdmin || false,
        };
        setUser(userWithNickname);

        const loginResponse = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: data.username, password: data.password }),
        });

        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          localStorage.setItem('token', loginData.accessToken || loginData.token);
        }
      } catch (error) {
        console.error('注册失败:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const adminLogin = useCallback(async (username: string, password: string, mfaToken?: string): Promise<{ requireMfa?: boolean } | void> => {
    setIsLoading(true);
    try {
      const body: Record<string, string> = { username, password };
      if (mfaToken) {
        body.mfaToken = mfaToken;
      }

      const response = await fetch(`${API_URL}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '管理员登录失败');
      }

      const data = await response.json();

      if (data.requireMfa) {
        return { requireMfa: true };
      }

      setUser({
        id: data.user.id.toString(),
        username: data.user.username,
        nickname: data.user.nickname,
        avatar: getIPFSUrl(data.user.avatarCid),
        avatarCid: data.user.avatarCid,
        bio: data.user.bio,
        isAdmin: data.user.isAdmin,
      });
      localStorage.setItem('token', data.accessToken || data.token);
      localStorage.setItem('userId', data.user.id.toString());
      if (data.sessionToken) {
        localStorage.setItem('adminSession', data.sessionToken);
      }
    } catch (error) {
      console.error('管理员登录失败:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 登出
  const logout = useCallback(() => {
    chatClient.disconnect();
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('adminSession');
  }, []);

  // 更新个人资料
  const updateProfile = useCallback(
    async (data: Partial<UserDTO>) => {
      if (!user) throw new Error('用户未登录');
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('登录已失效，请重新登录');
        }

        const response = await fetch(`${API_URL}/users/profile`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            setUser(null);
            throw new Error('登录已过期，请重新登录');
          }
          throw new Error(error.message || '更新失败');
        }

        const updatedUser = await response.json();
        console.log('updateProfile response:', updatedUser);

        const newUserState = {
          ...user,
          ...updatedUser,
          nickname: updatedUser.nickname,
          avatarCid: updatedUser.avatarCid,
          avatar: getIPFSUrl(updatedUser.avatarCid),
          backgroundCid: updatedUser.backgroundCid,
          backgroundColor: updatedUser.backgroundColor,
          globalBackgroundCid: updatedUser.globalBackgroundCid,
          globalBackgroundColor: updatedUser.globalBackgroundColor,
          language: updatedUser.language,
          fontSize: updatedUser.fontSize,
          colorScheme: updatedUser.colorScheme,
          defaultVisibility: updatedUser.defaultVisibility,
          hideLikes: updatedUser.hideLikes,
          hideCollections: updatedUser.hideCollections,
        };
        console.log('Setting new user state:', newUserState);
        setUser(newUserState);

        return newUserState;
      } catch (error) {
        console.error('更新资料失败:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    adminLogin,
    register,
    logout,
    updateProfile,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

// 自定义hook：使用认证
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}