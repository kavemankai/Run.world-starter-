import test from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/game/core.ts";
import { Hero } from "../src/game/hero.ts";
import { Enemy, EncounterController } from "../src/game/enemy.ts";
import { WEAPONS, GRUNT, CAPTAIN, T } from "../src/game/data.ts";
import { CombatInput } from "../src/input/combat.ts";
import { circleInSector, v, length, sub, unit, mul } from "../src/game/math.ts";
const near = (a, b, tolerance = 0.001) =>
  assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);
function advance(seconds, fn, dt = 0.005) {
  for (let t = 0; t < seconds - 1e-8; t += dt) fn(Math.min(dt, seconds - t));
}
function rig(index = 0, shield = false) {
  const h = new Hero(WEAPONS[index], shield),
    input = new CombatInput(),
    controller = new EncounterController();
  const e = new Enemy(0, v(170, 245), { ...GRUNT, hp: 1000 }, h, controller);
  const step = (dt) => {
    h.step(dt, input, [e]);
    input.endStep();
  };
  return { h, input, e, step };
}
function swing(r, hold = 0.1) {
  r.input.pressAttack(false);
  r.step(0.005);
  advance(hold, r.step);
  r.input.releaseAttack(false);
  r.step(0.005);
}
for (const [hold, heavy] of [
  [0.1, false],
  [0.185, false],
  [0.21, true],
  [0.8, true],
]) {
  test(`hold ${hold}s selects ${heavy ? "heavy" : "light"} only on release`, () => {
    const r = rig();
    swing(r, hold);
    assert.equal(r.h.heavy, heavy);
    assert.equal(r.h.state, "windup");
  });
}
test("holding never auto-fires; sliding off cancels without a strike", () => {
  const r = rig();
  r.input.pressAttack(true);
  advance(3, r.step);
  assert.equal(r.h.state, "charging");
  near(r.e.hp, 1000);
  r.input.cancelAttack(true);
  r.step(0.005);
  assert.equal(r.h.state, "idle");
  advance(1, r.step);
  near(r.e.hp, 1000);
});
for (let index = 0; index < WEAPONS.length; index++) {
  const w = WEAPONS[index];
  for (const heavy of [false, true])
    test(`${w.name} ${heavy ? "heavy" : "light"} damages each target once and respects reach`, () => {
      const r = rig(index);
      r.e.pos = v(170, 300 - (heavy ? w.heavy : w.light).reach + 5);
      swing(r, heavy ? 0.3 : 0.08);
      const attack = heavy ? w.heavy : w.light;
      advance(attack.windup + 0.005, r.step);
      near(r.e.hp, 1000 - attack.damage);
      advance(attack.active + attack.recover + 0.1, r.step);
      near(r.e.hp, 1000 - attack.damage);
      const far = rig(index);
      far.e.pos = v(170, 300 - attack.reach - 17 - (heavy ? attack.lunge : 0));
      swing(far, heavy ? 0.3 : 0.08);
      advance(attack.windup + attack.active + attack.recover + 0.1, far.step);
      near(far.e.hp, 1000);
    });
  test(`${w.name} walking speed, dodge count and recharge retain source balance`, () => {
    const r = rig(index);
    r.h.pos = v(30, 190);
    r.input.keyMove = v(1, 0);
    advance(0.2, r.step);
    const start = { ...r.h.pos };
    advance(0.1, r.step);
    near(r.h.pos.x - start.x, 195 * w.move * 0.1);
    assert.equal(r.h.maxDodges, 2 + w.extraDodges);
    near(r.h.rechargeTime, 1.4 * w.recharge);
    r.input.keyMove = v();
    r.input.dodgePressed = true;
    r.step(0.005);
    assert.equal(r.h.dodges, r.h.maxDodges - 1);
    advance(r.h.rechargeTime - 0.02, r.step);
    assert.equal(r.h.dodges, r.h.maxDodges - 1);
    advance(0.03, r.step);
    assert.equal(r.h.dodges, r.h.maxDodges);
  });
  test(`${w.name} shield eligibility`, () => {
    const h = new Hero(w, true);
    assert.equal(h.shield, w.oneHanded);
  });
}
test("only daggers move during wind-up and active frames; committed facing stays locked", () => {
  for (let i = 0; i < 5; i++) {
    const r = rig(i);
    swing(r, 0.3);
    r.input.keyMove = v(1, 0);
    const before = { ...r.h.pos };
    r.step(0.015);
    assert.equal(r.h.state, "windup");
    near(r.h.facing.x, 0);
    assert.equal(r.h.pos.x > before.x, i === 3);
  }
});
test("spear heavy lunges 35 units; axe heavy has wider coverage than sword", () => {
  const r = rig(1);
  r.e.pos = v(30, 30);
  swing(r, 0.3);
  const start = r.h.pos.y;
  advance(r.h.attack.windup + r.h.attack.active + 0.015, r.step);
  near(start - r.h.pos.y, 35, 0.1);
  assert.ok(circleInSector(v(), v(1, 0), 90, 200, v(-5, 60), 0));
  assert.ok(!circleInSector(v(), v(1, 0), 95, 140, v(-5, 60), 0));
});
test("one swing hits multiple targets but never hits a target behind the sword", () => {
  const h = new Hero(),
    input = new CombatInput(),
    ctrl = new EncounterController();
  const enemies = [v(165, 245), v(180, 245), v(170, 355)].map(
    (p, i) => new Enemy(i, p, GRUNT, h, ctrl),
  );
  const step = (dt) => {
    h.step(dt, input, enemies);
    input.endStep();
  };
  input.pressAttack(false);
  advance(0.08, step);
  input.releaseAttack(false);
  advance(0.6, step);
  assert.deepEqual(
    enemies.map((e) => e.hp),
    [20, 20, 30],
  );
});
test("dodge invulnerability ends at .16 seconds, post-hit immunity ends at .35", () => {
  const r = rig();
  r.input.dodgePressed = true;
  r.step(0.005);
  r.h.time = 0.158;
  assert.equal(r.h.takeHit(12), false);
  r.h.time = 0.162;
  assert.equal(r.h.takeHit(12), true);
  near(r.h.hp, 88);
  advance(0.34, r.step);
  assert.equal(r.h.takeHit(12), false);
  advance(0.02, r.step);
  assert.equal(r.h.takeHit(12), true);
});
test("dodge moves 90 units in stick direction or backward, stays inside arena, refuses when empty", () => {
  const r = rig();
  r.h.pos = v(170, 190);
  r.input.keyMove = v(1, 0);
  r.input.dodgePressed = true;
  r.step(0.005);
  advance(0.3, r.step);
  near(r.h.pos.x, 260);
  near(r.h.pos.y, 190);
  r.h.pos = v(17, 17);
  r.input.keyMove = v(-1, -1);
  r.input.dodgePressed = true;
  r.step(0.005);
  advance(0.3, r.step);
  near(r.h.pos.x, 16);
  near(r.h.pos.y, 16);
  r.h.dodges = 0;
  r.input.dodgePressed = true;
  r.step(0.005);
  assert.notEqual(r.h.state, "dodge");
  const back = rig();
  back.h.pos = v(170, 190);
  back.input.dodgePressed = true;
  back.step(0.005);
  advance(0.3, back.step);
  near(back.h.pos.y, 280);
});
test("dodge cancels charging and recovery but is refused in wind-up and active", () => {
  const r = rig();
  r.input.pressAttack(false);
  r.step(0.005);
  r.input.dodgePressed = true;
  r.step(0.005);
  assert.equal(r.h.state, "dodge");
  const committed = rig();
  swing(committed);
  for (const state of ["windup", "active"]) {
    committed.h.enter(state);
    const n = committed.h.dodges;
    committed.input.dodgePressed = true;
    committed.step(0.005);
    assert.equal(committed.h.dodges, n);
  }
  committed.h.enter("recover");
  committed.input.dodgePressed = true;
  committed.step(0.005);
  assert.equal(committed.h.state, "dodge");
});
test("invalid attack press is dropped; holding after hurt does not attack", () => {
  const r = rig();
  r.h.takeHit(10);
  r.input.pressAttack(false);
  advance(0.7, r.step);
  assert.equal(r.h.state, "idle");
  near(r.e.hp, 1000);
});
for (const shield of [false, true]) {
  test(`${shield ? "shield" : "bare"} parry has no chip or guard cost and covers attacks from behind`, () => {
    const r = rig(0, shield);
    r.h.enter("block");
    r.h.time = r.h.parryWindow - 0.002;
    assert.equal(r.h.receive(12, v(170, 350), GRUNT.attacks[0]), "parried");
    near(r.h.hp, 100);
    near(r.h.guard, r.h.maxGuard);
  });
  test(`${shield ? "shield" : "bare"} ordinary block applies chip and guard cost after parry window`, () => {
    const r = rig(0, shield);
    r.h.enter("block");
    r.h.time = r.h.parryWindow + 0.002;
    assert.equal(r.h.receive(12, v(170, 245), GRUNT.attacks[0]), "blocked");
    near(r.h.hp, shield ? 100 : 95.2);
    near(r.h.guard, r.h.maxGuard - (shield ? 12 : 18));
  });
}
test("captain lunge breaks bare guard, shield stops it, a timely parry beats it", () => {
  const attack = CAPTAIN.attacks[3];
  for (const shield of [false, true]) {
    const r = rig(0, shield);
    r.h.enter("block");
    r.h.time = 1;
    assert.equal(
      r.h.receive(22, v(170, 240), attack),
      shield ? "blocked" : "hit",
    );
  }
  const r = rig();
  r.h.enter("block");
  assert.equal(r.h.receive(22, v(170, 240), attack), "parried");
});
test("guard breaks after absorbing hit, stun takes damage, then restores half guard", () => {
  const r = rig(0, true);
  r.h.enter("block");
  r.h.time = 1;
  r.h.guard = 5;
  r.h.receive(12, v(170, 245), GRUNT.attacks[0]);
  near(r.h.hp, 100);
  assert.equal(r.h.state, "guardBreak");
  advance(0.81, r.step);
  assert.equal(r.h.state, "idle");
  near(r.h.guard, 40);
  const broken = rig(0, true);
  broken.h.enter("guardBreak");
  assert.equal(broken.h.receive(12, v(170, 245), GRUNT.attacks[0]), "hit");
  near(broken.h.hp, 88);
});
test("guard regenerates only after delay and while lowered; lowering enforces reraise delay", () => {
  const r = rig();
  r.h.guard = 10;
  r.h.guardWait = 0.6;
  advance(0.5, r.step);
  near(r.h.guard, 10);
  advance(0.3, r.step);
  assert.ok(r.h.guard > 14);
  r.input.blockKey = true;
  r.step(0.005);
  assert.equal(r.h.state, "block");
  const guard = r.h.guard;
  advance(0.8, r.step);
  near(r.h.guard, guard);
  r.input.blockKey = false;
  r.step(0.005);
  r.input.blockKey = true;
  r.step(0.005);
  assert.equal(r.h.state, "idle");
  advance(0.36, r.step);
  assert.equal(r.h.state, "block");
});
test("parry freezes attacker and makes next hit double damage; daggers execute grunts and take 60 captain HP", () => {
  for (const index of [0, 3]) {
    const r = rig(index);
    r.h.pos = v(170, 240);
    r.h.enter("block");
    r.e.pos = v(170, 190);
    r.e.facing = v(0, 1);
    r.e.begin(GRUNT.attacks[0]);
    r.h.time = 0;
    r.e.step(0.65);
    assert.equal(r.e.state, index === 3 ? "dead" : "stagger");
    near(r.e.staggerLeft, WEAPONS[index].parryStagger);
    near(r.e.hp, index === 3 ? 0 : 1000); // execute fraction is 1 of the rig's 1000 HP
    if (index === 0) {
      r.e.takeHit(10, r.h.pos, 0);
      near(r.e.hp, 980);
      assert.equal(r.e.state, "position");
    }
  }
  const r = rig(3),
    boss = new Enemy(0, v(170, 190), CAPTAIN, r.h, new EncounterController());
  r.h.pos = v(170, 240);
  r.h.enter("block");
  boss.facing = v(0, 1);
  boss.begin(CAPTAIN.attacks[0]);
  boss.step(0.7);
  near(boss.hp, 90);
  assert.equal(boss.state, "stagger");
});
test("block recoil does not wake or grant bonus; heavy stagger immunity prevents stun lock", () => {
  const r = rig();
  r.e.stagger(1, false, 1);
  r.e.takeHit(10, r.h.pos, 0);
  near(r.e.hp, 990);
  assert.equal(r.e.state, "stagger");
  advance(1.01, (dt) => r.e.step(dt));
  r.e.takeHit(25, r.h.pos, 0, 1);
  assert.notEqual(r.e.state, "stagger");
  advance(1.01, (dt) => r.e.step(dt));
  r.e.takeHit(25, r.h.pos, 0, 1);
  assert.equal(r.e.state, "stagger");
});
test("enemy telegraph tracks before lock, locks final .25s, damages once", () => {
  const r = rig();
  r.e.pos = v(170, 190);
  r.h.pos = v(170, 230);
  r.e.facing = v(0, 1);
  r.e.begin(GRUNT.attacks[0]);
  r.e.step(0.3);
  r.h.pos = v(210, 190);
  r.e.step(0.05);
  near(r.e.attackDir.x, 1);
  r.e.step(0.06);
  assert.equal(r.e.locked, true);
  r.h.pos = v(170, 230);
  r.e.step(0.1);
  near(r.e.attackDir.x, 1);
  r.h.pos = v(210, 190);
  advance(0.3, (dt) => r.e.step(dt));
  near(r.h.hp, 88);
  advance(0.1, (dt) => r.e.step(dt));
  near(r.h.hp, 88);
});
test("enemy strike can hit after immunity expires within its active window", () => {
  const r = rig();
  r.e.pos = v(170, 190);
  r.h.pos = v(170, 230);
  r.e.facing = v(0, 1);
  r.e.begin(GRUNT.attacks[0]);
  r.h.enter("dodge");
  r.h.time = 0.1;
  r.e.step(0.65);
  near(r.h.hp, 100);
  r.h.time = 0.17;
  r.e.step(0.005);
  near(r.h.hp, 88);
});
test("captain starts with lunge at range, skips lunge up close and chains combo in one commitment", () => {
  const g = new Game();
  g.start("captain");
  let boss = g.enemies[0];
  g.hero.pos = v(170, 205);
  boss.pos = v(170, 80);
  boss.step(0.005);
  assert.equal(boss.attack.label, "Lunge");
  const close = new Game();
  close.start("captain");
  boss = close.enemies[0];
  boss.pos = v(170, 190);
  close.hero.pos = v(170, 240);
  boss.step(0.005);
  assert.equal(boss.attack.label, "Slash");
  boss.controller.commit(boss.id);
  boss.facing = v(0, 1);
  boss.begin(CAPTAIN.attacks[1]);
  advance(0.55 + 0.1 + 0.12 + 0.005, (dt) => boss.step(dt));
  assert.equal(boss.attack.label, "Combo II");
  assert.equal(boss.controller.committed.size, 1);
});
test("lunge hit area stays anchored at attack origin while body moves", () => {
  const g = new Game();
  g.start("captain");
  const e = g.enemies[0];
  e.pos = v(170, 80);
  e.facing = v(0, 1);
  e.begin(CAPTAIN.attacks[3]);
  e.step(0.8);
  const origin = { ...e.attackOrigin };
  e.step(0.06);
  assert.ok(e.pos.y > origin.y);
  assert.deepEqual(e.attackOrigin, origin);
});
test("attack commitment count never exceeds two and death/stagger release slots", () => {
  const g = new Game();
  g.start();
  g.hero.hp = 100000;
  advance(12, (dt) => g.step(dt), 1 / 60);
  assert.equal(g.controller.peak, 2);
  for (const e of g.enemies) e.takeHit(100000, g.hero.pos, 0);
  assert.equal(g.controller.committed.size, 0);
  g.start();
  g.controller.commit(0);
  g.enemies[0].stagger(1);
  assert.equal(g.controller.committed.size, 0);
});
test("three grunts lead to 2s breather, capped heal, restored dodges, captain then victory", () => {
  const g = new Game();
  g.start();
  g.hero.hp = 50;
  g.hero.dodges = 0;
  for (const e of g.enemies) e.takeHit(100, g.hero.pos, 0);
  g.step(1 / 60);
  near(g.hero.hp, 80);
  assert.equal(g.hero.dodges, 2);
  near(g.intermission, 2);
  assert.equal(g.alive, 0);
  advance(1.9, (dt) => g.step(dt), 1 / 60);
  assert.equal(g.captainSpawned, false);
  advance(0.12, (dt) => g.step(dt), 1 / 60);
  assert.equal(g.captainSpawned, true);
  assert.equal(g.alive, 1);
  g.enemies.at(-1).takeHit(1000, g.hero.pos, 0);
  g.step(1 / 60);
  assert.equal(g.outcome, "victory");
});
test("one-enemy victory, defeat priority, and every retry reset including captain-only", () => {
  const g = new Game();
  g.start("one", 3, true);
  g.enemies[0].takeHit(100, g.hero.pos, 0);
  g.step(1 / 60);
  assert.equal(g.outcome, "victory");
  g.start("one");
  g.hero.takeHit(1000);
  g.enemies[0].takeHit(100, g.hero.pos, 0);
  g.step(1 / 60);
  assert.equal(g.outcome, "defeat");
  for (const mode of ["one", "threeCaptain", "captain"]) {
    g.start(mode, 3, true);
    assert.equal(g.phase, "fighting");
    assert.equal(g.outcome, null);
    near(g.hero.hp, 100);
    assert.equal(g.hero.dodges, 3);
    assert.equal(g.hero.shield, false);
    near(g.fightTime, 0);
    near(g.intermission, 0);
    assert.equal(g.alive, mode === "threeCaptain" ? 3 : 1);
    assert.equal(g.controller.committed.size, 0);
  }
});
test("pause freezes time and clears held actions; resume cannot release a stale heavy", () => {
  const g = new Game();
  g.start();
  g.input.pressAttack(true);
  g.input.blockKey = false;
  g.step(1 / 60);
  g.pause();
  const time = g.fightTime;
  g.step(10);
  near(g.fightTime, time);
  assert.equal(g.input.attackDown, false);
  assert.equal(g.hero.state, "idle");
  g.resume();
  g.input.releaseAttack(true);
  g.step(1 / 60);
  assert.equal(g.hero.state, "idle");
});
test("frame catch-up caps at .1 seconds and top-down axes stay screen-aligned", () => {
  const g = new Game();
  g.start();
  g.step(5);
  near(g.fightTime, 0.1);
  g.hero.pos = v(170, 190);
  g.input.keyMove = v(0, -1);
  advance(0.3, (dt) => g.step(dt));
  near(g.hero.pos.x, 170);
  assert.ok(g.hero.pos.y < 190);
});
test("sector boundaries include body overlap but reject out-of-range and behind targets", () => {
  assert.equal(circleInSector(v(), v(1, 0), 75, 90, v(90, 0), 16), true);
  assert.equal(circleInSector(v(), v(1, 0), 75, 90, v(92, 0), 16), false);
  assert.equal(circleInSector(v(), v(1, 0), 75, 90, v(-30, 0), 16), false);
  assert.equal(circleInSector(v(), v(1, 0), 50, 360, v(-40, 0), 0), true);
  assert.equal(circleInSector(v(), v(1, 0), 75, 90, v(-1, 0), 16), true);
});

