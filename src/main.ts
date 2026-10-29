import './ui/style.css';
import { Game, type EndMsg } from './game/Game';
import { Hud } from './ui/hud';
import { loadSettings, resolveServerUrl, saveSettings, type Settings } from './settings';
import { OnlineSession, PracticeSession, type Session } from './net/session';
import { CHARACTER_NAMES, type Character, type LobbyPlayer, type ServerMsg } from './shared/protocol';
import { VOICE_LINE_COUNT } from './shared/voiceLines';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

let settings: Settings = loadSettings();
let game: Game;
const hud = new Hud();
let session: Session | null = null;
let you = '';
let lobby: { code: string; players: LobbyPlayer[]; roundLength: number; inMatch: boolean } | null = null;
let characterMode: 'practice' | 'create' = 'practice';
let screenStack: string[] = [];
let endTimer: number | null = null;
let currentScreen = 'loading';

// ---------------- Screens ----------------

function show(id: string | null, push = false): void {
  if (push && currentScreen) screenStack.push(currentScreen);
  else if (!push) screenStack = [];
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  currentScreen = id ?? '';
  if (id) $(`screen-${id}`).classList.add('active');
  game?.setMenuOpen(!!id);
}

function back(): void {
  const prev = screenStack.pop();
  if (prev) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    currentScreen = prev;
    $(`screen-${prev}`).classList.add('active');
  } else {
    show('main');
  }
}

function dialog(text: string): void {
  $('dialog-text').textContent = text;
  $('dialog').classList.remove('hidden');
}
$('dialog-ok').addEventListener('click', () => $('dialog').classList.add('hidden'));

// ---------------- Settings UI ----------------

function bindSettings(): void {
  const vol = $<HTMLInputElement>('set-volume');
  const intensity = $<HTMLSelectElement>('set-intensity');
  const loud = $<HTMLInputElement>('set-reduce-loud');
  const lang = $<HTMLSelectElement>('set-lang');
  const pitch = $<HTMLInputElement>('set-pitch');
  const sens = $<HTMLInputElement>('set-sens');
  const invert = $<HTMLInputElement>('set-invert');
  const quality = $<HTMLSelectElement>('set-quality');
  const fps = $<HTMLInputElement>('set-fps');
  const server = $<HTMLInputElement>('set-server');
  vol.value = String(settings.volume);
  intensity.value = settings.intensity;
  loud.checked = settings.reduceLoud;
  lang.value = settings.voiceLang;
  pitch.value = String(settings.voicePitch);
  sens.value = String(settings.sensitivity);
  invert.checked = settings.invertY;
  quality.value = settings.quality;
  fps.checked = settings.showFps;
  server.value = settings.serverUrl;
  const update = () => {
    settings = {
      ...settings,
      volume: Number(vol.value),
      intensity: intensity.value as Settings['intensity'],
      reduceLoud: loud.checked,
      voiceLang: lang.value as Settings['voiceLang'],
      voicePitch: Number(pitch.value),
      sensitivity: Number(sens.value),
      invertY: invert.checked,
      quality: quality.value as Settings['quality'],
      showFps: fps.checked,
      serverUrl: server.value.trim(),
    };
    saveSettings(settings);
    game?.applySettings(settings);
  };
  for (const el of [vol, intensity, loud, lang, pitch, sens, invert, quality, fps, server]) el.addEventListener('change', update);
  vol.addEventListener('input', update);
  $('test-voice').addEventListener('click', () => {
    game.audio.resume();
    void game.voice.say('ahmed', Math.floor(Math.random() * VOICE_LINE_COUNT), 0.9);
  });
}

// ---------------- Sessions ----------------

function wire(s: Session): void {
  session = s;
  s.onMessage = onMessage;
  s.onStatus = (st) => {
    if (st === 'reconnecting') hud.setNet('Reconnecting...');
    if (st === 'offline') {
      dialog('Lost connection to the game server.');
      quitToMenu();
    }
  };
}

function onlineUrl(): string | null {
  const url = resolveServerUrl(settings);
  if (!url) {
    dialog('Online play needs the game server. Open the game from your server link, or type the server address in SETTINGS.');
  }
  return url;
}

function startPractice(character: Character): void {
  const length = Number($<HTMLSelectElement>('practice-length').value) || 300;
  const s = new PracticeSession(character, length);
  wire(s);
  game.attach(s);
  you = '';
  s.start();
}

