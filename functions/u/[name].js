// GET /u/icebot566  ->  the profile page (or the 404 page if nobody has that name)
export async function onRequestGet({ request, env, params }) {
  const url = new URL(request.url);
  const row = env.DB
    ? await env.DB.prepare('SELECT username FROM users WHERE username = ?').bind(String(params.name)).first()
    : null;

  if (!row) {
    // Ask for a file that doesn't exist so Pages answers with our 404.html and a real 404 status.
    const missing = await env.ASSETS.fetch(new URL('/u/__no-such-player__', url));
    return new Response(missing.body, { status: 404, headers: missing.headers });
  }
  if (row.username !== params.name) {
    return Response.redirect(new URL(`/u/${encodeURIComponent(row.username)}`, url).toString(), 301);
  }
  return env.ASSETS.fetch(new URL('/u/', url));
}
