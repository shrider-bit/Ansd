// Player settings, saved in the browser (or app) between sessions.

import type { VoiceLang } from './shared/voiceLines';

export type Intensity = 'mild' | 'normal' | 'scary';
export type Quality = 'low' | 'medium' | 'high';

export interface Settings {
  volume: number;
  /** Softens sudden loud sounds (slams, thunder, jump scares) independently of scare level. */
  reduceLoud: boolean;
  intensity: Intensity;
  voiceLang: VoiceLang;
  /** Granny voice pitch multiplier for the placeholder speech voice. */
  voicePitch: number;
  sensitivity: number;
  invertY: boolean;
  quality: Quality;
  showFps: boolean;
  serverUrl: string;
}

const KEY = 'grannys-house-settings-v1';

function defaultQuality(): Quality {
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  return coarse ? 'low' : 'medium';
}

export const DEFAULTS: Settings = {
  volume: 0.8,
  reduceLoud: false,
  intensity: 'normal',
  voiceLang: 'en',
  voicePitch: 0.5,
  sensitivity: 1,
  invertY: false,
  quality: defaultQuality(),
  showFps: false,
  serverUrl: '',
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    // Storage unavailable (private mode etc.) - fall back to defaults.
  }
  return { ...DEFAULTS };
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Ignore - settings just won't persist.
  }
}

/**
 * WebSocket address of the multiplayer server. Priority: user setting,
 * build-time VITE_SERVER_URL, then the server that served this page.
 */
export function resolveServerUrl(s: Settings): string | null {
  const fromSetting = s.serverUrl.trim();
  if (fromSetting) return normaliseWsUrl(fromSetting);
  const fromBuild = (import.meta.env.VITE_SERVER_URL as string | undefined)?.trim();
  if (fromBuild) return normaliseWsUrl(fromBuild);
  if (location.protocol === 'http:' || location.protocol === 'https:') {
    // Capacitor serves the APK from https://localhost - no server there.
    if (location.hostname === 'localhost' && !location.port) return null;
    // Static hosts (GitHub Pages) don't run the game server.
    if (location.hostname.endsWith('github.io')) return null;
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${location.host}/ws`;
  }
  return null;
}

export function normaliseWsUrl(u: string): string {
  let url = u.replace(/^http(s?):\/\//i, (_m, s) => `ws${s}://`);
  if (!/^wss?:\/\//i.test(url)) url = `wss://${url}`;
  if (!/\/ws\/?$/.test(url)) url = url.replace(/\/$/, '') + '/ws';
  return url;
}
