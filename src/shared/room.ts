// A private two-player room: lobby, character choice, rounds, scores,
// automatic role swapping and reconnection. Transport-agnostic: the Node
// server plugs in WebSockets, practice mode plugs in an in-process bot.

import { Match } from './match';
import {
  ROUND_LENGTHS, TUNING, type Character, type ClientMsg, type LobbyPlayer, type Role,
  type RoundResult, type ServerMsg,
} from './protocol';
import { makeRng, randomToken } from './rng';

export interface Conn { send(msg: ServerMsg): void }

interface RPlayer {
  id: string;
  token: string;
  character: Character | null;
  conn: Conn | null;
  host: boolean;
  bot: boolean;
  score: number;
  disconnectedFor: number;
}

export interface RoomOptions {
  practice?: boolean;
  seed?: number;
  roundLength?: number;
}

export class Room {
  readonly code: string;
  readonly practice: boolean;
  roundLength: number;
  match: Match | null = null;
  round = 0;
  /** Seconds until the next round starts (after a round ends). */
  nextIn = -1;
  idleFor = 0;
  private readonly players: RPlayer[] = [];
  private readonly rng: () => number;
  private lastRoles: Record<string, Role> | null = null;
  private nextId = 1;

  constructor(code: string, opts: RoomOptions = {}) {
    this.code = code;
    this.practice = !!opts.practice;
    this.roundLength = opts.roundLength ?? 300;
    this.rng = makeRng(opts.seed ?? Math.floor(Math.random() * 2 ** 31));
  }

  get size(): number { return this.players.length; }
  get connectedCount(): number { return this.players.filter((p) => p.conn).length; }

  /** Adds a player. Returns their id, or an error message. */
  join(conn: Conn, character: Character | null, opts: { bot?: boolean } = {}): { id: string } | { error: string } {
    if (this.players.length >= 2) return { error: 'This room is full.' };
    const taken = this.players.some((p) => p.character === character);
    const p: RPlayer = {
      id: `p${this.nextId++}`,
      token: randomToken(24),
      character: character && !taken ? character : null,
      conn,
      host: this.players.length === 0,
      bot: !!opts.bot,
      score: 0,
      disconnectedFor: 0,
    };
    this.players.push(p);
    conn.send({ t: 'welcome', code: this.code, token: p.token, you: p.id, practice: this.practice });
    this.broadcastLobby();
    return { id: p.id };
  }

  rejoin(conn: Conn, token: string): { id: string } | { error: string } {
    const p = this.players.find((q) => q.token === token);
    if (!p) return { error: 'Could not rejoin that room.' };
    p.conn = conn;
    p.disconnectedFor = 0;
    conn.send({ t: 'welcome', code: this.code, token: p.token, you: p.id, practice: this.practice });
    this.broadcastLobby();
    if (this.match) {
      conn.send({ t: 'round', info: this.match.info(p.id) });
      if (this.connectedCount === this.players.length) this.match.setPaused(false, '');
    }
    return { id: p.id };
  }

  disconnect(id: string): void {
    const p = this.players.find((q) => q.id === id);
    if (!p) return;
    p.conn = null;
    this.match?.setPaused(true, 'disconnected');
    this.broadcastLobby();
  }

  remove(id: string): void {
    const i = this.players.findIndex((q) => q.id === id);
    if (i < 0) return;
    const [gone] = this.players.splice(i, 1);
    if (gone.host && this.players[0]) this.players[0].host = true;
    if (this.match) {
      this.match = null;
      this.nextIn = -1;
      for (const p of this.players) p.conn?.send({ t: 'error', message: 'The other player left the game.' });
    }
    this.round = 0;
    for (const p of this.players) p.score = 0;
    this.broadcastLobby();
  }

