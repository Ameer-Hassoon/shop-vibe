import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  console.log('Middleware - Token role:', token?.role);
  console.log('Middleware - Path:', req.nextUrl.pathname);

  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');

  if (isAdminRoute) {
    if (!token) {
      console.log('Middleware - No token, redirecting to login');
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (token.role !== 'ADMIN') {
      console.log('Middleware - Not admin, redirecting to home');
      return NextResponse.redirect(new URL('/', req.url));
    }
    console.log('Middleware - Admin verified');
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
