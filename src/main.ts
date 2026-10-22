import "./style.css";
import { Game, type Mode } from "./game/core.ts";
import { T, WEAPONS } from "./game/data.ts";
import { renderGame } from "./game/render.ts";
import { BrowserInput } from "./input/browser.ts";
import { SoundPlayer } from "./audio/sound.ts";
import { initializeRunPlatform } from "./platform/run.ts";
const mount = document.querySelector<HTMLDivElement>("#app");
if (!mount) throw new Error("Missing #app");
mount.innerHTML = `
<main class="shell">
  <header class="masthead"><a class="wordmark" href="#">PHONE <span>OF</span> THRONES<span class="edition">SHIELDWALL · COMBAT PROTOTYPE</span></a><span class="platform-badge">RUN.WORLD <i></i></span></header>
  <section class="stage" aria-label="Phone of Thrones arena">
    <canvas id="game" tabindex="0" width="720" height="1280" aria-label="Top-down melee arena. Move with WASD or arrows, J to attack, K to block, Space to dodge.">Your browser needs Canvas2D to play.</canvas>
    <div class="hud" hidden>
      <div class="health-heading"><span>VITALITY</span><strong id="hp">100 / 100</strong></div>
      <div class="meter health"><span id="health-fill"></span></div>
      <div class="guard-line"><span>GUARD</span><div class="meter"><span id="guard-fill"></span></div><span id="guard-number">40</span></div>
      <div class="encounter"><span id="loadout">Sword</span><span id="encounter">3 HOSTILES</span><time id="timer">0:00</time></div>
    </div>
    <div id="touch-controls" hidden>
      <div class="move-zone" data-control="move" aria-label="Drag to move"></div>
      <button class="combat block" data-control="block" aria-label="Block: hold to guard, raise just before impact to parry"><span class="control-icon">♜</span><span>BLOCK</span><small>HOLD · K</small></button>
      <button class="combat attack" data-control="attack" aria-label="Attack: tap for light, hold then release for heavy"><span class="control-icon">⚔</span><span>ATTACK</span><small>TAP / HOLD · J</small></button>
      <button class="combat dodge" data-control="dodge" aria-label="Dodge in movement direction, or backwards when standing"><span class="control-icon">◇</span><span>DODGE</span><small>SPACE</small></button>
    </div>
    <section id="panel" class="overlay" aria-labelledby="panel-title">
      <div class="panel-inner">
        <div class="crest" aria-hidden="true">♜</div><p class="eyebrow" id="eyebrow">THE TRAINING GROUNDS</p>
        <h1 id="panel-title">Steel yourself.</h1>
        <p id="panel-copy" class="panel-copy">One arena. Five weapons. Every strike is a choice.</p>
        <div id="setup">
          <fieldset><legend>CHOOSE YOUR WEAPON</legend><div class="weapon-grid">${WEAPONS.map((w, i) => `<button class="weapon ${i === 0 ? "selected" : ""}" data-weapon="${i}" aria-pressed="${i === 0}"><span aria-hidden="true">${["†", "↟", "⚒", "‡", "╋"][i]}</span>${w.name}</button>`).join("")}</div></fieldset>
          <p id="weapon-description" class="weapon-description">${WEAPONS[0]!.description}</p>
          <label class="shield-toggle"><input id="shield" type="checkbox"/><span>Carry a shield</span><small id="shield-hint">Sword & spear · slower movement</small></label>
          <label class="mode-label" for="mode">YOUR CHALLENGE</label><select id="mode"><option value="threeCaptain">Three enemies + Captain</option><option value="one">One enemy · practice</option><option value="captain">Captain only</option></select>
        </div>
        <button id="action" class="primary" disabled>Connecting…</button>
        <button id="offline" class="secondary">Play offline</button>
        <button id="back" class="secondary" hidden>Change loadout</button>
        <p id="connection" class="connection" role="status">Connecting to RUN.world…</p>
        <p class="instructions">Move with the left stick. Tap attack for a quick cut.<br/>Hold, then release for a heavy. Block or dodge the red wedge.</p>
      </div>
    </section>
  </section>
  <footer><div class="footer-actions"><button id="pause" disabled>Pause</button><button id="mute" aria-pressed="false">Sound on</button><button id="menu" disabled>Loadout</button></div><span class="keyboard-tip">WASD move · J attack · K block · Space dodge</span></footer>
</main>`;
function el<T extends HTMLElement>(selector: string): T {
  const node = mount!.querySelector<T>(selector);
  if (!node) throw new Error(`Missing ${selector}`);
  return node;
}
const canvas = el<HTMLCanvasElement>("#game"),
  ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Canvas2D is unavailable");
