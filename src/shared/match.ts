// One round of play. Authoritative: decides doors, keys, hiding, catching,
// escaping and the timer. Runs on the Node server for online games and in
// the browser for practice games.

import { LEVEL, hideFront, type Level } from './level';
import { doorSegment, dist2, doorSwingDir, lineClear, solidWallSegments, type Seg } from './geometry';
import {
  TUNING, type ClientMsg, type DoorState, type NetPlayer, type Role, type RoundInfo,
  type RoundResult, type ServerMsg,
} from './protocol';
import { VOICE_LINE_COUNT } from './voiceLines';
import { pick } from './rng';

interface MPlayer extends NetPlayer {
  role: Role;
  hiddenIn: string | null;
  /** Movement budget in metres (token bucket for speed validation). */
  budget: number;
  lastCorrect: number;
  lastVoice: number;
  lastSearch: number;
}

export interface MatchOptions {
  round: number;
  roles: Record<string, Role>;
  timeLimit: number;
  rng: () => number;
  /** Send to one player. */
  send: (to: string, msg: ServerMsg) => void;
  onEnd: (result: RoundResult) => void;
  level?: Level;
}

export class Match {
  readonly level: Level;
  readonly round: number;
  readonly timeLimit: number;
  phase: 'countdown' | 'playing' | 'ended' = 'countdown';
  countdown: number = TUNING.countdownSeconds;
  timeLeft: number;
  paused = false;
  result: RoundResult | null = null;
  readonly doors: Record<string, DoorState> = {};
  readonly keySpot: string;
  keyHolder = '';
  frontUnlocked = false;
  readonly players = new Map<string, MPlayer>();
  private readonly walls: Seg[];
  private readonly doorToggleAt = new Map<string, number>();
  private clock = 0;
  private readonly opts: MatchOptions;

  constructor(opts: MatchOptions) {
    this.opts = opts;
    this.level = opts.level ?? LEVEL;
    this.round = opts.round;
    this.timeLimit = opts.timeLimit;
    this.timeLeft = opts.timeLimit;
    this.walls = solidWallSegments(this.level);
    for (const d of this.level.doors) {
      if (d.kind === 'arch') continue;
      this.doors[d.id] = { open: false, dir: 1, locked: d.kind === 'front' };
    }
    this.keySpot = pick(opts.rng, this.level.keySpots).id;
    for (const [id, role] of Object.entries(opts.roles)) {
      const s = this.level.spawns[role];
      this.players.set(id, {
        id, role, x: s.x, y: 0, z: s.z, yaw: s.yaw, pitch: 0,
        crouch: false, run: false, moving: false, light: false, hidden: false,
        hiddenIn: null, budget: 0, lastCorrect: -1, lastVoice: -99, lastSearch: -99,
      });
    }
  }

  get survivor(): MPlayer | undefined {
    for (const p of this.players.values()) if (p.role === 'survivor') return p;
    return undefined;
  }

  get granny(): MPlayer | undefined {
    for (const p of this.players.values()) if (p.role === 'granny') return p;
    return undefined;
  }

  info(forId: string): RoundInfo {
    const roles: Record<string, Role> = {};
    const spawns: RoundInfo['spawns'] = {};
    for (const p of this.players.values()) {
      roles[p.id] = p.role;
      const hide = p.hidden && p.id !== forId;
      spawns[p.id] = hide ? { x: 0, z: 0, yaw: 0 } : { x: p.x, z: p.z, yaw: p.yaw };
    }
    return {
      round: this.round, roles, timeLimit: this.timeLimit, keySpot: this.keySpot,
      keyHolder: this.keyHolder, frontUnlocked: this.frontUnlocked, doors: { ...this.doors },
      phase: this.phase, timeLeft: this.timeLeft, countdown: this.countdown, spawns,
      hiddenIn: this.players.get(forId)?.hiddenIn ?? null,
    };
  }

  /** Line of sight on the floor plan, blocked by walls and closed doors. */
  canSee(ax: number, az: number, bx: number, bz: number): boolean {
    if (!lineClear(this.walls, ax, az, bx, bz)) return false;
    return lineClear(this.closedDoorSegs(), ax, az, bx, bz);
  }

