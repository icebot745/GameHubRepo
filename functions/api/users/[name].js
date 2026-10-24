// GET /api/users/icebot566  ->  public profile info (display name + month joined, nothing else)
import { joinedMonth, json } from '../../_lib/http.js';

export async function onRequestGet({ params, env }) {
  if (!env.DB) return json({ error: 'not found' }, 404);
  const row = await env.DB.prepare('SELECT username, created_at FROM users WHERE username = ?')
    .bind(String(params.name)).first();
  if (!row) return json({ error: 'not found' }, 404);
  return json({ username: row.username, joined: joinedMonth(row.created_at) }, 200, { 'cache-control': 'public, max-age=60' });
}
