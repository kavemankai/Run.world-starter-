import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BOARD_HEIGHT, BOARD_WIDTH, PLAYER_RADIUS, ROUND_SECONDS, TARGET_SCORE,
  clamp, createGame, startGame, pauseGame, tickGame, NO_INPUT,
} from '../src/game/core.ts';

const freshInput = () => ({
  directions: { left: false, right: false, up: false, down: false },
  pointerTarget: null,
});

describe('pure deterministic core', () => {
  it('starts ready, with centered player and bounded signal', () => {
    const state = createGame();
    assert.equal(state.mode, 'ready');
    assert.equal(state.remaining, ROUND_SECONDS);
    assert.equal(state.score, 0);
    assert.ok(state.signal.x > 0 && state.signal.x < BOARD_WIDTH);
    assert.ok(state.signal.y > 0 && state.signal.y < BOARD_HEIGHT);
  });

  it('uses identical signal spawn for identical seeds', () => {
    assert.deepEqual(createGame(1234).signal, createGame(1234).signal);
    assert.notDeepEqual(createGame(1234).signal, createGame(9876).signal);
  });

  it('does not advance before starting or while paused', () => {
    const state = createGame();
    tickGame(state, NO_INPUT, 0.05);
    assert.equal(state.remaining, ROUND_SECONDS);
    startGame(state);
    pauseGame(state);
    tickGame(state, NO_INPUT, 0.05);
    assert.equal(state.remaining, ROUND_SECONDS);
    startGame(state);
    tickGame(state, NO_INPUT, 0.05);
    assert.ok(state.remaining < ROUND_SECONDS);
  });

  it('normalizes diagonal travel speed', () => {
    const state = createGame();
    const input = freshInput();
    input.directions.right = true;
    input.directions.up = true;
    startGame(state);
    const before = { ...state.player };
    tickGame(state, input, 0.02);
    assert.ok(Math.abs(Math.hypot(state.player.x - before.x, state.player.y - before.y) - 10) < 0.001);
  });

  it('keeps the player inside the board', () => {
    const state = createGame();
    startGame(state);
    state.player.x = PLAYER_RADIUS;
    state.player.y = PLAYER_RADIUS;
    const input = freshInput();
    input.directions.left = true;
    input.directions.up = true;
    tickGame(state, input, 0.05);
    assert.ok(state.player.x >= PLAYER_RADIUS && state.player.y >= PLAYER_RADIUS);
  });

  it('collects a signal and respawns it', () => {
    const state = createGame();
    startGame(state);
    state.signal = { ...state.player };
    tickGame(state, NO_INPUT, 0.016);
    assert.equal(state.score, 1);
    assert.notDeepEqual(state.signal, state.player);
  });

  it('wins after the final collection', () => {
    const state = createGame();
    startGame(state);
    state.score = TARGET_SCORE - 1;
    state.signal = { ...state.player };
    tickGame(state, NO_INPUT, 0.016);
    assert.equal(state.score, TARGET_SCORE);
    assert.equal(state.mode, 'won');
  });

  it('loses when the timer runs out', () => {
    const state = createGame();
    startGame(state);
    state.remaining = 0.01;
    tickGame(state, NO_INPUT, 0.02);
    assert.equal(state.remaining, 0);
    assert.equal(state.mode, 'lost');
  });

  it('does not accept invalid or negative time steps', () => {
    const state = createGame();
    startGame(state);
    tickGame(state, NO_INPUT, -1);
    tickGame(state, NO_INPUT, Number.POSITIVE_INFINITY);
    assert.equal(state.remaining, ROUND_SECONDS);
    assert.equal(clamp(100, 1, 3), 3);
  });

  it('cannot restart a completed run by resuming', () => {
    const state = createGame();
    startGame(state);
    state.mode = 'won';
    startGame(state);
    assert.equal(state.mode, 'won');
  });
});
