// Procedurally painted textures (no external image files to license).

import * as THREE from 'three';
import { makeRng } from '../shared/rng';

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

function toTexture(c: HTMLCanvasElement, rx: number, ry: number): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function stains(ctx: CanvasRenderingContext2D, w: number, h: number, rng: () => number, n: number, alpha: number): void {
  for (let i = 0; i < n; i++) {
    const x = rng() * w, y = rng() * h, r = 8 + rng() * 40;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(20,12,4,${alpha})`);
    g.addColorStop(1, 'rgba(20,12,4,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

export function wallpaper(base: string, stripe: string, seed: number): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256);
  const rng = makeRng(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = stripe;
  for (let x = 0; x < 256; x += 32) ctx.fillRect(x, 0, 10, 256);
  // Faded diamond pattern
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = '#d9c9a0';
  for (let y = 0; y < 256; y += 32) {
    for (let x = 16; x < 256; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, y + 6); ctx.lineTo(x + 6, y + 16); ctx.lineTo(x, y + 26); ctx.lineTo(x - 6, y + 16);
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  stains(ctx, 256, 256, rng, 10, 0.35);
  // Peeling at the bottom
  const g = ctx.createLinearGradient(0, 200, 0, 256);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(10,6,2,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 200, 256, 56);
  return toTexture(c, 1, 1);
}

export function woodFloor(seed: number): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256);
  const rng = makeRng(seed);
  const plank = 32;
  for (let y = 0; y < 256; y += plank) {
    const offset = Math.floor(rng() * 256);
    for (let x = -offset; x < 256; x += 128) {
      const shade = 45 + Math.floor(rng() * 25);
      ctx.fillStyle = `rgb(${shade + 20},${shade},${Math.floor(shade * 0.6)})`;
      ctx.fillRect(x, y, 128, plank);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const yy = y + 4 + rng() * (plank - 8);
        ctx.moveTo(x, yy);
        ctx.bezierCurveTo(x + 40, yy + rng() * 4 - 2, x + 80, yy + rng() * 4 - 2, x + 128, yy);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(x, y, 2, plank);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, y, 256, 2);
  }
  stains(ctx, 256, 256, rng, 6, 0.3);
  return toTexture(c, 1, 1);
}

export function plaster(seed: number): THREE.CanvasTexture {
  const [c, ctx] = canvas(128, 128);
  const rng = makeRng(seed);
  ctx.fillStyle = '#5b554b';
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = `rgba(${rng() < 0.5 ? '0,0,0' : '255,255,255'},${rng() * 0.06})`;
    ctx.fillRect(rng() * 128, rng() * 128, 3, 3);
  }
  stains(ctx, 128, 128, rng, 4, 0.4);
  return toTexture(c, 1, 1);
}

export function woodPanel(seed: number, tint = [70, 42, 22]): THREE.CanvasTexture {
  const [c, ctx] = canvas(128, 128);
  const rng = makeRng(seed);
  ctx.fillStyle = `rgb(${tint[0]},${tint[1]},${tint[2]})`;
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  for (let i = 0; i < 18; i++) {
    ctx.beginPath();
    const x = rng() * 128;
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + rng() * 10 - 5, 40, x + rng() * 10 - 5, 90, x, 128);
    ctx.stroke();
  }
  stains(ctx, 128, 128, rng, 3, 0.25);
  return toTexture(c, 1, 1);
}

export function grass(seed: number): THREE.CanvasTexture {
  const [c, ctx] = canvas(128, 128);
  const rng = makeRng(seed);
  ctx.fillStyle = '#1b2414';
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) {
    const g = 30 + rng() * 40;
    ctx.fillStyle = `rgb(${g * 0.6},${g},${g * 0.4})`;
    ctx.fillRect(rng() * 128, rng() * 128, 1, 3);
  }
  return toTexture(c, 30, 30);
}

/** Radial glow sprite (lamps, eyes, key sparkle). */
export function glow(color: string): THREE.CanvasTexture {
  const [c, ctx] = canvas(64, 64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
