# OP Game Hub

Overpowered free browser games for kids and teens, at **www.opgamehub.com**.
Hosted on **Cloudflare Pages**, built straight from the `main` branch of this repo. Every push to `main` goes live in a minute or two.

## Games

| Game | Folder | URL |
|---|---|---|
| Stickman Parkour | `stickman-parkour/` | https://www.opgamehub.com/stickman-parkour/ |

## Layout

```
index.html                 hub home page (lists every game)
404.html                   real "not found" page (stops Cloudflare serving the home page for bad URLs)
robots.txt                 lets search engines and AI crawlers in, points to the sitemap
sitemap.xml                every page, for Google and Bing
llms.txt                   plain-text summary of the site for AI assistants
favicon.svg                browser tab icon
apple-touch-icon.png       home-screen icon on phones
og-image.jpg               link-preview image for the hub (1200x630)
stickman-parkour/
  index.html               the whole game in one file, plus its About / FAQ section
  og-image.jpg             link-preview image for the game (1200x630)
assets/
  ophub.css                shared design tokens + account chip/page styles (classes start with oph-)
  ophub.js                 shared account script: Sign in chip, window.OPHub
welcome/index.html         pick or change your display name
u/index.html               player profile page, served at /u/<name>
privacy/index.html         what we keep when someone signs in
functions/                 server code (Cloudflare Pages Functions) for sign-in
  _lib/http.js             cookies, sessions, small helpers (not a route)
  _lib/names.js            display-name rules + rude-word filter (not a route)
  api/auth/login.js        GET  /api/auth/login     -> Google sign-in screen
  api/auth/callback.js     GET  /api/auth/callback  <- Google sends players back here
  api/auth/logout.js       POST /api/auth/logout
  api/me.js                GET  /api/me             -> who is signed in
  api/username.js          GET  /api/username?check=  /  POST /api/username
  api/users/[name].js      GET  /api/users/<name>   -> public profile (name + join month)
  api/account/delete.js    POST /api/account/delete
  u/[name].js              /u/<name> -> profile page, or 404 if nobody has that name
schema.sql                 database tables (paste into the D1 console once)
```

## Adding a new game

1. Make a folder, e.g. `my-new-game/`, with the game's `index.html` inside.
2. In that page's `<head>`, copy the block between `<!-- SEO -->` and `<!-- /SEO -->` from `stickman-parkour/index.html` and change the title, description, URLs and image.
3. Give the page some real text (how to play, features, FAQ). Canvas games are invisible to search engines without it.
4. Add a 1200x630 `og-image.jpg` in the game folder.
5. Add a card for it on the hub (`index.html`), and a `ListItem` in the hub's `ItemList` structured data.
6. Add the URL to `sitemap.xml` and a line to `llms.txt`.
7. Add a row to the table above, then commit and push to `main`.

## SEO / GEO rules for this site

- One `<h1>` per page. Unique `<title>` and `<meta name="description">` on every page.
- Every page has a `<link rel="canonical">` with the full `https://www.opgamehub.com/...` URL (trailing slash for folders).
- Keep the JSON-LD blocks (`WebSite`, `Organization`, `ItemList` on the hub; `VideoGame`, `BreadcrumbList`, `FAQPage` on games) in step with the visible text.
- Brand: "OP" means overpowered. Audience is kids and teens, global English. No personal names; the site is presented as OP Game Hub.
- Account pages (`/welcome/`, `/u/...`) are `noindex`. Player profiles must never be indexed.

## Accounts (optional Sign in with Google)

Playing never needs an account. Signing in gives a player a display name like `@icebot566` and a profile page at `/u/icebot566`.

- **Stored per player:** Google's account number for them (`sub`), the display name, the join date (shown as month only). Sessions are stored as hashes. **Never stored:** email, real name, photo, age.
- **Names:** 3 to 20 characters, letters/numbers/_, start with a letter, max 5 digits in a row, unique ignoring capitals. Rude and reserved words are blocked in `functions/_lib/names.js`. Add words there.
- **Renames:** one free fix after picking, then once every 30 days. Changing only capital letters is always allowed.
- **Before setup is done**, `/api/me` answers `available: false` and pages hide the Sign in button, so the site works exactly as before.

### One-time setup

**Google** ([console.cloud.google.com](https://console.cloud.google.com))
1. Create a project called `OP Game Hub`.
2. Open **Google Auth Platform** and click **Get started**. App name `OP Game Hub`, audience **External**, add your contact email.
3. **Branding:** home page `https://www.opgamehub.com/`, privacy policy `https://www.opgamehub.com/privacy/`, authorised domain `opgamehub.com`. Skip the logo, because uploading one can send the app for Google review.
4. **Clients → Create client → Web application.** Under **Authorised redirect URIs** add both of these:
   - `https://www.opgamehub.com/api/auth/callback`
   - `https://opgamehub.com/api/auth/callback`
5. Copy the **Client ID** and **Client secret** straight away. Google may only show the secret once.
6. **Audience → Publish app**, so anyone can sign in, not just test users.

**Cloudflare** ([dash.cloudflare.com](https://dash.cloudflare.com))
1. **Storage & databases → D1 SQL database → Create**, and name it `ophub-db`.
2. Open it, go to **Console**, paste all of `schema.sql`, and run it.
3. **Workers & Pages →** this Pages project **→ Settings → Bindings → Add → D1 database.** Set the variable name to `DB` and pick `ophub-db`.
4. **Settings → Variables and Secrets.** Add `GOOGLE_CLIENT_ID` as type *Text* and `GOOGLE_CLIENT_SECRET` as type *Secret*.
5. Deploy: push or merge to `main`, or use **Retry deployment**. New bindings only apply to new deployments.
6. Recommended: **Rules → Redirect Rules →** redirect `opgamehub.com` to `www.opgamehub.com`, so everyone signs in on one address.

### Using accounts from a game

Link `/assets/ophub.css` and `/assets/ophub.js`. Then put `<div id="ophub-account" class="oph-account"></div>` where the Sign in chip should appear. From code: `OPHub.ready.then(me => me.signedIn && me.user.username)`.

## Saves

Each game saves progress in the player's browser (localStorage), so coins and unlocks stay on that device and browser only. Cloud saves for signed-in players are planned.
