# Minimum pre-deploy playtest checklist

- [ ] Fresh load has no console errors; SDK status is accurate.
- [ ] Start, control, complete a run, restart, pause and resume.
- [ ] Timer stops when tab is hidden, app loses focus or phone switches apps.
- [ ] Keyboard controls, mouse drag and touch drag work without scrolling.
- [ ] Try 360px phone portrait, 760px tablet and 1440px desktop viewport.
- [ ] UI never blocks core gameplay or places controls outside safe edges.
- [ ] Frame rate and asset loading checked on mid-range phone; no giant textures.
- [ ] Relative paths work under a nested URL, not only at `/`.
- [ ] Reinstall npm dependencies from committed lockfile; build succeeds.
- [ ] Playground sign-in and required SDK features checked using real test identities.
- [ ] Production upload reviewed separately; not just local Vite preview.
- [ ] Record at least three external tester runs with observed friction and bug list.
