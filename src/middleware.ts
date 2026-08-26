import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from './lib/auth';
import { AUTH_COOKIE_NAME } from './lib/constants';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static files, api auth routes, icons
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/site.webmanifest')
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const isAuthenticated = Boolean(session);

  // If user is at /login and already authenticated, redirect to /
  if (pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // If user is not authenticated and trying to access protected route, redirect to /login
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // User is authenticated, pass role in custom header for server components if needed
  const response = NextResponse.next();
  if (session?.role) {
    response.headers.set('x-user-role', session.role);
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