const stage = el<HTMLElement>(".stage"),
  panel = el<HTMLElement>("#panel"),
  title = el<HTMLElement>("#panel-title");
const copy = el<HTMLElement>("#panel-copy"),
  setup = el<HTMLElement>("#setup"),
  action = el<HTMLButtonElement>("#action");
const offline = el<HTMLButtonElement>("#offline"),
  back = el<HTMLButtonElement>("#back"),
  connection = el<HTMLElement>("#connection");
const pauseButton = el<HTMLButtonElement>("#pause"),
  muteButton = el<HTMLButtonElement>("#mute"),
  menuButton = el<HTMLButtonElement>("#menu");
const mode = el<HTMLSelectElement>("#mode"),
  shield = el<HTMLInputElement>("#shield");
const hud = el<HTMLElement>(".hud"),
  controls = el<HTMLElement>("#touch-controls");
const hp = el<HTMLElement>("#hp"),
  healthFill = el<HTMLElement>("#health-fill"),
  guardFill = el<HTMLElement>("#guard-fill");
const guardNumber = el<HTMLElement>("#guard-number"),
  loadout = el<HTMLElement>("#loadout"),
  encounter = el<HTMLElement>("#encounter"),
  timer = el<HTMLElement>("#timer");
const game = new Game(),
  sound = new SoundPlayer();
let selectedWeapon = 0,
  ready = false,
  offlineChosen = false,
  accumulator = 0,
  previous = 0,
  lastPanel = "";
