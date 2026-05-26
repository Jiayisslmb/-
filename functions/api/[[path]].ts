// API Proxy — forwards /api/* to backend
// Named Tunnel permanent endpoint:
const API_BASE = 'https://api.desocial.com';

export async function onRequest(context: { request: Request; params: Record<string, string> }) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '') || '/';
  const target = `${API_BASE}${path}${url.search}`;

  try {
    const response = await fetch(target, {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD'
        ? await request.arrayBuffer()
        : undefined,
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (e) {
    return new Response(JSON.stringify({ message: 'Backend unavailable', error: String(e) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
