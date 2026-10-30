# Portfolio Quest

A portfolio you play instead of scroll: a GBA-era top-down world where a
visitor walks a character out of their house and across a small town, and
each building is a section of the portfolio.

| Place | What is inside |
| --- | --- |
| **Home** | Where you start. A walkable room with a photo frame on the wall, and the game's tutorial. |
| **Skill Centre** | Skills, as RPG stat sheets. |
| **Story Theatre** | About you — the work, and the person. |
| **Project Builds** | Projects, with source and live links. |
| **Contact Centre** | Email, phone, socials, all copyable. |

There are five badges to collect: one per building, and one hidden in the
town.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run typecheck  # tsc --noEmit
npm run build      # typecheck, then build to dist/
npm run preview    # serve the built output
```

## Making it yours

Two things, and nothing else.

### 1. Your content

Everything a visitor reads lives in **[`src/content/portfolio.ts`](src/content/portfolio.ts)**.
It is one typed object: your name and tagline, skill groups, story chapters,
projects, contact details, and the flavour text for the signposts and the
townsfolk. Anything written in SHOUTING CAPS is a placeholder.

The panels and the plain-text page both read from that file, so you never
have to touch game code to change what the portfolio says.

A note on `skills[].level`: it is 0–100 and drives the length of the stat
bars. A wall of 95s reads as noise. A varied spread reads as a real person.

### 2. Your photo

Save it as **`public/photo/me.jpg`**. That is the whole step. Until the file
exists, the frame in your house shows a short note telling you where to put
it rather than a broken image.

Square-ish works best — the frame centre-crops to a square. Anything from
400×400 up is plenty.

## Controls

| Key | Action |
| --- | --- |
| `W` `A` `S` `D` or arrows | Walk |
| Hold `Shift` | Run |
| `E` / `Enter` | Read signs, talk to people, enter buildings |
| `M` | Map — and fast travel to buildings you have found |
| `H` | Show the tutorial again |
| `Esc` | Close anything |
| Click the ground | Walk there |

Touch devices get an on-screen D-pad automatically.

## How it is built

**Vite + React + TypeScript, with a hand-rolled Canvas 2D tile engine.**

No game framework. The logic needed here is small and well understood — a
tile grid, grid-stepped movement, tile collision, a follow camera, scene
warps and a few NPCs — and a framework would have added about a megabyte for
features this does not use. Meanwhile the project is *mostly* rich content
UI, which React and the DOM handle far better than a canvas: the panels get
selectable text, real anchors, working scrollbars and screen-reader support
for free.

### There are no image files

Every tile, building and character is defined as pixel data in TypeScript
over a shared palette in [`src/game/art/palette.ts`](src/game/art/palette.ts),
and rasterised into an in-memory sprite atlas at boot. Geometric things
(tiles, buildings, furniture) are *drawn* with a small pixel DSL; characters
are authored as literal pixel strings. Retinting the entire town is an edit
to the palette file.

The only real image in the project is your photo.

### Things worth knowing before you change it

- **`src/state/useGameStore.ts` is the only bridge between the game loop and
  React**, and it carries *discrete events* only — a panel opened, a badge
  earned, walking started. Nothing continuous. Putting the player's position
  in the store would re-render the whole interface sixty times a second.
  The corner minimap is the one component that tracks a moving value, and it
  does so by painting imperatively from the engine's 10Hz position feed. If
  you change it, check with the React DevTools profiler: walking across the
  town should produce no renders at all.

- **Movement is grid-locked, not free.** The player's position is
  authoritative as a *tile*, and the pixel position is interpolated across
  the step. `PIVOT_MS` in [`src/game/player.ts`](src/game/player.ts) is the
  single most important number for feel: it is the beat where tapping a
  direction turns you without moving, which is what lets you stand still and
  look at something.

- **Interpolation is linear on purpose.** Easing each step looks smoother in
  isolation, but when steps are chained every tile boundary becomes a
  slow-fast-slow pulse and walking visibly throbs.

- **The maps are authored as text.** See
  [`src/game/world/maps/town.ts`](src/game/world/maps/town.ts) — you can read
  the shape of the town in the source. The treeline and woodland are
  scattered procedurally from a fixed seed.

- **`assertSceneConnected` runs in dev only and will throw at boot** if any
  sign, NPC, door or spawn ends up walled off. This is not paranoia: the
  trees are placed procedurally, and it has already caught a potted plant
  that sealed off one half of a bed. If you move furniture and the app
  refuses to start, read the error — it names the tile.

### Layout

```
src/
├── content/portfolio.ts   ← your content; the only file you need to edit
├── boot/                  loader, spiral wipe, hero screen
├── game/
│   ├── engine.ts           the controller: loop, triggers, scenes
│   ├── player.ts npc.ts    grid-stepped movement
│   ├── renderer.ts         pixel-perfect draw, baked ground, depth sorting
│   ├── collision.ts        walkability, pathfinding, the connectivity check
│   ├── audio.ts            synthesized chiptune and SFX
│   ├── art/                palette, pixel DSL, sprites, atlas
│   └── world/maps/         town.ts and home.ts
├── state/                 the zustand store and guarded localStorage
└── ui/                    HUD, map, dialogue, and the four panels
```

## Accessibility

A game is a hostile way to deliver a portfolio to some people, so the hero
screen offers **"or read it as a plain page"** — the same content from the
same source file, as one scrollable document. It is also the automatic
fallback if the world fails to build for any reason.

Within the game: every panel is real DOM with focus management and `Esc` to
close, the keyboard never gets trapped, `prefers-reduced-motion` shortens
the transitions and stops the idle animations, and audio starts muted-able
with the choice persisted.

## Deploying

It is a static build. `npm run build` and serve `dist/`.

`vercel.json` is included for Vercel. For Netlify or GitHub Pages, publish
`dist/` with a rewrite of all paths to `/`.

## Saved state

Badges, the mute setting, and whether the tutorial has been seen persist to
`localStorage`. Every access is wrapped in `try/catch`, because touching
`localStorage` *throws* in a private window with site data blocked — the
game must work identically when all of it comes back empty.
