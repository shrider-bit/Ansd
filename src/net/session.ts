// A Session connects the game to an authoritative Room: either the online
// server over WebSockets, or a Room running locally for Practice mode.

import { Room } from '../shared/room';
import type { Character, ClientMsg, ServerMsg } from '../shared/protocol';
import { GrannyBot } from '../game/bot';

export interface Session {
  readonly practice: boolean;
  send(msg: ClientMsg): void;
  onMessage: (msg: ServerMsg) => void;
  onStatus: (status: 'connecting' | 'online' | 'reconnecting' | 'offline') => void;
  close(): void;
  /** Practice only: the computer Granny. */
  bot?: GrannyBot;
  /** Round-trip time in ms (online only). */
  rtt: number;
}

const REJOIN_KEY = 'grannys-house-rejoin';

export class OnlineSession implements Session {
  readonly practice = false;
  onMessage: (msg: ServerMsg) => void = () => {};
  onStatus: Session['onStatus'] = () => {};
  rtt = 0;
  private ws: WebSocket | null = null;
  private closed = false;
  private attempts = 0;
  private queue: ClientMsg[] = [];
  private code = '';
  private token = '';
  private pingTimer: number | null = null;
  private readonly url: string;

  constructor(url: string) {
    this.url = url;
  }

  /** Connects and sends `first` (create / join / rejoin) once open. */
  connect(first: ClientMsg): void {
    this.queue = [first];
    this.open();
  }

  static savedRejoin(): { code: string; token: string } | null {
    try {
      const raw = sessionStorage.getItem(REJOIN_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private open(): void {
    this.onStatus(this.attempts ? 'reconnecting' : 'connecting');
    const ws = new WebSocket(this.url);
    this.ws = ws;
    ws.onopen = () => {
      this.attempts = 0;
      this.onStatus('online');
      if (this.token) ws.send(JSON.stringify({ t: 'rejoin', code: this.code, token: this.token }));
      for (const m of this.queue) ws.send(JSON.stringify(m));
      this.queue = [];
      if (this.pingTimer === null) {
        this.pingTimer = window.setInterval(() => this.send({ t: 'ping', n: performance.now() }), 2000);
      }
    };
    ws.onmessage = (ev) => {
      let msg: ServerMsg;
      try { msg = JSON.parse(String(ev.data)); } catch { return; }
      if (msg.t === 'welcome') {
        this.code = msg.code;
        this.token = msg.token;
        try { sessionStorage.setItem(REJOIN_KEY, JSON.stringify({ code: msg.code, token: msg.token })); } catch { /* ignore */ }
      }
      if (msg.t === 'pong') {
        this.rtt = performance.now() - msg.n;
        return;
      }
      this.onMessage(msg);
    };
    ws.onclose = () => {
      if (this.closed) return;
      this.ws = null;
      // Reconnect with backoff; the server keeps our seat for a while.
      if (this.attempts++ < 12) {
        this.onStatus('reconnecting');
        setTimeout(() => !this.closed && this.open(), Math.min(8000, 500 * 2 ** this.attempts));
      } else {
        this.onStatus('offline');
      }
    };
  }

  send(msg: ClientMsg): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
    else if (msg.t !== 'move' && msg.t !== 'ping') this.queue.push(msg);
  }

  close(): void {
    this.closed = true;
    if (this.pingTimer !== null) clearInterval(this.pingTimer);
    try { sessionStorage.removeItem(REJOIN_KEY); } catch { /* ignore */ }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ t: 'leave' }));
    this.ws?.close();
    this.ws = null;
  }
}

/** Offline practice against the computer Granny, using the same Room rules. */
export class PracticeSession implements Session {
  readonly practice = true;
  onMessage: (msg: ServerMsg) => void = () => {};
  onStatus: Session['onStatus'] = () => {};
  rtt = 0;
  readonly bot: GrannyBot;
  private readonly room: Room;
  private readonly humanId: string;
  private readonly timer: number;
  paused = false;

  constructor(character: Character, roundLength: number) {
    this.room = new Room('PRACTICE', { practice: true, roundLength });
    const human = this.room.join({ send: (m) => queueMicrotask(() => this.onMessage(m)) }, character);
    if (!('id' in human)) throw new Error(human.error);
    this.humanId = human.id;
    let botId = '';
    this.bot = new GrannyBot('', (m) => this.room.handle(botId, m));
    const botChar: Character = character === 'ahmed' ? 'miral' : 'ahmed';
    const bot = this.room.join({ send: (m) => this.bot.receive(m) }, botChar, { bot: true });
    if (!('id' in bot)) throw new Error(bot.error);
    botId = bot.id;
    this.bot.id = botId;
    // Tick with real elapsed time: timers drift when the browser is busy.
    let last = performance.now();
    this.timer = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      if (!this.paused) this.room.tick(dt);
    }, 50);
    queueMicrotask(() => this.onStatus('online'));
  }

  /** Freezes the practice game (pause menu). */
  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  start(): void {
    this.room.handle(this.humanId, { t: 'start' });
  }

  send(msg: ClientMsg): void {
    this.room.handle(this.humanId, msg);
  }

  close(): void {
    clearInterval(this.timer);
    this.bot.detach();
  }
}
