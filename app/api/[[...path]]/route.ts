const TUNNEL_URL = process.env.BACKEND_TUNNEL_URL || 'http://localhost:3002';

async function handler(request: Request) {
  const url = new URL(request.url);
  const pathname = (url.pathname === '/api/socket.io' && url.search.includes('EIO='))
    ? '/api/socket.io/'
    : url.pathname;
  const target = `${TUNNEL_URL}${pathname}${url.search}`;

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
    return Response.json(
      { message: 'Backend unavailable', error: String(e) },
      { status: 502 }
    );
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
