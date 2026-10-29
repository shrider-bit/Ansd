// Computer-controlled Granny for Practice mode. She plays by the same rules
// as a human Granny: she only gets the information the room sends to the
// Granny player, and sends the same move / interact / voice messages.

import RAPIER from '@dimforge/rapier3d-compat';
import { LEVEL, hideFront, type HideSpot } from '../shared/level';
import { doorSegment, lineClear, solidWallSegments, type Seg } from '../shared/geometry';
import { NavGraph } from '../shared/nav';
import { TUNING, type ClientMsg, type DoorState, type NetPlayer, type ServerMsg } from '../shared/protocol';
import type { Intensity } from '../settings';

export type BotMode = 'idle' | 'patrol' | 'investigate' | 'chase' | 'lookaround' | 'checkHide';

const WALLS: Seg[] = solidWallSegments(LEVEL);

export interface SightInput {
  gx: number; gz: number; gyaw: number;
  sx: number; sz: number;
  survivorLight: boolean; survivorCrouch: boolean;
  clear: boolean;
  intensity: Intensity;
}

/** Can Granny see the survivor? Pure function so it can be unit tested. */
export function canSee(s: SightInput): boolean {
  if (!s.clear) return false;
  const dx = s.sx - s.gx, dz = s.sz - s.gz;
  const d = Math.hypot(dx, dz);
  if (d < 2.2) return true; // Too close to miss.
  let range = s.survivorLight ? 20 : 10;
  if (s.survivorCrouch) range *= 0.7;
  if (s.intensity === 'mild') range *= 0.8;
  if (d > range) return false;
  // Forward is -z at yaw 0.
  const fx = -Math.sin(s.gyaw), fz = -Math.cos(s.gyaw);
  const cosAngle = (dx * fx + dz * fz) / d;
  return cosAngle > Math.cos((60 * Math.PI) / 180);
}

/** How far away Granny can hear the survivor's footsteps. */
export function hearingRange(run: boolean, crouch: boolean, moving: boolean, occluded: boolean): number {
  if (!moving) return 0;
  const r = run ? 13 : crouch ? 1.5 : 5.5;
  return occluded ? r * 0.6 : r;
}

export class GrannyBot {
  id: string;
  private readonly send: (msg: ClientMsg) => void;
  readonly nav = new NavGraph(LEVEL.nav.nodes, LEVEL.nav.edges);
  mode: BotMode = 'idle';
  x = LEVEL.spawns.granny.x;
  z = LEVEL.spawns.granny.z;
  yaw = LEVEL.spawns.granny.yaw;
  intensity: Intensity = 'normal';
  private playing = false;
  private survivor: NetPlayer | null = null;
  private doors: Record<string, DoorState> = {};
  private target: { x: number; z: number } | null = null;
  private path: { x: number; z: number }[] = [];
  private timer = 0;
  private lastSeenAt = -99;
  private lastSeen: { x: number; z: number } | null = null;
  private hideTarget: HideSpot | null = null;
  private clock = 0;
  private sendAcc = 0;
  private voiceAt = 0;
  private doorOpenedAt = new Map<string, number>();
  private pauseFor = 0;
  private stuckTimer = 0;
  private stuckFrom = { x: 0, z: 0 };
  private forceNavFor = 0;
  private collider: RAPIER.Collider | null = null;
  private controller: RAPIER.KinematicCharacterController | null = null;
  private world: RAPIER.World | null = null;
  private moving = false;

  constructor(id: string, send: (msg: ClientMsg) => void) {
    this.id = id;
    this.send = send;
  }

  attach(world: RAPIER.World): void {
    this.detach();
    this.world = world;
    this.collider = world.createCollider(RAPIER.ColliderDesc.capsule(0.5, 0.35).setTranslation(this.x, 0.85, this.z));
    this.controller = world.createCharacterController(0.02);
    this.controller.setSlideEnabled(true);
    this.controller.enableSnapToGround(0.3);
  }

  detach(): void {
    if (this.world && this.collider) this.world.removeCollider(this.collider, false);
    if (this.world && this.controller) this.world.removeCharacterController(this.controller);
    this.collider = null;
    this.controller = null;
    this.world = null;
  }

  /** The bot's own collider (so the local player can ignore it if needed). */
  get colliderHandle(): number | null {
    return this.collider?.handle ?? null;
  }

