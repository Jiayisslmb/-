import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isAdmin = request.cookies.get('isAdmin')?.value === 'true';

  // 未登录用户访问需登录的页面
  const protectedPaths = /^\/(profile|content\/create|messages|settings|circles\/create|activities\/create|admin)/;
  if (!token && protectedPaths.test(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url));
  }

  // 非管理员访问管理员页面
  if (!isAdmin && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/content/create/:path*',
    '/messages/:path*',
    '/settings/:path*',
    '/circles/create/:path*',
    '/activities/create/:path*',
    '/admin/:path*',
  ],
};
