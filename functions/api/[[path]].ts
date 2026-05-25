// API Proxy — forwards /api/* to backend
// UPDATE API_BASE when switching from Quick Tunnel to Named Tunnel DNS:
//   Current (Quick Tunnel): https://matched-poems-cancelled-stations.trycloudflare.com/api
//   After DNS propagation: https://api.desocial.com (Named Tunnel permanent endpoint)
const API_BASE = 'https://matched-poems-cancelled-stations.trycloudflare.com/api';

export async function onRequest(context) {
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
