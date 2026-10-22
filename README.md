# Phone of Thrones

A top-down 2D **Shieldwall combat prototype** for RUN.world. Choose one of five weapons, fight three grunts, then face the captain. Includes one-enemy practice and captain-only modes, shields, blocking, parrying, guard breaks, heavy-hit stagger and retry.

This TypeScript/Canvas2D port replaces the Signal Run demo in this repository. It derives from [Phone-of-thrones-](https://github.com/kavemankai/Phone-of-thrones-) v0.8.0, commit `e7ab545b389cd052305c4bb9d3d1c8e30a81d499`. The original Godot repository is unchanged. Combat values follow the implemented prototype, including its later additions, rather than the older design brief.

## Run locally

Requires Node **22.16+** and npm.

```sh
npm ci
npm run dev
```

Open Vite's local URL. The official RUN.world Playground toolbar provides platform sign-in. For anonymous browser testing, choose **Play offline**, then **Enter the arena**. Offline play and successful SDK mock initialization do not establish authenticated RUN.world compatibility.

For a production browser preview:

```sh
npm run build
npm run preview
```

## Controls

| Action         | Touch / mouse                                       | Keyboard                     |
| -------------- | --------------------------------------------------- | ---------------------------- |
| Move / face    | Drag in the left control area                       | WASD / arrows                |
| Light attack   | Tap ATTACK and release before 0.20 s                | Tap J                        |
| Heavy attack   | Hold ATTACK until HEAVY READY, then release         | Hold J, release              |
| Guard / parry  | Hold BLOCK; raise just before impact to parry       | Hold K                       |
| Dodge          | DODGE; follows stick or goes backwards when neutral | Space                        |
| Pause / resume | Footer Pause / Resume                               | Escape pauses; Enter resumes |
| Start / retry  | Panel button                                        | Enter                        |

Leaving ATTACK cancels the charge. Dodge cancels charge/recovery but cannot cancel a committed swing. Every swing damages each target once. Daggers move through attacks; other weapons stop during wind-up/strike. Orange dashed wedges track you; solid red wedges lock direction. The visible sector is the actual damage area, tested against character circles.

The shield is available for Sword/Spear and costs 5% movement speed. All guards cover 360° as in the source; bare guards take chip damage. The captain's lunge breaks an ordinary bare guard, but a parry or shield stops it. A parry or heavy freezes an enemy and grants double damage on its waking hit; a plain block recoil has neither effect. Dagger parries kill grunts and remove 60 captain HP.

After the grunts die: a two-second breather, up to 30 HP restored, full dodge charges, then the captain. Defeat takes priority if both sides die together. Retry retains the chosen encounter/loadout and resets combat state. Backgrounding, focus loss, resize or a host pause freezes the fight and clears held input. Resume is explicit. Sound is generated locally after interaction and can be muted.

## Verification

```sh
npm run build                 # typecheck, deterministic tests, Vite, dist checks
npx playwright install chromium
npm run test:browser          # built preview; run build first
```

For an installed system Chromium, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/path/to/chromium`. CI installs Chromium and runs both commands. Browser results and traces are ignored by Git.

See [TEST_REPORT.md](TEST_REPORT.md) for evidence and limits. Current automated coverage includes all five weapons completing the full encounter with a scripted player at normal HP; this is a regression check, not a human playtest or a balance claim.

## Architecture and tuning

- `src/game/`: browser-free combat model, typed weapon/enemy/tuning data, vector/sector math and Canvas2D rendering adapter.
- `src/input/`: shared combat intent plus keyboard and independent multitouch pointers.
- `src/platform/run.ts`: SDK initialization and host pause/sleep hooks.
- `src/audio/`: small procedural sound player; no audio downloads.
- `src/main.ts` and `src/style.css`: menus, HUD, fixed 60 Hz loop, responsive portrait layout and safe areas.

Edit `src/game/data.ts` for balance. Distances use a 340×380 arena, uniformly scaled inside a 720×1280 reference view. The bottom 28% is reserved for controls. Top-down spawn positions and direct screen-aligned movement replace the source's isometric projection. Rendering caps pixel density at 2. No campaign, networking, saved progress, ads or purchases are implemented. RevenueCat/Firebase are development-only dependencies required by Playground tooling, not game services.

## RUN.world upload

The validated browser bundle is `dist/`; paths are relative for subdirectory hosting. Both official Vite plugins are retained. No RUN.world game has been registered or deployed by this change.

After authenticated Playground and physical-phone checks, install the official [RUN.world CLI](https://github.com/series-ai/rundot-cli-releases), then:

```sh
rundot login
rundot init      # a new Phone of Thrones game, build path dist
npm run deploy
```

Per-game configs and credentials stay out of Git. Uploading a private build and publishing publicly are separate actions. See [docs/RUN_PLATFORM.md](docs/RUN_PLATFORM.md), [docs/PLAYTEST_CHECKLIST.md](docs/PLAYTEST_CHECKLIST.md) and [docs/HANDOVER.md](docs/HANDOVER.md).
