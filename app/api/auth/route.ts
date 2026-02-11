import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (password !== process.env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: 'Password errata' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });

  // httpOnly cookie — 7 days
  res.cookies.set('ship_auth', process.env.AUTH_SECRET || 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('ship_auth');
  return res;
}