  handle(id: string, msg: ClientMsg): void {
    const p = this.players.find((q) => q.id === id);
    if (!p) return;
    switch (msg.t) {
      case 'pick':
        if (this.match) return;
        if (this.players.some((q) => q !== p && q.character === msg.character)) {
          p.conn?.send({ t: 'error', message: 'That character is already taken.' });
          return;
        }
        p.character = msg.character;
        this.broadcastLobby();
        return;
      case 'roundLength':
        if (p.host && !this.match && (ROUND_LENGTHS as readonly number[]).includes(msg.seconds)) {
          this.roundLength = msg.seconds;
          this.broadcastLobby();
        }
        return;
      case 'start':
        if (!p.host || this.match) return;
        if (!this.ready()) {
          p.conn?.send({ t: 'error', message: 'Need two players who have each picked Ahmed or Miral.' });
          return;
        }
        this.round = 0;
        for (const q of this.players) q.score = 0;
        this.lastRoles = null;
        this.startRound();
        return;
      case 'restart':
        if (!this.ready()) return;
        this.round = 0;
        for (const q of this.players) q.score = 0;
        this.lastRoles = null;
        this.startRound();
        return;
      case 'leave':
        this.remove(id);
        return;
      case 'ping':
        p.conn?.send({ t: 'pong', n: msg.n });
        return;
      default:
        this.match?.handle(id, msg);
    }
  }

  ready(): boolean {
    return this.players.length === 2
      && this.players.every((p) => p.character && p.conn)
      && this.players[0].character !== this.players[1].character;
  }

  private chooseRoles(): Record<string, Role> {
    const [a, b] = this.players;
    if (this.practice) {
      const human = this.players.find((p) => !p.bot)!;
      const bot = this.players.find((p) => p.bot)!;
      return { [human.id]: 'survivor', [bot.id]: 'granny' };
    }
    if (!this.lastRoles) {
      const aSurvives = this.rng() < 0.5;
      return { [a.id]: aSurvives ? 'survivor' : 'granny', [b.id]: aSurvives ? 'granny' : 'survivor' };
    }
    // Swap roles every round.
    const swap = (r: Role): Role => (r === 'granny' ? 'survivor' : 'granny');
    return { [a.id]: swap(this.lastRoles[a.id]), [b.id]: swap(this.lastRoles[b.id]) };
  }

  private startRound(): void {
    this.round += 1;
    this.nextIn = -1;
    const roles = this.chooseRoles();
    this.lastRoles = roles;
    this.match = new Match({
      round: this.round,
      roles,
      timeLimit: this.roundLength,
      rng: this.rng,
      send: (to, msg) => this.players.find((p) => p.id === to)?.conn?.send(msg),
      onEnd: (result) => this.onRoundEnd(result),
    });
    for (const p of this.players) p.conn?.send({ t: 'round', info: this.match.info(p.id) });
    this.broadcastLobby();
  }

  private onRoundEnd(result: RoundResult): void {
    const m = this.match!;
    const survivor = m.survivor!.id;
    const granny = m.granny!.id;
    const winner = result === 'escaped' ? survivor : result === 'caught' ? granny : null;
    const wp = this.players.find((p) => p.id === winner);
    if (wp) wp.score += 1;
    this.nextIn = TUNING.nextRoundSeconds;
    const scores: Record<string, number> = {};
    for (const p of this.players) scores[p.id] = p.score;
    for (const p of this.players) {
      p.conn?.send({ t: 'end', result, survivor, granny, scores, next: this.nextIn });
    }
  }

  tick(dt: number): void {
    this.idleFor = this.connectedCount === 0 ? this.idleFor + dt : 0;
    for (const p of [...this.players]) {
      if (p.conn) continue;
      p.disconnectedFor += dt;
      if (p.disconnectedFor > TUNING.reconnectGraceSeconds) this.remove(p.id);
    }
    if (!this.match) return;
    if (this.match.phase === 'ended') {
      if (this.nextIn > 0 && this.connectedCount === this.players.length) {
        this.nextIn -= dt;
        if (this.nextIn <= 0 && this.ready()) this.startRound();
      }
      return;
    }
    this.match.tick(dt);
    // tick() may have ended the round.
    if ((this.match.phase as Match['phase']) !== 'ended') {
      for (const p of this.players) p.conn?.send(this.match.snapshot(p.id));
    }
  }

  lobbyPlayers(): LobbyPlayer[] {
    return this.players.map((p) => ({
      id: p.id, character: p.character, connected: !!p.conn, host: p.host, bot: p.bot, score: p.score,
    }));
  }

  private broadcastLobby(): void {
    const msg: ServerMsg = {
      t: 'lobby', code: this.code, players: this.lobbyPlayers(), roundLength: this.roundLength, inMatch: !!this.match,
    };
    for (const p of this.players) p.conn?.send(msg);
  }
}
