export interface Vec {
  x: number;
  y: number;
}
export const v = (x = 0, y = 0): Vec => ({ x, y });
export const add = (a: Vec, b: Vec): Vec => v(a.x + b.x, a.y + b.y);
export const sub = (a: Vec, b: Vec): Vec => v(a.x - b.x, a.y - b.y);
export const mul = (a: Vec, s: number): Vec => v(a.x * s, a.y * s);
export const length = (a: Vec): number => Math.hypot(a.x, a.y);
export const unit = (a: Vec): Vec =>
  length(a) > 0.000001 ? mul(a, 1 / length(a)) : v();
export const clamp = (n: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, n));
export const limit = (a: Vec): Vec => (length(a) > 1 ? unit(a) : a);
export const angle = (a: Vec, b: Vec): number =>
  Math.atan2(a.x * b.y - a.y * b.x, a.x * b.x + a.y * b.y);
export const rotate = (a: Vec, radians: number): Vec =>
  v(
    a.x * Math.cos(radians) - a.y * Math.sin(radians),
    a.x * Math.sin(radians) + a.y * Math.cos(radians),
  );
export const toward = (a: Vec, b: Vec, amount: number): Vec =>
  length(sub(b, a)) <= amount ? b : add(a, mul(unit(sub(b, a)), amount));
export const bound = (p: Vec, r: number): Vec =>
  v(clamp(p.x, r, 340 - r), clamp(p.y, r, 380 - r));

/** Analytic sector/circle contact. Renderer uses these same origin/facing/reach/arc values. */
export function circleInSector(
  origin: Vec,
  facing: Vec,
  reach: number,
  arc: number,
  center: Vec,
  radius: number,
): boolean {
  const d = sub(center, origin),
    dist = length(d);
  if (dist <= radius) return true;
  if (dist > reach + radius) return false;
  if (arc >= 359.9) return true;
  const half = (arc * Math.PI) / 360;
  if (Math.abs(angle(facing, d)) <= half) return true;
  return [-1, 1].some((sign) => {
    const edge = rotate(facing, half * sign);
    const t = clamp(d.x * edge.x + d.y * edge.y, 0, reach);
    return length(sub(d, mul(edge, t))) <= radius;
  });
}
