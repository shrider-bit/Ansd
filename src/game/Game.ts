// The in-game scene: renders the house, runs the local player, shows the
// other player, plays sounds and talks to the authoritative room.

import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { LEVEL, hideFront, roomAt, type HideSpot } from '../shared/level';
import { doorSegment, lineClear, solidWallSegments, type Seg } from '../shared/geometry';
import {
  CHARACTER_NAMES, TUNING, type Character, type LobbyPlayer, type NetPlayer, type Role,
  type RoundInfo, type ServerMsg,
} from '../shared/protocol';
import { VOICE_LINES } from '../shared/voiceLines';
import type { Settings } from '../settings';
import type { Session } from '../net/session';
import type { Hud } from '../ui/hud';
import { AudioEngine } from './audio';
import { Input } from './input';
import { LocalPlayer } from './player';
import { animateRig, createGranny, createKid, type Rig } from './models';
import { buildWorld, setWardrobeOpen, type WorldObjects } from './world';
import { GrannyVoice } from './voice';

const WALLS: Seg[] = solidWallSegments(LEVEL);
const INTERP_DELAY = 0.1;

interface Remote {
  id: string;
  role: Role;
  character: Character;
  rig: Rig;
  buf: { t: number; p: NetPlayer }[];
  x: number; y: number; z: number; yaw: number;
  hidden: boolean;
  moving: boolean; run: boolean; crouch: boolean; light: boolean;
  stepAcc: number;
}

interface Interaction { label: string; act: () => void }

export type EndMsg = Extract<ServerMsg, { t: 'end' }>;

export interface GameEvents {
  onEnd: (msg: EndMsg) => void;
  onPauseRequest: () => void;
}

export class Game {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly input: Input;
  readonly audio: AudioEngine;
  readonly voice = new GrannyVoice();
  private world!: RAPIER.World;
  private objs!: WorldObjects;
  private player!: LocalPlayer;
  private session: Session | null = null;
  private readonly hud: Hud;
  private settings: Settings;
  private readonly events: GameEvents;

  you = '';
  private characters: Record<string, Character> = {};
  role: Role = 'survivor';
  phase: 'idle' | 'countdown' | 'playing' | 'ended' = 'idle';
  private timeLeft = 0;
  private countdown = 0;
  private keySpot = '';
  private keyHolder = '';
  private hiddenIn: HideSpot | null = null;
  private paused = false;
  private menuOpen = false;
  private remotes = new Map<string, Remote>();
  private readonly remoteFlash: THREE.SpotLight;
  private readonly remoteLantern: THREE.PointLight;
  private sendAcc = 0;
  private lastVoiceAt = -99;
  private clock = 0;
  private thunderIn = 12;
  private whisperIn = 40;
  private wardrobeAnim: { doors: THREE.Object3D[] | undefined; t: number } | null = null;
  private interaction: Interaction | null = null;
  private fpsFrames = 0;
  private fpsTime = 0;
  fps = 0;
  private running = false;
  private lastFrame = 0;
  private hums: ((level: number) => void)[] = [];
  private scareTime = -1;
  private chaseOn = false;
  private readonly tmpV = new THREE.Vector3();

