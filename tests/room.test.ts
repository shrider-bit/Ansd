import { describe, expect, it } from 'vitest';
import { Room } from '../src/shared/room';
import { parseClientMsg, type Role, type ServerMsg } from '../src/shared/protocol';

class FakeConn {
  msgs: ServerMsg[] = [];
  send(m: ServerMsg) { this.msgs.push(m); }
  last<T extends ServerMsg['t']>(t: T) {
    return [...this.msgs].reverse().find((m) => m.t === t) as Extract<ServerMsg, { t: T }> | undefined;
  }
}

function twoPlayers() {
  const room = new Room('ABCDE', { seed: 7, roundLength: 60 });
  const a = new FakeConn(), b = new FakeConn();
  const ra = room.join(a, 'ahmed');
  const rb = room.join(b, null);
  if (!('id' in ra) || !('id' in rb)) throw new Error('join failed');
  return { room, a, b, ida: ra.id, idb: rb.id };
}

describe('Room', () => {
  it('allows exactly two players', () => {
    const { room } = twoPlayers();
    const res = room.join(new FakeConn(), 'miral');
    expect('error' in res).toBe(true);
  });

  it('requires distinct characters before the host can start', () => {
    const { room, a, b, ida, idb } = twoPlayers();
    room.handle(idb, { t: 'pick', character: 'ahmed' });
    expect(b.last('error')).toBeDefined();
    room.handle(ida, { t: 'start' });
    expect(room.match).toBeNull();
    room.handle(idb, { t: 'pick', character: 'miral' });
    room.handle(idb, { t: 'start' }); // not host
    expect(room.match).toBeNull();
    room.handle(ida, { t: 'start' });
    expect(room.match).not.toBeNull();
    expect(a.last('round')).toBeDefined();
  });

  it('swaps roles automatically every round', () => {
    const { room, ida, idb } = twoPlayers();
    room.handle(idb, { t: 'pick', character: 'miral' });
    room.handle(ida, { t: 'start' });
    const roles: Role[] = [];
    for (let round = 0; round < 3; round++) {
      roles.push(room.match!.players.get(ida)!.role);
      room.match!.end('timeup');
      for (let i = 0; i < 300; i++) room.tick(0.05);
    }
    expect(roles[0]).not.toBe(roles[1]);
    expect(roles[1]).not.toBe(roles[2]);
    expect(room.round).toBe(4);
  });

  it('scores a catch for Granny', () => {
    const { room, a, ida, idb } = twoPlayers();
    room.handle(idb, { t: 'pick', character: 'miral' });
    room.handle(ida, { t: 'start' });
    const granny = room.match!.granny!.id;
    room.match!.end('caught');
    const end = a.last('end')!;
    expect(end.scores[granny]).toBe(1);
  });

  it('pauses on disconnect and resumes on rejoin with the token', () => {
    const { room, b, ida, idb } = twoPlayers();
    room.handle(idb, { t: 'pick', character: 'miral' });
    room.handle(ida, { t: 'start' });
    const token = b.last('welcome')!.token;
    room.disconnect(idb);
    expect(room.match!.paused).toBe(true);
    const before = room.match!.countdown;
    room.tick(1);
    expect(room.match!.countdown).toBe(before);
    expect('error' in room.rejoin(new FakeConn(), 'wrong-token')).toBe(true);
    const nb = new FakeConn();
    const res = room.rejoin(nb, token);
    expect('id' in res && res.id).toBe(idb);
    expect(room.match!.paused).toBe(false);
    expect(nb.last('round')).toBeDefined();
  });

  it('drops a player who never comes back', () => {
    const { room, idb } = twoPlayers();
    room.disconnect(idb);
    for (let i = 0; i < 130; i++) room.tick(1);
    expect(room.size).toBe(1);
  });
});

describe('protocol validation', () => {
  it('rejects malformed messages', () => {
    expect(parseClientMsg(null)).toBeNull();
    expect(parseClientMsg({ t: 'move', x: 'a' })).toBeNull();
    expect(parseClientMsg({ t: 'move', x: 1, y: 0, z: 1, yaw: 0, pitch: NaN })).toBeNull();
    expect(parseClientMsg({ t: 'create', character: 'granny' })).toBeNull();
    expect(parseClientMsg({ t: 'interact', kind: 'teleport', id: 'x' })).toBeNull();
    expect(parseClientMsg({ t: 'hack' })).toBeNull();
    expect(parseClientMsg({ t: 'join', code: 'X'.repeat(100) })).toBeNull();
  });

  it('accepts valid messages', () => {
    expect(parseClientMsg({ t: 'create', character: 'miral' })).toEqual({ t: 'create', character: 'miral' });
    expect(parseClientMsg({ t: 'interact', kind: 'door', id: 'front' })).toEqual({ t: 'interact', kind: 'door', id: 'front' });
  });
});
