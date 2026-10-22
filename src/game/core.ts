import { CAPTAIN, GRUNT, T, WEAPONS, type Sound } from "./data.ts";
import { EncounterController, Enemy } from "./enemy.ts";
import { Hero } from "./hero.ts";
import { CombatInput } from "../input/combat.ts";
import { add, bound, length, mul, sub, unit, v } from "./math.ts";
export type Mode = "one" | "threeCaptain" | "captain";
export type Phase = "menu" | "fighting" | "paused" | "result";
export class Game {
  phase: Phase = "menu";
  outcome: "victory" | "defeat" | null = null;
  mode: Mode = "threeCaptain";
  weaponIndex = 0;
  shield = false;
  hero = new Hero();
  input = new CombatInput();
  controller = new EncounterController();
  enemies: Enemy[] = [];
  captainSpawned = false;
  intermission = 0;
  fightTime = 0;
  resultTimer = 0;
  events: Sound[] = [];
  private emit = (sound: Sound): void => {
    this.events.push(sound);
  };
  start(
    mode = this.mode,
    weaponIndex = this.weaponIndex,
    shield = this.shield,
  ): void {
    this.mode = mode;
    this.weaponIndex = Math.max(0, Math.min(WEAPONS.length - 1, weaponIndex));
    this.shield = shield;
    this.events = [];
    this.input.clear();
    this.controller = new EncounterController();
    this.hero = new Hero(WEAPONS[this.weaponIndex]!, shield, this.emit);
    this.enemies = [];
    this.captainSpawned = false;
    this.intermission = 0;
    this.fightTime = 0;
    this.resultTimer = 0;
    this.outcome = null;
    if (mode === "captain") this.spawnCaptain();
    else {
      const spots = [v(170, 80), v(90, 95), v(250, 95)];
      this.enemies = spots
        .slice(0, mode === "one" ? 1 : 3)
        .map(
          (p, i) =>
            new Enemy(i, p, GRUNT, this.hero, this.controller, this.emit),
        );
    }
    this.phase = "fighting";
  }
  get alive(): number {
    return this.enemies.filter((e) => e.state !== "dead").length;
  }
  pause(): void {
    if (this.phase === "fighting") {
      this.phase = "paused";
      this.clearInput();
    }
  }
  resume(): void {
    if (this.phase === "paused") {
      this.clearInput();
      this.phase = "fighting";
    }
  }
  menu(): void {
    this.clearInput();
    this.events = [];
    this.phase = "menu";
  }
  clearInput(): void {
    this.input.clear();
    if (this.hero.state === "charging" || this.hero.state === "block") {
      this.hero.charge = 0;
      this.hero.enter("idle");
      this.hero.blockCooldown = T.blockDelay;
    }
    this.hero.velocity = v();
  }
  private spawnCaptain(): void {
    const top = v(170, 80),
      bottom = v(170, 300);
    this.enemies.push(
      new Enemy(
        0,
        length(sub(top, this.hero.pos)) >= length(sub(bottom, this.hero.pos))
          ? top
          : bottom,
        CAPTAIN,
        this.hero,
        this.controller,
        this.emit,
      ),
    );
    this.captainSpawned = true;
  }
  step(dt: number): void {
    if (this.phase === "result") {
      this.resultTimer = Math.max(0, this.resultTimer - Math.min(dt, 0.1));
      return;
    }
    if (this.phase !== "fighting" || dt <= 0) return;
    const elapsed = Math.min(dt, 0.1),
      n = Math.max(1, Math.ceil(elapsed / (1 / 60) - 0.0001));
    for (let i = 0; i < n && this.phase === "fighting"; i++)
      this.simulate(elapsed / n);
  }
  private simulate(dt: number): void {
    this.fightTime += dt;
    for (const enemy of this.enemies) enemy.step(dt);
    this.hero.step(dt, this.input, this.enemies);
    this.overlaps(dt);
    this.input.endStep();
    if (this.intermission > 0) {
      this.intermission = Math.max(0, this.intermission - dt);
      if (this.intermission === 0) this.spawnCaptain();
    }
    if (this.hero.state === "dead") this.finish("defeat");
    else if (this.alive === 0 && this.intermission === 0) {
      if (this.mode === "threeCaptain" && !this.captainSpawned) {
        this.intermission = T.captainIntro;
        this.hero.restore();
        this.emit("captain");
      } else this.finish("victory");
    }
  }
  private finish(outcome: "victory" | "defeat"): void {
    this.outcome = outcome;
    this.resultTimer = T.resultDelay;
    this.phase = "result";
    this.clearInput();
    this.emit(outcome === "victory" ? "win" : "lose");
  }
  private overlaps(dt: number): void {
    const alive = this.enemies.filter((e) => e.state !== "dead"),
      maxPush = T.separation * dt;
    const heroSolid = this.hero.state !== "dodge" && this.hero.state !== "dead";
    alive.forEach((a, i) => {
      if (heroSolid && !a.immovable) {
        const d = sub(a.pos, this.hero.pos),
          dist = length(d),
          min = a.radius + this.hero.radius;
        if (dist < min)
          a.pos = bound(
            add(
              a.pos,
              mul(
                dist > 0.001 ? unit(d) : v(0, -1),
                Math.min(min - dist, maxPush),
              ),
            ),
            a.radius,
          );
      }
      for (let j = i + 1; j < alive.length; j++) {
        const b = alive[j]!,
          d = sub(b.pos, a.pos),
          dist = length(d),
          min = a.radius + b.radius;
        if (dist >= min || (a.immovable && b.immovable)) continue;
        const dir =
            dist > 0.001 ? unit(d) : v(Math.cos(i + j), Math.sin(i + j)),
          push = Math.min(min - dist, maxPush);
        if (!a.immovable)
          a.pos = bound(
            add(a.pos, mul(dir, -push * (b.immovable ? 1 : 0.5))),
            a.radius,
          );
        if (!b.immovable)
          b.pos = bound(
            add(b.pos, mul(dir, push * (a.immovable ? 1 : 0.5))),
            b.radius,
          );
      }
    });
  }
}