function createRoom(character: Character): void {
  const url = onlineUrl();
  if (!url) return;
  const s = new OnlineSession(url);
  wire(s);
  game.attach(s);
  s.connect({ t: 'create', character });
  $('lobby-status').textContent = 'Creating room...';
  show('lobby');
}

function joinRoom(code: string): void {
  const url = onlineUrl();
  if (!url) return;
  const clean = code.trim().toUpperCase();
  if (clean.length < 4) {
    dialog('Please type the room code.');
    return;
  }
  const s = new OnlineSession(url);
  wire(s);
  game.attach(s);
  s.connect({ t: 'join', code: clean });
  $('lobby-status').textContent = 'Joining...';
  show('lobby');
}

function quitToMenu(): void {
  session?.close();
  session = null;
  lobby = null;
  if (endTimer !== null) clearInterval(endTimer);
  game.detach();
  hud.setNet('');
  if (document.pointerLockElement) document.exitPointerLock();
  show('main');
}

function onMessage(msg: ServerMsg): void {
  switch (msg.t) {
    case 'welcome':
      you = msg.you;
      game.setPlayers(you, lobby?.players ?? []);
      break;
    case 'lobby': {
      const wasInMatch = lobby?.inMatch;
      lobby = { code: msg.code, players: msg.players, roundLength: msg.roundLength, inMatch: msg.inMatch };
      game.setPlayers(you, msg.players);
      renderLobby();
      if (session?.practice) break;
      if (wasInMatch && !msg.inMatch) {
        game.detach();
        game.attach(session!);
        show('lobby');
      } else if (!msg.inMatch && currentScreen !== 'lobby' && currentScreen !== 'settings') {
        show('lobby');
      }
      // Pick a free character automatically for the joining player.
      const me = msg.players.find((p) => p.id === you);
      if (me && !me.character && !msg.inMatch) {
        const taken = new Set(msg.players.map((p) => p.character));
        const free = (['ahmed', 'miral'] as Character[]).find((c) => !taken.has(c));
        if (free) session?.send({ t: 'pick', character: free });
      }
      break;
    }
    case 'error':
      dialog(msg.message);
      if (msg.fatal) quitToMenu();
      else if (!lobby && !session?.practice) quitToMenu();
      break;
    case 'round':
      if (endTimer !== null) clearInterval(endTimer);
      show(null);
      enterGameView();
      game.handle(msg);
      break;
    case 'end':
      game.handle(msg);
      break;
    default:
      game.handle(msg);
  }
}

function enterGameView(): void {
  game.setMenuOpen(false);
  if (game.input.touchMode) {
    document.body.classList.add('touch');
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) {
      el.requestFullscreen().then(() => {
        const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
        return o.lock?.('landscape');
      }).catch(() => undefined);
    }
  } else {
    game.input.requestPointerLock();
  }
}

function renderLobby(): void {
  if (!lobby) return;
  $('lobby-code').textContent = lobby.code;
  const list = $('lobby-players');
  list.innerHTML = '';
  for (const p of lobby.players) {
    const div = document.createElement('div');
    div.className = `lobby-player${p.id === you ? ' me' : ''}`;
    const name = p.character ? CHARACTER_NAMES[p.character] : 'Choosing...';
    div.innerHTML = `<div class="name"></div><div class="meta"></div>`;
    div.querySelector('.name')!.textContent = name;
    div.querySelector('.meta')!.textContent =
      `${p.id === you ? 'You' : 'Other player'}${p.host ? ' · host' : ''}${p.connected ? '' : ' · reconnecting...'} · wins: ${p.score}`;
    list.appendChild(div);
  }
  if (lobby.players.length < 2) {
    const div = document.createElement('div');
    div.className = 'lobby-player';
    div.innerHTML = '<div class="name">...</div><div class="meta">Waiting for the other player</div>';
    list.appendChild(div);
  }
  const me = lobby.players.find((p) => p.id === you);
  document.querySelectorAll<HTMLButtonElement>('.char-pick').forEach((b) => {
    b.classList.toggle('selected', me?.character === b.dataset.pick);
    b.disabled = lobby!.players.some((p) => p.id !== you && p.character === b.dataset.pick);
  });
  const isHost = !!me?.host;
  const len = $<HTMLSelectElement>('lobby-length');
  len.value = String(lobby.roundLength);
  len.disabled = !isHost;
  const ready = lobby.players.length === 2 && lobby.players.every((p) => p.character && p.connected);
  const start = $<HTMLButtonElement>('lobby-start');
  start.style.display = isHost ? '' : 'none';
  start.disabled = !ready;
  $('lobby-status').textContent = lobby.players.length < 2
    ? 'Waiting for the other player to join...'
    : !ready ? 'Both players need to pick Ahmed or Miral.'
      : isHost ? 'Ready! Press START MATCH.' : 'Ready! Waiting for the host to start...';
}

