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

## Saves

Each game saves progress in the player's browser (localStorage), so coins and unlocks stay on that device and browser only.
