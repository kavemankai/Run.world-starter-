import type { Game } from "../game/core.ts";
import { clamp, length, limit, v } from "../game/math.ts";
export interface StickView {
  active: boolean;
  x: number;
  y: number;
  dx: number;
  dy: number;
}
/** Pointer capture belongs to each individual control, so move + attack/block/dodge coexist. */
export class BrowserInput {
  stick: StickView = { active: false, x: 180, y: 1100, dx: 0, dy: 0 };
  private keys = new Set<string>();
  private pointers = new Map<number, { kind: string; element: HTMLElement }>();
  private moveId: number | null = null;
  constructor(
    private game: Game,
    private stage: HTMLElement,
    private wakeAudio: () => void,
    private onPause: () => void,
    private onStart: () => void,
  ) {
    for (const element of stage.querySelectorAll<HTMLElement>(
      "[data-control]",
    )) {
      element.addEventListener("pointerdown", (event) =>
        this.down(event, element),
      );
      element.addEventListener("pointermove", (event) => this.motion(event));
      element.addEventListener("pointerup", (event) => this.up(event, false));
      element.addEventListener("pointercancel", (event) =>
        this.up(event, true),
      );
      element.addEventListener("lostpointercapture", (event) =>
        this.up(event, true),
      );
      element.addEventListener("contextmenu", (e) => e.preventDefault());
      if (element instanceof HTMLButtonElement) {
        // Native button activation supports keyboard and assistive technology as well as pointers.
        element.addEventListener("keydown", (event) => {
          if (
            (event.key === " " || event.key === "Enter") &&
            !event.repeat &&
            this.game.phase === "fighting"
          ) {
            event.preventDefault();
            this.buttonKey(element.dataset.control!, true);
            this.wakeAudio();
          }
        });
        element.addEventListener("keyup", (event) => {
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            this.buttonKey(element.dataset.control!, false);
          }
        });
      }
    }
    window.addEventListener("keydown", (e) => this.key(e, true));
    window.addEventListener("keyup", (e) => this.key(e, false));
    window.addEventListener("blur", onPause);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) onPause();
    });
  }
  private buttonKey(kind: string, down: boolean): void {
    if (kind === "attack") {
      if (down) this.game.input.pressAttack(false);
      else this.game.input.releaseAttack(false);
    }
    if (kind === "block") this.game.input.blockKey = down;
    if (kind === "dodge" && down) this.game.input.dodgePressed = true;
  }
  private point(event: PointerEvent): { x: number; y: number } {
    const r = this.stage.getBoundingClientRect();
    return {
      x: ((event.clientX - r.left) / r.width) * 720,
      y: ((event.clientY - r.top) / r.height) * 1280,
    };
  }
  private down(event: PointerEvent, element: HTMLElement): void {
    if (
      this.game.phase !== "fighting" ||
      (event.pointerType === "mouse" && event.button !== 0)
    )
      return;
    const kind = element.dataset.control!;
    if ([...this.pointers.values()].some((p) => p.kind === kind)) return;
    event.preventDefault();
    this.wakeAudio();
    element.setPointerCapture(event.pointerId);
    this.pointers.set(event.pointerId, { kind, element });
    element.classList.add("held");
    if (kind === "move") {
      this.moveId = event.pointerId;
      const p = this.point(event);
      this.stick = {
        active: true,
        x: clamp(p.x, 95, 275),
        y: clamp(p.y, 1020, 1175),
        dx: 0,
        dy: 0,
      };
      this.motion(event);
    } else if (kind === "attack") this.game.input.pressAttack(true);
    else if (kind === "block") this.game.input.blockTouch = true;
    else if (kind === "dodge") this.game.input.dodgePressed = true;
  }
  private motion(event: PointerEvent): void {
    const pointer = this.pointers.get(event.pointerId);
    if (!pointer) return;
    if (event.pointerId === this.moveId) {
      const p = this.point(event),
        vec = limit(v((p.x - this.stick.x) / 90, (p.y - this.stick.y) / 90));
      this.stick.dx = vec.x * 90;
      this.stick.dy = vec.y * 90;
      this.game.input.touchMove = length(vec) < 0.12 ? v() : vec;
    } else if (pointer.kind === "attack" || pointer.kind === "block") {
      const r = pointer.element.getBoundingClientRect();
      if (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      )
        this.up(event, true);
    }
  }
  private up(event: PointerEvent, cancel: boolean): void {
    const pointer = this.pointers.get(event.pointerId);
    if (!pointer) return;
    this.pointers.delete(event.pointerId);
    pointer.element.classList.remove("held");
    if (pointer.kind === "move") {
      this.moveId = null;
      this.stick.active = false;
      this.game.input.touchMove = v();
    }
    if (pointer.kind === "attack") {
      if (cancel) this.game.input.cancelAttack(true);
      else this.game.input.releaseAttack(true);
    }
    if (pointer.kind === "block") this.game.input.blockTouch = false;
    if (pointer.element.hasPointerCapture(event.pointerId))
      pointer.element.releasePointerCapture(event.pointerId);
  }
  private key(event: KeyboardEvent, down: boolean): void {
    const key = event.key.toLowerCase();
    if (event.target instanceof HTMLElement) {
      if (event.target.closest("select, input")) return;
      if (event.target.closest("button, a") && (key === " " || key === "enter"))
        return;
    }
    if (key === "escape" && down && !event.repeat) {
      this.onPause();
      return;
    }
    if (
      key === "enter" &&
      down &&
      !event.repeat &&
      this.game.phase !== "fighting"
    ) {
      this.onStart();
      return;
    }
    if (
      ![
        "w",
        "a",
        "s",
        "d",
        "arrowup",
        "arrowleft",
        "arrowdown",
        "arrowright",
        "j",
        "k",
        " ",
      ].includes(key)
    )
      return;
    if (this.game.phase !== "fighting") return;
    event.preventDefault();
    if (down && event.repeat) return;
    if (down) {
      this.keys.add(key);
      this.wakeAudio();
    } else this.keys.delete(key);
    const has = (...keys: string[]): number =>
      keys.some((k) => this.keys.has(k)) ? 1 : 0;
    this.game.input.keyMove = limit(
      v(
        has("d", "arrowright") - has("a", "arrowleft"),
        has("s", "arrowdown") - has("w", "arrowup"),
      ),
    );
    if (key === "j") {
      if (down) this.game.input.pressAttack(false);
      else this.game.input.releaseAttack(false);
    }
    if (key === "k") this.game.input.blockKey = down;
    if (key === " " && down) this.game.input.dodgePressed = true;
  }
  reset(): void {
    this.keys.clear();
    this.game.clearInput();
    this.moveId = null;
    this.stick.active = false;
    for (const [id, pointer] of this.pointers) {
      pointer.element.classList.remove("held");
      if (pointer.element.hasPointerCapture(id))
        pointer.element.releasePointerCapture(id);
    }
    this.pointers.clear();
  }
}
