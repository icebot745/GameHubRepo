// GET /api/auth/login?return=/some/page
// Sends the player to Google's sign-in screen.
import { OAUTH_COOKIE, b64url, isConfigured, randomToken, redirect, safeReturn, setCookie, sha256 } from '../../_lib/http.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const back = safeReturn(url.searchParams.get('return') || '/');
  if (!isConfigured(env)) return redirect(back);

  const state = randomToken(16);
  const nonce = randomToken(16);
  const verifier = randomToken(32);

  const google = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  google.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${url.origin}/api/auth/callback`,
    response_type: 'code',
    // Google requires "email" or "profile" next to "openid". We read only the account
    // number (sub) from the reply; the email is never stored.
    scope: 'openid email',
    state,
    nonce,
    code_challenge: b64url(await sha256(verifier)),
    code_challenge_method: 'S256',
    prompt: 'select_account',
  }).toString();

  const packed = [state, nonce, verifier, b64url(new TextEncoder().encode(back))].join('.');
  return redirect(google.toString(), [setCookie(OAUTH_COOKIE, packed, 600)]);
}
