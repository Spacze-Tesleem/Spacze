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

  // Everything under /admin or /api requires a valid session
  if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
    const authed = await getSession(req);
    if (!authed) {
      if (pathname.startsWith('/api')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // Redirect browser requests to the login page
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