  private closedDoorSegs(): Seg[] {
    const out: Seg[] = [];
    for (const d of this.level.doors) {
      const st = this.doors[d.id];
      if (st && !st.open) out.push(doorSegment(d));
    }
    return out;
  }

  private sendAll(msg: ServerMsg): void {
    for (const id of this.players.keys()) this.opts.send(id, msg);
  }

  handle(id: string, msg: ClientMsg): void {
    const p = this.players.get(id);
    if (!p || this.phase === 'ended') return;
    switch (msg.t) {
      case 'move': this.onMove(p, msg); break;
      case 'interact': if (this.phase === 'playing' && !this.paused) this.onInteract(p, msg.kind, msg.id); break;
      case 'voice': this.onVoice(p, msg.line); break;
      default: break;
    }
  }

  private correct(p: MPlayer): void {
    if (this.clock - p.lastCorrect < 0.25) return;
    p.lastCorrect = this.clock;
    this.opts.send(p.id, { t: 'correct', x: p.x, y: p.y, z: p.z });
  }

  private maxSpeed(p: MPlayer): number {
    return p.role === 'granny' ? TUNING.grannyRun : TUNING.survivorRun;
  }

  private onMove(p: MPlayer, m: Extract<ClientMsg, { t: 'move' }>): void {
    p.yaw = m.yaw;
    p.pitch = Math.max(-1.6, Math.min(1.6, m.pitch));
    p.light = m.light;
    if (this.phase !== 'playing' || this.paused || p.hidden) {
      p.moving = false;
      return;
    }
    const d = dist2(p.x, p.z, m.x, m.z);
    const b = this.level.bounds;
    const inBounds = m.x >= b.x1 && m.x <= b.x2 && m.z >= b.z1 && m.z <= b.z2 && m.y > -1 && m.y < 3.5;
    const blocked = d > 0.001 && !this.canSee(p.x, p.z, m.x, m.z);
    if (!inBounds || blocked || d > p.budget + 0.35) {
      this.correct(p);
      return;
    }
    p.budget = Math.max(0, p.budget - d);
    p.x = m.x; p.y = m.y; p.z = m.z;
    p.crouch = p.role === 'survivor' && m.crouch;
    p.run = m.run;
    p.moving = m.moving;
    if (p.role === 'survivor' && p.z >= this.level.escapeZ) this.end('escaped');
  }

