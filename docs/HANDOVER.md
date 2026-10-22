# Starter handover — Build A

## Scope

A reusable, engine-agnostic RUN.world game-shell repository. The bundled mini-game **Signal Run** is demonstration code and is not a production game.

## Implemented

- TypeScript/Vite SDK-hosted app with RUN.world libraries + Playground plugins.
- Explicit RUN SDK initialization; visible failure state; user-triggered offline demo fallback.
- Responsive Canvas2D sample, keyboard/mouse/touch input, logical viewport and capped DPR.
- Fixed-step testable game simulation, 10-signal win condition, 40-second timer and pause/loss states.
- Node native unit tests, GitHub Actions CI, production `dist` path validator.
- Codex instructions (`AGENTS.md`), platform and architecture docs, game brief template.

## Verification

Record completed commands and their results here; don't equate a source review with a successful build.

- Native Node tests: **10/10 passed** using Node 22.16.0
- Pure core typecheck: **passed** with globally available `tsc -p tsconfig.core.json --noEmit`
- Full npm install / TypeScript / Vite production build: **not run**; npm registry unavailable in this environment (`EAI_AGAIN registry.npmjs.org`).
- Browser / mobile / RUN Playground / deployment: Not yet verified.

## Production TODO for each game

1. Run `npm install`, then commit generated `package-lock.json` for deterministic CI (`npm ci`).
2. Copy `docs/GAME_BRIEF.template.md` to `docs/GAME_BRIEF.md`.
3. Choose renderer based on the game (PixiJS for 2D, Three.js for 3D, etc).
4. Remove or replace Signal Run sample and its sample tests with the new game.
5. Run SDK setup and review official API manuals.
6. Authenticate and initialize **each new game** separately with RUN CLI.
7. Build, run browser playtests, verify in Playground and deploy intentionally.

## Known limits

- Package installation and full SDK-driven production compilation require npm registry access.
- No deployed RUN game has been created by this repository.
- No multiplayer, platform storage, asset pipeline implementation or IAP logic exists; these are future game-specific modules.
