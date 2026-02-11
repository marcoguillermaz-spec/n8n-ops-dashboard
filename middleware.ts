import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple cookie-based auth middleware.
 *
 * Protects all routes except /login and /api/auth.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const authCookie = req.cookies.get('ship_auth')?.value;
  const secret = process.env.AUTH_SECRET || 'authenticated';

  if (authCookie !== secret) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