let boundsChanged = true;
let connectionLabel = "Connecting…";
const input = new BrowserInput(game, stage, () => sound.unlock(), pause, act);
function size(): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(720 * dpr);
  canvas.height = Math.round(1280 * dpr);
  ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  boundsChanged = false;
}
window.addEventListener("resize", () => {
  boundsChanged = true;
  pause();
});
size();
new ResizeObserver(() => {
  boundsChanged = true;
  pause();
}).observe(stage);
function pause(): void {
  if (game.phase !== "fighting") return;
  game.pause();
  input.reset();
  sound.pause();
  accumulator = 0;
  previous = 0;
}
function act(): void {
  if (!ready || (game.phase === "result" && game.resultTimer > 0)) return;
  sound.unlock();
  input.reset();
  accumulator = 0;
  previous = 0;
  if (game.phase === "paused") game.resume();
  else game.start(mode.value as Mode, selectedWeapon, shield.checked);
  canvas.focus({ preventScroll: true });
}
action.addEventListener("click", act);
pauseButton.addEventListener("click", () => {
  if (game.phase === "paused") act();
  else pause();
});
muteButton.addEventListener("click", () => {
  sound.toggle();
  muteButton.textContent = sound.muted ? "Sound off" : "Sound on";
  muteButton.setAttribute("aria-pressed", String(sound.muted));
});
function showMenu(): void {
  input.reset();
  sound.pause();
  game.menu();
  accumulator = 0;
  previous = 0;
}
back.addEventListener("click", showMenu);
menuButton.addEventListener("click", showMenu);
offline.addEventListener("click", () => {
  offlineChosen = true;
  ready = true;
  offline.hidden = true;
  connection.textContent = "Offline play · RUN.world connection not verified";
  lastPanel = "";
});
for (const button of mount.querySelectorAll<HTMLButtonElement>(
  "[data-weapon]",
)) {
  button.addEventListener("click", () => {
    selectedWeapon = Number(button.dataset.weapon);
    for (const b of mount.querySelectorAll<HTMLButtonElement>(
      "[data-weapon]",
    )) {
      const selected = b === button;
      b.classList.toggle("selected", selected);
      b.setAttribute("aria-pressed", String(selected));
    }
    const w = WEAPONS[selectedWeapon]!;
    el("#weapon-description").textContent = w.description;
    shield.disabled = !w.oneHanded;
    if (!w.oneHanded) shield.checked = false;
    el("#shield-hint").textContent = w.oneHanded
      ? "Sword & spear · slower movement"
      : "Two-handed weapon · no shield";
  });
}
function sync(): void {
  const h = game.hero;
  hp.textContent = `${Math.ceil(h.hp)} / ${T.heroHp}`;
  healthFill.style.width = `${h.hp}%`;
  guardFill.style.width = `${(h.guard / h.maxGuard) * 100}%`;
  guardNumber.textContent = String(Math.ceil(h.guard));
  loadout.textContent = h.weapon.name + (h.shield ? " + shield" : "");
  encounter.textContent = game.captainSpawned
    ? "CAPTAIN"
    : `${game.alive} HOSTILE${game.alive === 1 ? "" : "S"}`;
  timer.textContent = `${Math.floor(game.fightTime / 60)}:${String(Math.floor(game.fightTime % 60)).padStart(2, "0")}`;
  pauseButton.disabled = !["fighting", "paused"].includes(game.phase);
  pauseButton.textContent = game.phase === "paused" ? "Resume" : "Pause";
  menuButton.disabled = game.phase === "menu";
  hud.hidden = game.phase === "menu";
  controls.hidden = game.phase !== "fighting";
  const panelState = game.phase + (game.resultTimer > 0 ? "-wait" : "") + ready;
  if (lastPanel === panelState) return;
  lastPanel = panelState;
  panel.hidden =
    game.phase === "fighting" ||
    (game.phase === "result" && game.resultTimer > 0);
  setup.hidden = game.phase !== "menu";
  back.hidden = game.phase === "menu";
  offline.hidden = ready;
  action.disabled = !ready;
  if (game.phase === "menu") {
    title.textContent = "Steel yourself.";
    copy.textContent = "One arena. Five weapons. Every strike is a choice.";
    action.textContent = ready ? "Enter the arena →" : connectionLabel;
  } else if (game.phase === "paused") {
    title.textContent = "Take a breath.";
    copy.textContent = "Your fight is paused. Resume when you’re ready.";
    action.textContent = "Resume fight →";
  } else if (game.phase === "result") {
    title.textContent =
      game.outcome === "victory" ? "The arena is yours." : "Rise again.";
    copy.textContent = `${game.outcome === "victory" ? "Victory" : "Defeat"} · ${h.weapon.name}${h.shield ? " + shield" : ""} · ${game.fightTime.toFixed(1)}s · ${Math.ceil(h.hp)} HP remaining`;
    action.textContent = "Fight again →";
  }
  if (!panel.hidden)
    requestAnimationFrame(() => {
      if (ready && game.phase !== "menu") action.focus({ preventScroll: true });
    });
}
function frame(now: number): void {
  if (boundsChanged) size();
  const dt = previous ? Math.min((now - previous) / 1000, 0.1) : 0;
  previous = now;
  if (game.phase === "fighting") {
    accumulator = Math.min(accumulator + dt, 0.1);
    while (accumulator + 1e-9 >= 1 / 60) {
      game.step(1 / 60);
      accumulator -= 1 / 60;
    }
  } else {
    accumulator = 0;
    if (game.phase === "result") game.step(dt);
  }
  for (const event of game.events.splice(0)) sound.play(event);
  sync();
  renderGame(ctx!, game, input.stick);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
async function connect(): Promise<void> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const platform = await Promise.race([
      initializeRunPlatform(pause),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("RUN.world connection timed out")),
          10000,
        );
      }),
    ]);
    if (!offlineChosen) {
      ready = !platform.local;
      connection.textContent = platform.local
        ? "Local preview · choose offline play to enter"
        : "RUN.world SDK initialized";
      if (platform.local) connectionLabel = "Choose offline play below";
      lastPanel = "";
    }
  } catch {
    if (!offlineChosen) {
      connection.textContent =
        "RUN.world unavailable. Choose offline play to continue.";
      connectionLabel = "Connection unavailable";
      lastPanel = "";
    }
  } finally {
    clearTimeout(timeout);
  }
}
void connect();
