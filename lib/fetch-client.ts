// 统一 HTTP 客户端 — 所有前端 fetch 请求的唯一入口

// 使用相对路径，通过 Next.js rewrites 代理到后端
const API_BASE = '/api';

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

function buildUrl(endpoint: string): string {
  return `${API_BASE}${endpoint}`;
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
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
  options: RequestInit
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
