# Phone of Thrones — browser port v0.9.0

## Delivered

Full top-down TypeScript/Canvas2D port of Phone-of-thrones- e7ab545 (v0.8.0) in Run.world-starter-. Five weapons, Sword/Spear shields, light/heavy attacks, movement ramps, dodge charges, block/parry, guard breaks, stagger, three modes, captain chains, intermission and retry. Original Godot repository unchanged.

The starter demo has been replaced. Official RUN.world Vite plugins, SDK boundary, relative paths and dist validation remain. All art/audio is procedural; game logic makes no service calls. Browser control pointers are independent and focus/host pauses clear held input. Host/device safe areas are supported.

## Evidence

See ../TEST_REPORT.md for commands, versions and outcomes. The build, deterministic model checks and desktop/mobile-size Chromium checks have passed locally. No claim of phone performance or authenticated platform operation follows from these results.

SDK setup copied bundled official docs to ignored `rundot/docs/`; agent-file and CLI-hook modifications were declined. Reviewed initialization, Playground, runtime restrictions, safe-area and lifecycle references. Added the optional RevenueCat development package because Playground's missing-dependency screen blocked the local page even though this game has no IAP.

## Remaining verification

1. Sign into RUN.world Playground and test SDK initialization, actual host pause/sleep and host insets. The local mock is explicitly labelled; no account or game ID was supplied.
2. Play on physical Android/iOS devices. Confirm multitouch, audio, notches, readability and at least 30 FPS; target 60. Judge timing and balance with people, especially 0.20 s heavy input and generous parry windows.
3. Register a new Phone of Thrones game with authenticated RUN CLI, upload the validated `dist/`, and review the hosted build. Public publishing is separate and was not performed.

The previous starter's GitHub instructions remain useful for repository administration, but this branch is now a game rather than a reusable empty template. Source tuning deliberately retains the existing 360° guard and dagger execute behavior. No source balance or larger Shieldwall features were added.
