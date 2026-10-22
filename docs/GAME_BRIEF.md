# Phone of Thrones — RUN.world port

Port source commit e7ab545b389cd052305c4bb9d3d1c8e30a81d499 (Godot prototype v0.8.0) from https://github.com/kavemankai/Phone-of-thrones-.

Build the complete combat prototype in TypeScript and Canvas2D: five weapons, shields, block/parry, guard breaks, stagger, three encounter modes and captain patterns. Replace isometric drawing with top-down 2D and direct screen-space movement. Preserve source tuning, use 340×380 simulation units, portrait 720×1280 reference, bottom 28% controls, uniform arena scaling and independent multitouch pointers.

Acceptance: deterministic combat checks pass; desktop/touch controls, pause/resume, menus and retry work in browser; Vite bundle uses relative paths and official RUN.world plugins. Browser success is separate from authenticated Playground/device verification. No campaign, persistence, multiplayer or monetization. No public deployment in this change.
