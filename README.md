# OP Game Hub

Free browser games, served with GitHub Pages at **www.opgamehub.com**.

## Games

| Game | Folder | URL |
|---|---|---|
| Stickman Parkour | `stickman-parkour/` | https://www.opgamehub.com/stickman-parkour/ |

## Layout

```
index.html               hub home page (lists every game)
stickman-parkour/
  index.html             the whole game in one file
.nojekyll                tells GitHub Pages to serve files as-is
```

## Adding a new game

1. Make a new folder, e.g. `my-new-game/`, with the game's `index.html` inside.
2. Add a card for it in the root `index.html` (copy the Stickman Parkour card).
3. Add a row to the table above.
4. Commit and push to `main`. GitHub Pages republishes in a minute or two.

## Saves

Each game saves progress in the player's browser (localStorage), so coins and unlocks stay on that device and browser only.
