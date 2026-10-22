# RUN.world Game Starter

**Codex-first, engine-neutral TypeScript starter for local RUN.world game development.**

This is a reusable repository foundation, **not** a RUN.world game engine. It ships a small playable Canvas2D example (Signal Run) to prove input, scene rendering, fixed-step game logic, pause handling and win/loss wiring. For each real project, replace the demo and choose PixiJS/Three.js if necessary.

## Quick start

Requires **Node.js 22.16+**, npm, a RUN.world account for Playground features and the official `rundot` CLI for deployment.

```bash
npm install
npm run dev
```

Open the Vite local URL. RUN Playground's toolbar handles account sign-in; the sample explicitly reports any SDK connection failure and can be played in deliberate offline-demo mode. That mode is **not** evidence of SDK compatibility.

To typecheck, test, validate the build and create a shipping bundle:

```bash
npm run build
```

### Create a new game

1. Create a new repository from this starter (once uploaded to GitHub, mark it as a **template repository**) or copy these files into a new directory.
2. `npm install` and commit the generated `package-lock.json` so CI can later use `npm ci`.
3. `npm run new:game -- "My Game Name"` (changes package name and HTML title only).
4. Copy `docs/GAME_BRIEF.template.md` to `docs/GAME_BRIEF.md` and fill in the design decisions and Build A scope.
5. Ask Codex to read `AGENTS.md` and `docs/GAME_BRIEF.md`, replace the sample with the smallest playable vertical slice and keep platform/test infrastructure.
6. Run `npx rundot-sdk-setup` and review each prompted change. Official docs are copied locally for agents; do not blindly overwrite your `AGENTS.md`.
7. Use local browser tests and RUN.world Playground for all SDK-dependent functionality.

### Deploy (not automatic)

Install the official CLI from https://github.com/series-ai/rundot-cli-releases and run:

```bash
rundot login
rundot init          # once per individual game; use dist as build directory
npm run deploy       # build/tests then rundot deploy
```

RUN.world creates `game.config.prod.json` when you initialize a game. It is intentionally git-ignored in the template so cloned games don't target the starter's ID. Keep a separate configuration for each game. Deployment is not the same as publishing publicly.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite + RUN.world Playground local server |
| `npm run dev:lan` | LAN preview (never use with headless Playground key) |
| `npm test` | Fast deterministic Node.js core tests |
| `npm run typecheck` | TypeScript validation |
| `npm run build` | Typecheck + tests + bundle + dist path check |
| `npm run preview` | Preview already-built production files |
| `npm run deploy` | Validated build + authenticated `rundot deploy` |
| `npm run new:game -- "Title"` | Rename package and browser title |

## Layout

```text
src/
  main.ts                responsive shell, input, loop and lifecycle
  game/core.ts           deterministic, browser-free game state
  game/render.ts         replaceable Canvas2D demo renderer
  platform/run.ts        isolated RUN.world SDK bootstrap
  style.css              responsive layout
tests/core.test.mjs      native Node tests (no extra test framework)
docs/                   architecture, SDK, checklist, game brief and handover
.github/workflows/ci.yml automatic validation
AGENTS.md                Codex development contract
vite.config.ts           official SDK Vite plugins and relative base path
```

## Template philosophy

- Engine neutral by default. Choose PixiJS for sprite-centric 2D, Three.js for WebGL 3D, or other browser rendering only when warranted.
- Platform isolated; don't tie the core loop to storage, multiplayer or account state unless required.
- Do not claim user playtesting from passing unit tests.
- Do not commit account credentials, arbitrary game IDs, temporary SDK docs or megabytes of unreviewed art.
- No ads, purchases, tracking or monetization are included in the foundation.

See `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/RUN_PLATFORM.md`, `docs/HANDOVER.md` and `docs/PUBLISH_GITHUB.md` before expanding the project.

### Upstream requirements verified against official guides

- [RUN.world Getting Started](https://github.com/series-ai/venus-sdk-docs/blob/main/rundot-developer-platform/getting-started.md)
- [Testing Locally With Playground](https://github.com/series-ai/venus-sdk-docs/blob/main/rundot-developer-platform/playground.md)
- [RUN.world CLI](https://github.com/series-ai/rundot-cli-releases)
- [RUN.world SDK npm package](https://www.npmjs.com/package/@series-inc/rundot-game-sdk)