  private constructor(canvas: HTMLCanvasElement, hud: Hud, settings: Settings, events: GameEvents) {
    this.hud = hud;
    this.settings = settings;
    this.events = events;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: settings.quality !== 'low', powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = settings.quality === 'high';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.camera = new THREE.PerspectiveCamera(72, 1, 0.05, 80);
    this.scene.background = new THREE.Color(0x040508);
    this.input = new Input(canvas, document.getElementById('stick')!, document.getElementById('stick-knob')!);
    this.audio = new AudioEngine(settings.quality !== 'low');
    this.remoteFlash = new THREE.SpotLight(0xfff1d0, 0, 18, 0.42, 0.5, 1.4);
    this.remoteLantern = new THREE.PointLight(0xff8a30, 0, 6, 1.8);
    this.scene.add(this.remoteFlash, this.remoteFlash.target, this.remoteLantern);
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  static async create(canvas: HTMLCanvasElement, hud: Hud, settings: Settings, events: GameEvents): Promise<Game> {
    await RAPIER.init();
    const g = new Game(canvas, hud, settings, events);
    g.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    g.objs = buildWorld(g.scene, g.world, LEVEL, settings.quality);
    g.player = new LocalPlayer(g.world, g.camera, g.scene, settings.quality === 'high');
    g.player.teleport(0.5, 10.5, 0);
    for (const l of g.objs.lamps) {
      if (l.flicker) g.hums.push(g.audio.addHum(l.light.position));
    }
    g.input.on((a) => g.onAction(a));
    hud.onVoiceButton((line) => g.sayVoice(line));
    g.applySettings(settings);
    g.start();
    return g;
  }

  applySettings(s: Settings): void {
    this.settings = s;
    this.audio.setVolume(s.volume);
    this.audio.setReduceLoud(s.reduceLoud);
    this.audio.setHrtf(s.quality !== 'low');
    this.voice.lang = s.voiceLang;
    this.voice.pitch = s.voicePitch;
    const dpr = window.devicePixelRatio || 1;
    this.renderer.setPixelRatio(s.quality === 'low' ? Math.min(dpr, 1) : s.quality === 'medium' ? Math.min(dpr, 1.5) : Math.min(dpr, 2));
    const fog = s.intensity === 'mild' ? 0.05 : s.intensity === 'scary' ? 0.095 : 0.07;
    this.scene.fog = new THREE.FogExp2(0x05060a, fog);
    this.objs.ambient.intensity = s.intensity === 'mild' ? 0.8 : s.intensity === 'scary' ? 0.3 : 0.5;
    if (this.session?.bot) this.session.bot.intensity = s.intensity;
    this.hud.setFps('');
    this.resize();
  }

  private resize(): void {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // ---------------- Session & messages ----------------

  attach(session: Session): void {
    this.session = session;
    if (session.bot) {
      session.bot.attach(this.world);
      session.bot.intensity = this.settings.intensity;
    }
  }

  detach(): void {
    this.session?.bot?.detach();
    this.session = null;
    this.phase = 'idle';
    this.hiddenIn = null;
    this.player.setEnabled(true);
    this.hud.setHidden(null);
    this.hud.show(false);
    this.hud.showScare(false);
    this.audio.setChase(false);
    this.chaseOn = false;
    for (const r of this.remotes.values()) this.scene.remove(r.rig.root);
    this.remotes.clear();
    this.remoteFlash.intensity = 0;
    this.remoteLantern.intensity = 0;
    this.input.enabled = false;
    this.paused = false;
    this.menuOpen = false;
    // Park the camera outside for the menu backdrop.
    this.player.teleport(0.5, 12.5, 0);
    this.player.frozen = true;
  }

  setPlayers(you: string, players: LobbyPlayer[]): void {
    this.you = you;
    for (const p of players) if (p.character) this.characters[p.id] = p.character;
  }

  private nameOf(id: string): string {
    const c = this.characters[id];
    return c ? CHARACTER_NAMES[c] : 'Player';
  }

  private get survivorId(): string {
    if (this.role === 'survivor') return this.you;
    for (const r of this.remotes.values()) if (r.role === 'survivor') return r.id;
    return '';
  }

  handle(msg: ServerMsg): void {
    switch (msg.t) {
      case 'round': this.startRound(msg.info); break;
      case 'go':
        this.phase = 'playing';
        this.player.frozen = false;
        this.hud.setCountdown('GO!');
        setTimeout(() => this.phase === 'playing' && this.hud.setCountdown(null), 900);
        if (this.role === 'granny') this.audio.cackle(null, 0.5);
        break;
      case 'snap': {
        this.timeLeft = msg.timeLeft;
        const now = performance.now() / 1000;
        for (const p of msg.players) {
          const r = this.remotes.get(p.id);
          if (!r) continue;
          r.buf.push({ t: now, p });
          if (r.buf.length > 20) r.buf.shift();
        }
        break;
      }
      case 'door': {
        const d = this.objs.doors.get(msg.id);
        if (!d) break;
        const wasOpen = d.state.open;
        d.apply(msg.state);
        const occ = this.occluded(d.center.x, d.center.z);
        if (msg.state.open && !wasOpen) this.audio.doorOpen(d.center, occ);
        else if (!msg.state.open && wasOpen) this.audio.doorClose(d.center, occ);
        break;
      }
      case 'key':
        this.keyHolder = msg.holder;
        this.objs.keyMesh.visible = false;
        if (msg.holder === this.you) {
          this.audio.pickup();
          this.hud.setKey(true);
          this.hud.toast('You found the key! Now unlock the front door.');
        } else if (this.role === 'granny') {
          this.hud.toast(`${this.nameOf(msg.holder)} found the key!`);
        }
        break;
      case 'unlocked':
        this.audio.unlock();
        this.hud.toast(this.role === 'survivor' ? 'Unlocked! Get out, quick!' : 'The front door is unlocked!');
        break;
      case 'hidden': this.onHidden(msg); break;
      case 'search': {
        const h = LEVEL.hideSpots.find((s) => s.id === msg.spot);
        if (h) {
          this.audio.wardrobe({ x: h.x, y: 1, z: h.z }, this.occluded(h.x, h.z));
          this.flapWardrobe(h.id);
        }
        if (!msg.found && this.role === 'granny') this.hud.toast('Nobody here... hmm.');
        break;
      }
      case 'voice': this.onVoice(msg); break;
      case 'info': {
        const text: Record<string, string> = {
          locked: 'The front door is locked. Find the key!',
          locked_granny: "It's locked.",
          blocked: 'Something is in the way!',
        };
        this.hud.toast(text[msg.text] ?? msg.text);
        if (msg.text.startsWith('locked')) this.audio.locked(this.objs.doors.get('front')!.center);
        break;
      }
      case 'correct':
        if (!this.hiddenIn) this.player.teleport(msg.x, msg.z, undefined, msg.y);
        break;
      case 'paused':
        this.paused = msg.paused;
        this.player.frozen = msg.paused || this.phase !== 'playing';
        this.hud.setCountdown(msg.paused ? '...' : null, msg.paused ? 'Waiting for the other player to reconnect' : '');
        break;
      case 'end': this.onEnd(msg); break;
      default: break;
    }
  }

  private startRound(info: RoundInfo): void {
    this.role = info.roles[this.you] ?? 'survivor';
    this.phase = info.phase;
    this.timeLeft = info.timeLeft;
    this.countdown = info.countdown;
    this.keySpot = info.keySpot;
    this.keyHolder = info.keyHolder;
    this.paused = false;
    this.scareTime = -1;
    this.hud.showScare(false);
    this.player.setRole(this.role);
    this.player.setEnabled(true);
    this.hiddenIn = null;
    this.hud.setHidden(null);
    const sp = info.spawns[this.you];
    this.player.teleport(sp.x, sp.z, sp.yaw);
    this.player.frozen = info.phase !== 'playing';
    for (const [id, st] of Object.entries(info.doors)) this.objs.doors.get(id)?.snap(st);
    // Key
    const k = LEVEL.keySpots.find((s) => s.id === info.keySpot);
    this.objs.keyMesh.visible = !info.keyHolder && !!k;
    if (k) this.objs.keyMesh.position.set(k.x, k.y + 0.05, k.z);
    this.hud.setKey(info.keyHolder === this.you);
    // Other player
    for (const r of this.remotes.values()) this.scene.remove(r.rig.root);
    this.remotes.clear();
    for (const [id, role] of Object.entries(info.roles)) {
      if (id === this.you) continue;
      const character = this.characters[id] ?? 'ahmed';
      const rig = role === 'granny' ? createGranny() : createKid(character);
      this.scene.add(rig.root);
      const s = info.spawns[id];
      this.remotes.set(id, {
        id, role, character, rig, buf: [], x: s.x, y: 0, z: s.z, yaw: s.yaw, hidden: false,
        moving: false, run: false, crouch: false, light: false, stepAcc: 0,
      });
    }
    if (info.hiddenIn) {
      const h = LEVEL.hideSpots.find((s) => s.id === info.hiddenIn);
      if (h) this.enterHide(h);
    }
    this.hud.setRole(this.role, this.nameOf(this.survivorId));
    this.hud.show(true);
    this.input.enabled = true;
    this.input.reset();
    this.thunderIn = 8 + Math.random() * 10;
    this.audio.startAmbience();
    this.audio.setChase(false);
    this.chaseOn = false;
    if (info.phase === 'countdown') {
      const survivorName = this.nameOf(this.survivorId);
      this.hud.setCountdown(String(Math.ceil(info.countdown)),
        this.role === 'granny' ? `You are GRANNY! Catch ${survivorName}!` : 'You are the SURVIVOR! Find the key and escape!');
    }
  }

  private onHidden(msg: Extract<ServerMsg, { t: 'hidden' }>): void {
    if (msg.player === this.you) {
      if (msg.hidden && msg.spot) {
        const h = LEVEL.hideSpots.find((s) => s.id === msg.spot);
        if (h) this.enterHide(h);
      } else if (!msg.hidden) {
        this.exitHide(msg.x ?? this.player.position.x, msg.z ?? this.player.position.z);
      }
      return;
    }
    const r = this.remotes.get(msg.player);
    if (!r) return;
    r.hidden = msg.hidden;
    if (msg.x !== undefined && msg.z !== undefined) {
      this.audio.wardrobe({ x: msg.x, y: 1, z: msg.z }, this.occluded(msg.x, msg.z));
      const h = LEVEL.hideSpots.reduce((a, b) => (Math.hypot(b.x - msg.x!, b.z - msg.z!) < Math.hypot(a.x - msg.x!, a.z - msg.z!) ? b : a));
      this.flapWardrobe(h.id);
      if (!msg.hidden) {
        // Jump the model straight to where they came out.
        r.x = msg.x; r.z = msg.z;
        r.buf = [];
      }
    }
  }

  private flapWardrobe(id: string): void {
    const doors = this.objs.wardrobeDoors.get(id);
    if (doors) this.wardrobeAnim = { doors, t: 0 };
  }

  private enterHide(h: HideSpot): void {
    this.hiddenIn = h;
    this.player.setEnabled(false);
    this.player.crouch = false;
    this.hud.setHidden(h.kind);
    this.audio.wardrobe(null);
    this.flapWardrobe(h.id);
    this.player.yaw = Math.atan2(-h.fx, -h.fz);
    this.player.pitch = 0;
  }

  private exitHide(x: number, z: number): void {
    const h = this.hiddenIn;
    this.hiddenIn = null;
    this.player.setEnabled(true);
    this.hud.setHidden(null);
    this.player.teleport(x, z, h ? Math.atan2(-h.fx, -h.fz) : undefined);
    if (h) this.flapWardrobe(h.id);
    this.audio.wardrobe(null);
  }

  private onVoice(msg: Extract<ServerMsg, { t: 'voice' }>): void {
    const target = this.characters[this.survivorId] ?? 'ahmed';
    const p = this.player.position;
    const d = Math.hypot(msg.x - p.x, msg.z - p.z);
    const occ = this.occluded(msg.x, msg.z);
    const mine = msg.from === this.you;
    const vol = mine ? 0.8 : Math.max(0.15, 1 - d / 28) * (occ ? 0.65 : 1);
    void this.voice.say(target, msg.line, vol);
    if (!mine) this.audio.voiceCue({ x: msg.x, y: 1.6, z: msg.z }, occ);
    if (msg.line === 4) this.audio.cackle(mine ? null : { x: msg.x, y: 1.6, z: msg.z }, 0.4);
    const text = VOICE_LINES[this.settings.voiceLang][target][msg.line];
    this.hud.toast(`Granny: "${text}"`, 2600);
  }

  private onEnd(msg: EndMsg): void {
    this.phase = 'ended';
    this.player.frozen = true;
    this.audio.setChase(false);
    this.chaseOn = false;
    this.hud.setPrompt(null, this.input.touchMode);
    const iAmSurvivor = msg.survivor === this.you;
    let delay = 900;
    if (msg.result === 'caught' && iAmSurvivor) {
      const strength = this.settings.intensity === 'mild' ? 0 : this.settings.intensity === 'scary' ? 1 : 0.6;
      if (strength > 0) {
        this.scareTime = 0;
        this.hud.showScare(true);
        this.audio.jumpScare(strength);
        delay = 1800;
      } else {
        this.audio.cackle(null, 0.4);
        delay = 1300;
      }
    } else if (msg.result === 'caught') {
      this.audio.cackle(null, 0.6);
      this.audio.stinger(true);
    } else if (msg.result === 'escaped') {
      this.audio.stinger(iAmSurvivor);
    } else {
      this.audio.stinger(false);
    }
    setTimeout(() => {
      this.hud.showScare(false);
      this.events.onEnd(msg);
    }, delay);
  }

  // ---------------- Actions ----------------

  private onAction(a: string): void {
    if (this.phase === 'idle') return;
    if (a === 'pause') {
      this.events.onPauseRequest();
      return;
    }
    if (this.menuOpen || this.phase !== 'playing' || this.paused) return;
    if (a === 'interact') this.interaction?.act();
    else if (a === 'flashlight') this.player.toggleLight();
    else if (a === 'crouch' && this.role === 'survivor' && !this.hiddenIn) this.player.crouch = !this.player.crouch;
    else if (a.startsWith('voice')) this.sayVoice(Number(a.slice(5)));
  }

  sayVoice(line: number): void {
    if (this.role !== 'granny' || this.phase !== 'playing') return;
    if (this.clock - this.lastVoiceAt < TUNING.voiceCooldown) return;
    this.lastVoiceAt = this.clock;
    this.session?.send({ t: 'voice', line });
  }

  setMenuOpen(open: boolean): void {
    this.menuOpen = open;
    this.input.enabled = !open && this.phase !== 'idle';
    if (open) this.input.reset();
  }

  setTouchCrouch(): void { this.onAction('crouch'); }

  private occluded(x: number, z: number): boolean {
    const p = this.player.position;
    return !this.lineOfSight(p.x, p.z, x, z);
  }

  private lineOfSight(ax: number, az: number, bx: number, bz: number): boolean {
    if (!lineClear(WALLS, ax, az, bx, bz)) return false;
    for (const d of this.objs.doors.values()) {
      if (Math.abs(d.angle) < 0.6) {
        const s = doorSegment(d.def);
        if (!lineClear([s], ax, az, bx, bz)) return false;
      }
    }
    return true;
  }

  private findInteraction(): Interaction | null {
    if (this.phase !== 'playing' || this.paused) return null;
    const send = this.session ? this.session.send.bind(this.session) : () => {};
    if (this.hiddenIn) {
      const id = this.hiddenIn.id;
      return { label: 'Leave hiding spot', act: () => send({ t: 'interact', kind: 'unhide', id }) };
    }
    const p = this.player.position;
    const fx = -Math.sin(this.player.yaw), fz = -Math.cos(this.player.yaw);
    let best: Interaction | null = null;
    let bestScore = Infinity;
    const consider = (x: number, z: number, range: number, make: () => Interaction | null) => {
      const dx = x - p.x, dz = z - p.z;
      const d = Math.hypot(dx, dz);
      if (d > range) return;
      const dot = d < 0.01 ? 1 : (dx * fx + dz * fz) / d;
      if (dot < 0.25 && d > 0.9) return;
      const score = d * (1.6 - dot);
      if (score < bestScore) {
        const it = make();
        if (it) { best = it; bestScore = score; }
      }
    };
    for (const door of this.objs.doors.values()) {
      consider(door.def.x, door.def.z, 2.1, () => {
        const id = door.def.id;
        const act = () => send({ t: 'interact', kind: 'door', id });
        if (door.state.locked) {
          if (this.role === 'survivor' && this.keyHolder === this.you) return { label: 'Unlock the front door', act };
          return { label: this.role === 'survivor' ? 'Locked - find the key' : 'Locked', act };
        }
        return { label: door.state.open ? 'Close door' : 'Open door', act };
      });
    }
    if (this.role === 'survivor' && !this.keyHolder && this.objs.keyMesh.visible) {
      const k = this.objs.keyMesh.position;
      const keySpot = this.keySpot;
      consider(k.x, k.z, 1.9, () => ({ label: 'Pick up the key', act: () => send({ t: 'interact', kind: 'key', id: keySpot }) }));
    }
    for (const h of LEVEL.hideSpots) {
      const f = hideFront(h);
      const toSpot = (h.x - p.x) * fx + (h.z - p.z) * fz;
      if (toSpot < 0) continue;
      consider(f.x, f.z, 1.3, () => {
        const what = h.kind === 'bed' ? 'under the bed' : h.id === 'pantry' ? 'in the pantry' : 'in the wardrobe';
        return this.role === 'survivor'
          ? { label: `Hide ${what}`, act: () => send({ t: 'interact', kind: 'hide', id: h.id }) }
          : { label: `Search ${h.kind === 'bed' ? 'under the bed' : h.id === 'pantry' ? 'the pantry' : 'the wardrobe'}`, act: () => send({ t: 'interact', kind: 'search', id: h.id }) };
      });
    }
    return best;
  }

  // ---------------- Frame loop ----------------

  private start(): void {
    this.running = true;
    this.lastFrame = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, Math.max(0.001, (now - this.lastFrame) / 1000));
      this.lastFrame = now;
      this.frame(dt);
    };
    requestAnimationFrame(loop);
  }

