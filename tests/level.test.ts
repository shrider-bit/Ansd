import { describe, expect, it } from 'vitest';
import { LEVEL, hideFront } from '../src/shared/level';
import { doorSegment, lineClear, segmentsIntersect, solidWallSegments } from '../src/shared/geometry';
import { NavGraph } from '../src/shared/nav';

const walls = solidWallSegments(LEVEL);

describe('geometry', () => {
  it('detects crossing and non-crossing segments', () => {
    expect(segmentsIntersect(0, 0, 2, 2, 0, 2, 2, 0)).toBe(true);
    expect(segmentsIntersect(0, 0, 1, 0, 0, 1, 1, 1)).toBe(false);
    expect(segmentsIntersect(0, 0, 2, 0, 1, 0, 3, 0)).toBe(true); // collinear overlap
  });

  it('cuts door openings out of walls', () => {
    // Through the living room doorway at x=-6.5 on the z=0 wall.
    expect(lineClear(walls, -6.5, 1, -6.5, -1)).toBe(true);
    // Through solid wall next to it.
    expect(lineClear(walls, -8.5, 1, -8.5, -1)).toBe(false);
    // A closed door blocks the doorway.
    const living = LEVEL.doors.find((d) => d.id === 'living')!;
    expect(lineClear([doorSegment(living)], -6.5, 1, -6.5, -1)).toBe(false);
  });

  it('keeps the house sealed apart from the front door', () => {
    expect(lineClear(walls, 5, 5, 5, 12)).toBe(false);
    expect(lineClear(walls, 0.5, 6, 0.5, 10)).toBe(true);
  });
});

describe('navigation graph', () => {
  const nav = new NavGraph(LEVEL.nav.nodes, LEVEL.nav.edges);

  it('connects every node to every other node', () => {
    for (const n of LEVEL.nav.nodes) {
      expect(nav.path('kitchen', n.id).length, `kitchen -> ${n.id}`).toBeGreaterThan(0);
    }
  });

  it('never routes an edge through a wall', () => {
    for (const [a, b] of LEVEL.nav.edges) {
      const na = nav.node(a), nb = nav.node(b);
      expect(lineClear(walls, na.x, na.z, nb.x, nb.z), `${a} -> ${b}`).toBe(true);
    }
  });

  it('finds a sensible path from kitchen to bedroom through the hallway', () => {
    const p = nav.path('kitchen', 'bedroom');
    expect(p[0]).toBe('kitchen');
    expect(p.at(-1)).toBe('bedroom');
    expect(p).toContain('hall_c');
  });
});

describe('level data', () => {
  it('has hiding spots whose fronts are inside the house', () => {
    for (const h of LEVEL.hideSpots) {
      const f = hideFront(h);
      expect(Math.abs(f.x)).toBeLessThan(10);
      expect(Math.abs(f.z)).toBeLessThan(8);
      expect(lineClear(walls, h.x, h.z, f.x, f.z)).toBe(true);
    }
  });

  it('has at least four possible key locations', () => {
    expect(LEVEL.keySpots.length).toBeGreaterThanOrEqual(4);
  });
});
