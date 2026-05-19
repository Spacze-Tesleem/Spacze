/**
 * Next.js middleware — enforces server-side authentication on all admin and
 * API routes.
 *
 * Protected paths:
 *   /admin/*          → redirect to /admin/login if no valid session
 *   /api/*            → 401 JSON if no valid session
 *
 * Unprotected paths (no session required):
 *   /api/admin-auth   → login endpoint (sets the cookie)
 *   /api/admin-logout → logout endpoint (clears the cookie)
 *   /                 → public marketing site
 *   /_next/*          → Next.js internals
 *   /favicon.ico      → static asset
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

// Routes that must be reachable without a session
const PUBLIC_API = new Set(['/api/admin-auth', '/api/admin-logout']);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow Next.js internals and static files through unconditionally
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  // Public API routes — no auth needed
  if (PUBLIC_API.has(pathname)) return NextResponse.next();

  // /admin (exact) is the login page — always allow it through so the login
  // form is reachable without a session. Sub-paths and all /api routes require
  // a valid session.
  //
  // If ADMIN_SESSION_SECRET is not configured the middleware passes through
  // rather than blocking all traffic — the site stays up while the env var
  // is being added to the hosting platform.
  const isAdminLogin = pathname === '/admin';
  if (!isAdminLogin && (pathname.startsWith('/admin') || pathname.startsWith('/api'))) {
    if (!process.env.ADMIN_SESSION_SECRET) {
      console.warn('[middleware] ADMIN_SESSION_SECRET is not set — auth enforcement is disabled.');
      return NextResponse.next();
    }
    const authed = await getSession(req);
    if (!authed) {
      if (pathname.startsWith('/api')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // Redirect unauthenticated sub-path requests to the login page
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/admin';
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except Next.js static chunks
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
