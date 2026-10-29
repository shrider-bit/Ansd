// Waypoint navigation graph + A* path finding (used by the AI Granny).

import type { NavNode } from './level';

export class NavGraph {
  readonly nodes: NavNode[];
  private readonly byId = new Map<string, NavNode>();
  private readonly adj = new Map<string, string[]>();

  constructor(nodes: NavNode[], edges: [string, string][]) {
    this.nodes = nodes;
    for (const n of nodes) {
      this.byId.set(n.id, n);
      this.adj.set(n.id, []);
    }
    for (const [a, b] of edges) {
      if (!this.byId.has(a) || !this.byId.has(b)) throw new Error(`Bad nav edge ${a}-${b}`);
      this.adj.get(a)!.push(b);
      this.adj.get(b)!.push(a);
    }
  }

  node(id: string): NavNode {
    const n = this.byId.get(id);
    if (!n) throw new Error(`Unknown nav node ${id}`);
    return n;
  }

  neighbours(id: string): readonly string[] {
    return this.adj.get(id) ?? [];
  }

  /**
   * Nearest node to (x, z). `reachable` lets callers reject nodes that are
   * behind a wall.
   */
  nearest(x: number, z: number, reachable?: (n: NavNode) => boolean): NavNode {
    let best: NavNode | null = null;
    let bestD = Infinity;
    let fallback: NavNode = this.nodes[0];
    let fallbackD = Infinity;
    for (const n of this.nodes) {
      const d = Math.hypot(n.x - x, n.z - z);
      if (d < fallbackD) { fallbackD = d; fallback = n; }
      if (d < bestD && (!reachable || reachable(n))) { bestD = d; best = n; }
    }
    return best ?? fallback;
  }

  /** A* path of node ids from `from` to `to` (inclusive), or [] if none. */
  path(from: string, to: string): string[] {
    if (from === to) return [from];
    const goal = this.node(to);
    const open = new Set<string>([from]);
    const came = new Map<string, string>();
    const g = new Map<string, number>([[from, 0]]);
    const f = new Map<string, number>([[from, this.h(from, goal)]]);
    while (open.size) {
      let cur = '';
      let curF = Infinity;
      for (const id of open) {
        const v = f.get(id) ?? Infinity;
        if (v < curF) { curF = v; cur = id; }
      }
      if (cur === to) {
        const out = [cur];
        while (came.has(cur)) { cur = came.get(cur)!; out.unshift(cur); }
        return out;
      }
      open.delete(cur);
      const cn = this.node(cur);
      for (const nb of this.neighbours(cur)) {
        const nn = this.node(nb);
        const tentative = (g.get(cur) ?? Infinity) + Math.hypot(nn.x - cn.x, nn.z - cn.z);
        if (tentative < (g.get(nb) ?? Infinity)) {
          came.set(nb, cur);
          g.set(nb, tentative);
          f.set(nb, tentative + this.h(nb, goal));
          open.add(nb);
        }
      }
    }
    return [];
  }

  private h(id: string, goal: NavNode): number {
    const n = this.node(id);
    return Math.hypot(n.x - goal.x, n.z - goal.z);
  }
}
