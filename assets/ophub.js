// OP Game Hub accounts, shared by every page.
// Put <div id="ophub-account" class="oph-account"></div> where the Sign in button should go.
// Pages can also use window.OPHub: OPHub.ready (a promise of /api/me), OPHub.signIn(), OPHub.signOut().
(() => {
  const COLORS = ['#2ef6ff', '#ff2bd6', '#b6ff3b', '#ffb02e', '#9d6bff'];

  function avatar(name, big) {
    const el = document.createElement('span');
    let h = 0;
    for (const ch of String(name).toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    el.className = big ? 'oph-avatar oph-big' : 'oph-avatar';
    el.style.setProperty('--c', COLORS[h % COLORS.length]);
    el.textContent = String(name).charAt(0).toUpperCase();
    el.setAttribute('aria-hidden', 'true');
    return el;
  }

  function signIn(returnTo) {
    const back = returnTo || location.pathname + location.search;
    location.href = '/api/auth/login?return=' + encodeURIComponent(back);
  }

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    location.href = '/';
  }

  function toast(text) {
    const t = document.createElement('div');
    t.className = 'oph-toast';
    t.setAttribute('role', 'status');
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 6000);
  }

  function formatMonth(ym) {
    const [y, m] = String(ym).split('-').map(Number);
    if (!y || !m) return '';
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  }

  function renderChip(me) {
    const slot = document.getElementById('ophub-account');
    if (!slot || !me.available) return;
    slot.replaceChildren();
    if (!me.signedIn) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'oph-chip oph-signin';
      b.textContent = 'Sign in';
      b.title = 'Sign in with Google';
      b.addEventListener('click', () => signIn());
      slot.appendChild(b);
      return;
    }
    const a = document.createElement('a');
    a.className = 'oph-chip';
    if (me.user.username) {
      a.href = '/u/' + encodeURIComponent(me.user.username);
      a.append(avatar(me.user.username), document.createTextNode('@' + me.user.username));
      a.setAttribute('aria-label', 'Your profile: @' + me.user.username);
    } else {
      a.href = '/welcome/?return=' + encodeURIComponent(location.pathname);
      a.classList.add('oph-signin');
      a.textContent = 'Pick a name';
    }
    slot.appendChild(a);
  }

  const ready = fetch('/api/me', { headers: { accept: 'application/json' } })
    .then((r) => (r.ok ? r.json() : { available: false, signedIn: false }))
    .catch(() => ({ available: false, signedIn: false }));

  window.OPHub = { ready, signIn, signOut, avatar, formatMonth, toast };

  const start = () => {
    ready.then(renderChip);
    const q = new URLSearchParams(location.search);
    if (q.get('signin') === 'failed') {
      toast("Sign-in didn't work. Please try again.");
      q.delete('signin');
      const rest = q.toString();
      history.replaceState(null, '', location.pathname + (rest ? '?' + rest : '') + location.hash);
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