  receive(msg: ServerMsg): void {
    switch (msg.t) {
      case 'round': {
        const sp = msg.info.spawns[this.id];
        this.x = sp.x; this.z = sp.z; this.yaw = sp.yaw;
        this.collider?.setTranslation({ x: this.x, y: 0.85, z: this.z });
        this.doors = { ...msg.info.doors };
        this.playing = msg.info.phase === 'playing';
        this.mode = 'patrol';
        this.target = null;
        this.path = [];
        this.survivor = null;
        this.lastSeen = null;
        this.voiceAt = this.clock + 6;
        break;
      }
      case 'go': this.playing = true; break;
      case 'end': this.playing = false; this.mode = 'idle'; break;
      case 'snap':
        this.survivor = msg.players[0] ?? null;
        break;
      case 'door':
        this.doors[msg.id] = msg.state;
        if (msg.by !== this.id && this.mode !== 'chase') {
          // Heard a door: go and look.
          const d = LEVEL.doors.find((q) => q.id === msg.id)!;
          if (Math.hypot(d.x - this.x, d.z - this.z) < 12) this.investigate(d.x, d.z);
        }
        break;
      case 'hidden':
        if (msg.player !== this.id && msg.hidden) {
          const recentlySeen = this.clock - this.lastSeenAt < 1.5 && this.lastSeen;
          const heardAt = msg.x !== undefined && msg.z !== undefined ? { x: msg.x, z: msg.z } : null;
          const where = heardAt ?? (recentlySeen ? this.lastSeen : null);
          if (where) {
            const spot = nearestHide(where.x, where.z);
            if (spot && Math.hypot(spot.x - where.x, spot.z - where.z) < 3) this.checkHide(spot);
          }
        }
        break;
      case 'search':
        if (this.mode === 'checkHide') {
          this.mode = 'lookaround';
          this.timer = 2.5;
          this.hideTarget = null;
        }
        if (msg.found) this.say(4);
        break;
      default:
        break;
    }
  }

  private say(line: number): void {
    this.send({ t: 'voice', line });
    this.voiceAt = this.clock + 15 + Math.random() * 20;
  }

  private investigate(x: number, z: number): void {
    this.mode = 'investigate';
    this.setTarget(x, z);
  }

  private checkHide(spot: HideSpot): void {
    this.mode = 'checkHide';
    this.hideTarget = spot;
    const f = hideFront(spot);
    this.setTarget(f.x, f.z);
  }

  private setTarget(x: number, z: number): void {
    this.target = { x, z };
    this.path = this.planPath(x, z);
  }

  private wallsClear(ax: number, az: number, bx: number, bz: number): boolean {
    return lineClear(WALLS, ax, az, bx, bz);
  }

  private sightClear(ax: number, az: number, bx: number, bz: number): boolean {
    if (!this.wallsClear(ax, az, bx, bz)) return false;
    const closed = LEVEL.doors.filter((d) => this.doors[d.id] && !this.doors[d.id].open).map(doorSegment);
    return lineClear(closed, ax, az, bx, bz);
  }

  private planPath(x: number, z: number): { x: number; z: number }[] {
    if (this.forceNavFor <= 0 && this.wallsClear(this.x, this.z, x, z) && Math.hypot(x - this.x, z - this.z) < 9) {
      return [{ x, z }];
    }
    const from = this.nav.nearest(this.x, this.z, (n) => this.wallsClear(this.x, this.z, n.x, n.z));
    const to = this.nav.nearest(x, z, (n) => this.wallsClear(x, z, n.x, n.z));
    const ids = this.nav.path(from.id, to.id);
    const pts = ids.map((id) => { const n = this.nav.node(id); return { x: n.x, z: n.z }; });
    pts.push({ x, z });
    return pts;
  }

  private speedFor(mode: BotMode): number {
    if (mode === 'chase') {
      return this.intensity === 'mild' ? 3.3 : this.intensity === 'scary' ? TUNING.grannyRun : 4.0;
    }
    if (mode === 'investigate' || mode === 'checkHide') return TUNING.grannyWalk;
    return TUNING.grannyWalk * 0.75;
  }

  update(dt: number): void {
    this.clock += dt;
    if (!this.playing || !this.collider || !this.controller) {
      this.moving = false;
      this.emit(dt);
      return;
    }
    this.perceive();
    this.decide(dt);
    this.move(dt);
    this.emit(dt);
  }

  private perceive(): void {
    const s = this.survivor;
    if (!s || s.hidden) return;
    const clear = this.sightClear(this.x, this.z, s.x, s.z);
    const seen = canSee({
      gx: this.x, gz: this.z, gyaw: this.yaw, sx: s.x, sz: s.z,
      survivorLight: s.light, survivorCrouch: s.crouch, clear, intensity: this.intensity,
    });
    if (seen) {
      if (this.mode !== 'chase' && this.clock > this.voiceAt - 10) this.say(Math.random() < 0.5 ? 0 : 2);
      this.mode = 'chase';
      this.lastSeen = { x: s.x, z: s.z };
      this.lastSeenAt = this.clock;
      this.target = { x: s.x, z: s.z };
      this.path = clear ? [{ x: s.x, z: s.z }] : this.planPath(s.x, s.z);
      return;
    }
    const range = hearingRange(s.run, s.crouch, s.moving, !clear);
    if (range > 0 && Math.hypot(s.x - this.x, s.z - this.z) < range && this.mode !== 'chase' && this.mode !== 'checkHide') {
      this.investigate(s.x, s.z);
    }
  }

