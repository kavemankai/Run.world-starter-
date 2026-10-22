import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  TARGET_SCORE,
  type GameState,
} from './core.ts';

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState, now: number): void {
  const w = BOARD_WIDTH;
  const h = BOARD_HEIGHT;
  ctx.clearRect(0, 0, w, h);
  const sky = ctx.createLinearGradient(0, 0, w, h);
  sky.addColorStop(0, '#0a1229');
  sky.addColorStop(0.6, '#12112d');
  sky.addColorStop(1, '#1b1743');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // A zero-asset, procedural background that ships with the starter.
  ctx.strokeStyle = 'rgba(130, 160, 240, 0.095)';
  ctx.lineWidth = 1;
  for (let x = 40; x < w; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 40; y < h; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  for (let i = 0; i < 90; i += 1) {
    const x = ((i * 479 + 71) % 701) + 10;
    const y = ((i * 283 + 13) % 977) + 10;
    const alpha = 0.14 + ((i * 13) % 8) / 40;
    circle(ctx, x, y, i % 7 === 0 ? 2 : 1, `rgba(187, 211, 255, ${alpha})`);
  }

  ctx.save();
  ctx.shadowColor = '#63ebff';
  ctx.shadowBlur = 35;
  circle(ctx, state.signal.x, state.signal.y, 32 + Math.sin(now * 0.004) * 4, 'rgba(63,223,251,0.15)');
  ctx.strokeStyle = '#60ecff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(state.signal.x, state.signal.y, 28 + Math.sin(now * 0.003) * 4, 0, 2 * Math.PI);
  ctx.stroke();
  circle(ctx, state.signal.x, state.signal.y, 17, '#96f7ff');
  ctx.restore();

  ctx.save();
  ctx.translate(state.player.x, state.player.y);
  ctx.shadowColor = '#ad83ff';
  ctx.shadowBlur = 34;
  circle(ctx, 0, 0, 29, '#aa8bfc');
  circle(ctx, 0, 0, 20, '#e7d8ff');
  circle(ctx, 0, 0, 9, '#ffffff');
  ctx.restore();

  // Progress rail is deliberately on-canvas to showcase scaling correctness.
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.fillRect(34, 30, w - 68, 7);
  ctx.fillStyle = '#6fe5ed';
  ctx.fillRect(34, 30, (w - 68) * Math.min(state.score / TARGET_SCORE, 1), 7);

  ctx.strokeStyle = 'rgba(159,199,255,0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(21, 21, w - 42, h - 42);
}
