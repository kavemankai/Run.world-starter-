import './style.css';
import {
  BOARD_HEIGHT, BOARD_WIDTH, ROUND_SECONDS, TARGET_SCORE,
  createGame, pauseGame, startGame, tickGame, type Directions, type Input,
  type GameState,
} from './game/core.ts';
import { renderGame } from './game/render.ts';
import { initializeRunPlatform } from './platform/run.ts';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app mount node');

root.innerHTML = `
  <main class="shell">
    <section class="game-column" aria-label="Sample game">
      <header class="topbar">
        <div class="brand"><span class="brand-mark">R<span>.</span></span><span>RUN<span class="subtle">/STARTER</span></span></div>
        <div id="platform-status" class="connection" role="status" aria-live="polite">Connecting to RUN.world…</div>
      </header>
      <div class="game-frame">
        <canvas id="game" width="${BOARD_WIDTH}" height="${BOARD_HEIGHT}" aria-label="Signal Run playing field"></canvas>
        <div class="in-game-hud" aria-live="off">
          <div class="hud-item"><span class="hud-label">SIGNALS</span><strong id="score">0 / ${TARGET_SCORE}</strong></div>
          <div class="hud-item hud-right"><span class="hud-label">TIME LEFT</span><strong id="time">${ROUND_SECONDS}s</strong></div>
        </div>
        <div id="modal" class="game-modal">
          <div class="modal-panel">
            <div class="eyebrow">PLAYABLE STARTER DEMO</div>
            <h1 id="modal-heading">SIGNAL<span>RUN</span></h1>
            <p id="modal-description">Collect 10 signals before the timer ends. Move with WASD, arrow keys, or touch and drag.</p>
            <button id="action" class="button primary" disabled>Connecting…</button>
            <button id="offline" class="button ghost" hidden>Try offline demo</button>
          </div>
        </div>
      </div>
      <footer class="controls">
        <button id="pause" class="button ghost compact" disabled>Pause</button>
        <button id="restart" class="button ghost compact">Reset</button>
        <span class="control-tip">Keyboard · Mouse · Touch</span>
      </footer>
    </section>
    <aside class="info-panel">
      <span class="eyebrow">RUN.WORLD / BUILD A</span>
      <h2>ONE FOUNDATION.<br/><em>ANY GAME.</em></h2>
      <p>This is a working game-shell example, not a required engine. Replace the sample with Three.js, PixiJS or your own renderer.</p>
      <div class="feature"><span class="num">01</span><div><strong>CODEx FIRST</strong><small>AGENTS.md, reproducible workflow and architecture guidance.</small></div></div>
      <div class="feature"><span class="num">02</span><div><strong>RUN SDK READY</strong><small>Playground plugins, isolated platform bootstrap and deploy scripts.</small></div></div>
      <div class="feature"><span class="num">03</span><div><strong>TESTABLE CORE</strong><small>Deterministic game mechanics with native Node.js tests.</small></div></div>
      <div class="feature"><span class="num">04</span><div><strong>MOBILE READY</strong><small>Responsive viewport and unified pointer and keyboard controls.</small></div></div>
      <div class="aside-foot">Starter repository · TypeScript / Vite / Canvas2D</div>
    </aside>
  </main>`;

function element<T extends HTMLElement>(selector: string): T {
  const match = root!.querySelector<T>(selector);
  if (!match) throw new Error(`Missing required element ${selector}`);
  return match;
}

const canvas = element<HTMLCanvasElement>('#game');
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('Canvas2D not available');
const scoreEl = element<HTMLElement>('#score');
const timeEl = element<HTMLElement>('#time');
const statusEl = element<HTMLElement>('#platform-status');
const modalEl = element<HTMLElement>('#modal');
const headingEl = element<HTMLElement>('#modal-heading');
const descriptionEl = element<HTMLElement>('#modal-description');
const actionEl = element<HTMLButtonElement>('#action');
const offlineEl = element<HTMLButtonElement>('#offline');
const pauseEl = element<HTMLButtonElement>('#pause');
const resetEl = element<HTMLButtonElement>('#restart');

let game: GameState = createGame();
let active = false;
let pointerActive = false;
let frameLast = 0;
let accumulator = 0;
let lastMode = '';
const STEP = 1 / 60;
const dirs: Directions = { left: false, right: false, up: false, down: false };
const input: Input = { directions: dirs, pointerTarget: null };

