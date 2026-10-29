import { describe, expect, it } from 'vitest';
import { Match } from '../src/shared/match';
import { LEVEL, hideFront } from '../src/shared/level';
import type { ServerMsg, RoundResult } from '../src/shared/protocol';
import { makeRng } from '../src/shared/rng';

function setup() {
  const sent: { to: string; msg: ServerMsg }[] = [];
  let result: RoundResult | null = null;
  const m = new Match({
    round: 1,
    roles: { s: 'survivor', g: 'granny' },
    timeLimit: 60,
    rng: makeRng(1),
    send: (to, msg) => sent.push({ to, msg }),
    onEnd: (r) => { result = r; },
  });
  // Skip the countdown.
  m.tick(10);
  return { m, sent, result: () => result };
}

/** Walks a player to (x, z) in small legal steps. */
function walk(m: Match, id: string, x: number, z: number) {
  const p = m.players.get(id)!;
  for (let i = 0; i < 400; i++) {
    const dx = x - p.x, dz = z - p.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.01) return;
    const step = Math.min(d, 0.12);
    m.tick(0.05);
    m.handle(id, { t: 'move', x: p.x + (dx / d) * step, y: 0, z: p.z + (dz / d) * step, yaw: 0, pitch: 0, crouch: false, run: false, moving: true, light: true });
  }
}

/** Teleports for test setup (bypasses validation). */
function place(m: Match, id: string, x: number, z: number) {
  const p = m.players.get(id)!;
  p.x = x; p.z = z;
}

describe('Match rules', () => {
  it('starts after the countdown', () => {
    const { m, sent } = setup();
    expect(m.phase).toBe('playing');
    expect(sent.some((s) => s.msg.t === 'go')).toBe(true);
  });

  it('rejects moves that are too fast (speed hack) and corrects the player', () => {
    const { m, sent } = setup();
    m.tick(0.05);
    const p = m.players.get('s')!;
    const before = { x: p.x, z: p.z };
    m.handle('s', { t: 'move', x: p.x + 5, y: 0, z: p.z, yaw: 0, pitch: 0, crouch: false, run: true, moving: true, light: true });
    expect(p.x).toBe(before.x);
    expect(sent.some((s) => s.to === 's' && s.msg.t === 'correct')).toBe(true);
  });

  it('rejects moves through walls', () => {
    const { m } = setup();
    place(m, 's', -8.5, -1.7); // hallway, next to the bedroom wall
    for (let i = 0; i < 20; i++) m.tick(0.05);
    m.handle('s', { t: 'move', x: -8.5, y: 0, z: -2.3, yaw: 0, pitch: 0, crouch: false, run: false, moving: true, light: true });
    expect(m.players.get('s')!.z).toBeCloseTo(-1.7);
  });

  it('lets the survivor open doors and blocks walking through closed ones', () => {
    const { m } = setup();
    place(m, 's', -6.5, -2.6); // bedroom side of the bedroom door
    for (let i = 0; i < 20; i++) m.tick(0.05);
    m.handle('s', { t: 'move', x: -6.5, y: 0, z: -1.6, yaw: 0, pitch: 0, crouch: false, run: false, moving: true, light: true });
    expect(m.players.get('s')!.z).toBeCloseTo(-2.6);
    m.handle('s', { t: 'interact', kind: 'door', id: 'bedroom' });
    expect(m.doors.bedroom.open).toBe(true);
    walk(m, 's', -6.5, -1.0);
    expect(m.players.get('s')!.z).toBeCloseTo(-1.0);
  });

  it('only lets the survivor pick up the key when close to it', () => {
    const { m } = setup();
    const k = LEVEL.keySpots.find((s) => s.id === m.keySpot)!;
    m.handle('s', { t: 'interact', kind: 'key', id: k.id });
    if (Math.hypot(k.x - m.players.get('s')!.x, k.z - m.players.get('s')!.z) > 3) expect(m.keyHolder).toBe('');
    m.handle('g', { t: 'interact', kind: 'key', id: k.id });
    expect(m.keyHolder).not.toBe('g');
    place(m, 's', k.x + 0.5, k.z + 0.5);
    m.handle('s', { t: 'interact', kind: 'key', id: k.id });
    expect(m.keyHolder).toBe('s');
  });

  it('needs the key to unlock the front door, then the survivor can escape', () => {
    const { m, result } = setup();
    place(m, 's', 0.5, 7.0);
    m.handle('s', { t: 'interact', kind: 'door', id: 'front' });
    expect(m.doors.front.open).toBe(false);
    m.keyHolder = 's';
    m.handle('s', { t: 'interact', kind: 'door', id: 'front' });
    expect(m.doors.front.locked).toBe(false);
    expect(m.doors.front.open).toBe(true);
    walk(m, 's', 0.5, 9.5);
    expect(result()).toBe('escaped');
  });

  it('Granny catches the survivor when close with line of sight', () => {
    const { m, result } = setup();
    place(m, 's', 0, 4);
    place(m, 'g', 0, 5);
    m.tick(0.05);
    expect(result()).toBe('caught');
  });

  it('does not catch through a wall', () => {
    const { m, result } = setup();
    place(m, 's', -2.4, 2); // living room side of x=-2 wall
    place(m, 'g', -1.6, 2); // entrance side
    m.tick(0.05);
    expect(result()).toBe(null);
  });

  it('hidden survivors are safe unless Granny searches the right spot', () => {
    const { m, sent, result } = setup();
    const h = LEVEL.hideSpots[0];
    const f = hideFront(h);
    place(m, 's', f.x, f.z);
    m.handle('s', { t: 'interact', kind: 'hide', id: h.id });
    expect(m.players.get('s')!.hidden).toBe(true);
    // Granny's snapshot must not reveal where the survivor is.
    const snap = m.snapshot('g');
    expect(snap.t === 'snap' && snap.players[0].y).toBe(-100);
    // Granny standing right there doesn't auto-catch a hidden player.
    place(m, 'g', f.x + 0.3, f.z);
    m.tick(0.05);
    expect(result()).toBe(null);
    // Searching a different spot finds nothing.
    const other = LEVEL.hideSpots[1];
    const of = hideFront(other);
    place(m, 'g', of.x, of.z);
    m.handle('g', { t: 'interact', kind: 'search', id: other.id });
    expect(sent.some((s) => s.msg.t === 'search' && !s.msg.found)).toBe(true);
    // Searching the right one catches them.
    place(m, 'g', f.x, f.z);
    m.tick(2);
    m.handle('g', { t: 'interact', kind: 'search', id: h.id });
    expect(result()).toBe('caught');
  });

  it('ends in a draw when time runs out', () => {
    const { m, result } = setup();
    for (let i = 0; i < 70; i++) m.tick(1);
    expect(result()).toBe('timeup');
  });

  it('only Granny can use voice lines, with a cooldown', () => {
    const { m, sent } = setup();
    m.handle('s', { t: 'voice', line: 0 });
    m.handle('g', { t: 'voice', line: 0 });
    m.handle('g', { t: 'voice', line: 1 });
    expect(sent.filter((s) => s.msg.t === 'voice' && s.to === 's').length).toBe(1);
  });
});
