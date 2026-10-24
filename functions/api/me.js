// GET /api/me  ->  who is signed in on this browser (if anyone)
import { getSession, isConfigured, json, publicMe } from '../_lib/http.js';

export async function onRequestGet({ request, env }) {
  // "available: false" until Google + the database are set up, so pages hide the Sign in button.
  if (!isConfigured(env)) return json({ available: false, signedIn: false });
  const me = await getSession(request, env);
  if (!me) return json({ available: true, signedIn: false });
  return json({ available: true, signedIn: true, user: publicMe(me) });
}