  private frame(dt: number): void {
    this.clock += dt;
    const active = this.phase !== 'idle';
    const practicePaused = this.session?.practice && this.menuOpen;

    // Local player
    if (this.hiddenIn) {
      const h = this.hiddenIn;
      const look = this.input.consumeLook();
      this.player.yaw -= look.x * 0.002 * this.settings.sensitivity;
      this.player.pitch -= look.y * 0.002 * this.settings.sensitivity;
      this.player.pitch = Math.max(-0.4, Math.min(0.4, this.player.pitch));
      const base = Math.atan2(-h.fx, -h.fz);
      const out = h.kind === 'bed' ? 0.55 : 0.45;
      this.player.viewFrom(h.x + h.fx * out, h.kind === 'bed' ? 0.2 : 1.45, h.z + h.fz * out, base);
    } else if (active && !practicePaused) {
      if (this.player.update(dt, this.input, this.settings.sensitivity, this.settings.invertY)) {
        this.audio.footstep(null, this.role === 'granny', this.player.running, this.player.crouch);
      }
    } else if (!active) {
      // Menu backdrop: slowly look at the house.
      this.camera.position.set(0.5 + Math.sin(this.clock * 0.1) * 3, 1.8, 15);
      this.camera.lookAt(0.5, 2.2, 0);
    }

    for (const d of this.objs.doors.values()) d.update(dt);
    this.world.step();

    if (this.wardrobeAnim) {
      this.wardrobeAnim.t += dt;
      const t = this.wardrobeAnim.t;
      setWardrobeOpen(this.wardrobeAnim.doors, t < 0.3 ? t / 0.3 : t < 0.7 ? 1 : Math.max(0, 1 - (t - 0.7) / 0.3));
      if (t > 1) this.wardrobeAnim = null;
    }

    // Network: send our state 20x a second.
    if (this.session && (this.phase === 'playing' || this.phase === 'countdown')) {
      this.sendAcc += dt;
      if (this.sendAcc >= 0.05) {
        this.sendAcc = 0;
        const p = this.player.position;
        this.session.send({
          t: 'move', x: p.x, y: p.y, z: p.z, yaw: this.player.yaw, pitch: this.player.pitch,
          crouch: this.player.crouch, run: this.player.running, moving: this.player.moving, light: this.player.lightOn,
        });
      }
    }

    if (this.session?.bot && !practicePaused) this.session.bot.update(dt);

    this.updateRemotes(dt);
    this.updateAtmosphere(dt);

    // Key sparkle
    if (this.objs.keyMesh.visible) {
      this.objs.keyMesh.rotation.y += dt * 1.5;
      this.objs.keyMesh.position.y += Math.sin(this.clock * 3) * 0.0015;
    }

    // HUD
    if (active) {
      if (this.phase === 'playing' && !this.paused && !practicePaused) this.timeLeft = Math.max(0, this.timeLeft - dt);
      this.hud.setTimer(this.phase === 'countdown' ? this.timeLeft : this.timeLeft);
      if (this.phase === 'countdown' && !this.paused) {
        this.countdown -= practicePaused ? 0 : dt;
        const survivorName = this.nameOf(this.survivorId);
        this.hud.setCountdown(String(Math.max(1, Math.ceil(this.countdown))),
          this.role === 'granny' ? `You are GRANNY! Catch ${survivorName}!` : 'You are the SURVIVOR! Find the key and escape!');
      }
      this.hud.setStamina(this.player.stamina.value, this.player.stamina.exhausted);
      const p = this.player.position;
      this.hud.setRoom(roomAt(LEVEL, p.x, p.z));
      this.hud.setObjective(this.objectiveText());
      this.interaction = this.menuOpen ? null : this.findInteraction();
      this.hud.setPrompt(this.interaction?.label ?? null, this.input.touchMode);
      this.hud.setVoiceCooldown(1 - (this.clock - this.lastVoiceAt) / TUNING.voiceCooldown);
      this.hud.setNet(this.session && !this.session.practice ? `ping ${Math.round(this.session.rtt)} ms` : '');
    }

    this.audio.updateListener(this.camera);
    this.renderer.render(this.scene, this.camera);

    // Measure FPS with real time (dt is clamped, so it can't be used here).
    this.fpsFrames++;
    const nowMs = performance.now();
    if (nowMs - this.fpsTime >= 1000) {
      this.fps = (this.fpsFrames * 1000) / (nowMs - this.fpsTime);
      this.fpsFrames = 0;
      this.fpsTime = nowMs;
      this.hud.setFps(this.settings.showFps ? `${Math.round(this.fps)} FPS` : '');
    }
  }

