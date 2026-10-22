/** Pure game simulation: no DOM, SDK, network calls or rendering code. */
export const BOARD_WIDTH = 720;
export const BOARD_HEIGHT = 1000;
export const ROUND_SECONDS = 40;
export const TARGET_SCORE = 10;
export const MOVE_SPEED = 500;
export const PLAYER_RADIUS = 27;
export const SIGNAL_RADIUS = 21;

export type Point = { x: number; y: number };
export type Mode = 'ready' | 'playing' | 'paused' | 'won' | 'lost';
export type Directions = { left: boolean; right: boolean; up: boolean; down: boolean };

export interface Input {
  directions: Directions;
  pointerTarget: Point | null;
}

export interface GameState {
  mode: Mode;
  player: Point;
  signal: Point;
  remaining: number;
  score: number;
  rngState: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function random01(state: GameState): number {
  // Reproducible xorshift32 for testable simulations.
  let n = state.rngState | 0;
  n ^= n << 13;
  n ^= n >>> 17;
  n ^= n << 5;
  state.rngState = n >>> 0;
  return state.rngState / 4294967296;
}

function nextSignal(state: GameState): Point {
  let result: Point = { x: BOARD_WIDTH / 2, y: BOARD_HEIGHT / 3 };
  for (let i = 0; i < 8; i += 1) {
    result = {
      x: 68 + random01(state) * (BOARD_WIDTH - 136),
      y: 84 + random01(state) * (BOARD_HEIGHT - 168),
    };
    if (Math.hypot(result.x - state.player.x, result.y - state.player.y) > 125) break;
  }
  return result;
}

export function createGame(seed = 2026): GameState {
  const state: GameState = {
    mode: 'ready',
    player: { x: BOARD_WIDTH / 2, y: BOARD_HEIGHT * 0.76 },
    signal: { x: 0, y: 0 },
    remaining: ROUND_SECONDS,
    score: 0,
    rngState: (seed >>> 0) || 1,
  };
  state.signal = nextSignal(state);
  return state;
}

export function startGame(state: GameState): void {
  if (state.mode === 'ready' || state.mode === 'paused') state.mode = 'playing';
}

export function pauseGame(state: GameState): void {
  if (state.mode === 'playing') state.mode = 'paused';
}

export function tickGame(state: GameState, input: Input, seconds: number): void {
  if (state.mode !== 'playing' || !Number.isFinite(seconds) || seconds <= 0) return;
  // The caller drives a fixed-step loop. Large ticks are discarded rather than
  // advancing an entire round after the app regains focus.
  const dt = clamp(seconds, 0, 1 / 20);
  state.remaining = Math.max(0, state.remaining - dt);
  if (state.remaining === 0) {
    state.mode = 'lost';
    return;
  }

  let dx = Number(input.directions.right) - Number(input.directions.left);
  let dy = Number(input.directions.down) - Number(input.directions.up);
  const keyboardLength = Math.hypot(dx, dy);
  if (keyboardLength > 0) {
    dx /= keyboardLength;
    dy /= keyboardLength;
  } else if (input.pointerTarget) {
    dx = input.pointerTarget.x - state.player.x;
    dy = input.pointerTarget.y - state.player.y;
    const distance = Math.hypot(dx, dy);
    if (distance > 1) {
      const travel = Math.min(distance, MOVE_SPEED * dt);
      dx = (dx / distance) * (travel / (MOVE_SPEED * dt));
      dy = (dy / distance) * (travel / (MOVE_SPEED * dt));
    } else {
      dx = 0;
      dy = 0;
    }
  }

  state.player.x = clamp(state.player.x + dx * MOVE_SPEED * dt, PLAYER_RADIUS, BOARD_WIDTH - PLAYER_RADIUS);
  state.player.y = clamp(state.player.y + dy * MOVE_SPEED * dt, PLAYER_RADIUS, BOARD_HEIGHT - PLAYER_RADIUS);

  if (Math.hypot(state.signal.x - state.player.x, state.signal.y - state.player.y) <= PLAYER_RADIUS + SIGNAL_RADIUS) {
    state.score += 1;
    if (state.score >= TARGET_SCORE) {
      state.mode = 'won';
    } else {
      state.signal = nextSignal(state);
    }
  }
}

export const NO_INPUT: Input = {
  directions: { left: false, right: false, up: false, down: false },
  pointerTarget: null,
};
