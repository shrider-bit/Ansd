// In-game heads-up display (DOM overlay on top of the 3D canvas).

import type { Role } from '../shared/protocol';
import { VOICE_BUTTON_LABELS, VOICE_LINE_COUNT } from '../shared/voiceLines';

const $ = (id: string) => document.getElementById(id)!;

export class Hud {
  private readonly root = $('hud');
  private readonly timer = $('timer');
  private readonly role = $('role-badge');
  private readonly roomName = $('room-name');
  private readonly objective = $('objective');
  private readonly prompt = $('prompt');
  private readonly toastEl = $('toast');
  private readonly stamina = $('stamina');
  private readonly staminaFill = $('stamina-fill');
  private readonly keySlot = $('slot-key');
  private readonly voiceBar = $('voice-bar');
  private readonly countdown = $('countdown');
  private readonly hideOverlay = $('hide-overlay');
  private readonly vignette = $('vignette');
  private readonly flashEl = $('flash');
  private readonly scare = $('scare');
  private readonly net = $('net-status');
  private readonly fps = $('fps');
  private readonly inventory = $('inventory');
  private toastTimer: number | null = null;
  private lastPrompt = '';
  private voiceCds: HTMLElement[] = [];

  show(on: boolean): void {
    this.root.classList.toggle('hidden', !on);
  }

  setRole(role: Role, survivorName: string): void {
    this.role.textContent = role === 'granny' ? 'YOU ARE GRANNY' : 'SURVIVOR';
    this.role.className = role;
    this.stamina.style.display = '';
    this.inventory.style.display = role === 'survivor' ? '' : 'none';
    this.voiceBar.style.display = role === 'granny' ? '' : 'none';
    this.voiceBar.innerHTML = '';
    this.voiceCds = [];
    if (role === 'granny') {
      for (let i = 0; i < VOICE_LINE_COUNT; i++) {
        const b = document.createElement('button');
        b.className = 'small';
        b.dataset.voice = String(i);
        b.textContent = `${i + 1}. ${i === 0 ? `Call ${survivorName}` : VOICE_BUTTON_LABELS[i]}`;
        const cd = document.createElement('div');
        cd.className = 'cd';
        b.appendChild(cd);
        this.voiceCds.push(cd);
        this.voiceBar.appendChild(b);
      }
    }
  }

  onVoiceButton(fn: (line: number) => void): void {
    this.voiceBar.addEventListener('pointerdown', (e) => {
      const b = (e.target as HTMLElement).closest('button');
      if (b?.dataset.voice) {
        e.preventDefault();
        fn(Number(b.dataset.voice));
      }
    });
  }

  /** 0..1 remaining cooldown for the voice buttons. */
  setVoiceCooldown(frac: number): void {
    for (const cd of this.voiceCds) cd.style.width = `${Math.max(0, frac) * 100}%`;
  }

  setTimer(seconds: number): void {
    const s = Math.max(0, Math.ceil(seconds));
    this.timer.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    this.timer.classList.toggle('low', s <= 30);
  }

  setRoom(name: string): void {
    if (this.roomName.textContent !== name) this.roomName.textContent = name;
  }

  setObjective(text: string): void {
    if (this.objective.textContent !== text) this.objective.textContent = text;
  }

  setPrompt(text: string | null, touch: boolean): void {
    const html = text ? (touch ? text : `<kbd>E</kbd>${text}`) : '';
    if (html === this.lastPrompt) return;
    this.lastPrompt = html;
    this.prompt.innerHTML = html;
    this.prompt.classList.toggle('show', !!text);
  }

  toast(text: string, ms = 2200): void {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('show');
    if (this.toastTimer !== null) clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.remove('show'), ms);
  }

  setStamina(value: number, exhausted: boolean): void {
    this.staminaFill.style.width = `${Math.round(value * 100)}%`;
    this.stamina.classList.toggle('tired', exhausted);
  }

  setKey(has: boolean): void {
    this.keySlot.classList.toggle('has', has);
  }

  setCountdown(text: string | null, sub = ''): void {
    this.countdown.innerHTML = text ? `${text}${sub ? `<small>${sub}</small>` : ''}` : '';
  }

  setHidden(kind: 'wardrobe' | 'bed' | null): void {
    this.hideOverlay.className = kind ?? '';
  }

  setDanger(on: boolean): void {
    this.vignette.classList.toggle('danger', on);
  }

  lightning(strength: number): void {
    this.flashEl.animate(
      [{ opacity: 0 }, { opacity: 0.35 * strength }, { opacity: 0.05 }, { opacity: 0.25 * strength }, { opacity: 0 }],
      { duration: 600, easing: 'ease-out' },
    );
  }

  showScare(on: boolean): void {
    this.scare.classList.toggle('show', on);
  }

  setNet(text: string): void {
    this.net.textContent = text;
    this.net.style.display = text ? '' : 'none';
  }

  setFps(text: string): void {
    this.fps.textContent = text;
  }
}
