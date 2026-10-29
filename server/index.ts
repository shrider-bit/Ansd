// Authoritative multiplayer server: serves the built game (dist/) over HTTP
// and runs private two-player rooms over WebSockets on /ws.

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { WebSocketServer, type WebSocket } from 'ws';
import { Room } from '../src/shared/room';
import { parseClientMsg, type ServerMsg } from '../src/shared/protocol';
import { randomToken } from '../src/shared/rng';

const PORT = Number(process.env.PORT ?? 8080);
const STATIC_DIR = resolve(process.env.STATIC_DIR ?? join(process.cwd(), 'dist'));
const TICK_HZ = 20;
const MAX_ROOMS = Number(process.env.MAX_ROOMS ?? 500);
const MAX_MSGS_PER_SEC = 60;
const MAX_FAILED_JOINS = 8;
const ROOM_IDLE_SECONDS = 180;

const rooms = new Map<string, Room>();

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.webmanifest': 'application/manifest+json',
};

async function serveStatic(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size }));
    return;
  }
  let path = decodeURIComponent(url.pathname);
  if (path.endsWith('/')) path += 'index.html';
  const file = normalize(join(STATIC_DIR, path));
  if (!file.startsWith(STATIC_DIR + sep)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const s = await stat(file);
    if (!s.isFile()) throw new Error('not a file');
    const body = await readFile(file);
    res.writeHead(200, {
      'content-type': MIME[extname(file)] ?? 'application/octet-stream',
      'cache-control': path.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
      'x-content-type-options': 'nosniff',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
  }
}

function newRoomCode(): string {
  for (;;) {
    const code = randomToken(5);
    if (!rooms.has(code)) return code;
  }
}

const http = createServer((req, res) => {
  serveStatic(req, res).catch(() => res.writeHead(500).end());
});

const wss = new WebSocketServer({ server: http, path: '/ws', maxPayload: 2048 });

wss.on('connection', (ws: WebSocket) => {
  let room: Room | null = null;
  let playerId: string | null = null;
  let msgCount = 0;
  let windowStart = Date.now();
  let failedJoins = 0;
  const conn = {
    send(msg: ServerMsg) {
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
    },
  };
  const fail = (message: string, fatal = false) => conn.send({ t: 'error', message, fatal });

  ws.on('message', (data) => {
    const now = Date.now();
    if (now - windowStart > 1000) { windowStart = now; msgCount = 0; }
    if (++msgCount > MAX_MSGS_PER_SEC) return; // Silently drop floods.
    let parsed: unknown;
    try { parsed = JSON.parse(String(data)); } catch { return; }
    const msg = parseClientMsg(parsed);
    if (!msg) return;

    if (!room || !playerId) {
      if (msg.t === 'create') {
        if (rooms.size >= MAX_ROOMS) return fail('The server is busy. Please try again later.');
        const r = new Room(newRoomCode());
        rooms.set(r.code, r);
        const res = r.join(conn, msg.character);
        if ('id' in res) { room = r; playerId = res.id; }
        return;
      }
      if (msg.t === 'join' || msg.t === 'rejoin') {
        const r = rooms.get(msg.code.trim().toUpperCase());
        const res = r
          ? msg.t === 'join' ? r.join(conn, msg.character ?? null) : r.rejoin(conn, msg.token)
          : { error: 'No room with that code. Check the code and try again.' };
        if ('id' in res && r) {
          room = r; playerId = res.id;
        } else {
          fail('error' in res ? res.error : 'Could not join.');
          if (++failedJoins >= MAX_FAILED_JOINS) ws.close();
        }
        return;
      }
      if (msg.t === 'ping') conn.send({ t: 'pong', n: msg.n });
      return;
    }
    room.handle(playerId, msg);
    if (msg.t === 'leave') { room = null; playerId = null; }
  });

  ws.on('close', () => {
    if (room && playerId) room.disconnect(playerId);
  });
});

let lastTick = performance.now();
setInterval(() => {
  // Real elapsed time (clamped) so a busy server never under-counts time.
  const now = performance.now();
  const dt = Math.min(0.25, (now - lastTick) / 1000);
  lastTick = now;
  for (const [code, room] of rooms) {
    room.tick(dt);
    if (room.size === 0 || room.idleFor > ROOM_IDLE_SECONDS) rooms.delete(code);
  }
}, 1000 / TICK_HZ);

http.listen(PORT, () => {
  console.log(`Granny's House server on http://localhost:${PORT} (static: ${STATIC_DIR})`);
});
