/**
 * Minimal signed-cookie session helpers.
 *
 * Uses the Web Crypto API (SubtleCrypto) — compatible with both the Node.js
 * runtime (API routes) and the Edge Runtime (middleware). No Node built-ins.
 *
 * Token format:  base64url(JSON payload) + "." + base64url(HMAC-SHA256)
 *
 * Required env var: ADMIN_SESSION_SECRET (any string, ≥32 chars recommended)
 */

import { NextRequest, NextResponse } from 'next/server';

export const SESSION_COOKIE = 'spacze_session';
const MAX_AGE_SEC = 8 * 60 * 60; // 8 hours

function getSecret(): string | null {
  return process.env.ADMIN_SESSION_SECRET ?? null;
}

function b64uEncode(buf: ArrayBuffer): string {
  return Buffer.from(buf).toString('base64url');
}

function b64uDecode(s: string): Uint8Array {
  return new Uint8Array(Buffer.from(s, 'base64url'));
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function signData(data: string, secret: string): Promise<string> {
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return b64uEncode(sig);
}

async function verifyData(data: string, sigB64u: string, secret: string): Promise<boolean> {
  const key = await importKey(secret);
  return crypto.subtle.verify('HMAC', key, b64uDecode(sigB64u), new TextEncoder().encode(data));
}

/** Encode a payload object into a signed token string. */
export async function encodeToken(payload: Record<string, unknown>): Promise<string> {
  const secret = getSecret();
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set.');
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig  = await signData(data, secret);
  return `${data}.${sig}`;
}

/** Verify and decode a token. Returns null if invalid, expired, or secret missing. */
export async function decodeToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const secret = getSecret();
    if (!secret) return null; // no secret → treat every token as invalid
    const dot = token.lastIndexOf('.');
    if (dot < 0) return null;
    const data = token.slice(0, dot);
    const sig  = token.slice(dot + 1);
    const ok   = await verifyData(data, sig, secret);
    if (!ok) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Set the session cookie on a NextResponse. */
export async function setSessionCookie(res: NextResponse): Promise<void> {
  const token = await encodeToken({ admin: true, exp: Date.now() + MAX_AGE_SEC * 1000 });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    maxAge:   MAX_AGE_SEC,
  });
}

/** Clear the session cookie on a NextResponse. */
export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    maxAge:   0,
  });
}

/**
 * Read and validate the session from an incoming request.
 *
 * If ADMIN_SESSION_SECRET is not set, returns false (all requests are
 * unauthenticated) rather than throwing — this keeps the site up while
 * the env var is being configured on the hosting platform.
 */
export async function getSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return (await decodeToken(token)) !== null;
}