  private decide(dt: number): void {
    if (this.pauseFor > 0) return;
    if (this.mode === 'chase' && this.clock - this.lastSeenAt > 0.3) {
      // Lost sight: run to where we last saw them.
      if (!this.target && this.lastSeen) this.setTarget(this.lastSeen.x, this.lastSeen.z);
    }
    if (this.mode === 'lookaround') {
      this.timer -= dt;
      this.yaw += dt * 1.6;
      if (this.timer <= 0) {
        const chance = this.intensity === 'mild' ? 0.15 : this.intensity === 'scary' ? 0.45 : 0.3;
        const spot = nearestHide(this.x, this.z);
        if (spot && Math.random() < chance && Math.hypot(spot.x - this.x, spot.z - this.z) < 7) this.checkHide(spot);
        else this.mode = 'patrol';
      }
      return;
    }
    if (this.mode === 'patrol' && !this.target) {
      const options = this.nav.nodes.filter((n) => n.patrol && Math.hypot(n.x - this.x, n.z - this.z) > 3);
      const n = options[Math.floor(Math.random() * options.length)];
      this.setTarget(n.x, n.z);
    }
    if (this.mode === 'patrol' && this.clock > this.voiceAt) this.say(Math.random() < 0.5 ? 1 : 3);
  }

  private arrive(): void {
    this.target = null;
    this.path = [];
    if (this.mode === 'checkHide' && this.hideTarget) {
      // Face the hiding spot and look inside.
      this.yaw = Math.atan2(this.hideTarget.fx, this.hideTarget.fz);
      this.pauseFor = 0.7;
      const id = this.hideTarget.id;
      setTimeout(() => this.send({ t: 'interact', kind: 'search', id }), 700);
      return;
    }
    if (this.mode === 'investigate' || this.mode === 'chase') {
      this.mode = 'lookaround';
      this.timer = 2.5 + Math.random() * 2;
    }
  }

  private move(dt: number): void {
    if (this.pauseFor > 0) {
      this.pauseFor -= dt;
      this.moving = false;
      return;
    }
    this.forceNavFor = Math.max(0, this.forceNavFor - dt);
    const next = this.path[0];
    if (!next) {
      this.moving = false;
      if (this.target) this.arrive();
      return;
    }
    const dx = next.x - this.x, dz = next.z - this.z;
    const d = Math.hypot(dx, dz);
    const last = this.path.length === 1;
    if (d < (last ? 0.5 : 0.35)) {
      this.path.shift();
      if (!this.path.length) this.arrive();
      return;
    }
    // Open closed doors in the way.
    for (const def of LEVEL.doors) {
      const st = this.doors[def.id];
      if (!st || st.open || st.locked) continue;
      if (Math.hypot(def.x - this.x, def.z - this.z) < 1.4 && this.clock - (this.doorOpenedAt.get(def.id) ?? -99) > 2) {
        this.doorOpenedAt.set(def.id, this.clock);
        this.send({ t: 'interact', kind: 'door', id: def.id });
        this.pauseFor = 0.5;
        return;
      }
    }
    const speed = this.speedFor(this.mode);
    const step = Math.min(d, speed * dt);
    const want = { x: (dx / d) * step, y: -0.05, z: (dz / d) * step };
    this.controller!.computeColliderMovement(this.collider!, want);
    const m = this.controller!.computedMovement();
    const t = this.collider!.translation();
    this.collider!.setTranslation({ x: t.x + m.x, y: t.y + m.y, z: t.z + m.z });
    this.x = t.x + m.x;
    this.z = t.z + m.z;
    // Turn smoothly towards the direction of travel.
    const targetYaw = Math.atan2(-dx, -dz);
    let diff = targetYaw - this.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.yaw += diff * Math.min(1, dt * 6);
    this.moving = true;
    // Stuck detection: if we barely moved for a second, re-plan along the nav graph.
    this.stuckTimer += dt;
    if (this.stuckTimer > 1) {
      if (Math.hypot(this.x - this.stuckFrom.x, this.z - this.stuckFrom.z) < 0.3 && this.target) {
        this.forceNavFor = 3;
        this.path = this.planPath(this.target.x, this.target.z);
      }
      this.stuckTimer = 0;
      this.stuckFrom = { x: this.x, z: this.z };
    }
  }

  private emit(dt: number): void {
    this.sendAcc += dt;
    if (this.sendAcc < 0.05) return;
    this.sendAcc = 0;
    this.send({
      t: 'move', x: this.x, y: 0, z: this.z, yaw: this.yaw, pitch: 0,
      crouch: false, run: this.mode === 'chase', moving: this.moving, light: false,
    });
  }
}

function nearestHide(x: number, z: number): HideSpot | null {
  let best: HideSpot | null = null;
  let bd = Infinity;
  for (const h of LEVEL.hideSpots) {
    const d = Math.hypot(h.x - x, h.z - z);
    if (d < bd) { bd = d; best = h; }
  }
  return best;
}