function updateSizing(): void {
  // CSS controls display size; the backing store stays at logical coordinates.
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(BOARD_WIDTH * dpr);
  canvas.height = Math.round(BOARD_HEIGHT * dpr);
  ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', updateSizing);
updateSizing();

function setTarget(clientX: number, clientY: number): void {
  const rect = canvas.getBoundingClientRect();
  input.pointerTarget = {
    x: ((clientX - rect.left) / rect.width) * BOARD_WIDTH,
    y: ((clientY - rect.top) / rect.height) * BOARD_HEIGHT,
  };
}
canvas.addEventListener('pointerdown', (event) => {
  if (game.mode !== 'playing') return;
  pointerActive = true;
  canvas.setPointerCapture(event.pointerId);
  setTarget(event.clientX, event.clientY);
});
canvas.addEventListener('pointermove', (event) => {
  if (pointerActive) setTarget(event.clientX, event.clientY);
});
function clearPointer(): void { pointerActive = false; input.pointerTarget = null; }
canvas.addEventListener('pointerup', clearPointer);
canvas.addEventListener('pointercancel', clearPointer);
window.addEventListener('blur', () => { clearPointer(); clearDirections(); pauseGame(game); });

const keyMap: Record<string, keyof Directions> = {
  arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
  arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down',
};
function clearDirections(): void { dirs.left = false; dirs.right = false; dirs.up = false; dirs.down = false; }
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key in keyMap) {
    if (game.mode === 'playing') event.preventDefault();
    dirs[keyMap[key]!] = true;
  }
  if (key === 'escape' && game.mode === 'playing') pauseGame(game);
  if (key === ' ' && !event.repeat && active && (game.mode === 'ready' || game.mode === 'paused')) {
    event.preventDefault(); startGame(game);
  }
});
window.addEventListener('keyup', (event) => {
  const direction = keyMap[event.key.toLowerCase()];
  if (direction) dirs[direction] = false;
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { pauseGame(game); clearDirections(); clearPointer(); accumulator = 0; frameLast = 0; }
});

function reset(): void { game = createGame((Date.now() >>> 0) || 1); clearDirections(); clearPointer(); accumulator = 0; }

function action(): void {
  if (!active) return;
  if (game.mode === 'won' || game.mode === 'lost') reset();
  startGame(game);
}
actionEl.addEventListener('click', action);
resetEl.addEventListener('click', reset);
pauseEl.addEventListener('click', () => {
  if (game.mode === 'playing') pauseGame(game);
  else if (game.mode === 'paused') startGame(game);
});
offlineEl.addEventListener('click', () => {
  active = true;
  offlineEl.hidden = true;
  statusEl.textContent = 'Offline demo · SDK unavailable';
  statusEl.classList.add('warning');
});

function syncUI(): void {
  scoreEl.textContent = `${game.score} / ${TARGET_SCORE}`;
  timeEl.textContent = `${Math.ceil(game.remaining)}s`;
  actionEl.disabled = !active;
  if (active && game.mode === 'ready') actionEl.textContent = 'Start game';
  if (lastMode === game.mode) return;
  lastMode = game.mode;
  pauseEl.disabled = !active || (game.mode !== 'playing' && game.mode !== 'paused');
  pauseEl.textContent = game.mode === 'paused' ? 'Resume' : 'Pause';
  modalEl.hidden = game.mode === 'playing';
  const screen = {
    ready: ['SIGNAL RUN', 'Collect 10 signals before the timer ends. Move with WASD, arrow keys, or touch and drag.', 'Start game'],
    paused: ['PAUSED', 'Your timer is frozen. Resume when ready.', 'Resume game'],
    won: ['MISSION CLEAR', 'All signals recovered. The example game loop is complete.', 'Play again'],
    lost: ['TIME EXPIRED', `You recovered ${game.score} of ${TARGET_SCORE} signals.`, 'Try again'],
    playing: ['', '', ''],
  }[game.mode];
  headingEl.textContent = screen[0];
  descriptionEl.textContent = screen[1];
  actionEl.textContent = active ? screen[2] : 'Connecting…';
  actionEl.disabled = !active;
}

function frame(now: number): void {
  if (frameLast === 0) frameLast = now;
  const delta = Math.min((now - frameLast) / 1000, 0.1);
  frameLast = now;
  if (game.mode === 'playing') {
    accumulator += delta;
    for (let i = 0; i < 6 && accumulator >= STEP; i += 1) {
      tickGame(game, input, STEP);
      accumulator -= STEP;
    }
  } else {
    accumulator = 0;
  }
  syncUI();
  renderGame(ctx!, game, now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

async function connect(): Promise<void> {
  try {
    await initializeRunPlatform();
    active = true;
    statusEl.textContent = 'RUN.world SDK connected';
    statusEl.classList.add('connected');
  } catch (error) {
    statusEl.textContent = 'SDK connection failed';
    statusEl.classList.add('warning');
    offlineEl.hidden = false;
    console.error('RUN.world platform initialization failed:', error);
    // Offline mode is an explicit player choice, never a fake SDK success.
    actionEl.textContent = 'Platform connection required';
  }
}
void connect();
