// Messages exchanged between game clients and the authoritative room.
// The same messages flow over WebSockets (online) and in-process (practice).

export type Character = 'ahmed' | 'miral';
export type Role = 'granny' | 'survivor';
export type RoundResult = 'caught' | 'escaped' | 'timeup';

export const CHARACTER_NAMES: Record<Character, string> = { ahmed: 'Ahmed', miral: 'Miral' };

export const ROUND_LENGTHS = [180, 300, 600, 900] as const;

export const TUNING = {
  survivorWalk: 3.0,
  survivorRun: 5.4,
  survivorCrouch: 1.5,
  grannyWalk: 2.9,
  grannyRun: 4.7,
  /** Server tolerance multiplier on top of the fastest allowed speed. */
  speedTolerance: 1.5,
  catchDistance: 1.25,
  interactDistance: 2.6,
  countdownSeconds: 4,
  nextRoundSeconds: 12,
  voiceCooldown: 2.5,
  reconnectGraceSeconds: 120,
} as const;

export interface LobbyPlayer {
  id: string;
  character: Character | null;
  connected: boolean;
  host: boolean;
  bot?: boolean;
  score: number;
}

export interface NetPlayer {
  id: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  crouch: boolean;
  run: boolean;
  moving: boolean;
  light: boolean;
  /** True when hidden. Hidden survivors are sent without a real position to Granny. */
  hidden: boolean;
}

export interface DoorState { open: boolean; dir: 1 | -1; locked: boolean }

export type ClientMsg =
  | { t: 'create'; character: Character }
  | { t: 'join'; code: string; character?: Character }
  | { t: 'rejoin'; code: string; token: string }
  | { t: 'pick'; character: Character }
  | { t: 'roundLength'; seconds: number }
  | { t: 'start' }
  | {
      t: 'move'; x: number; y: number; z: number; yaw: number; pitch: number;
      crouch: boolean; run: boolean; moving: boolean; light: boolean;
    }
  | { t: 'interact'; kind: 'door' | 'key' | 'hide' | 'unhide' | 'search'; id: string }
  | { t: 'voice'; line: number }
  | { t: 'restart' }
  | { t: 'leave' }
  | { t: 'ping'; n: number };

export interface RoundInfo {
  round: number;
  roles: Record<string, Role>;
  timeLimit: number;
  keySpot: string;
  /** Who holds the key ('' = nobody). */
  keyHolder: string;
  frontUnlocked: boolean;
  doors: Record<string, DoorState>;
  phase: 'countdown' | 'playing' | 'ended';
  timeLeft: number;
  countdown: number;
  spawns: Record<string, { x: number; z: number; yaw: number }>;
  hiddenIn: string | null; // only filled for the hidden player themself
}

export type ServerMsg =
  | { t: 'welcome'; code: string; token: string; you: string; practice: boolean }
  | { t: 'lobby'; code: string; players: LobbyPlayer[]; roundLength: number; inMatch: boolean }
  | { t: 'error'; message: string; fatal?: boolean }
  | { t: 'round'; info: RoundInfo }
  | { t: 'go' }
  | { t: 'snap'; timeLeft: number; players: NetPlayer[] }
  | { t: 'door'; id: string; state: DoorState; by: string }
  | { t: 'key'; holder: string; spot: string }
  | { t: 'unlocked' }
  | { t: 'hidden'; player: string; hidden: boolean; spot: string | null; x?: number; z?: number }
  | { t: 'search'; spot: string; found: boolean }
  | { t: 'voice'; from: string; line: number; x: number; z: number }
  | { t: 'info'; text: string }
  | { t: 'correct'; x: number; y: number; z: number }
  | { t: 'paused'; paused: boolean; reason: string }
  | { t: 'end'; result: RoundResult; survivor: string; granny: string; scores: Record<string, number>; next: number }
  | { t: 'pong'; n: number };

export function isCharacter(v: unknown): v is Character {
  return v === 'ahmed' || v === 'miral';
}

const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const str = (v: unknown, max = 64): v is string => typeof v === 'string' && v.length <= max;

/** Validates untrusted input. Returns null for anything malformed. */
export function parseClientMsg(raw: unknown): ClientMsg | null {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Record<string, unknown>;
  switch (m.t) {
    case 'create':
      return isCharacter(m.character) ? { t: 'create', character: m.character } : null;
    case 'join':
      if (!str(m.code, 12)) return null;
      return { t: 'join', code: m.code, character: isCharacter(m.character) ? m.character : undefined };
    case 'rejoin':
      return str(m.code, 12) && str(m.token, 64) ? { t: 'rejoin', code: m.code, token: m.token } : null;
    case 'pick':
      return isCharacter(m.character) ? { t: 'pick', character: m.character } : null;
    case 'roundLength':
      return num(m.seconds) ? { t: 'roundLength', seconds: m.seconds } : null;
    case 'start':
    case 'restart':
    case 'leave':
      return { t: m.t };
    case 'move':
      if (![m.x, m.y, m.z, m.yaw, m.pitch].every(num)) return null;
      return {
        t: 'move', x: m.x as number, y: m.y as number, z: m.z as number, yaw: m.yaw as number, pitch: m.pitch as number,
        crouch: m.crouch === true, run: m.run === true, moving: m.moving === true, light: m.light === true,
      };
    case 'interact':
      if (!['door', 'key', 'hide', 'unhide', 'search'].includes(m.kind as string) || !str(m.id, 32)) return null;
      return { t: 'interact', kind: m.kind as 'door', id: m.id };
    case 'voice':
      return num(m.line) ? { t: 'voice', line: Math.floor(m.line) } : null;
    case 'ping':
      return num(m.n) ? { t: 'ping', n: m.n } : null;
    default:
      return null;
  }
}
