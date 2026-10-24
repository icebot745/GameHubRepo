// POST /api/auth/logout
import { SESSION_COOKIE, clearCookie, fromOurSite, getSession, json } from '../../_lib/http.js';

export async function onRequestPost({ request, env }) {
  if (!fromOurSite(request)) return json({ ok: false, reason: 'Bad request.' }, 403);
  const me = await getSession(request, env);
  if (me) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(me.tokenHash).run();
  return json({ ok: true }, 200, { 'set-cookie': clearCookie(SESSION_COOKIE) });
}
