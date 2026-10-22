import { length, limit, v, type Vec } from "../game/math.ts";
/** Shared keyboard/touch intent. One-step edges are consumed even when an action is refused. */
export class CombatInput {
  touchMove = v();
  keyMove = v();
  attackTouch = false;
  attackKey = false;
  blockTouch = false;
  blockKey = false;
  attackPressed = false;
  attackReleased = false;
  dodgePressed = false;
  move(): Vec {
    return limit(length(this.touchMove) > 0 ? this.touchMove : this.keyMove);
  }
  get attackDown(): boolean {
    return this.attackTouch || this.attackKey;
  }
  get blockDown(): boolean {
    return this.blockTouch || this.blockKey;
  }
  pressAttack(touch: boolean): void {
    const held = this.attackDown;
    if (touch) this.attackTouch = true;
    else this.attackKey = true;
    if (!held) this.attackPressed = true;
  }
  releaseAttack(touch: boolean): void {
    const held = this.attackDown;
    if (touch) this.attackTouch = false;
    else this.attackKey = false;
    if (held && !this.attackDown) this.attackReleased = true;
  }
  cancelAttack(touch: boolean): void {
    if (touch) this.attackTouch = false;
    else this.attackKey = false;
  }
  endStep(): void {
    this.attackPressed = false;
    this.attackReleased = false;
    this.dodgePressed = false;
  }
  clear(): void {
    this.touchMove = v();
    this.keyMove = v();
    this.attackTouch = false;
    this.attackKey = false;
    this.blockTouch = false;
    this.blockKey = false;
    this.endStep();
  }
}