// Source prototype's deterministic scripted player, adapted to screen-aligned coordinates.
function scriptedPlayer(g) {
  const h = g.hero,
    input = g.input;
  const target = g.enemies
    .filter((e) => e.state !== "dead")
    .sort((a, b) => length(sub(a.pos, h.pos)) - length(sub(b.pos, h.pos)))[0];
  if (!target) {
    input.keyMove = v();
    return;
  }
  const delta = sub(target.pos, h.pos),
    want = h.weapon.light.reach * 0.85;
  input.keyMove = mul(unit(delta), length(delta) > want ? 1 : 0.05);
  if (h.state === "idle" && input.attackDown) input.releaseAttack(false);
  for (const e of g.enemies) {
    if (e.state !== "windup" || !e.locked) continue;
    const left = e.attack.windup - e.time;
    if (
      left <= Math.max(0.02, 0.15 - e.attack.active) &&
      h.dodges > 0 &&
      ["idle", "charging", "recover"].includes(h.state) &&
      circleInSector(
        e.attackOrigin,
        e.attackDir,
        e.attack.reach,
        e.attack.arc,
        h.pos,
        h.radius,
      )
    ) {
      input.keyMove = v(e.attackDir.y, -e.attackDir.x);
      input.dodgePressed = true;
      return;
    }
  }
  if (h.state === "idle" && length(delta) <= want + 4) input.pressAttack(false);
  else if (h.state === "charging") input.releaseAttack(false);
}
for (let i = 0; i < 5; i++)
  test(`${WEAPONS[i].name}: scripted player beats three grunts and captain with normal health`, () => {
    const g = new Game();
    g.start("threeCaptain", i);
    for (let n = 0; n < 240 * 60 && g.phase === "fighting"; n++) {
      scriptedPlayer(g);
      g.step(1 / 60);
    }
    assert.equal(g.outcome, "victory");
    assert.equal(g.captainSpawned, true);
    assert.ok(g.hero.hp > 0);
    assert.ok(g.controller.peak <= 2);
  });
