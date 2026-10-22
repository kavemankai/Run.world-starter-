import type { Game } from "./core.ts";
import { T } from "./data.ts";
import { clamp, mul, add, rotate, v, type Vec } from "./math.ts";
import type { StickView } from "../input/browser.ts";
const TAU = Math.PI * 2;
export const VIEW = {
  width: 720,
  height: 1280,
  arenaX: 35,
  arenaY: 140,
  scale: 650 / 340,
};
function circle(
  c: CanvasRenderingContext2D,
  p: Vec,
  r: number,
  fill: string,
  stroke?: string,
): void {
  c.beginPath();
  c.arc(p.x, p.y, r, 0, TAU);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 1.5;
    c.stroke();
  }
}
/** Draw the exact analytic sector used by circleInSector, without polygon approximation. */
export function sector(
  c: CanvasRenderingContext2D,
  origin: Vec,
  facing: Vec,
  reach: number,
  arc: number,
  fill: string,
  stroke: string,
  dashed = false,
): void {
  const base = Math.atan2(facing.y, facing.x),
    half = (arc * Math.PI) / 360;
  c.beginPath();
  if (arc < 359.9) {
    c.moveTo(origin.x, origin.y);
    c.arc(origin.x, origin.y, reach, base - half, base + half);
    c.closePath();
  } else c.arc(origin.x, origin.y, reach, 0, TAU);
  c.fillStyle = fill;
  c.fill();
  c.strokeStyle = stroke;
  c.lineWidth = 1.2;
  c.setLineDash(dashed ? [4, 3] : []);
  c.stroke();
  c.setLineDash([]);
}
function text(
  c: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size: number,
  color = "#e9e3d2",
  align: CanvasTextAlign = "center",
): void {
  c.font = `600 ${size}px system-ui, sans-serif`;
  c.fillStyle = color;
  c.textAlign = align;
  c.fillText(value, x, y);
}
function bar(
  c: CanvasRenderingContext2D,
  p: Vec,
  width: number,
  ratio: number,
  color: string,
): void {
  c.fillStyle = "#0a1119";
  c.fillRect(p.x - width / 2, p.y, width, 3);
  c.fillStyle = color;
  c.fillRect(p.x - width / 2, p.y, width * clamp(ratio, 0, 1), 3);
}
function body(
  c: CanvasRenderingContext2D,
  pos: Vec,
  radius: number,
  facing: Vec,
  color: string,
  flash: boolean,
  captain: boolean,
): void {
  circle(c, add(pos, v(1, 3)), radius + 2, "#0005");
  circle(c, pos, radius, flash ? "#fff9de" : color, "#0a1420");
  const side = rotate(facing, Math.PI / 2);
  for (const sign of [-1, 1])
    circle(
      c,
      add(pos, mul(side, radius * 0.75 * sign)),
      radius * 0.34,
      flash ? "#fff" : color,
      "#b9c4c94d",
    );
  circle(
    c,
    add(pos, mul(facing, 2)),
    radius * 0.58,
    captain ? "#d2a448" : "#a9bbc5",
    "#28333b",
  );
  c.strokeStyle = "#26313c";
  c.lineWidth = 3;
  c.beginPath();
  const visor = add(pos, mul(facing, radius * 0.4));
  c.moveTo(visor.x - side.x * radius * 0.35, visor.y - side.y * radius * 0.35);
  c.lineTo(visor.x + side.x * radius * 0.35, visor.y + side.y * radius * 0.35);
  c.stroke();
  const tip = add(pos, mul(facing, radius + 5));
  c.beginPath();
  c.moveTo(tip.x, tip.y);
  for (const s of [-1, 1]) {
    const p = add(add(pos, mul(facing, radius - 1)), mul(side, s * 3));
    c.lineTo(p.x, p.y);
  }
  c.closePath();
  c.fillStyle = "#fff1ce";
  c.fill();
}
function weapon(
  c: CanvasRenderingContext2D,
  pos: Vec,
  direction: Vec,
  reach: number,
  width: number,
  color: string,
): void {
  const a = add(pos, mul(direction, 12)),
    b = add(pos, mul(direction, reach));
  c.lineCap = "round";
  c.lineWidth = width + 2;
  c.strokeStyle = "#111923";
  c.beginPath();
  c.moveTo(a.x, a.y);
  c.lineTo(b.x, b.y);
  c.stroke();
  c.lineWidth = width;
  c.strokeStyle = color;
  c.stroke();
  c.lineCap = "butt";
}
export function renderGame(
  c: CanvasRenderingContext2D,
  game: Game,
  stick: StickView,
): void {
  c.clearRect(0, 0, 720, 1280);
  const bg = c.createLinearGradient(0, 0, 0, 1280);
  bg.addColorStop(0, "#182530");
  bg.addColorStop(1, "#0b141d");
  c.fillStyle = bg;
  c.fillRect(0, 0, 720, 1280);
  c.save();
  c.translate(VIEW.arenaX, VIEW.arenaY);
  c.scale(VIEW.scale, VIEW.scale);
  c.fillStyle = "#273a3d";
  c.fillRect(0, 0, 340, 380);
  for (let y = 0; y < 380; y += 38)
    for (let x = 0; x < 340; x += 34) {
      c.fillStyle = (x / 34 + y / 38) % 2 ? "#2d414220" : "#71817c0d";
      c.fillRect(x + 1, y + 1, 32, 36);
      c.strokeStyle = "#a4b3a00b";
      c.lineWidth = 0.6;
      c.strokeRect(x, y, 34, 38);
    }
  c.strokeStyle = "#9f9862";
  c.lineWidth = 3;
  c.strokeRect(0, 0, 340, 380);
  c.strokeStyle = "#d5c38c22";
  c.lineWidth = 1;
  c.strokeRect(5, 5, 330, 370);
  circle(c, v(170, 190), 74, "#ffffff02", "#c8bc8b16");
  circle(c, v(170, 190), 68, "#ffffff00", "#c8bc8b0d");
  text(c, "╳", 170, 207, 46, "#c8bc8b13");
  if (game.phase !== "menu") {
    for (const e of game.enemies) {
      if (e.state !== "windup" && e.state !== "active") continue;
      const active = e.state === "active";
      sector(
        c,
        active ? e.attackOrigin : e.pos,
        e.attackDir,
        e.attack.reach,
        e.attack.arc,
        active ? "#ffe8c1b0" : e.locked ? "#ff49366b" : "#fbb64a24",
        active ? "#fff1ce" : e.locked ? "#ff7156" : "#f7bb62",
        !e.locked && !active,
      );
      text(
        c,
        active ? "STRIKE" : e.locked ? "LOCKED" : e.attack.label.toUpperCase(),
        e.pos.x,
        e.pos.y + e.radius + 14,
        8,
        active ? "#fff" : "#ffbf77",
      );
    }
    const h = game.hero,
      a = h.attack;
    if (a && ["windup", "active", "recover"].includes(h.state)) {
      const opacity =
        h.state === "active" ? "65" : h.state === "windup" ? "22" : "15";
      sector(
        c,
        h.pos,
        h.facing,
        a.reach,
        a.arc,
        `#80cbff${opacity}`,
        h.state === "active" ? "#cef2ff" : "#80cbff33",
      );
    }
    if (h.state === "block")
      sector(
        c,
        h.pos,
        h.facing,
        h.radius + 34,
        h.guardArc,
        h.parryFlash > 0 ? "#ffe08365" : "#75c7ff22",
        "#88d8f9aa",
      );
    for (const e of game.enemies) {
      if (e.state === "dead") {
        if (e.fade > 0) {
          c.globalAlpha = e.fade / 0.6;
          circle(c, e.pos, e.radius, "#84807a");
          c.globalAlpha = 1;
        }
        continue;
      }
      const captain = e.profile.id === "captain";
      body(
        c,
        e.pos,
        e.radius,
        e.committed ? e.attackDir : e.facing,
        captain ? "#8c3445" : "#b94d43",
        e.flash > 0,
        captain,
      );
      let direction = rotate(e.facing, 0.8);
      if (e.committed) {
        const half = (e.attack.arc * Math.PI) / 360;
        direction = rotate(
          e.attackDir,
          e.state === "windup"
            ? -half * clamp(e.time / e.attack.windup, 0, 1)
            : e.state === "active"
              ? -half + 2 * half * clamp(e.time / e.attack.active, 0, 1)
              : half,
        );
      }
      weapon(
        c,
        e.pos,
        direction,
        e.radius + 20,
        3,
        captain ? "#f3d78d" : "#d0bcb0",
      );
      bar(
        c,
        v(e.pos.x, e.pos.y - e.radius - 9),
        captain ? 48 : 30,
        e.hp / e.profile.hp,
        captain ? "#e8be63" : "#ee816c",
      );
      if (captain)
        text(c, "CAPTAIN", e.pos.x, e.pos.y - e.radius - 15, 8, "#f0d494");
      if (e.state === "stagger") {
        bar(
          c,
          v(e.pos.x, e.pos.y - e.radius - 22),
          36,
          e.staggerLeft / e.staggerTotal,
          "#edce66",
        );
        text(
          c,
          `${Math.max(0, e.staggerLeft).toFixed(1)}s`,
          e.pos.x,
          e.pos.y - e.radius - 26,
          9,
          "#ffe9a3",
        );
      }
    }
    c.save();
    if (h.state === "dodge") c.globalAlpha = h.invulnerable ? 0.45 : 0.8;
    else if (h.immune > 0)
      c.globalAlpha = Math.floor(h.immune * 24) % 2 ? 0.6 : 1;
    body(
      c,
      h.pos,
      h.radius,
      h.facing,
      h.state === "dead" ? "#606b77" : "#417ca9",
      h.flash > 0,
      false,
    );
    let direction = rotate(h.facing, 0.6);
    if (a && ["windup", "active", "recover"].includes(h.state)) {
      const half = (a.arc * Math.PI) / 360;
      direction = rotate(
        h.facing,
        h.state === "windup"
          ? -half
          : h.state === "active"
            ? -half + 2 * half * clamp(h.time / a.active, 0, 1)
            : half,
      );
    }
    if (h.weapon.dual)
      for (const sign of [-1, 1])
        weapon(
          c,
          h.pos,
          rotate(direction, sign * 0.35),
          h.radius + h.weapon.length,
          h.weapon.thickness,
          h.weapon.color,
        );
    else
      weapon(
        c,
        h.pos,
        h.state === "block" && !h.shield
          ? rotate(h.facing, Math.PI / 2)
          : direction,
        h.radius + h.weapon.length,
        h.weapon.thickness,
        h.weapon.color,
      );
    if (h.shield) {
      const p = add(
        h.pos,
        mul(rotate(h.facing, h.state === "block" ? 0 : -Math.PI / 2), 22),
      );
      circle(c, p, 10, h.parryFlash > 0 ? "#ffe097" : "#a2bccb", "#435a72");
      circle(c, p, 3, "#455a74");
    }
    c.restore();
    if (h.state === "charging") {
      const ready = h.charge + 1e-6 >= T.heavyHold;
      c.beginPath();
      c.arc(
        h.pos.x,
        h.pos.y,
        24,
        -Math.PI / 2,
        -Math.PI / 2 + TAU * clamp(h.charge / T.heavyHold, 0, 1),
      );
      c.strokeStyle = ready ? "#ffe191" : "#ccecff";
      c.lineWidth = 2;
      c.stroke();
      if (ready) text(c, "HEAVY READY", h.pos.x, h.pos.y + 34, 9, "#ffe191");
    }
    if (h.parryFlash > 0)
      text(c, "PARRY", h.pos.x, h.pos.y - 36, 11, "#ffe191");
    if (h.state === "guardBreak")
      text(c, "GUARD BROKEN", h.pos.x, h.pos.y - 32, 10, "#ffe191");
  }
  c.restore();
  const h = game.hero;
  if (game.intermission > 0) {
    c.fillStyle = "#0c1625dd";
    c.fillRect(70, 430, 580, 130);
    text(c, "CAPTAIN INCOMING", 360, 482, 30, "#ecd49b");
    text(
      c,
      `+30 HEALTH · DODGES REFILLED · ${Math.ceil(game.intermission)}`,
      360,
      522,
      17,
      "#afc3c9",
    );
  }
  text(
    c,
    game.phase === "menu"
      ? "THE TRAINING GROUNDS"
      : game.intermission > 0
        ? "STEADY YOUR HAND"
        : "READ THE WIND-UP. CHOOSE YOUR MOMENT.",
    360,
    911,
    15,
    "#7d929c",
  );
  c.strokeStyle = "#aab4a420";
  c.beginPath();
  c.moveTo(35, 936);
  c.lineTo(685, 936);
  c.stroke();
  const sx = stick.active ? stick.x : 170,
    sy = stick.active ? stick.y : 1105;
  circle(c, v(sx, sy), 90, "#a2b6c505", "#9ab0bc33");
  circle(c, v(sx, sy), 65, "#a2b6c503", "#9ab0bc16");
  circle(
    c,
    v(sx + (stick.active ? stick.dx : 0), sy + (stick.active ? stick.dy : 0)),
    34,
    stick.active ? "#7ab6cf50" : "#7ab6cf16",
    "#a5cfe65e",
  );
  if (!stick.active) text(c, "MOVE", sx, sy + 130, 18, "#8c9ea8");
  if (game.phase !== "menu") {
    const count = h.maxDodges;
    for (let i = 0; i < count; i++)
      circle(
        c,
        v(417 + i * 19 - (count - 1) * 9.5, 1225),
        5,
        i < h.dodges ? "#b5d8ed" : "#34434d",
        "#8dabb94d",
      );
    if (h.dodges < count) {
      c.fillStyle = "#42515b";
      c.fillRect(383, 1245, 68, 3);
      c.fillStyle = "#a9c9dd";
      c.fillRect(383, 1245, 68 * clamp(h.recharge / h.rechargeTime, 0, 1), 3);
    }
  }
}
