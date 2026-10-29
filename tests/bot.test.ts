import { describe, expect, it } from 'vitest';
import { canSee, hearingRange } from '../src/game/bot';
import { Stamina } from '../src/game/stamina';

const base = { gx: 0, gz: 0, gyaw: 0, sx: 0, sz: -6, survivorLight: true, survivorCrouch: false, clear: true, intensity: 'normal' as const };

describe('Granny AI senses', () => {
  it('sees a survivor in front of her', () => {
    expect(canSee(base)).toBe(true);
  });
  it('does not see through walls', () => {
    expect(canSee({ ...base, clear: false })).toBe(false);
  });
  it('does not see behind her (unless very close)', () => {
    expect(canSee({ ...base, sz: 6 })).toBe(false);
    expect(canSee({ ...base, sz: 1.5 })).toBe(true);
  });
  it('sees less far when the flashlight is off', () => {
    expect(canSee({ ...base, sz: -15 })).toBe(true);
    expect(canSee({ ...base, sz: -15, survivorLight: false })).toBe(false);
  });
  it('hears running further than crouching', () => {
    expect(hearingRange(true, false, true, false)).toBeGreaterThan(hearingRange(false, true, true, false));
    expect(hearingRange(true, false, false, false)).toBe(0);
    expect(hearingRange(true, false, true, true)).toBeLessThan(hearingRange(true, false, true, false));
  });
});

describe('Stamina', () => {
  it('drains while running and blocks running when exhausted', () => {
    const s = new Stamina(0.5, 0.25, 0.3);
    for (let i = 0; i < 8; i++) s.update(0.25, true);
    expect(s.value).toBe(0);
    expect(s.canRun()).toBe(false);
    s.update(1, false);
    expect(s.canRun()).toBe(false); // 0.25 < 0.3
    s.update(0.4, false);
    expect(s.canRun()).toBe(true);
  });
});
