import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// We need to re-import the module after mocking
// The module uses global fetch and localStorage
let request: typeof import('../fetch-client').request;
let ApiError: typeof import('../fetch-client').ApiError;
let buildUrl: typeof import('../fetch-client').buildUrl;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();

  // Reset localStorage mock state
  const store: Record<string, string> = {};
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
    },
    writable: true,
  });

  const mod = await import('../fetch-client');
  request = mod.request;
  ApiError = mod.ApiError;
  buildUrl = mod.buildUrl;
});

// ============================================================
// ApiError
// ============================================================
describe('ApiError', () => {
  it('正确创建错误实例', () => {
    const err = new ApiError('Not Found', 404, { code: 'NOT_FOUND' });
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Not Found');
    expect(err.status).toBe(404);
    expect(err.name).toBe('ApiError');
  });

  it('isRateLimited判断429状态码', () => {
    expect(new ApiError('', 429).isRateLimited).toBe(true);
    expect(new ApiError('', 200).isRateLimited).toBe(false);
  });

  it('isServerError判断5xx状态码', () => {
    expect(new ApiError('', 500).isServerError).toBe(true);
    expect(new ApiError('', 503).isServerError).toBe(true);
    expect(new ApiError('', 400).isServerError).toBe(false);
  });

  it('isUnauthorized判断401状态码', () => {
    expect(new ApiError('', 401).isUnauthorized).toBe(true);
    expect(new ApiError('', 403).isUnauthorized).toBe(false);
  });

  it('isRetryable = isRateLimited || isServerError', () => {
    expect(new ApiError('', 429).isRetryable).toBe(true);
    expect(new ApiError('', 500).isRetryable).toBe(true);
    expect(new ApiError('', 400).isRetryable).toBe(false);
  });
});

// ============================================================
// request — success path
// ============================================================
describe('request — success', () => {
  it('返回解析后的JSON', async () => {
    mockFetch.mockResolvedValueOnce(
      Response.json({ data: 'hello' }, { status: 200 })
    );
    const result = await request('/test');
    expect(result).toEqual({ data: 'hello' });
  });

  it('URL包含API_BASE前缀', async () => {
    mockFetch.mockResolvedValueOnce(
      Response.json({}, { status: 200 })
    );
    await request('/test');
    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('/api/test');
  });

  it('包含Content-Type头', async () => {
    mockFetch.mockResolvedValueOnce(
      Response.json({}, { status: 200 })
    );
    await request('/test');
    const config = mockFetch.mock.calls[0][1];
    expect(config.headers['Content-Type']).toBe('application/json');
  });

  it('有token时包含Authorization头', async () => {
    localStorage.setItem('token', 'test-token-123');
    mockFetch.mockResolvedValueOnce(
      Response.json({}, { status: 200 })
    );
    await request('/test');
    const config = mockFetch.mock.calls[0][1];
    expect(config.headers['Authorization']).toBe('Bearer test-token-123');
  });
});

// ============================================================
// request — error handling
// ============================================================
describe('request — error handling', () => {
  it('非200响应抛出ApiError', async () => {
    mockFetch.mockResolvedValueOnce(
      Response.json({ message: 'Not Found' }, { status: 404 })
    );
    await expect(request('/notfound')).rejects.toBeInstanceOf(ApiError);
  });

  it('ApiError包含正确的status', async () => {
    mockFetch.mockResolvedValueOnce(
      Response.json({ message: 'Bad Request' }, { status: 400 })
    );
    try {
      await request('/bad');
      expect.fail('Should have thrown');
    } catch (e) {
      expect((e as any).status).toBe(400);
    }
  });
});

// ============================================================
// buildUrl
// ============================================================
describe('buildUrl', () => {
  it('拼接API_BASE_URL和endpoint', () => {
    const url = buildUrl('/users/profile');
    expect(url).toContain('/api/users/profile');
  });
});
