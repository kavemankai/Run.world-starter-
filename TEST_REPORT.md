# Phone of Thrones browser port — verification

Build: **0.9.0**, 22 October 2026. Source: Phone-of-thrones- v0.8.0, e7ab545b389cd052305c4bb9d3d1c8e30a81d499. Environment: Linux cloud workspace, Node 24.19.0, RUN SDK 5.29.1, Vite 7.3.7, headless system Chromium via Playwright.

## Automated evidence

- `npm run build`: **passed**. TypeScript, **56 deterministic tests**, Vite production build and relative-path/dist validation. Bundle totals approximately **0.39 MiB** uncompressed, including SDK code.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser`: **6 browser scenarios passed** against the built production preview.
- `git diff --check`: passed.

Combat checks cover all five weapons' light/heavy damage and reach, one hit per target, movement/recharge differences, shield eligibility, dagger movement and parry execute, spear lunge, attack cancellation/refusal, immunity boundaries, guard cost/regen/break, parry and stagger behavior, enemy tracking/direction lock, attack slots, captain patterns/chains, lunge origin, encounter progression, defeat priority, reset and pause.

A deterministic scripted player used ordinary movement/attack/dodge input at normal 100 HP to beat three grunts and the captain with every weapon. Observed simulation times: Sword 11.9 s, Spear 16.2 s, Axe 12.8 s, Daggers 17.3 s, Zweihander 14.0 s. These establish completion paths, not human difficulty, phone performance or enjoyment.

Browser scenarios cover:

1. All weapon menus, shield availability, 320×568 / 390×844 / 720×1280 / 810×1080 / 1280×800 layouts and injected host safe-area CSS insets.
2. Real keyboard movement, pause with a held attack, frozen time, explicit resume and mute controls; no uncaught page errors in that flow.
3. An actual keyboard-controlled practice-fight victory, result display and retry restoring HP/time.
4. Idle-player defeat, change-loadout flow and captain-only start.
5. Chromium touch-event multitouch: simultaneous stick/attack, movement while charging, slide-off cancellation, block/dodge, touch cancellation and focus-loss pause.
6. Loading the production bundle and starting a game under `/hosted/game/` to exercise relative asset paths.

Browser screenshots were inspected for the menu, arena and controls. Repeatable tests save viewport/gameplay screenshots locally under ignored `test-results/`; traces/screenshots are retained on browser test failure.

## Platform and device limits

The development server starts with both official plugins and no missing-dependency screen; its Playground shell requires sign-in before mounting the game. No authenticated RUN.world Playground session, RUN game registration, deployment or publication was performed. Production-preview SDK initialization uses its local/mock environment and is labelled accordingly; the player explicitly chooses offline play. Reviewed official bundled documentation and retained the official plugins, initialization, safe-area variables and host pause/sleep subscriptions, but actual host behavior still requires account-backed testing.

No physical phone, native RUN.world app, mobile GPU benchmark or human combat playtest was used. Chromium mobile-size/touch automation does not establish device performance, touch feel, audio quality or SDK compatibility. The 60 FPS target / 30 FPS floor is unmeasured. Very short landscape windows may scroll because this is a portrait game.
