// GET  /api/username?check=icebot566  ->  is this name allowed and free?
// POST /api/username {"username":"icebot566"}  ->  pick or change your display name
import { fromOurSite, getSession, json, nextRenameAt, publicMe, readJson } from '../_lib/http.js';
import { checkUsername } from '../_lib/names.js';

const TAKEN = { ok: false, reason: 'Someone already has that name.' };

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ ok: false, reason: 'Accounts are not switched on yet.' }, 503);
  const rule = checkUsername(new URL(request.url).searchParams.get('check') || '');
  if (!rule.ok) return json(rule);
  const me = await getSession(request, env);
  const owner = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(rule.name).first();
  if (owner && (!me || owner.id !== me.id)) return json(TAKEN);
  return json({ ok: true, name: rule.name });
}

export async function onRequestPost({ request, env }) {
  if (!fromOurSite(request)) return json({ ok: false, reason: 'Bad request.' }, 403);
  if (!env.DB) return json({ ok: false, reason: 'Accounts are not switched on yet.' }, 503);
  const me = await getSession(request, env);
  if (!me) return json({ ok: false, reason: 'Sign in first.' }, 401);

  const body = await readJson(request);
  const rule = checkUsername(body && body.username);
  if (!rule.ok) return json(rule, 400);
  if (me.username === rule.name) return json({ ok: true, user: publicMe(me) });

  // First pick is free, and so is one fix after it. After that: once every 30 days.
  // Changing only capital letters (icebot -> IceBot) never counts.
  let changedAt = me.username_changed_at;
  const caseOnly = me.username && me.username.toLowerCase() === rule.name.toLowerCase();
  if (me.username && !caseOnly) {
    const nextAt = nextRenameAt(me);
    if (nextAt && nextAt > Date.now()) {
      return json({ ok: false, reason: 'You changed your name recently.', canRenameAt: nextAt }, 429);
    }
    changedAt = Date.now();
  }

  try {
    await env.DB.prepare('UPDATE users SET username = ?, username_changed_at = ? WHERE id = ?')
      .bind(rule.name, changedAt, me.id).run();
  } catch (err) {
    if (String((err && err.message) || err).includes('UNIQUE')) return json(TAKEN, 409);
    throw err;
  }
  return json({ ok: true, user: publicMe({ ...me, username: rule.name, username_changed_at: changedAt }) });
}
