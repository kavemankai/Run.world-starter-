# Phone of Thrones architecture

## Simulation

`Game` owns the encounter phase, mode, loadout, hero, enemies, commitment controller, intermission, outcome and sound-event queue. `start` resets all encounter state while retaining omitted mode/loadout arguments. `pause` and `resume` clear input; a cancelled charge never becomes an attack after resuming.

`Hero` and `Enemy` run explicit state machines. The pure TypeScript model has no DOM, Canvas, SDK or audio dependencies. Tuning, five weapon definitions, grunt/captain profiles and attack data live in `data.ts`. The source is Godot v0.8.0 at e7ab545; the latest implemented mechanics take precedence over its older design document.

The browser loop accumulates fixed 1/60 s steps, capped at 0.1 s catch-up. `Game.step` also subdivides larger calls to avoid skipping short active windows. Enemies resolve first, then the hero, body separation and encounter transitions. Defeat takes priority. One-step input flags are consumed even when the action is refused. Dead/staggered enemies release commitment slots; captain combos retain one slot between strikes. At most two attacks are committed concurrently.

## Geometry and presentation

The top-down simulation uses direct screen axes and a 340×380 rectangular arena. The hero spawns at (170,300), enemies at (170,80), (90,95), (250,95). The captain appears at the farther end. These replace only the source's isometric coordinate mapping and spawn orientation.

Damage uses analytic sector/circle contact. The renderer draws the same sector through Canvas arcs with the exact origin, facing, reach and arc. Captain lunge telegraphs remain anchored at the strike origin while its body slides forward. Canvas2D renders procedural characters, effects and arena; no external art is fetched.

The logical viewport is 720×1280. Arena scaling is uniform; input converts actual element bounds back to logical coordinates. DOM controls occupy the bottom 28%, preserving independent pointer captures for stick, attack, block and dodge. Device and SDK safe-area CSS variables protect the whole shell; a ResizeObserver pauses on stage-size changes. Pixel density is capped at 2. Portrait is the design target; very short landscape windows can scroll.

## Browser and platform boundary

`CombatInput` merges keyboard/touch held states and one-step edges. `BrowserInput` maps DOM events, cancels slide-off attacks and resets pointer captures. Keyboard and touch share combat rules. The DOM shell manages menu, mode/loadout choice, pause/result panels, HUD and explicit offline selection.

The platform adapter awaits SDK initialization and subscribes to host pause/sleep. Development/mock initialization is labelled local and still requires choosing offline play; it is not reported as a verified platform connection. Initialization failure/timeout leaves offline play available. Host resume never starts a fight automatically. Official libraries/Playground Vite plugins, relative paths and `dist` output are preserved.

Audio consumes discrete simulation events, starts after interaction, caps simultaneous voices, suspends on pause and provides a session-only mute toggle. No persistent settings or platform storage are used.

## Checks

Native Node tests exercise model behavior and scripted complete encounters. Playwright tests exercise the built browser UI, real Chromium touch events, keyboard fights, pause, viewport/safe-area layout and nested asset hosting. CI uses the committed lockfile. Authenticated Playground behavior, deployment and real phone performance remain distinct verification gates.