  private onInteract(p: MPlayer, kind: string, targetId: string): void {
    const near = (x: number, z: number, r: number = TUNING.interactDistance) => dist2(p.x, p.z, x, z) <= r;
    if (kind === 'door') {
      const def = this.level.doors.find((d) => d.id === targetId);
      const st = this.doors[targetId];
      if (!def || !st || p.hidden || !near(def.x, def.z)) return;
      const last = this.doorToggleAt.get(def.id) ?? -99;
      if (this.clock - last < 0.45) return;
      if (st.locked) {
        if (p.role === 'survivor' && this.keyHolder === p.id) {
          st.locked = false;
          this.frontUnlocked = true;
          this.sendAll({ t: 'unlocked' });
        } else {
          this.opts.send(p.id, { t: 'info', text: p.role === 'survivor' ? 'locked' : 'locked_granny' });
          return;
        }
      }
      if (st.open) {
        for (const other of this.players.values()) {
          if (!other.hidden && dist2(other.x, other.z, def.x, def.z) < 0.75) {
            this.opts.send(p.id, { t: 'info', text: 'blocked' });
            return;
          }
        }
        st.open = false;
      } else {
        st.open = true;
        st.dir = doorSwingDir(def, p.x, p.z);
      }
      this.doorToggleAt.set(def.id, this.clock);
      this.sendAll({ t: 'door', id: def.id, state: { ...st }, by: p.id });
      return;
    }
    if (kind === 'key') {
      if (p.role !== 'survivor' || p.hidden || this.keyHolder || targetId !== this.keySpot) return;
      const k = this.level.keySpots.find((s) => s.id === targetId);
      if (!k || !near(k.x, k.z)) return;
      this.keyHolder = p.id;
      this.sendAll({ t: 'key', holder: p.id, spot: k.id });
      return;
    }
    if (kind === 'hide') {
      const h = this.level.hideSpots.find((s) => s.id === targetId);
      if (p.role !== 'survivor' || p.hidden || !h) return;
      const f = hideFront(h);
      if (!near(f.x, f.z)) return;
      p.hidden = true;
      p.hiddenIn = h.id;
      p.moving = false;
      p.run = false;
      this.opts.send(p.id, { t: 'hidden', player: p.id, hidden: true, spot: h.id });
      const g = this.granny;
      if (g) {
        // Granny only learns where if she was close enough to hear the creak.
        const heard = dist2(g.x, g.z, h.x, h.z) < 8;
        this.opts.send(g.id, heard
          ? { t: 'hidden', player: p.id, hidden: true, spot: null, x: h.x, z: h.z }
          : { t: 'hidden', player: p.id, hidden: true, spot: null });
      }
      return;
    }
    if (kind === 'unhide') {
      if (!p.hidden || !p.hiddenIn) return;
      const h = this.level.hideSpots.find((s) => s.id === p.hiddenIn)!;
      const f = hideFront(h);
      p.hidden = false;
      p.hiddenIn = null;
      p.x = f.x; p.z = f.z; p.y = 0;
      p.budget = 0;
      this.sendAll({ t: 'hidden', player: p.id, hidden: false, spot: null, x: f.x, z: f.z });
      return;
    }
    if (kind === 'search') {
      const h = this.level.hideSpots.find((s) => s.id === targetId);
      if (p.role !== 'granny' || !h) return;
      const f = hideFront(h);
      if (!near(f.x, f.z) || this.clock - p.lastSearch < 1.2) return;
      p.lastSearch = this.clock;
      const s = this.survivor;
      const found = !!s && s.hiddenIn === h.id;
      this.sendAll({ t: 'search', spot: h.id, found });
      if (found) this.end('caught');
    }
  }

  private onVoice(p: MPlayer, line: number): void {
    if (p.role !== 'granny' || line < 0 || line >= VOICE_LINE_COUNT) return;
    if (this.clock - p.lastVoice < TUNING.voiceCooldown) return;
    p.lastVoice = this.clock;
    this.sendAll({ t: 'voice', from: p.id, line, x: p.x, z: p.z });
  }

  setPaused(paused: boolean, reason: string): void {
    if (this.paused === paused || this.phase === 'ended') return;
    this.paused = paused;
    this.sendAll({ t: 'paused', paused, reason });
  }

  tick(dt: number): void {
    if (this.phase === 'ended' || this.paused) return;
    this.clock += dt;
    if (this.phase === 'countdown') {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        this.phase = 'playing';
        this.sendAll({ t: 'go' });
      }
      return;
    }
    for (const p of this.players.values()) {
      p.budget = Math.min(p.budget + this.maxSpeed(p) * TUNING.speedTolerance * dt, this.maxSpeed(p) * 1.2);
    }
    this.timeLeft = Math.max(0, this.timeLeft - dt);
    const s = this.survivor, g = this.granny;
    if (s && g && !s.hidden) {
      const d = dist2(s.x, s.z, g.x, g.z);
      if (d <= TUNING.catchDistance && Math.abs(s.y - g.y) < 1.5 && this.canSee(g.x, g.z, s.x, s.z)) {
        this.end('caught');
        return;
      }
    }
    if (this.timeLeft <= 0) this.end('timeup');
  }

  /** Per-recipient snapshot of the other players. */
  snapshot(forId: string): ServerMsg {
    const players: NetPlayer[] = [];
    for (const p of this.players.values()) {
      if (p.id === forId) continue;
      const conceal = p.hidden;
      players.push({
        id: p.id, x: conceal ? 0 : p.x, y: conceal ? -100 : p.y, z: conceal ? 0 : p.z,
        yaw: p.yaw, pitch: p.pitch, crouch: p.crouch, run: p.run, moving: p.moving,
        light: p.light, hidden: p.hidden,
      });
    }
    return { t: 'snap', timeLeft: this.timeLeft, players };
  }

  end(result: RoundResult): void {
    if (this.phase === 'ended') return;
    this.phase = 'ended';
    this.result = result;
    this.opts.onEnd(result);
  }
}
