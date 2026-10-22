import { T, type Attack, type Profile, type Sound } from "./data.ts";
import {
  add,
  bound,
  circleInSector,
  length,
  mul,
  sub,
  unit,
  v,
  type Vec,
} from "./math.ts";
import type { Hero } from "./hero.ts";
export class EncounterController {
  committed = new Set<number>();
  peak = 0;
  hasSlot(id: number): boolean {
    return this.committed.has(id) || this.committed.size < T.maxCommits;
  }
  commit(id: number): boolean {
    if (!this.hasSlot(id)) return false;
    this.committed.add(id);
    this.peak = Math.max(this.peak, this.committed.size);
    return true;
  }
  release(id: number): void {
    this.committed.delete(id);
  }
}
export type EnemyState =
  | "approach"
  | "position"
  | "windup"
  | "active"
  | "recover"
  | "dead"
  | "stagger";
export class Enemy {
  pos: Vec;
  facing = v(0, 1);
  attackDir = v(0, 1);
  attackOrigin = v();
  state: EnemyState = "approach";
  time = 0;
  hp: number;
  radius: number;
  attack: Attack;
  patternPos = 0;
  locked = false;
  hitDone = false;
  cooldown: number;
  flash = 0;
  fade = 0.6;
  staggerLeft = 0;
  staggerTotal = 0;
  staggerWakes = true;
  staggerBonus: number = T.staggerBonus;
  staggerImmune = 0;
  id: number;
  profile: Profile;
  controller: EncounterController;
  private hero: Hero;
  private emit: (sound: Sound) => void;
  constructor(
    id: number,
    pos: Vec,
    profile: Profile,
    hero: Hero,
    controller: EncounterController,
    emit: (sound: Sound) => void = () => {},
  ) {
    this.id = id;
    this.profile = profile;
    this.hero = hero;
    this.controller = controller;
    this.emit = emit;
    this.pos = pos;
    this.hp = profile.hp;
    this.radius = profile.radius;
    this.attack = profile.attacks[0]!;
    this.cooldown = T.enemyStagger * id;
  }
  get committed(): boolean {
    return ["windup", "active", "recover"].includes(this.state);
  }
  get immovable(): boolean {
    return this.committed || this.state === "stagger";
  }
  stagger(duration: number, wake = true, bonus: number = T.staggerBonus): void {
    if (this.state === "dead") return;
    this.staggerWakes = wake;
    this.staggerBonus = bonus;
    this.staggerTotal = duration;
    this.staggerLeft = duration;
    this.controller.release(this.id);
    this.hitDone = true;
    this.locked = false;
    this.enter("stagger");
  }
  private wake(): void {
    this.staggerLeft = 0;
    this.staggerImmune = T.staggerImmunity;
    this.cooldown = T.enemyGap;
    this.enter("position");
  }
  takeHit(damage: number, origin: Vec, knockback: number, stagger = 0): void {
    if (this.state === "dead") return;
    const frozen = this.state === "stagger";
    this.hp -= damage * (frozen ? this.staggerBonus : 1);
    this.flash = 0.12;
    if (knockback > 0) {
      const away = sub(this.pos, origin);
      this.pos = bound(
        add(
          this.pos,
          mul(length(away) > 0.001 ? unit(away) : v(0, 1), knockback),
        ),
        this.radius,
      );
    }
    if (this.hp <= 0) this.die();
    else if (frozen) {
      if (this.staggerWakes) this.wake();
    } else if (
      stagger > 0 &&
      this.staggerImmune <= 0 &&
      this.profile.heavyStagger > 0
    )
      this.stagger(stagger * this.profile.heavyStagger);
  }
  private die(): void {
    this.hp = 0;
    this.enter("dead");
    this.fade = 0.6;
    this.controller.release(this.id);
  }
  private enter(state: EnemyState): void {
    this.state = state;
    this.time = 0;
  }
  private direction(): Vec {
    const d = sub(this.hero.pos, this.pos);
    return length(d) > 0.001 ? unit(d) : this.facing;
  }
  begin(attack: Attack): void {
    this.attack = attack;
    this.locked = false;
    this.hitDone = false;
    this.attackDir = this.facing;
    this.attackOrigin = { ...this.pos };
    this.enter("windup");
  }
  step(dt: number): void {
    this.flash = Math.max(0, this.flash - dt);
    if (this.state === "dead") {
      this.fade = Math.max(0, this.fade - dt);
      return;
    }
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.staggerImmune = Math.max(0, this.staggerImmune - dt);
    this.time += dt;
    switch (this.state) {
      case "approach":
      case "position":
        this.free(dt);
        break;
      case "windup":
        if (this.time < this.attack.windup - this.attack.lockTime) {
          if (this.hero.state !== "dead") this.facing = this.direction();
          this.attackDir = this.facing;
        } else if (!this.locked) {
          this.locked = true;
          this.attackDir = this.facing;
        }
        if (this.time + 1e-9 >= this.attack.windup) {
          this.enter("active");
          this.attackOrigin = { ...this.pos };
          this.emit("strike");
          this.tryHit();
        }
        break;
      case "active":
        this.tryHit();
        // A parry may have changed state while resolving the strike.
        if ((this.state as EnemyState) !== "active") break;
        if (this.attack.lunge > 0)
          this.pos = bound(
            add(
              this.pos,
              mul(
                this.attackDir,
                (this.attack.lunge / this.attack.active) * dt,
              ),
            ),
            this.radius,
          );
        if (this.time + 1e-9 >= this.attack.active) this.enter("recover");
        break;
      case "stagger":
        this.staggerLeft -= dt;
        if (this.staggerLeft <= 0) this.wake();
        break;
      case "recover":
        if (this.time + 1e-9 >= this.attack.recover) {
          if (this.attack.chainTo >= 0 && this.hero.state !== "dead") {
            this.facing = this.direction();
            this.begin(this.profile.attacks[this.attack.chainTo]!);
          } else {
            this.controller.release(this.id);
            this.cooldown = T.enemyGap;
            this.enter("position");
          }
        }
        break;
    }
  }
  private free(dt: number): void {
    if (this.hero.state === "dead") return;
    const dist = length(sub(this.hero.pos, this.pos)),
      dir = this.direction();
    this.facing = dir;
    let nextPos = this.patternPos;
    for (let k = 0; k < this.profile.pattern.length; k++) {
      const candidate = this.patternPos + k,
        attack =
          this.profile.attacks[
            this.profile.pattern[candidate % this.profile.pattern.length]!
          ]!;
      if (dist >= attack.minRange) {
        nextPos = candidate;
        break;
      }
    }
    const next =
      this.profile.attacks[
        this.profile.pattern[nextPos % this.profile.pattern.length]!
      ]!;
    const wantsIn = this.cooldown <= 0 && this.controller.hasSlot(this.id);
    if (
      wantsIn &&
      dist >= next.minRange &&
      dist <= next.maxRange &&
      this.controller.commit(this.id)
    ) {
      this.patternPos = nextPos + 1;
      this.begin(next);
      return;
    }
    let move: Vec;
    if (wantsIn || dist > this.profile.hover + 6) {
      this.state = "approach";
      move = dir;
    } else if (dist < this.profile.hover - 10) {
      this.state = "position";
      move = mul(dir, -0.6);
    } else {
      this.state = "position";
      move = mul(
        v(dir.y, -dir.x),
        (this.id % 2 === 0 ? 1 : -1) * T.enemyStrafe,
      );
    }
    this.pos = bound(
      add(this.pos, mul(move, this.profile.speed * dt)),
      this.radius,
    );
  }
  private tryHit(): void {
    if (
      this.hitDone ||
      !circleInSector(
        this.attackOrigin,
        this.attackDir,
        this.attack.reach,
        this.attack.arc,
        this.hero.pos,
        this.hero.radius,
      )
    )
      return;
    const result = this.hero.receive(
      this.attack.damage,
      this.attackOrigin,
      this.attack,
    );
    if (result === "none") return;
    this.hitDone = true;
    if (result === "parried") {
      this.stagger(this.hero.weapon.parryStagger);
      if (this.hero.weapon.parryKill) {
        this.hp -= this.profile.hp * this.profile.executeFraction;
        this.flash = 0.12;
        if (this.hp <= 0) this.die();
      }
    } else if (
      result === "blocked" &&
      this.attack.blockStun &&
      this.hero.state === "block"
    )
      this.stagger(this.hero.weapon.blockStun, false, 1);
  }
}
