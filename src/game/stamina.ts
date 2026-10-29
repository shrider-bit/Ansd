/** Sprint stamina: drains while running, refills while not. 0..1. */
export class Stamina {
  value = 1;
  /** When fully drained you must recover to `recoverAt` before running again. */
  exhausted = false;
  constructor(
    public drainPerSec: number,
    public regenPerSec: number,
    public recoverAt = 0.3,
  ) {}

  canRun(): boolean {
    return !this.exhausted && this.value > 0;
  }

  update(dt: number, running: boolean): void {
    if (running && this.canRun()) {
      this.value = Math.max(0, this.value - this.drainPerSec * dt);
      if (this.value === 0) this.exhausted = true;
    } else {
      this.value = Math.min(1, this.value + this.regenPerSec * dt);
      if (this.exhausted && this.value >= this.recoverAt) this.exhausted = false;
    }
  }

  reset(): void {
    this.value = 1;
    this.exhausted = false;
  }
}
