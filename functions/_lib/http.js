// Shared helpers for the OP Game Hub account API (Cloudflare Pages Functions).
// Files in functions/_lib/ hold no request handlers, so they never become routes.

export const SESSION_COOKIE = '__Host-ophub_sid';
export const OAUTH_COOKIE = '__Host-ophub_oauth';
export const SESSION_DAYS = 30;
export const RENAME_COOLDOWN_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

export function redirect(location, cookies = []) {
  const headers = new Headers({ location, 'cache-control': 'no-store' });
  for (const c of cookies) headers.append('set-cookie', c);
  return new Response(null, { status: 302, headers });
}

export function parseCookies(request) {
  const out = {};
  for (const part of (request.headers.get('cookie') || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

// __Host- cookies: HTTPS only, whole site, invisible to page scripts.
export function setCookie(name, value, maxAgeSeconds) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}
export function clearCookie(name) {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function b64urlDecodeText(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s + '='.repeat((4 - (s.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}
export function randomToken(bytes = 32) {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}
export async function sha256(text) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}
export async function sha256hex(text) {
  return [...(await sha256(text))].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Only allow returning to a page on this site.
export function safeReturn(path) {
  if (typeof path !== 'string' || !/^\/(?![\/\\])/.test(path) || path.startsWith('/api/')) return '/';
  return path.slice(0, 300);
}

export function isConfigured(env) {
  return Boolean(env.DB && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

// Requests that change something must come from our own pages.
export function fromOurSite(request) {
  const origin = request.headers.get('origin');
  return Boolean(origin) && origin === new URL(request.url).origin;
}

export async function readJson(request, maxBytes = 2048) {
  const text = await request.text();
  if (text.length > maxBytes) return null;
  try { return JSON.parse(text); } catch { return null; }
}

export async function getSession(request, env) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token || !env.DB) return null;
  const tokenHash = await sha256hex(token);
  const row = await env.DB.prepare(
    `SELECT u.id, u.username, u.created_at, u.username_changed_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ?`
  ).bind(tokenHash, Date.now()).first();
  return row ? { ...row, tokenHash } : null;
}

export async function createSession(env, userId) {
  const token = randomToken();
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now),
    env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
      .bind(await sha256hex(token), userId, now + SESSION_DAYS * DAY),
  ]);
  return setCookie(SESSION_COOKIE, token, SESSION_DAYS * 24 * 60 * 60);
}

export function nextRenameAt(user) {
  return user.username_changed_at ? user.username_changed_at + RENAME_COOLDOWN_DAYS * DAY : null;
}

// Only the month someone joined is ever shown, never the exact time.
export function joinedMonth(ms) {
  return new Date(ms).toISOString().slice(0, 7);
}

export function publicMe(user) {
  const renameAt = nextRenameAt(user);
  return {
    username: user.username,
    joined: joinedMonth(user.created_at),
    canRenameAt: renameAt && renameAt > Date.now() ? renameAt : null,
  };
}
