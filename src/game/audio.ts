/**
 * Chiptune music and sound effects, synthesized at runtime.
 *
 * There are no audio files in this project. A GBA-era soundtrack is square
 * and triangle waves with sharp envelopes, which is a few dozen lines of
 * Web Audio — and shipping it as code rather than a .ogg keeps the whole
 * portfolio under the size of a single photograph.
 *
 * Notes are scheduled against `AudioContext.currentTime` on a lookahead
 * timer rather than fired from the game loop. The game loop is subject to
 * frame timing and tab throttling; the audio clock is not, so this is the
 * only way to get music that does not audibly stumble when a frame runs
 * long.
 */

const BPM = 132;
/** Eighth notes. */
const STEP_SECONDS = 60 / BPM / 2;
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SECONDS = 0.22;

type Note = number | null;

/**
 * I-V-vi-IV in C, as a four-bar arpeggio. The progression is a cliché and
 * that is exactly why it is here: it resolves pleasantly on a loop that a
 * visitor may hear twenty times while reading, and never grates.
 */
const ARP: Note[] = [
  // C
  72, 76, 79, 76, 72, 76, 79, 76,
  // G
  67, 71, 74, 71, 67, 71, 74, 79,
  // Am
  69, 72, 76, 72, 69, 72, 76, 81,
  // F
  65, 69, 72, 69, 65, 69, 72, 77,
];

const MELODY: Note[] = [
  84, null, null, 88, null, null, 86, null,
  83, null, null, 86, null, null, 84, null,
  81, null, null, 84, null, null, 83, null,
  79, null, null, 81, null, 77, null, null,
];

const BASS: Note[] = [
  48, null, null, null, 48, null, 55, null,
  43, null, null, null, 43, null, 50, null,
  45, null, null, null, 45, null, 52, null,
  41, null, null, null, 41, null, 48, null,
];

const PATTERN_LENGTH = ARP.length;

