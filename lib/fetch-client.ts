// 统一 HTTP 客户端 — 所有前端 fetch 请求的唯一入口

// 开发模式使用环境变量直连后端，生产模式（Pages）使用相对路径经过 Pages Function 代理
const API_BASE =
  typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : '/api';

class ApiError extends Error {
  status: number;
  code?: string;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }

  get isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isRetryable(): boolean {
    return this.isRateLimited || this.isServerError;
  }
}

const MAX_RETRIES = 3;
const BASE_DELAY = 1000;
const DEFAULT_TIMEOUT = 30000;

// GET 请求去重：相同 URL 的并发请求共享同一个 Promise
const inflightRequests = new Map<string, Promise<unknown>>();

// Token 刷新去重：并发 401 只触发一次刷新
let refreshPromise: Promise<boolean> | null = null;

function buildUrl(endpoint: string): string {
  return `${API_BASE}${endpoint}`;
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function clearAuthState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('adminSession');
  document.cookie = 'token=; path=/; max-age=0';
  document.cookie = 'isAdmin=; path=/; max-age=0';
}

async function refreshAccessToken(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    localStorage.setItem('token', data.accessToken);
    document.cookie = `token=${data.accessToken}; path=/; max-age=604800; SameSite=Lax`;
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    return true;
  } catch {
    return false;
  }
}

async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = refreshAccessToken().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildUrl(endpoint);
  const method = options.method || 'GET';

  // GET 请求去重
  if (method === 'GET') {
    const cacheKey = url;
    const existing = inflightRequests.get(cacheKey);
    if (existing) return existing as Promise<T>;

    const promise = doRequest<T>(url, options);
    inflightRequests.set(cacheKey, promise);
    try {
      return await promise;
    } finally {
      inflightRequests.delete(cacheKey);
    }
  }

  return doRequest<T>(url, options);
}

async function doRequest<T>(
  url: string,
  options: RequestInit,
  isRetryAfterRefresh = false
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string> || {}),
  };

  const config: RequestInit = {
    ...options,
    headers,
    signal: controller.signal,
  };

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (response.status === 401 && !isRetryAfterRefresh) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          return doRequest<T>(url, options, true);
        }
        clearAuthState();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/sign-in';
        }
        throw new ApiError('登录已过期，请重新登录', 401);
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message = (errorBody as { message?: string }).message || `请求失败: ${response.status}`;
        const apiError = new ApiError(message, response.status, errorBody);

        if (apiError.isRetryable && attempt < MAX_RETRIES) {
          const delay = BASE_DELAY * Math.pow(2, attempt) + Math.random() * 1000;
          console.warn(`请求失败 (${response.status})，${Math.round(delay)}ms后重试... (${attempt + 1}/${MAX_RETRIES})`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw apiError;
      }

      return response.json() as Promise<T>;
    } catch (error: unknown) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) throw error;

      const isNetworkError =
        error instanceof TypeError ||
        (error instanceof DOMException && error.name === 'AbortError') ||
        (error instanceof Error && (
          error.message.includes('网络') ||
          error.message.includes('network') ||
          error.message.includes('fetch')
        ));

      if (isNetworkError && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, attempt) + Math.random() * 1000;
        console.warn(`网络错误，${Math.round(delay)}ms后重试... (${attempt + 1}/${MAX_RETRIES})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      console.error(`API请求错误 [${url}]:`, error);
      throw error;
    }
  }

  throw new ApiError('请求重试失败', 0);
}

export { request, ApiError, buildUrl };
export type { };
