// Keyboard + mouse (pointer lock) and touch controls (virtual joystick,
// drag-to-look, on-screen buttons).

export type Action = 'interact' | 'flashlight' | 'crouch' | 'pause' | 'voice0' | 'voice1' | 'voice2' | 'voice3' | 'voice4';

export class Input {
  readonly keys = new Set<string>();
  /** Accumulated look delta in pixels since last read. */
  private lookX = 0;
  private lookY = 0;
  /** Touch joystick vector, -1..1. */
  stickX = 0;
  stickY = 0;
  touchRun = false;
  touchMode = false;
  enabled = false;
  private readonly listeners = new Set<(a: Action) => void>();
  private stickId: number | null = null;
  private stickOrigin = { x: 0, y: 0 };
  private lookId: number | null = null;
  private lookLast = { x: 0, y: 0 };
  private readonly canvas: HTMLCanvasElement;
  private readonly stickEl: HTMLElement;
  private readonly knobEl: HTMLElement;

  constructor(canvas: HTMLCanvasElement, stickEl: HTMLElement, knobEl: HTMLElement) {
    this.canvas = canvas;
    this.stickEl = stickEl;
    this.knobEl = knobEl;
    // Touch laptops still have a mouse: only phones/tablets start in touch mode
    // (a real touch on the canvas switches it on later).
    this.touchMode = matchMedia('(pointer: coarse)').matches;
    window.addEventListener('keydown', (e) => this.onKey(e, true));
    window.addEventListener('keyup', (e) => this.onKey(e, false));
    window.addEventListener('blur', () => this.keys.clear());
    document.addEventListener('mousemove', (e) => {
      if (this.enabled && document.pointerLockElement === this.canvas) {
        this.lookX += e.movementX;
        this.lookY += e.movementY;
      }
    });
    canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
    canvas.addEventListener('touchcancel', (e) => this.onTouchEnd(e));
  }

  on(fn: (a: Action) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  fire(a: Action): void {
    for (const fn of this.listeners) fn(a);
  }

  private onKey(e: KeyboardEvent, down: boolean): void {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (down) this.keys.add(e.code); else this.keys.delete(e.code);
    if (!down || e.repeat || !this.enabled) return;
    const map: Record<string, Action> = {
      KeyE: 'interact', KeyF: 'flashlight', KeyC: 'crouch', ControlLeft: 'crouch',
      Digit1: 'voice0', Digit2: 'voice1', Digit3: 'voice2', Digit4: 'voice3', Digit5: 'voice4',
    };
    const a = map[e.code];
    if (a) {
      this.fire(a);
      e.preventDefault();
    }
    if (e.code === 'Escape' || e.code === 'KeyP') this.fire('pause');
  }

  /** Movement axes from keyboard or joystick. */
  move(): { x: number; y: number } {
    let x = this.stickX, y = this.stickY;
    const k = this.keys;
    if (k.has('KeyW') || k.has('ArrowUp')) y += 1;
    if (k.has('KeyS') || k.has('ArrowDown')) y -= 1;
    if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) x += 1;
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y };
  }

  wantsRun(): boolean {
    return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.touchRun;
  }

  consumeLook(): { x: number; y: number } {
    const out = { x: this.lookX, y: this.lookY };
    this.lookX = 0;
    this.lookY = 0;
    return out;
  }

  requestPointerLock(): void {
    if (this.touchMode) return;
    try {
      const r = this.canvas.requestPointerLock() as unknown;
      if (r instanceof Promise) r.catch(() => undefined);
    } catch {
      // Not supported (or not allowed right now).
    }
  }

  private onTouchStart(e: TouchEvent): void {
    if (!this.enabled) return;
    this.touchMode = true;
    document.body.classList.add('touch');
    e.preventDefault();
    for (const t of Array.from(e.changedTouches)) {
      if (t.clientX < window.innerWidth * 0.42 && this.stickId === null) {
        this.stickId = t.identifier;
        this.stickOrigin = { x: t.clientX, y: t.clientY };
        this.stickEl.style.left = `${t.clientX}px`;
        this.stickEl.style.top = `${t.clientY}px`;
        this.stickEl.classList.add('active');
        this.knobEl.style.transform = 'translate(-50%, -50%)';
      } else if (this.lookId === null) {
        this.lookId = t.identifier;
        this.lookLast = { x: t.clientX, y: t.clientY };
      }
    }
  }

  private onTouchMove(e: TouchEvent): void {
    if (!this.enabled) return;
    e.preventDefault();
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === this.stickId) {
        const max = 55;
        let dx = t.clientX - this.stickOrigin.x;
        let dy = t.clientY - this.stickOrigin.y;
        const len = Math.hypot(dx, dy);
        if (len > max) { dx = dx / len * max; dy = dy / len * max; }
        this.stickX = dx / max;
        this.stickY = -dy / max;
        this.knobEl.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      } else if (t.identifier === this.lookId) {
        // Touch look is a bit faster than mouse look.
        this.lookX += (t.clientX - this.lookLast.x) * 2.2;
        this.lookY += (t.clientY - this.lookLast.y) * 2.2;
        this.lookLast = { x: t.clientX, y: t.clientY };
      }
    }
  }

  private onTouchEnd(e: TouchEvent): void {
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === this.stickId) {
        this.stickId = null;
        this.stickX = this.stickY = 0;
        this.stickEl.classList.remove('active');
      } else if (t.identifier === this.lookId) {
        this.lookId = null;
      }
    }
  }

  reset(): void {
    this.keys.clear();
    this.stickX = this.stickY = 0;
    this.stickId = this.lookId = null;
    this.touchRun = false;
    this.lookX = this.lookY = 0;
    this.stickEl.classList.remove('active');
  }
}
