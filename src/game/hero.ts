import { T, WEAPONS, type Attack, type Sound, type Weapon } from "./data.ts";
import {
  add,
  angle,
  bound,
  circleInSector,
  length,
  mul,
  sub,
  toward,
  unit,
  v,
  type Vec,
} from "./math.ts";
import type { CombatInput } from "../input/combat.ts";
import type { Enemy } from "./enemy.ts";
export type HeroState =
  | "idle"
  | "charging"
  | "windup"
  | "active"
  | "recover"
  | "dodge"
  | "hurt"
  | "dead"
  | "block"
  | "guardBreak";
export type HitResult = "none" | "hit" | "blocked" | "parried";
export class Hero {
  pos = v(170, 300);
  facing = v(0, -1);
  velocity = v();
  radius = T.heroRadius;
  state: HeroState = "idle";
  time = 0;
  hp: number = T.heroHp;
  charge = 0;
  immune = 0;
  weapon: Weapon;
  shield: boolean;
  dodges: number;
  recharge = 0;
  dodgeDir = v();
  guard: number;
  guardWait = 0;
  blockCooldown = 0;
  flash = 0;
  parryFlash = 0;
  blockFlash = 0;
  attack: Attack | null = null;
  heavy = false;
  hitIds = new Set<number>();
  private emit: (sound: Sound) => void;
  constructor(
    weapon = WEAPONS[0]!,
    shield = false,
    emit: (sound: Sound) => void = () => {},
  ) {
    this.emit = emit;
    this.weapon = weapon;
    this.shield = shield && weapon.oneHanded;
    this.dodges = this.maxDodges;
    this.guard = this.maxGuard;
  }
  get maxDodges(): number {
    return T.dodgeCharges + this.weapon.extraDodges;
  }
  get rechargeTime(): number {
    return T.dodgeRecharge * this.weapon.recharge;
  }
  get speed(): number {
    return T.heroSpeed * this.weapon.move * (this.shield ? T.shieldMove : 1);
  }
  get maxGuard(): number {
    return this.shield ? T.shieldGuard : T.bareGuard;
  }
  get guardArc(): number {
    return this.shield ? T.shieldArc : T.bareArc;
  }
  get parryWindow(): number {
    return this.shield ? T.shieldParry : T.bareParry;
  }
  get invulnerable(): boolean {
    return (
      this.immune > 0 || (this.state === "dodge" && this.time < T.dodgeIframes)
    );
  }
  enter(state: HeroState): void {
    this.state = state;
    this.time = 0;
    if (
      ["dodge", "hurt", "guardBreak", "dead"].includes(state) ||
      (["windup", "active"].includes(state) && this.weapon.attackMove <= 0)
    )
      this.velocity = v();
  }
  restore(): void {
    if (this.state === "dead") return;
    this.hp = Math.min(T.heroHp, this.hp + T.captainHeal);
    this.dodges = this.maxDodges;
    this.recharge = 0;
  }
  takeHit(damage: number): boolean {
    if (this.state === "dead" || this.invulnerable) return false;
    this.hp = Math.max(0, this.hp - damage);
    this.immune = T.hitImmunity;
    this.flash = 0.15;
    this.charge = 0;
    this.attack = null;
    this.enter(this.hp <= 0 ? "dead" : "hurt");
    this.emit("hurt");
    return true;
  }
  receive(damage: number, origin: Vec, attack: Attack): HitResult {
    if (this.state === "dead" || this.invulnerable) return "none";
    const inside =
      this.guardArc >= 360 ||
      Math.abs(angle(this.facing, sub(origin, this.pos))) <=
        (this.guardArc * Math.PI) / 360;
    if (this.state === "block" && inside) {
      if (this.time < this.parryWindow) {
        this.parryFlash = 0.3;
        this.guardWait = T.guardDelay;
        this.emit("parry");
        return "parried";
      }
      if (this.shield || !attack.breaksBareGuard) {
        const reduction = this.shield ? T.shieldReduction : T.bareReduction;
        this.hp = Math.max(0, this.hp - damage * (1 - reduction));
        if (reduction < 1) this.flash = 0.08;
        if (this.hp <= 0) {
          this.enter("dead");
          this.emit("hurt");
          return "blocked";
        }
        this.guard = Math.max(
          0,
          this.guard -
            damage *
              (this.shield ? T.shieldCost : T.bareCost) *
              attack.guardCost,
        );
        this.guardWait = T.guardDelay;
        this.blockFlash = 0.15;
        if (this.guard <= 0) {
          this.enter("guardBreak");
          this.emit("break");
        } else this.emit("block");
        return "blocked";
      }
    }
    return this.takeHit(damage) ? "hit" : "none";
  }
  private move(
    dt: number,
    input: CombatInput,
    mult: number,
    turn = true,
  ): void {
    const intent = input.move(),
      target = mul(intent, this.speed * mult);
    const ramp =
      length(target) >= length(this.velocity) ? T.rampUp : T.rampDown;
    this.velocity = toward(this.velocity, target, (this.speed / ramp) * dt);
    if (turn && length(intent) > 0.001) this.facing = unit(intent);
    this.pos = bound(add(this.pos, mul(this.velocity, dt)), this.radius);
  }
  private dodge(input: CombatInput): boolean {
    if (this.dodges <= 0) return false;
    const move = input.move();
    this.dodgeDir = length(move) > 0.2 ? unit(move) : mul(this.facing, -1);
    if (this.dodges >= this.maxDodges) this.recharge = 0;
    this.dodges--;
    this.charge = 0;
    if (this.state === "block") this.blockCooldown = T.blockDelay;
    this.enter("dodge");
    this.emit("dodge");
    return true;
  }
  private startAttack(enemies: Enemy[]): void {
    this.heavy = this.charge + 1e-6 >= T.heavyHold;
    this.attack = this.heavy ? this.weapon.heavy : this.weapon.light;
    this.charge = 0;
    let nearest: Enemy | undefined,
      best = Infinity;
    for (const e of enemies) {
      if (e.state === "dead") continue;
      const delta = sub(e.pos, this.pos),
        dist = length(delta);
      if (
        dist > this.attack.reach + e.radius ||
        (dist > 0.001 &&
          Math.abs(angle(this.facing, delta)) > (T.aimCone * Math.PI) / 360)
      )
        continue;
      if (dist < best) {
        best = dist;
        nearest = e;
      }
    }
    if (nearest && best > 0.001) this.facing = unit(sub(nearest.pos, this.pos));
    this.hitIds.clear();
    this.enter("windup");
  }
  private hits(enemies: Enemy[]): void {
    const a = this.attack;
    if (!a) return;
    for (const e of enemies) {
      if (e.state === "dead" || this.hitIds.has(e.id)) continue;
      if (
        circleInSector(this.pos, this.facing, a.reach, a.arc, e.pos, e.radius)
      ) {
        this.hitIds.add(e.id);
        e.takeHit(
          a.damage,
          this.pos,
          a.knockback,
          this.heavy ? this.weapon.heavyStagger : 0,
        );
        this.emit("hit");
      }
    }
  }
  step(dt: number, input: CombatInput, enemies: Enemy[]): void {
    this.flash = Math.max(0, this.flash - dt);
    this.parryFlash = Math.max(0, this.parryFlash - dt);
    this.blockFlash = Math.max(0, this.blockFlash - dt);
    if (this.state === "dead") return;
    this.immune = Math.max(0, this.immune - dt);
    if (this.dodges < this.maxDodges) {
      this.recharge += dt;
      if (this.recharge + 1e-6 >= this.rechargeTime) {
        this.dodges++;
        this.recharge = Math.max(0, this.recharge - this.rechargeTime);
      }
    } else this.recharge = 0;
    this.blockCooldown = Math.max(0, this.blockCooldown - dt);
    if (
      !["block", "guardBreak"].includes(this.state) &&
      this.guard < this.maxGuard
    ) {
      this.guardWait = Math.max(0, this.guardWait - dt);
      if (this.guardWait <= 0)
        this.guard = Math.min(this.maxGuard, this.guard + T.guardRegen * dt);
    }
    this.time += dt;
    const slow =
      this.weapon.attackMove > 0 ? this.weapon.attackMove : T.halfSpeed;
    switch (this.state) {
      case "idle":
        if (input.dodgePressed && this.dodge(input)) return;
        if (input.blockDown && this.blockCooldown <= 0) {
          this.enter("block");
          return;
        }
        this.move(dt, input, 1);
        if (input.attackPressed) {
          this.enter("charging");
          this.charge = 0;
          this.charging(0, input, enemies);
        }
        break;
      case "charging":
        this.charging(dt, input, enemies);
        break;
      case "windup":
        this.move(dt, input, this.weapon.attackMove, false);
        if (this.time + 1e-9 >= this.attack!.windup) {
          this.enter("active");
          this.hitIds.clear();
          this.emit(this.heavy ? "heavy" : "light");
          this.hits(enemies);
        }
        break;
      case "active":
        this.move(dt, input, this.weapon.attackMove, false);
        if (this.attack!.lunge > 0)
          this.pos = bound(
            add(
              this.pos,
              mul(this.facing, (this.attack!.lunge / this.attack!.active) * dt),
            ),
            this.radius,
          );
        this.hits(enemies);
        if (this.time + 1e-9 >= this.attack!.active) this.enter("recover");
        break;
      case "recover":
        this.move(dt, input, slow);
        if (input.dodgePressed && this.dodge(input)) return;
        if (this.time + 1e-9 >= this.attack!.recover) this.enter("idle");
        break;
      case "dodge": {
        const moving = Math.max(
          0,
          Math.min(dt, T.dodgeDuration - (this.time - dt)),
        );
        this.pos = bound(
          add(
            this.pos,
            mul(this.dodgeDir, (T.dodgeDistance / T.dodgeDuration) * moving),
          ),
          this.radius,
        );
        if (this.time + 1e-9 >= T.dodgeDuration) this.enter("idle");
        break;
      }
      case "hurt":
        if (this.time >= T.hurtDuration) this.enter("idle");
        break;
      case "block":
        if (input.dodgePressed && this.dodge(input)) return;
        if (!input.blockDown) {
          this.blockCooldown = T.blockDelay;
          this.enter("idle");
          return;
        }
        this.guardWait = T.guardDelay;
        this.move(dt, input, T.blockMove);
        break;
      case "guardBreak":
        if (this.time >= T.guardBreak) {
          this.guard = this.maxGuard * T.guardRefill;
          this.guardWait = T.guardDelay;
          this.enter("idle");
        }
        break;
    }
  }
  private charging(dt: number, input: CombatInput, enemies: Enemy[]): void {
    this.charge += dt;
    this.move(
      dt,
      input,
      this.weapon.attackMove > 0 ? this.weapon.attackMove : T.halfSpeed,
    );
    if (input.dodgePressed && this.dodge(input)) return;
    if (input.blockDown && this.blockCooldown <= 0) {
      this.charge = 0;
      this.enter("block");
      return;
    }
    if (input.attackReleased) this.startAttack(enemies);
    else if (!input.attackDown) {
      this.charge = 0;
      this.enter("idle");
    }
  }
}
