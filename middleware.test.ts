/**
 * Tests for middleware authentication enforcement.
 *
 * Key invariant: the middleware must NEVER pass a request through to a
 * protected route when ADMIN_SESSION_SECRET is absent (fail-closed).
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

// getSession is the only external dependency we need to control.
jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
  SESSION_COOKIE: 'spacze_session',
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build a minimal NextRequest-like object for the given pathname.
 * The middleware only reads `req.nextUrl.pathname`, `req.nextUrl.clone()`,
 * and `req.cookies` (via getSession, which is mocked).
 */
function makeReq(pathname: string) {
  return {
    nextUrl: {
      pathname,
      clone: () => new URL(`http://localhost${pathname}`),
    },
    cookies: { get: () => undefined },
  } as any;
}

/**
 * Run the middleware and return the response.
 *
 * After jest.resetModules() both the middleware module AND the session mock
 * must be re-required from the fresh module registry so that the mock
 * returned by require('@/lib/session') is the same instance the middleware
 * module will call.
 */
async function run(pathname: string, sessionValue: boolean = false) {
  const sessionMod = require('@/lib/session');
  sessionMod.getSession.mockResolvedValue(sessionValue);
  const { middleware } = await import('./middleware');
  return middleware(makeReq(pathname));
}

// ── Test suites ───────────────────────────────────────────────────────────────

describe('middleware — ADMIN_SESSION_SECRET absent (fail-closed)', () => {
  const ENV_BACKUP = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ENV_BACKUP };
    delete process.env.ADMIN_SESSION_SECRET;
  });

  afterAll(() => {
    process.env = ENV_BACKUP;
  });

  it('returns 503 for /api/* routes when secret is missing', async () => {
    const res = await run('/api/leads');
    expect(res.status).toBe(503);
  });

  it('returns 503 for /api/settings when secret is missing', async () => {
    const res = await run('/api/settings');
    expect(res.status).toBe(503);
  });

  it('returns 503 for /api/whatsapp-replies when secret is missing', async () => {
    const res = await run('/api/whatsapp-replies');
    expect(res.status).toBe(503);
  });

  it('redirects /admin/dashboard to /admin when secret is missing', async () => {
    const res = await run('/admin/dashboard');
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/admin');
  });

  it('does NOT call getSession when secret is missing', async () => {
    await run('/api/leads');
    // getSession must never be reached — the secret check short-circuits first
    const sessionMod = require('@/lib/session');
    expect(sessionMod.getSession).not.toHaveBeenCalled();
  });
});

describe('middleware — ADMIN_SESSION_SECRET present', () => {
  const ENV_BACKUP = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ENV_BACKUP, ADMIN_SESSION_SECRET: 'test-secret-32-chars-long-enough!' };
  });

  afterAll(() => {
    process.env = ENV_BACKUP;
  });

  it('returns 401 for /api/* when session is invalid', async () => {
    const res = await run('/api/leads', false);
    expect(res.status).toBe(401);
  });

  it('passes through /api/* when session is valid', async () => {
    const res = await run('/api/leads', true);
    expect(res.status).toBe(200);
  });

  it('redirects /admin/dashboard to /admin when session is invalid', async () => {
    const res = await run('/admin/dashboard', false);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/admin');
  });

  it('passes through /admin/dashboard when session is valid', async () => {
    const res = await run('/admin/dashboard', true);
    expect(res.status).toBe(200);
  });
});

describe('middleware — public routes always pass through', () => {
  const ENV_BACKUP = process.env;

  beforeEach(() => {
    jest.resetModules();
    // Even with no secret, public routes must be reachable
    process.env = { ...ENV_BACKUP };
    delete process.env.ADMIN_SESSION_SECRET;
  });

  afterAll(() => {
    process.env = ENV_BACKUP;
  });

  it('passes through /', async () => {
    const res = await run('/');
    expect(res.status).toBe(200);
  });

  it('passes through /api/admin-auth (login endpoint)', async () => {
    const res = await run('/api/admin-auth');
    expect(res.status).toBe(200);
  });

  it('passes through /api/admin-logout', async () => {
    const res = await run('/api/admin-logout');
    expect(res.status).toBe(200);
  });

  it('passes through /admin (login page)', async () => {
    const res = await run('/admin');
    expect(res.status).toBe(200);
  });

  it('passes through /_next/static/... assets', async () => {
    const res = await run('/_next/static/chunks/main.js');
    expect(res.status).toBe(200);
  });
});