export type TrackName = 'overworld' | 'indoor';
export type SfxName = 'step' | 'grass' | 'bump' | 'door' | 'blip' | 'badge' | 'warp';

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;

  private timer: number | null = null;
  private nextStepTime = 0;
  private step = 0;
  private track: TrackName = 'overworld';
  private muted = false;
  private started = false;

  /**
   * Must be called from a user gesture — browsers refuse to start an
   * AudioContext otherwise, and one created too early is stuck suspended.
   */
  start(): void {
    if (this.started) {
      void this.ctx?.resume();
      return;
    }
    try {
      const ctx = new AudioContext();
      const master = ctx.createGain();
      master.gain.value = this.muted ? 0 : 0.5;
      master.connect(ctx.destination);

      const musicBus = ctx.createGain();
      musicBus.gain.value = 0.34;
      musicBus.connect(master);

      const sfxBus = ctx.createGain();
      sfxBus.gain.value = 0.7;
      sfxBus.connect(master);

      this.ctx = ctx;
      this.master = master;
      this.musicBus = musicBus;
      this.sfxBus = sfxBus;
      this.noise = createNoiseBuffer(ctx);
      this.started = true;

      this.nextStepTime = ctx.currentTime + 0.1;
      if (!this.muted) this.startScheduler();
    } catch {
      // No Web Audio: the game is entirely playable in silence.
      this.started = false;
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(muted ? 0 : 0.5, now, 0.05);
    // The scheduler is stopped rather than merely silenced, so a muted tab
    // is not still building oscillators eight times a second.
    if (muted) this.stopScheduler();
    else {
      this.nextStepTime = Math.max(this.nextStepTime, now + 0.08);
      this.startScheduler();
    }
  }

  setTrack(track: TrackName): void {
    this.track = track;
  }

  dispose(): void {
    this.stopScheduler();
    void this.ctx?.close();
    this.ctx = null;
    this.started = false;
  }

  private startScheduler(): void {
    if (this.timer !== null || !this.ctx) return;
    this.timer = window.setInterval(() => this.schedule(), LOOKAHEAD_MS);
  }

  private stopScheduler(): void {
    if (this.timer === null) return;
    window.clearInterval(this.timer);
    this.timer = null;
  }

  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    // A tab that was backgrounded comes back with currentTime far ahead of
    // where we left off. Catching up note by note would fire hundreds at
    // once, so skip forward instead.
    if (this.nextStepTime < ctx.currentTime - 1) {
      this.nextStepTime = ctx.currentTime + 0.05;
    }
    while (this.nextStepTime < ctx.currentTime + SCHEDULE_AHEAD_SECONDS) {
      this.scheduleStep(this.step, this.nextStepTime);
      this.step = (this.step + 1) % PATTERN_LENGTH;
      this.nextStepTime += STEP_SECONDS;
    }
  }

  private scheduleStep(step: number, time: number): void {
    const indoors = this.track === 'indoor';

    const bass = BASS[step];
    if (bass !== null && bass !== undefined) {
      this.tone({
        freq: midiToFreq(bass),
        time,
        duration: STEP_SECONDS * 1.7,
        type: 'triangle',
        gain: indoors ? 0.3 : 0.42,
        bus: this.musicBus,
      });
    }

    const melody = MELODY[step];
    if (melody !== null && melody !== undefined) {
      this.tone({
        freq: midiToFreq(melody),
        time,
        duration: STEP_SECONDS * 2.4,
        type: 'square',
        gain: indoors ? 0.14 : 0.2,
        bus: this.musicBus,
      });
    }

    // Indoors the arpeggio drops out entirely. It is the busiest voice, and
    // muting it turns the same theme into a quiet version of itself without
    // needing a second piece of music written.
    if (!indoors) {
      const arp = ARP[step];
      if (arp !== null && arp !== undefined) {
        this.tone({
          freq: midiToFreq(arp),
          time,
          duration: STEP_SECONDS * 0.85,
          type: 'square',
          gain: 0.12,
          bus: this.musicBus,
        });
      }
      // A soft tick on the beat, standing in for percussion.
      if (step % 4 === 0) this.burst(time, 0.05, 0.035, 1800);
    }
  }

  private tone(options: {
    freq: number;
    time: number;
    duration: number;
    type: OscillatorType;
    gain: number;
    bus: GainNode | null;
  }): void {
    const ctx = this.ctx;
    if (!ctx || !options.bus) return;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = options.type;
    osc.frequency.value = options.freq;

    // A fast attack and exponential decay is the characteristic chiptune
    // envelope; a linear fade sounds like a synthesizer pad instead.
    const { time, duration, gain } = options;
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(gain, time + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(env);
    env.connect(options.bus);
    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  private burst(time: number, duration: number, gain: number, cutoff: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.noise || !this.musicBus) return;
    const source = ctx.createBufferSource();
    source.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = cutoff;
    const env = ctx.createGain();
    env.gain.setValueAtTime(gain, time);
    env.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(filter);
    filter.connect(env);
    env.connect(this.musicBus);
    source.start(time);
    source.stop(time + duration + 0.01);
  }

  sfx(name: SfxName): void {
    const ctx = this.ctx;
    if (!ctx || this.muted || !this.sfxBus) return;
    const now = ctx.currentTime;

    switch (name) {
      case 'step':
        this.noiseHit(now, 0.045, 0.06, 420);
        break;
      case 'grass':
        this.noiseHit(now, 0.07, 0.07, 2600);
        break;
      case 'bump':
        this.sfxTone(140, now, 0.1, 'square', 0.16);
        this.noiseHit(now, 0.06, 0.08, 220);
        break;
      case 'blip':
        this.sfxTone(880, now, 0.05, 'square', 0.1);
        break;
      case 'door':
        // A short rising figure: the sound of going somewhere.
        [64, 69, 76].forEach((midi, i) =>
          this.sfxTone(midiToFreq(midi), now + i * 0.055, 0.12, 'square', 0.13),
        );
        break;
      case 'warp':
        [76, 71, 64].forEach((midi, i) =>
          this.sfxTone(midiToFreq(midi), now + i * 0.05, 0.1, 'triangle', 0.13),
        );
        break;
      case 'badge':
        [72, 76, 79, 84].forEach((midi, i) =>
          this.sfxTone(midiToFreq(midi), now + i * 0.085, 0.26, 'square', 0.15),
        );
        break;
    }
  }

  private sfxTone(
    freq: number,
    time: number,
    duration: number,
    type: OscillatorType,
    gain: number,
  ): void {
    this.tone({ freq, time, duration, type, gain, bus: this.sfxBus });
  }

  private noiseHit(time: number, duration: number, gain: number, cutoff: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.noise || !this.sfxBus) return;
    const source = ctx.createBufferSource();
    source.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = cutoff;
    filter.Q.value = 1.2;
    const env = ctx.createGain();
    env.gain.setValueAtTime(gain, time);
    env.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(filter);
    filter.connect(env);
    env.connect(this.sfxBus);
    source.start(time);
    source.stop(time + duration + 0.01);
  }
}

function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * 0.4);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** One engine for the whole app. */
export const audio = new AudioEngine();
