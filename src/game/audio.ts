// Procedural horror audio built with the Web Audio API: every sound is
// synthesised at runtime, so there are no audio files to license. Sounds
// with a position use 3D panners so players can tell where Granny is.

import * as THREE from 'three';

type Pos = { x: number; y: number; z: number };

export class AudioEngine {
  readonly ctx: AudioContext;
  private readonly master: GainNode;
  private readonly sfx: GainNode;
  private readonly music: GainNode;
  private readonly noise: AudioBuffer;
  private loudScale = 1;
  private hrtf: boolean;
  private heartbeatAt = 0;
  private chaseGain: GainNode | null = null;
  private chaseNodes: AudioScheduledSourceNode[] = [];
  private chaseTimer: number | null = null;
  private ambienceStarted = false;
  private readonly hums: { gain: GainNode; base: number }[] = [];
  private readonly fwd = new THREE.Vector3();

  constructor(hrtf: boolean) {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    this.hrtf = hrtf;
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 6;
    comp.connect(this.ctx.destination);
    this.master = this.ctx.createGain();
    this.master.connect(comp);
    this.sfx = this.ctx.createGain();
    this.sfx.connect(this.master);
    this.music = this.ctx.createGain();
    this.music.gain.value = 0.55;
    this.music.connect(this.master);
    const len = this.ctx.sampleRate * 2;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  resume(): void {
    if (this.ctx.state !== 'running') void this.ctx.resume();
  }

  setVolume(v: number): void {
    this.master.gain.value = Math.max(0, Math.min(1, v));
  }

  /** Scales sudden loud sounds (slams, thunder, scares). */
  setReduceLoud(reduce: boolean): void {
    this.loudScale = reduce ? 0.3 : 1;
  }

  setHrtf(on: boolean): void {
    this.hrtf = on;
  }

  get now(): number {
    return this.ctx.currentTime;
  }

  updateListener(camera: THREE.Camera): void {
    const l = this.ctx.listener;
    const p = camera.getWorldPosition(new THREE.Vector3());
    camera.getWorldDirection(this.fwd);
    if (l.positionX) {
      const t = this.ctx.currentTime;
      l.positionX.setTargetAtTime(p.x, t, 0.02);
      l.positionY.setTargetAtTime(p.y, t, 0.02);
      l.positionZ.setTargetAtTime(p.z, t, 0.02);
      l.forwardX.setTargetAtTime(this.fwd.x, t, 0.02);
      l.forwardY.setTargetAtTime(this.fwd.y, t, 0.02);
      l.forwardZ.setTargetAtTime(this.fwd.z, t, 0.02);
      l.upX.value = 0; l.upY.value = 1; l.upZ.value = 0;
    } else {
      l.setPosition(p.x, p.y, p.z);
      l.setOrientation(this.fwd.x, this.fwd.y, this.fwd.z, 0, 1, 0);
    }
  }

  /** Output node for a sound: positional panner (+ muffling) or plain. */
  private out(pos: Pos | null, occluded = false, loud = false): AudioNode {
    const gain = this.ctx.createGain();
    gain.gain.value = loud ? this.loudScale : 1;
    gain.connect(this.sfx);
    let head: AudioNode = gain;
    if (pos) {
      const p = this.ctx.createPanner();
      p.panningModel = this.hrtf ? 'HRTF' : 'equalpower';
      p.distanceModel = 'inverse';
      p.refDistance = 1.5;
      p.rolloffFactor = 1.3;
      p.maxDistance = 40;
      p.positionX.value = pos.x;
      p.positionY.value = pos.y;
      p.positionZ.value = pos.z;
      p.connect(head);
      head = p;
    }
    if (occluded) {
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 650;
      f.connect(head);
      head = f;
    }
    return head;
  }

  private noiseBurst(dest: AudioNode, opts: { freq: number; q: number; dur: number; gain: number; type?: BiquadFilterType; delay?: number; attack?: number }): void {
    const t = this.ctx.currentTime + (opts.delay ?? 0);
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = this.ctx.createBiquadFilter();
    f.type = opts.type ?? 'bandpass';
    f.frequency.value = opts.freq;
    f.Q.value = opts.q;
    const g = this.ctx.createGain();
    const attack = opts.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(opts.gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur);
    src.connect(f).connect(g).connect(dest);
    src.start(t, Math.random() * 1.5);
    src.stop(t + opts.dur + 0.05);
  }

  private tone(dest: AudioNode, opts: { type: OscillatorType; f0: number; f1?: number; dur: number; gain: number; delay?: number; attack?: number }): void {
    const t = this.ctx.currentTime + (opts.delay ?? 0);
    const o = this.ctx.createOscillator();
    o.type = opts.type;
    o.frequency.setValueAtTime(opts.f0, t);
    if (opts.f1) o.frequency.exponentialRampToValueAtTime(opts.f1, t + opts.dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(opts.gain, t + (opts.attack ?? 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + opts.dur + 0.05);
  }

  footstep(pos: Pos | null, heavy: boolean, run: boolean, crouch: boolean, occluded = false): void {
    const dest = this.out(pos, occluded);
    const g = (heavy ? 0.9 : 0.5) * (run ? 1.3 : crouch ? 0.35 : 0.8);
    this.noiseBurst(dest, { freq: heavy ? 180 : 320, q: 1.2, dur: heavy ? 0.22 : 0.12, gain: g });
    this.tone(dest, { type: 'sine', f0: heavy ? 70 : 110, f1: 40, dur: 0.12, gain: g * 0.6 });
    // Old floorboards creak now and then.
    if (Math.random() < (heavy ? 0.25 : 0.12)) this.creak(pos, occluded, 0.25);
  }

  creak(pos: Pos | null, occluded = false, volume = 0.5): void {
    const dest = this.out(pos, occluded);
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = 'sawtooth';
    const base = 180 + Math.random() * 160;
    o.frequency.setValueAtTime(base, t);
    o.frequency.linearRampToValueAtTime(base * (0.7 + Math.random() * 0.6), t + 0.5);
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 18 + Math.random() * 20;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 25;
    lfo.connect(lfoGain).connect(o.frequency);
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 900;
    f.Q.value = 4;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volume * 0.25, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(f).connect(g).connect(dest);
    o.start(t); lfo.start(t);
    o.stop(t + 0.65); lfo.stop(t + 0.65);
  }

  doorOpen(pos: Pos, occluded = false): void {
    this.creak(pos, occluded, 0.9);
    this.noiseBurst(this.out(pos, occluded), { freq: 1800, q: 3, dur: 0.06, gain: 0.3 });
  }

  doorClose(pos: Pos, occluded = false): void {
    const dest = this.out(pos, occluded, true);
    this.noiseBurst(dest, { freq: 140, q: 0.8, dur: 0.35, gain: 1.2, delay: 0.25 });
    this.tone(dest, { type: 'sine', f0: 90, f1: 35, dur: 0.3, gain: 0.9, delay: 0.25 });
  }

  locked(pos: Pos): void {
    const dest = this.out(pos);
    for (let i = 0; i < 4; i++) this.noiseBurst(dest, { freq: 2500, q: 6, dur: 0.05, gain: 0.35, delay: i * 0.07 });
  }

  pickup(): void {
    const dest = this.out(null);
    [880, 1320, 1760].forEach((f, i) => this.tone(dest, { type: 'triangle', f0: f, dur: 0.25, gain: 0.25, delay: i * 0.07 }));
  }

  unlock(): void {
    const dest = this.out(null);
    this.noiseBurst(dest, { freq: 2200, q: 8, dur: 0.08, gain: 0.5 });
    this.tone(dest, { type: 'square', f0: 300, f1: 200, dur: 0.15, gain: 0.15, delay: 0.1 });
  }

  wardrobe(pos: Pos | null, occluded = false): void {
    this.creak(pos, occluded, 0.7);
    this.noiseBurst(this.out(pos, occluded), { freq: 400, q: 1, dur: 0.15, gain: 0.4, delay: 0.3 });
  }

  thunder(distance: number): void {
    const dest = this.out(null, distance > 0.6, true);
    const g = 1.4 * (1 - distance * 0.6);
    this.noiseBurst(dest, { freq: 90, q: 0.5, dur: 3.5, gain: g, type: 'lowpass', attack: 0.15 });
    this.noiseBurst(dest, { freq: 300, q: 0.7, dur: 1.2, gain: g * 0.6, type: 'lowpass', attack: 0.02 });
  }

  /** Granny's cackle, synthesised as a pitched, tremolo-modulated voice. */
  cackle(pos: Pos | null, volume = 0.6): void {
    const dest = this.out(pos, false, true);
    for (let i = 0; i < 6; i++) {
      const t0 = i * 0.16;
      const f0 = 520 - i * 25 + Math.random() * 40;
      this.tone(dest, { type: 'sawtooth', f0, f1: f0 * 0.75, dur: 0.12, gain: volume * 0.18, delay: t0 });
      this.noiseBurst(dest, { freq: 2200, q: 2, dur: 0.1, gain: volume * 0.12, delay: t0 });
    }
  }

  /** Whoosh that accompanies Granny's voice so you can tell where she is. */
  voiceCue(pos: Pos, occluded: boolean): void {
    const dest = this.out(pos, occluded);
    this.noiseBurst(dest, { freq: 600, q: 3, dur: 1.2, gain: 0.35, attack: 0.4 });
    this.tone(dest, { type: 'sine', f0: 210, f1: 160, dur: 1.4, gain: 0.12, attack: 0.3 });
  }

  whisper(pos: Pos): void {
    const dest = this.out(pos, true);
    for (let i = 0; i < 5; i++) {
      this.noiseBurst(dest, { freq: 2500 + Math.random() * 2000, q: 5, dur: 0.18 + Math.random() * 0.2, gain: 0.12, delay: i * 0.22 + Math.random() * 0.1, attack: 0.06 });
    }
  }

  jumpScare(strength: number): void {
    const dest = this.out(null, false, true);
    this.noiseBurst(dest, { freq: 1200, q: 0.7, dur: 1.2, gain: 1.5 * strength, attack: 0.01 });
    this.tone(dest, { type: 'sawtooth', f0: 900, f1: 300, dur: 1.0, gain: 0.5 * strength });
    this.tone(dest, { type: 'square', f0: 55, f1: 40, dur: 1.2, gain: 0.6 * strength });
  }

  stinger(win: boolean): void {
    const dest = this.out(null);
    const notes = win ? [523, 659, 784, 1047] : [392, 370, 349, 262];
    notes.forEach((f, i) => this.tone(dest, { type: 'triangle', f0: f, dur: 0.5, gain: 0.25, delay: i * 0.18 }));
  }

  /** Heartbeat speeds up as `danger` (0..1) rises. Call every frame. */
  heartbeat(danger: number): void {
    if (danger <= 0.05) return;
    const t = this.ctx.currentTime;
    if (t < this.heartbeatAt) return;
    const interval = 1.2 - danger * 0.75;
    this.heartbeatAt = t + interval;
    const dest = this.out(null);
    const g = 0.25 + danger * 0.6;
    this.tone(dest, { type: 'sine', f0: 62, f1: 40, dur: 0.16, gain: g });
    this.tone(dest, { type: 'sine', f0: 58, f1: 38, dur: 0.16, gain: g * 0.7, delay: 0.2 });
  }

  /** Looping wind, distant creaks and whispers. */
  startAmbience(): void {
    if (this.ambienceStarted) return;
    this.ambienceStarted = true;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 400;
    f.Q.value = 0.6;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoG = this.ctx.createGain();
    lfoG.gain.value = 220;
    lfo.connect(lfoG).connect(f.frequency);
    const g = this.ctx.createGain();
    g.gain.value = 0.09;
    const gl = this.ctx.createOscillator();
    gl.frequency.value = 0.13;
    const glG = this.ctx.createGain();
    glG.gain.value = 0.05;
    gl.connect(glG).connect(g.gain);
    src.connect(f).connect(g).connect(this.music);
    src.start(); lfo.start(); gl.start();
    // Low drone
    const drone = this.ctx.createOscillator();
    drone.type = 'triangle';
    drone.frequency.value = 49;
    const dg = this.ctx.createGain();
    dg.gain.value = 0.035;
    drone.connect(dg).connect(this.music);
    drone.start();
  }

  /** Electrical hum attached to a flickering lamp; returns a level setter. */
  addHum(pos: Pos): (level: number) => void {
    const o = this.ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 100;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 500;
    const g = this.ctx.createGain();
    g.gain.value = 0;
    o.connect(f).connect(g).connect(this.out(pos));
    o.start();
    const hum = { gain: g, base: 0.03 };
    this.hums.push(hum);
    return (level: number) => g.gain.setTargetAtTime(hum.base * level, this.ctx.currentTime, 0.02);
  }

  /** Pulsing chase music while Granny is close and can see you. */
  setChase(on: boolean): void {
    if (on && !this.chaseGain) {
      const g = this.ctx.createGain();
      g.gain.value = 0.0001;
      g.gain.exponentialRampToValueAtTime(0.5, this.ctx.currentTime + 0.6);
      g.connect(this.music);
      this.chaseGain = g;
      const bass = this.ctx.createOscillator();
      bass.type = 'sawtooth';
      bass.frequency.value = 55;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 300;
      const pulse = this.ctx.createGain();
      pulse.gain.value = 0;
      const lfo = this.ctx.createOscillator();
      lfo.type = 'square';
      lfo.frequency.value = 4;
      const lfoG = this.ctx.createGain();
      lfoG.gain.value = 0.25;
      lfo.connect(lfoG).connect(pulse.gain);
      bass.connect(lp).connect(pulse).connect(g);
      const high = this.ctx.createOscillator();
      high.type = 'triangle';
      high.frequency.value = 740;
      const hg = this.ctx.createGain();
      hg.gain.value = 0.04;
      high.connect(hg).connect(g);
      const high2 = this.ctx.createOscillator();
      high2.type = 'triangle';
      high2.frequency.value = 784;
      high2.connect(hg);
      for (const n of [bass, lfo, high, high2]) n.start();
      this.chaseNodes = [bass, lfo, high, high2];
      let step = 0;
      this.chaseTimer = window.setInterval(() => {
        step++;
        bass.frequency.setValueAtTime(step % 8 < 4 ? 55 : 52, this.ctx.currentTime);
      }, 500);
    } else if (!on && this.chaseGain) {
      const g = this.chaseGain;
      const nodes = this.chaseNodes;
      g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.6);
      if (this.chaseTimer !== null) clearInterval(this.chaseTimer);
      setTimeout(() => { for (const n of nodes) n.stop(); g.disconnect(); }, 3000);
      this.chaseGain = null;
      this.chaseNodes = [];
      this.chaseTimer = null;
    }
  }

  stopAll(): void {
    this.setChase(false);
  }
}
