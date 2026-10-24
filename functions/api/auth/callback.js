// GET /api/auth/callback  (Google sends the player back here after sign-in)
import {
  OAUTH_COOKIE, b64urlDecodeText, clearCookie, createSession, isConfigured, parseCookies, redirect, safeReturn,
} from '../../_lib/http.js';

const GOOGLE_ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com']);

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const [state, nonce, verifier, backPacked] = (parseCookies(request)[OAUTH_COOKIE] || '').split('.');
  let back = '/';
  try { back = safeReturn(b64urlDecodeText(backPacked || '')); } catch { /* keep "/" */ }

  const fail = (why) => {
    console.warn('sign-in failed:', why);
    const sep = back.includes('?') ? '&' : '?';
    return redirect(`${back}${sep}signin=failed`, [clearCookie(OAUTH_COOKIE)]);
  };

  if (!isConfigured(env)) return fail('accounts not configured');
  if (url.searchParams.get('error')) {
    // Player pressed Cancel on Google's screen: just go back quietly.
    return redirect(back, [clearCookie(OAUTH_COOKIE)]);
  }
  if (!state || url.searchParams.get('state') !== state) return fail('state mismatch');
  const code = url.searchParams.get('code');
  if (!code) return fail('no code');

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${url.origin}/api/auth/callback`,
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
  });
  if (!tokenRes.ok) return fail(`token exchange ${tokenRes.status}: ${(await tokenRes.text()).slice(0, 200)}`);

  // The ID token came straight from Google over HTTPS using our secret, so Google's docs
  // say it can be trusted without checking its signature. We still check who it's for.
  let claims;
  try {
    const { id_token: idToken } = await tokenRes.json();
    claims = JSON.parse(b64urlDecodeText(idToken.split('.')[1]));
  } catch {
    return fail('unreadable id_token');
  }
  if (
    !GOOGLE_ISSUERS.has(claims.iss) ||
    claims.aud !== env.GOOGLE_CLIENT_ID ||
    claims.nonce !== nonce ||
    !(claims.exp * 1000 > Date.now()) ||
    !claims.sub
  ) {
    return fail('id_token checks');
  }

  const sub = String(claims.sub);
  await env.DB.prepare('INSERT OR IGNORE INTO users (google_sub, created_at) VALUES (?, ?)').bind(sub, Date.now()).run();
  const user = await env.DB.prepare('SELECT id, username FROM users WHERE google_sub = ?').bind(sub).first();
  if (!user) return fail('user row missing');

  const sessionCookie = await createSession(env, user.id);
  const dest = user.username ? back : `/welcome/?return=${encodeURIComponent(back)}`;
  return redirect(dest, [clearCookie(OAUTH_COOKIE), sessionCookie]);
}