  private objectiveText(): string {
    if (this.role === 'granny') {
      const name = this.nameOf(this.survivorId);
      return this.keyHolder ? `${name} has the key! Guard the front door!` : `Find and catch ${name}!`;
    }
    const front = this.objs.doors.get('front')!;
    if (this.keyHolder !== this.you) return 'Find the front door key';
    if (front.state.locked) return 'Unlock the front door';
    return 'Escape through the front door!';
  }

  private updateRemotes(dt: number): void {
    const renderT = performance.now() / 1000 - INTERP_DELAY;
    const me = this.player.position;
    let dangerDist = Infinity;
    let grannySeesMe = false;
    this.remoteFlash.intensity = 0;
    this.remoteLantern.intensity = 0;
    for (const r of this.remotes.values()) {
      // Interpolate between the two snapshots around renderT.
      const buf = r.buf;
      let i = buf.length - 1;
      while (i > 0 && buf[i].t > renderT) i--;
      const a = buf[i];
      const b = i < buf.length - 1 && a.t <= renderT ? buf[i + 1] : a;
      const prevX = r.x, prevZ = r.z;
      if (a && b) {
        const span = b.t - a.t;
        const k = span > 0 ? Math.min(1, Math.max(0, (renderT - a.t) / span)) : 1;
        if (!b.p.hidden) {
          r.x = a.p.hidden ? b.p.x : a.p.x + (b.p.x - a.p.x) * k;
          r.z = a.p.hidden ? b.p.z : a.p.z + (b.p.z - a.p.z) * k;
          r.y = b.p.y;
        }
        let dy = b.p.yaw - a.p.yaw;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        r.yaw = a.p.yaw + dy * k;
        r.hidden = b.p.hidden;
        r.moving = b.p.moving; r.run = b.p.run; r.crouch = b.p.crouch; r.light = b.p.light;
      }
      const moved = Math.hypot(r.x - prevX, r.z - prevZ);
      const speed = r.hidden ? 0 : moved / dt;
      r.rig.root.visible = !r.hidden;
      r.rig.root.position.set(r.x, Math.max(0, r.y), r.z);
      r.rig.root.rotation.y = r.yaw + Math.PI;
      animateRig(r.rig, dt, Math.min(speed, 6), r.crouch, r.role === 'granny');

      // Lights carried by the other player
      if (!r.hidden && r.rig.lanternAnchor) {
        r.rig.lanternAnchor.getWorldPosition(this.tmpV);
        if (r.role === 'granny') {
          this.remoteLantern.position.copy(this.tmpV);
          this.remoteLantern.intensity = 3;
        } else if (r.light) {
          this.remoteFlash.position.set(r.x, 1.3, r.z);
          this.remoteFlash.target.position.set(r.x - Math.sin(r.yaw) * 5, 1.0, r.z - Math.cos(r.yaw) * 5);
          this.remoteFlash.intensity = 12;
        }
      }

      // Footsteps of the other player (Granny hears the survivor, and vice versa).
      if (!r.hidden && r.moving) {
        r.stepAcc += moved;
        const stride = r.run ? 1.5 : r.crouch ? 0.9 : 1.2;
        if (r.stepAcc >= stride && moved < 2) {
          r.stepAcc = 0;
          this.audio.footstep({ x: r.x, y: 0.1, z: r.z }, r.role === 'granny', r.run, r.crouch, this.occluded(r.x, r.z));
        }
      }

      if (r.role === 'granny') {
        const d = Math.hypot(r.x - me.x, r.z - me.z);
        dangerDist = Math.min(dangerDist, d);
        if (d < 10 && this.lineOfSight(r.x, r.z, me.x, me.z)) grannySeesMe = true;
      } else if (this.role === 'granny' && !r.hidden) {
        const d = Math.hypot(r.x - me.x, r.z - me.z);
        if (d < 9 && this.lineOfSight(r.x, r.z, me.x, me.z)) grannySeesMe = true;
      }

      // Jump scare: pull Granny's face right up to the camera.
      if (this.scareTime >= 0 && r.role === 'granny') {
        this.scareTime += dt;
        this.camera.getWorldDirection(this.tmpV);
        const cam = this.camera.position;
        r.rig.root.visible = true;
        r.rig.root.position.set(cam.x + this.tmpV.x * 0.55, cam.y - 1.62, cam.z + this.tmpV.z * 0.55);
        r.rig.root.rotation.y = Math.atan2(-this.tmpV.x, -this.tmpV.z);
        r.rig.head.rotation.z = Math.sin(this.scareTime * 40) * 0.15;
        this.remoteLantern.position.set(cam.x, cam.y - 0.3, cam.z);
      }
    }
    if (this.phase === 'playing') {
      const danger = this.role === 'survivor' && dangerDist < 11 ? 1 - dangerDist / 11 : 0;
      this.audio.heartbeat(danger);
      this.hud.setDanger(danger > 0.6);
      const chase = grannySeesMe && (this.role === 'granny' || dangerDist < 10);
      if (chase !== this.chaseOn && this.settings.intensity !== 'mild') {
        this.chaseOn = chase;
        this.audio.setChase(chase);
      }
    } else {
      this.hud.setDanger(false);
    }
  }

