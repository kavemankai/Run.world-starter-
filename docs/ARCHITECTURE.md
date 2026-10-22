# Architecture and extension points

## Current starter

- `src/main.ts`: bootstraps UI, local input handling, fixed-step loop, SDK status and lifecycle.
- `src/game/core.ts`: deterministic game state, controls and win/loss rules; no browser dependencies.
- `src/game/render.ts`: sample Canvas2D renderer; disposable for real games.
- `src/platform/run.ts`: the only module importing the RUN SDK API. Add typed platform integration here as needed.
- `src/style.css`: responsive wrapper and overlays, not a framework commitment.
- `tests/core.test.mjs`: deterministic model tests using Node 22's native test runner.
- `vite.config.ts`: official RUN.world dev plugins, subdirectory-safe paths and ES2022 build.

## Core contract

Game simulation runs at fixed 60 Hz using elapsed-time accumulation with a catch-up cap. Rendering runs at display rate. Large background-tab time jumps are intentionally discarded, and the app pauses when focus is lost.

Inputs: WASD/arrow keys or a pointer target mapped from actual canvas bounds into logical 720x1000 coordinates. Touch and mouse share Pointer Events. Rendering uses device pixel ratio capped at 2 to avoid huge mobile framebuffers.

## Swapping to PixiJS

Keep `src/platform/run.ts`, CI, Vite plugins, lifecycle, tests and core model. Replace `renderGame` and Canvas2D setup with a PixiJS Application/render adapter. Avoid importing PixiJS into pure game logic; adapt pointer inputs at the renderer boundary.

## Swapping to Three.js

Keep platform bootstrap, CI, game model and timing. Replace Canvas2D setup with a Three.js scene, camera, WebGLRenderer and raycast or virtual-stick input adapter. Handle WebGL context loss and capped DPR; build actual assets as GLB/GLTF where appropriate. Mobile benchmark before adding post-processing.

## Online features

No cloud persistence or multiplayer is implemented in the sample. To add either, consult the installed SDK docs for current API signatures, implement integration in `src/platform`, add user-facing error handling, and verify in RUN.world Playground with distinct test users. Never equate local mocks with platform verification.
