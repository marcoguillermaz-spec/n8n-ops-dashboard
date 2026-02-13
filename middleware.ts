import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PUBLIC_ROUTES = ['/login', '/auth/callback', '/_next', '/favicon.ico'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Create Supabase client wired to request/response cookies
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Forward refreshed tokens to downstream Server Components
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // Recreate response so it carries the updated request cookies
          supabaseResponse = NextResponse.next({ request });
          // Persist tokens to browser
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: use getUser() — never getSession() — to guarantee token validation
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Domain restriction enforcement
  const email = user.email ?? '';
  if (!email.endsWith('@testbusters.it')) {
    await supabase.auth.signOut();
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'domain');
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
