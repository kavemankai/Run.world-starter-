# RUN.world setup and verification

Official references (review before changing platform code):

- Getting started: https://github.com/series-ai/venus-sdk-docs/blob/main/rundot-developer-platform/getting-started.md
- Local Playground: https://github.com/series-ai/venus-sdk-docs/blob/main/rundot-developer-platform/playground.md
- CLI releases and commands: https://github.com/series-ai/rundot-cli-releases
- RUN SDK package: https://www.npmjs.com/package/@series-inc/rundot-game-sdk

## Local setup

1. Install Node 22.16+ and npm, then `npm install`.
2. Run `npx rundot-sdk-setup` to review prompts and copy SDK documentation into the project; check any changes to `AGENTS.md` before accepting overwrites.
3. Install RUN CLI from official releases, open a new terminal, run `rundot --help`, then `rundot login`.
4. Run `npm run dev`; open Vite's local URL and sign in through Playground as required.
5. Once your game has a real name and scope, run `rundot init` and select build path `dist` to create its production game configuration.
6. Run `npm run build`, then `rundot deploy`. Publishing to the public listing is a separate intentional action.

## Build requirements

- Keep `base: './'` because RUN hosts game files under a subdirectory.
- Build output must be `dist/`; do not upload TypeScript source as if it were a compiled browser game.
- Vite uses `rundotGameLibrariesPlugin` + `rundotGamePlaygroundPlugin` in local dev.
- Firebase is a development-only requirement of Playground. RevenueCat is optional for Playground IAP and is intentionally absent here.
- Per-game generated `game.config.prod.json` and `game.config.playground.json` are git-ignored to prevent accidental reuse across cloned projects. Preserve them securely per game.

## Security

Never check `rk_` deploy keys or `pk_` Playground keys into Git. A Playground key is not a deploy key. Do not expose a development server carrying a headless Playground key on a LAN/public interface. `npm run dev:lan` is for anonymous local-device testing only and must not be used with `RUNDOT_PLAYGROUND_KEY` set.

## Deployment gate

Local `npm run build` passes -> manual browser check -> Playground SDK check -> phone check -> authenticated `rundot deploy` -> review uploaded build. No automatic publishing workflow is included; deployments must be intentional.