// ---------------- End of round ----------------

function onRoundEnd(msg: EndMsg): void {
  if (document.pointerLockElement) document.exitPointerLock();
  const meSurvivor = msg.survivor === you || (session?.practice && msg.survivor !== session.bot?.id);
  const name = (id: string) => {
    const p = lobby?.players.find((q) => q.id === id);
    return p?.character ? CHARACTER_NAMES[p.character] : 'Player';
  };
  const title = $('end-title');
  let text = '', sub = '', cls = 'draw';
  if (msg.result === 'escaped') {
    text = meSurvivor ? 'YOU ESCAPED!' : `${name(msg.survivor)} ESCAPED!`;
    sub = meSurvivor ? 'Granny is furious! Hehehe.' : 'Granny will be faster next time...';
    cls = meSurvivor ? 'win' : 'lose';
  } else if (msg.result === 'caught') {
    text = meSurvivor ? 'GRANNY CAUGHT YOU!' : `YOU CAUGHT ${name(msg.survivor).toUpperCase()}!`;
    sub = meSurvivor ? '"Hehehehe... I found you!"' : 'Hehehehe! Nobody escapes Granny!';
    cls = meSurvivor ? 'lose' : 'win';
  } else {
    text = "TIME'S UP!";
    sub = "Nobody won this round - it's a draw.";
  }
  title.textContent = text;
  title.className = `end-title ${cls}`;
  $('end-sub').textContent = sub;
  const scores = $('end-scores');
  scores.innerHTML = '';
  for (const p of lobby?.players ?? []) {
    const d = document.createElement('div');
    d.innerHTML = `<span></span> <b></b>`;
    d.querySelector('span')!.textContent = p.character ? CHARACTER_NAMES[p.character] : 'Player';
    d.querySelector('b')!.textContent = String(msg.scores[p.id] ?? 0);
    scores.appendChild(d);
  }
  let left = msg.next;
  const nextEl = $('end-next');
  const tick = () => {
    const swapText = session?.practice ? 'Next round' : 'Next round - you SWAP ROLES -';
    nextEl.textContent = left > 0 ? `${swapText} in ${Math.ceil(left)}...` : 'Starting...';
    left -= 1;
  };
  tick();
  if (endTimer !== null) clearInterval(endTimer);
  endTimer = window.setInterval(tick, 1000);
  show('end');
}

// ---------------- Pause ----------------

function openPause(): void {
  if (!session || game.phase === 'idle' || currentScreen === 'end') return;
  if (currentScreen !== '') return;
  if (session instanceof PracticeSession) session.setPaused(true);
  $('pause-hint').textContent = session.practice ? 'The game is paused.' : 'The game keeps going for the other player!';
  show('pause');
}

function resume(): void {
  if (session instanceof PracticeSession) session.setPaused(false);
  show(null);
  enterGameView();
}

document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement && game?.phase !== 'idle' && currentScreen === '' && session) {
    // Esc releases the mouse - show the pause menu.
    openPause();
  }
});

// ---------------- Wiring ----------------

