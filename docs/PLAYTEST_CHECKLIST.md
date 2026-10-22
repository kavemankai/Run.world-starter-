# Phone of Thrones pre-deploy playtest

Automated local evidence lives in ../TEST_REPORT.md. Complete these on real devices and in the host before deployment.

- [ ] Sign into Playground; verify SDK status reflects the real environment rather than mock initialization.
- [ ] Play all weapons and all three modes. Win, lose and retry repeatedly; retry retains loadout/mode and resets HP, guard, enemies and timers.
- [ ] Move and use action buttons together. Test multi-finger handoffs, sliding off ATTACK, touch cancellation and phone calls/app switching.
- [ ] Check light/heavy differentiation at 0.20 s, dodge responsiveness, guard/parry timing and dagger movement through attacks.
- [ ] Confirm the captain's lunge/chain telegraphs explain every hit. Check readability when enemies overlap.
- [ ] Check pause/resume with actual RUN.world overlays, background/foreground, resize/orientation and device sleep. No held action may fire on resume.
- [ ] Inspect host toolbar, notches and gesture-bar safe areas on Android and iOS.
- [ ] Check audible sound unlock, mute, pause suspension and resume; automated checks do not establish sound quality.
- [ ] Measure sustained performance on a mid-range phone. Target 60 FPS; minimum 30. Record model, browser/OS and build.
- [ ] Get at least three human runs. Record accidental heavies, missed dodges, confusion, encounter length and desire to retry. Scripted-player times are not human playtest data.
- [ ] Review a private RUN.world upload separately from local browser success. Publish only intentionally.
