// 2D (top-down) geometry used for server-side line-of-sight and movement
// validation. Walls are line segments on the x/z plane.

import { type Level, type DoorDef, doorWidth } from './level';

export interface Seg { x1: number; z1: number; x2: number; z2: number; doorId?: string }

/** Wall segments with door/arch openings cut out. */
export function solidWallSegments(level: Level): Seg[] {
  const out: Seg[] = [];
  for (const w of level.walls) {
    const alongX = w.z1 === w.z2;
    const fixed = alongX ? w.z1 : w.x1;
    const a = alongX ? Math.min(w.x1, w.x2) : Math.min(w.z1, w.z2);
    const b = alongX ? Math.max(w.x1, w.x2) : Math.max(w.z1, w.z2);
    const gaps = level.doors
      .filter((d) => (alongX ? d.along === 'x' && d.z === fixed : d.along === 'z' && d.x === fixed))
      .map((d) => {
        const c = alongX ? d.x : d.z;
        const hw = doorWidth(d) / 2;
        return [c - hw, c + hw] as const;
      })
      .filter(([g0, g1]) => g1 > a && g0 < b)
      .sort((p, q) => p[0] - q[0]);
    let cur = a;
    for (const [g0, g1] of gaps) {
      if (g0 > cur) out.push(mk(alongX, fixed, cur, g0));
      cur = Math.max(cur, g1);
    }
    if (cur < b) out.push(mk(alongX, fixed, cur, b));
  }
  return out;
}

function mk(alongX: boolean, fixed: number, a: number, b: number): Seg {
  return alongX ? { x1: a, z1: fixed, x2: b, z2: fixed } : { x1: fixed, z1: a, x2: fixed, z2: b };
}

/** Segment covering a door opening (used while the door is closed). */
export function doorSegment(d: DoorDef): Seg {
  const hw = doorWidth(d) / 2;
  return d.along === 'x'
    ? { x1: d.x - hw, z1: d.z, x2: d.x + hw, z2: d.z, doorId: d.id }
    : { x1: d.x, z1: d.z - hw, x2: d.x, z2: d.z + hw, doorId: d.id };
}

function cross(ax: number, az: number, bx: number, bz: number): number {
  return ax * bz - az * bx;
}

/** True if segment p1-p2 properly intersects segment q1-q2 (touching counts). */
export function segmentsIntersect(
  p1x: number, p1z: number, p2x: number, p2z: number,
  q1x: number, q1z: number, q2x: number, q2z: number,
): boolean {
  const rx = p2x - p1x, rz = p2z - p1z;
  const sx = q2x - q1x, sz = q2z - q1z;
  const denom = cross(rx, rz, sx, sz);
  const qpx = q1x - p1x, qpz = q1z - p1z;
  if (Math.abs(denom) < 1e-9) {
    // Parallel: treat collinear overlap as intersecting.
    if (Math.abs(cross(qpx, qpz, rx, rz)) > 1e-9) return false;
    const rr = rx * rx + rz * rz;
    if (rr < 1e-12) return false;
    const t0 = (qpx * rx + qpz * rz) / rr;
    const t1 = t0 + (sx * rx + sz * rz) / rr;
    return Math.max(t0, t1) >= 0 && Math.min(t0, t1) <= 1;
  }
  const t = cross(qpx, qpz, sx, sz) / denom;
  const u = cross(qpx, qpz, rx, rz) / denom;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

/** True if nothing in `segs` blocks the straight line a-b. */
export function lineClear(segs: readonly Seg[], ax: number, az: number, bx: number, bz: number): boolean {
  for (const s of segs) {
    if (segmentsIntersect(ax, az, bx, bz, s.x1, s.z1, s.x2, s.z2)) return false;
  }
  return true;
}

export function dist2(ax: number, az: number, bx: number, bz: number): number {
  const dx = ax - bx, dz = az - bz;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Which way a door swings (+1 / -1) so it opens away from the person
 * opening it. Matches the door pivot convention used by the client.
 */
export function doorSwingDir(d: DoorDef, px: number, pz: number): 1 | -1 {
  // Side of the wall the opener stands on, in the door's local z.
  const side = d.along === 'x' ? pz - d.z : -(px - d.x);
  return side < 0 ? -1 : 1;
}