function bindUi(): void {
  document.addEventListener('pointerdown', () => game?.audio.resume(), { capture: true });
  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!el) return;
    const a = el.dataset.action!;
    game.audio.creak(null, false, 0.3);
    switch (a) {
      case 'play':
        characterMode = 'practice';
        $('practice-length-row').style.display = '';
        $('character-hint').textContent = 'You are the survivor. The computer plays Granny. Find the key and escape!';
        show('character', true);
        break;
      case 'create':
        characterMode = 'create';
        $('practice-length-row').style.display = 'none';
        $('character-hint').textContent = 'You will get a room code to share with the other player.';
        show('character', true);
        break;
      case 'join': show('join', true); $<HTMLInputElement>('join-code').focus(); break;
      case 'join-go': joinRoom($<HTMLInputElement>('join-code').value); break;
      case 'settings': show('settings', true); break;
      case 'howto': show('howto', true); break;
      case 'back': back(); break;
      case 'leave': quitToMenu(); break;
      case 'lobby-start': session?.send({ t: 'start' }); break;
      case 'resume': resume(); break;
      case 'restart': session?.send({ t: 'restart' }); if (session instanceof PracticeSession) session.setPaused(false); break;
      case 'quit': quitToMenu(); break;
    }
  });
  document.querySelectorAll<HTMLElement>('.char-card').forEach((b) => b.addEventListener('click', () => {
    const c = b.dataset.character as Character;
    if (characterMode === 'practice') startPractice(c);
    else createRoom(c);
  }));
  document.querySelectorAll<HTMLButtonElement>('.char-pick').forEach((b) => b.addEventListener('click', () => {
    session?.send({ t: 'pick', character: b.dataset.pick as Character });
  }));
  $<HTMLSelectElement>('lobby-length').addEventListener('change', (e) => {
    session?.send({ t: 'roundLength', seconds: Number((e.target as HTMLSelectElement).value) });
  });
  $<HTMLInputElement>('join-code').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') joinRoom((e.target as HTMLInputElement).value);
  });
  $('copy-code').addEventListener('click', () => {
    if (!lobby) return;
    const url = new URL(location.href);
    url.search = `?room=${lobby.code}`;
    const text = location.protocol.startsWith('http') ? url.toString() : lobby.code;
    navigator.clipboard?.writeText(text).then(() => dialog(`Copied: ${text}`)).catch(() => dialog(`Room code: ${lobby!.code}`));
  });
  // Canvas click re-captures the mouse while playing.
  $('game').addEventListener('click', () => {
    if (game.phase !== 'idle' && currentScreen === '' && !document.pointerLockElement) game.input.requestPointerLock();
  });
  // Touch buttons
  const tap = (id: string, action: Parameters<Game['input']['fire']>[0]) => {
    $(id).addEventListener('pointerdown', (e) => { e.preventDefault(); game.input.fire(action); });
  };
  tap('btn-act', 'interact');
  tap('btn-crouch', 'crouch');
  tap('btn-light', 'flashlight');
  tap('btn-pause', 'pause');
  const run = $('btn-run');
  run.addEventListener('pointerdown', (e) => { e.preventDefault(); game.input.touchRun = true; run.classList.add('on'); });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) {
    run.addEventListener(ev, () => { game.input.touchRun = false; run.classList.remove('on'); });
  }
}

async function boot(): Promise<void> {
  bindSettings();
  bindUi();
  $('version').textContent = `v${__APP_VERSION__} · Phase 1 + online multiplayer preview`;
  try {
    game = await Game.create($<HTMLCanvasElement>('game'), hud, settings, {
      onEnd: onRoundEnd,
      onPauseRequest: openPause,
    });
  } catch (err) {
    console.error(err);
    $('screen-loading').querySelector('.loading-text')!.textContent =
      'Sorry - this device could not start the 3D game (WebGL / WebAssembly is needed).';
    return;
  }
  if (game.input.touchMode) document.body.classList.add('touch');
  game.setMenuOpen(true);

  const params = new URLSearchParams(location.search);
  if (params.get('debug') === '1') {
    (window as unknown as Record<string, unknown>).__granny = {
      game,
      state: () => game.debugState(),
      teleport: (x: number, z: number, yaw?: number) => game.debugTeleport(x, z, yaw),
      interact: () => game.debugInteract(),
      session: () => session,
    };
  }
  const saved = OnlineSession.savedRejoin();
  const url = resolveServerUrl(settings);
  if (saved && url) {
    // Page was reloaded mid-game: take our seat back.
    const s = new OnlineSession(url);
    wire(s);
    game.attach(s);
    s.connect({ t: 'rejoin', code: saved.code, token: saved.token });
    show('lobby');
    return;
  }
  const room = params.get('room');
  if (room) {
    show('main');
    show('join', true);
    $<HTMLInputElement>('join-code').value = room.toUpperCase().slice(0, 5);
    return;
  }
  show('main');
}

void boot();