  private updateAtmosphere(dt: number): void {
    const intensity = this.settings.intensity;
    // Flickering lamps
    this.objs.lamps.forEach((l, i) => {
      if (!l.flicker) return;
      const t = this.clock * (intensity === 'scary' ? 1.6 : 1) + l.phase;
      const off = Math.sin(t * 1.3) > 0.93 || (Math.sin(t * 7.1) > 0.97 && Math.sin(t * 0.4) > 0);
      const level = off ? 0.05 : 0.85 + Math.sin(t * 23) * 0.1;
      l.light.intensity = l.base * level;
      (l.bulb.material as THREE.MeshBasicMaterial).color.setScalar(level);
      this.hums[i % Math.max(1, this.hums.length)]?.(off ? 0 : 1);
    });
    if (this.phase === 'idle') return;
    // Lightning + thunder
    this.thunderIn -= dt;
    if (this.thunderIn <= 0) {
      const freq = intensity === 'mild' ? 50 : intensity === 'scary' ? 18 : 30;
      this.thunderIn = freq + Math.random() * freq;
      const near = Math.random();
      this.hud.lightning(0.5 + near * 0.5);
      for (const w of this.objs.windows) {
        w.color.set(0xd8e4ff);
        setTimeout(() => w.color.set(0x223355), 160 + Math.random() * 200);
      }
      const amb = this.objs.ambient;
      const base = amb.intensity;
      amb.intensity = base + 1.4 * (0.5 + near * 0.5);
      setTimeout(() => { amb.intensity = base; }, 140);
      setTimeout(() => this.audio.thunder(1 - near), 300 + (1 - near) * 2000);
    }
    // Distant whispers and creaks
    this.whisperIn -= dt;
    if (this.whisperIn <= 0 && this.phase === 'playing') {
      this.whisperIn = (intensity === 'mild' ? 70 : intensity === 'scary' ? 25 : 45) * (0.6 + Math.random() * 0.8);
      const p = this.player.position;
      const ang = Math.random() * Math.PI * 2;
      const pos = { x: p.x + Math.cos(ang) * 4, y: 1.5, z: p.z + Math.sin(ang) * 4 };
      if (intensity !== 'mild' && Math.random() < 0.6) this.audio.whisper(pos);
      else this.audio.creak(pos, true, 0.8);
    }
  }

  /** Debug/test hooks (only exposed with ?debug=1). */
  debugState(): Record<string, unknown> {
    const p = this.player.position;
    return {
      phase: this.phase, role: this.role, you: this.you, x: p.x, z: p.z, yaw: this.player.yaw,
      hidden: this.hiddenIn?.id ?? null, keyHolder: this.keyHolder, keySpot: this.keySpot, timeLeft: this.timeLeft,
      fps: this.fps, remotes: [...this.remotes.values()].map((r) => ({ id: r.id, role: r.role, x: r.x, z: r.z, hidden: r.hidden })),
      doors: Object.fromEntries([...this.objs.doors.entries()].map(([id, d]) => [id, d.state])),
      prompt: this.interaction?.label ?? null,
      bot: this.session?.bot ? { mode: this.session.bot.mode, x: this.session.bot.x, z: this.session.bot.z } : null,
      drawCalls: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles,
    };
  }

  debugTeleport(x: number, z: number, yaw?: number): void {
    this.player.teleport(x, z, yaw);
  }

  debugInteract(): void {
    this.interaction?.act();
  }
}
