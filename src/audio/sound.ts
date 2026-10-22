import type { Sound } from "../game/data.ts";
const NOTES: Record<Sound, [number, number, OscillatorType]> = {
  light: [230, 0.08, "triangle"],
  heavy: [110, 0.16, "sawtooth"],
  hit: [90, 0.07, "square"],
  hurt: [65, 0.16, "sawtooth"],
  dodge: [420, 0.08, "sine"],
  parry: [880, 0.24, "triangle"],
  block: [320, 0.12, "square"],
  break: [55, 0.3, "sawtooth"],
  strike: [155, 0.08, "triangle"],
  captain: [130, 0.5, "triangle"],
  win: [660, 0.45, "sine"],
  lose: [100, 0.5, "sine"],
};
export class SoundPlayer {
  private context?: AudioContext;
  private voices = new Set<OscillatorNode>();
  muted = false;
  unlock(): void {
    try {
      this.context ??= new AudioContext();
      void this.context.resume().catch(() => {});
    } catch {
      /* Audio is optional. */
    }
  }
  pause(): void {
    for (const voice of this.voices) voice.stop();
    this.voices.clear();
    void this.context?.suspend().catch(() => {});
  }
  toggle(): void {
    this.muted = !this.muted;
    if (this.muted) this.pause();
    else this.unlock();
  }
  play(sound: Sound): void {
    const ctx = this.context;
    if (this.muted || !ctx || ctx.state !== "running" || this.voices.size >= 12)
      return;
    const [freq, duration, type] = NOTES[sound],
      osc = ctx.createOscillator(),
      gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(30, freq * (sound === "win" ? 1.5 : 0.5)),
      ctx.currentTime + duration,
    );
    gain.gain.setValueAtTime(0.045, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    this.voices.add(osc);
    osc.onended = () => {
      this.voices.delete(osc);
      osc.disconnect();
      gain.disconnect();
    };
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }
}
