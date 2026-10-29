// Granny's voice. PLACEHOLDER IMPLEMENTATION (Phase 1):
// - First tries a prerecorded file listed in public/audio/voice/manifest.json,
//   e.g. en/ahmed_1.mp3 (drop files there to replace the placeholder - see
//   docs/AUDIO.md).
// - Otherwise speaks the line with the device's built-in speech synthesiser,
//   pitched down and slowed for a creepy elderly voice. Free and offline,
//   no paid text-to-speech API calls.

import type { Character } from '../shared/protocol';
import { VOICE_LINES, type VoiceLang } from '../shared/voiceLines';

const fileCache = new Map<string, HTMLAudioElement | null>();
let manifest: Promise<Set<string>> | null = null;

/** Recorded files that exist, from public/audio/voice/manifest.json. */
function availableFiles(): Promise<Set<string>> {
  manifest ??= fetch('./audio/voice/manifest.json')
    .then((r) => (r.ok ? r.json() : { files: [] }))
    .then((j: { files?: string[] }) => new Set(j.files ?? []))
    .catch(() => new Set<string>());
  return manifest;
}

function voiceFile(lang: VoiceLang, target: Character, line: number): string {
  return `${lang}/${target}_${line + 1}.mp3`;
}

async function tryFile(name: string, volume: number, rate: number): Promise<boolean> {
  if (!(await availableFiles()).has(name)) return false;
  const url = `./audio/voice/${name}`;
  if (fileCache.get(url) === null) return false;
  let audio = fileCache.get(url);
  if (!audio) {
    audio = new Audio(url);
    audio.preload = 'auto';
    fileCache.set(url, audio);
  }
  try {
    const a = audio.cloneNode() as HTMLAudioElement;
    a.volume = Math.max(0, Math.min(1, volume));
    a.playbackRate = rate;
    a.preservesPitch = false;
    await a.play();
    return true;
  } catch {
    fileCache.set(url, null);
    return false;
  }
}

function pickVoice(lang: VoiceLang): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null;
  const voices = speechSynthesis.getVoices();
  const want = lang === 'ar' ? 'ar' : 'en';
  const matching = voices.filter((v) => v.lang.toLowerCase().startsWith(want));
  // Prefer female-sounding voices for Granny where the name hints at it.
  const female = matching.find((v) => /female|zira|samantha|susan|karen|moira|tessa|hoda|salma|laila|mariam/i.test(v.name));
  return female ?? matching[0] ?? null;
}

export class GrannyVoice {
  lang: VoiceLang = 'en';
  /** 0..1, lower = deeper / creepier. */
  pitch = 0.5;

  constructor() {
    // Some browsers load the voice list asynchronously.
    if ('speechSynthesis' in window) speechSynthesis.getVoices();
  }

  text(target: Character, line: number): string {
    return VOICE_LINES[this.lang][target][line] ?? '';
  }

  /** Plays a line. `volume` 0..1 approximates distance attenuation. */
  async say(target: Character, line: number, volume: number): Promise<void> {
    if (volume <= 0.02) return;
    const rate = 0.75 + this.pitch * 0.3;
    if (await tryFile(voiceFile(this.lang, target, line), volume, rate)) return;
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(this.text(target, line));
    const v = pickVoice(this.lang);
    if (v) u.voice = v;
    u.lang = this.lang === 'ar' ? 'ar-SA' : 'en-GB';
    u.pitch = 0.05 + this.pitch * 0.6;
    u.rate = 0.7 + this.pitch * 0.2;
    u.volume = Math.max(0, Math.min(1, volume));
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }
}
