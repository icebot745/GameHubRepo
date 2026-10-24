// POST /api/account/delete {"confirm":"icebot566"}  ->  removes the account and signs out everywhere
import { SESSION_COOKIE, clearCookie, fromOurSite, getSession, json, readJson } from '../../_lib/http.js';

export async function onRequestPost({ request, env }) {
  if (!fromOurSite(request)) return json({ ok: false, reason: 'Bad request.' }, 403);
  const me = await getSession(request, env);
  if (!me) return json({ ok: false, reason: 'Sign in first.' }, 401);
  const body = await readJson(request);
  const typed = String((body && body.confirm) || '').trim().toLowerCase();
  if (me.username && typed !== me.username.toLowerCase()) {
    return json({ ok: false, reason: 'Type your display name exactly to confirm.' }, 400);
  }
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(me.id),
    env.DB.prepare('DELETE FROM users WHERE id = ?').bind(me.id),
  ]);
  return json({ ok: true }, 200, { 'set-cookie': clearCookie(SESSION_COOKIE) });
}
