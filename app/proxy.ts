//路由中间件（权限控制，如拦截未登录用户访问需要权限的页面）
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isAdmin = request.cookies.get('isAdmin')?.value === 'true';

  // 未登录用户访问需登录的页面
  if (!token && request.nextUrl.pathname.match(/^\/profile|\/posts|\/messages/)) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // 非管理员访问管理员页面
  if (!isAdmin && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: ['/profile/:path*', '/posts/:path*', '/messages/:path*', '/admin/:path*'],
};