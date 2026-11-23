/* جسور — allocation engine.
   • hungarian(): exact Kuhn–Munkres (O(n²m)) for a rectangular cost matrix.
   • maxAssign(): maximum-total-value partial assignment with forbidden pairs (value 0).
   • cappedAssign(): Hungarian + repair pass for donor-protection caps (per cell and per entity).
   • greedy(): the "first-come" baseline — needs are served in arrival order, each takes its best free candidate.
   Nothing here is machine learning; it is classical operations research. */
const JOpt = (() => {
  function hungarian(a, n, m) {           // minimise; requires n <= m; returns row -> col
    const INF = 1e18;
    const u = new Float64Array(n + 1), v = new Float64Array(m + 1), minv = new Float64Array(m + 1);
    const p = new Int32Array(m + 1), way = new Int32Array(m + 1), used = new Uint8Array(m + 1);
    for (let i = 1; i <= n; i++) {
      p[0] = i; let j0 = 0; minv.fill(INF); used.fill(0);
      do {
        used[j0] = 1; const i0 = p[j0], row = (i0 - 1) * m; let delta = INF, j1 = 0;
        for (let j = 1; j <= m; j++) if (!used[j]) {
          const cur = a[row + j - 1] - u[i0] - v[j];
          if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
          if (minv[j] < delta) { delta = minv[j]; j1 = j; }
        }
        for (let j = 0; j <= m; j++) { if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta; }
        j0 = j1;
      } while (p[j0] !== 0);
      do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
    }
    const ans = new Int32Array(n).fill(-1);
    for (let j = 1; j <= m; j++) if (p[j]) ans[p[j] - 1] = j - 1;
    return ans;
  }

  // V: Float64Array nR*nC of values (>0 allowed, 0 forbidden). Returns [[r,c,value]...] maximising the total.
  function maxAssign(V, nR, nC) {
    if (!nR || !nC) return [];
    const out = [];
    if (nR <= nC) {
      const cost = new Float64Array(nR * nC); for (let k = 0; k < cost.length; k++) cost[k] = -V[k];
      const a = hungarian(cost, nR, nC);
      for (let r = 0; r < nR; r++) { const c = a[r]; if (c >= 0 && V[r * nC + c] > 0) out.push([r, c, V[r * nC + c]]); }
    } else {
      const cost = new Float64Array(nR * nC);
      for (let r = 0; r < nR; r++) for (let c = 0; c < nC; c++) cost[c * nR + r] = -V[r * nC + c];
      const a = hungarian(cost, nC, nR);
      for (let c = 0; c < nC; c++) { const r = a[c]; if (r >= 0 && V[r * nC + c] > 0) out.push([r, c, V[r * nC + c]]); }
    }
    return out;
  }

  const LVL = [0, .6, .85, 1];             // credit for a skill held at level 0..3
  const DEFAULTS = {
    w: { skill: 8, grade: 4, adj: 4, exp: 4, crit: 7, qat: 4, will: 5 },
    minFit: .62, mustThr: .6, floorCov: 1.0, maxOut: 24, allowBridge: true,
    extDays: 150, intDays: 35, costPerHire: 38000,
  };

  // Evaluate one (person, need) pair. detail=true also lists matched / missing skills.
  function evalPair(D, p, n, P, detail) {
    if (p.e === n.e) return null;
    const adj = D.ADJ[p.f][n.f]; if (adj < .3) return null;
    if (p.band < n.lo - 1 || p.band > n.hi + 1) return null;
    const grade = (p.band >= n.lo && p.band <= n.hi) ? 1 : .55;
    let sm = 0, sn = 0;
    for (let k = 0; k < n.must.length; k++) sm += LVL[p.sk[n.must[k]]];
    for (let k = 0; k < n.nice.length; k++) sn += LVL[p.sk[n.nice[k]]];
    const mustCov = sm / n.must.length;
    const skill = (2 * sm + sn) / (2 * n.must.length + n.nice.length);
    const exp = Math.min(1, p.yrs / D.EXPECT[n.lo]);
    const fit = .55 * skill + .15 * grade + .15 * adj + .15 * exp;
    let kind = 0;
    if (fit >= P.minFit && mustCov >= P.mustThr) kind = 1;
    else if (fit >= P.minFit - .15 && mustCov >= .3) kind = 2;
    if (!kind) return null;
    const w = P.w, crit = D.CRIT[n.crit].v, qat = p.q ? 1 : 0, will = D.WILL[p.will].v;
    const sw = w.skill + w.grade + w.adj + w.exp + w.crit + w.qat + w.will || 1;
    const value = (w.skill * skill + w.grade * grade + w.adj * adj + w.exp * exp + w.crit * crit + w.qat * qat + w.will * will) / sw;
    const r = { kind, fit, value: Math.max(value, 1e-4), mustCov, comps: { skill, grade, adj, exp, crit, qat, will } };
    if (detail) {
      r.matched = []; r.missing = []; let weeks = 0;
      n.must.forEach(s => { const l = p.sk[s]; (l >= 2 ? r.matched : r.missing).push({ s, must: true, lvl: l }); if (l < 2) weeks += l ? 3 : 6; });
      n.nice.forEach(s => { const l = p.sk[s]; (l >= 2 ? r.matched : r.missing).push({ s, must: false, lvl: l }); if (l < 2) weeks += l ? 1 : 2; });
      r.weeks = Math.max(4, Math.min(16, weeks));
    }
    return r;
  }
  const mechanism = n => (n.dur === 'perm' ? 'نقل' : n.dur === 'temp' ? 'ندب' : 'إعارة');

  // Stage 1 — score every candidate pair once.
  function buildMatrix(D, P, rejected) {
    const nN = D.needs.length, nP = D.people.length;
    const VAL = new Float32Array(nN * nP), FIT = new Float32Array(nN * nP), KIND = new Uint8Array(nN * nP);
    let direct = 0, bridge = 0;
    for (let i = 0; i < nN; i++) { const n = D.needs[i];
      for (let j = 0; j < nP; j++) {
        if (rejected && rejected.has(i + '|' + j)) continue;
        const r = evalPair(D, D.people[j], n, P, false); if (!r) continue;
        const k = i * nP + j; VAL[k] = r.value; FIT[k] = r.fit; KIND[k] = r.kind; if (r.kind === 1) direct++; else bridge++;
      } }
    return { VAL, FIT, KIND, nN, nP, pairs: nN * nP, direct, bridge };
  }

  // Donor-protection capacities.
  function caps(D, P) {
    const cell = new Int32Array(D.NE * D.NF);
    D.cells.forEach((c, k) => { cell[k] = Math.max(0, c.filled - Math.ceil(c.need * P.floorCov)); });
    return { cell, ent: P.maxOut };
  }
  const newUsage = D => ({ cell: new Int32Array(D.NE * D.NF), ent: new Int32Array(D.NE) });
  const use = (D, U, p) => { U.cell[p.e * D.NF + p.f]++; U.ent[p.e]++; };

  // Hungarian + repair. rows = need indices, cols = person indices, valOf(i,j) -> value (0 = forbidden).
  function cappedAssign(D, rows, cols, valOf, C, U) {
    let active = cols.slice(); const benched = []; const satCell = new Set(), satEnt = new Set();
    let pairs = [], iter = 0, repaired = 0;
    for (;;) {
      if (!rows.length || !active.length) { pairs = []; break; }
      iter++;
      const nR = rows.length, nC = active.length, V = new Float64Array(nR * nC);
      for (let r = 0; r < nR; r++) for (let c = 0; c < nC; c++) V[r * nC + c] = valOf(rows[r], active[c]);
      pairs = maxAssign(V, nR, nC).map(([r, c, v]) => ({ n: rows[r], p: active[c], v }));
      let violated = false; const kept = new Set(pairs.map(m => m.p));
      const byCell = new Map();
      pairs.forEach(m => { const p = D.people[m.p], k = p.e * D.NF + p.f; if (!byCell.has(k)) byCell.set(k, []); byCell.get(k).push(m); });
      byCell.forEach((list, k) => { const room = Math.max(0, C.cell[k] - U.cell[k]);
        if (list.length > room) { violated = true; satCell.add(k); list.sort((a, b) => b.v - a.v); list.slice(room).forEach(m => kept.delete(m.p)); } });
      const byEnt = new Map();
      pairs.forEach(m => { if (!kept.has(m.p)) return; const e = D.people[m.p].e; if (!byEnt.has(e)) byEnt.set(e, []); byEnt.get(e).push(m); });
      byEnt.forEach((list, e) => { const room = Math.max(0, C.ent - U.ent[e]);
        if (list.length > room) { violated = true; satEnt.add(e); list.sort((a, b) => b.v - a.v); list.slice(room).forEach(m => kept.delete(m.p)); } });
      if (!violated) break;
      const next = [];
      active.forEach(j => { const p = D.people[j];
        if (kept.has(j) || !(satCell.has(p.e * D.NF + p.f) || satEnt.has(p.e))) next.push(j); else { benched.push(j); repaired++; } });
      active = next;
    }
    // fill pass: let benched people back in wherever the caps still leave room
    const u2 = { cell: U.cell.slice(), ent: U.ent.slice() }; pairs.forEach(m => use(D, u2, D.people[m.p]));
    if (benched.length) {
      const takenN = new Set(pairs.map(m => m.n)), takenP = new Set(pairs.map(m => m.p)), cand = [];
      rows.forEach(i => { if (takenN.has(i)) return; benched.forEach(j => { const v = valOf(i, j); if (v > 0) cand.push({ n: i, p: j, v }); }); });
      cand.sort((a, b) => b.v - a.v);
      cand.forEach(m => { const p = D.people[m.p], k = p.e * D.NF + p.f;
        if (takenN.has(m.n) || takenP.has(m.p) || u2.cell[k] >= C.cell[k] || u2.ent[p.e] >= C.ent) return;
        takenN.add(m.n); takenP.add(m.p); u2.cell[k]++; u2.ent[p.e]++; pairs.push(m); });
    }
    pairs.forEach(m => use(D, U, D.people[m.p]));
    return { pairs, iter, benched: repaired };
  }

  // Baseline: needs in arrival order, each takes the best candidate still free (caps respected).
  function greedy(D, rows, cols, valOf, C, U) {
    const free = new Set(cols), pairs = [];
    rows.slice().sort((a, b) => D.needs[a].arrival - D.needs[b].arrival).forEach(i => {
      let best = -1, bv = 0;
      free.forEach(j => { const v = valOf(i, j); if (v <= bv) return; const p = D.people[j];
        if (U.cell[p.e * D.NF + p.f] >= C.cell[p.e * D.NF + p.f] || U.ent[p.e] >= C.ent) return; bv = v; best = j; });
      if (best >= 0) { free.delete(best); use(D, U, D.people[best]); pairs.push({ n: i, p: best, v: bv }); }
    });
    return pairs;
  }

  function stats(D, M, moves) {            // moves: [{n,p,kind}]
    const s = { filled: 0, bridge: 0, crit: 0, high: 0, fitSum: 0, value: 0, q: 0, total: moves.length };
    moves.forEach(m => { const k = m.n * M.nP + m.p, n = D.needs[m.n];
      if (m.kind === 2) s.bridge++; else { s.filled++; s.fitSum += M.FIT[k] || m.fit || 0; s.value += M.VAL[k] || 0; }
      if (n.crit === 2) s.crit++; if (n.crit === 1) s.high++; if (D.people[m.p].q) s.q++; });
    s.avgFit = s.filled ? s.fitSum / s.filled : 0;
    return s;
  }

  /* Full pipeline. decisions: Map "needIdx|personIdx" -> 'approved' | 'locked' | 'rejected'. */
  function solve(D, P, decisions) {
    const t0 = Date.now(); decisions = decisions || new Map();
    const rejected = new Set(), fixed = [];
    decisions.forEach((st, key) => { if (st === 'rejected') rejected.add(key); else { const [i, j] = key.split('|').map(Number); fixed.push({ n: i, p: j, st }); } });
    const M = buildMatrix(D, P, rejected); const t1 = Date.now();
    const C = caps(D, P), U = newUsage(D), fixN = new Set(), fixP = new Set(), moves = [];
    fixed.forEach(m => { fixN.add(m.n); fixP.add(m.p); use(D, U, D.people[m.p]);
      const ev = evalPair(D, D.people[m.p], D.needs[m.n], Object.assign({}, P, { minFit: 0, mustThr: 0 }), false);
      moves.push({ n: m.n, p: m.p, kind: M.KIND[m.n * M.nP + m.p] || (ev && ev.fit >= P.minFit ? 1 : 2), fixed: true, st: m.st, fit: ev ? ev.fit : 0 }); });
    const rows = D.needs.map(n => n.i).filter(i => !fixN.has(i)), cols = D.people.map(p => p.i).filter(j => !fixP.has(j));
    const copyU = u => ({ cell: u.cell.slice(), ent: u.ent.slice() });
    const vDirect = (i, j) => (M.KIND[i * M.nP + j] === 1 ? M.VAL[i * M.nP + j] : 0);
    const sum = ps => ps.reduce((a, m) => a + m.v, 0);
    let Ud = copyU(U); const dir = cappedAssign(D, rows, cols, vDirect, C, Ud); const t2 = Date.now();
    const Ug = copyU(U); const gPairs = greedy(D, rows, cols, vDirect, C, Ug); const t2b = Date.now();
    // the repair pass is a heuristic: never return less than the baseline
    let fallback = false; if (sum(gPairs) > sum(dir.pairs) + 1e-9) { dir.pairs = gPairs.slice(); Ud = Ug; fallback = true; }
    dir.pairs.forEach(m => moves.push({ n: m.n, p: m.p, kind: 1 }));
    let br = { pairs: [], iter: 0, benched: 0 };
    if (P.allowBridge) {
      const usedN = new Set(moves.map(m => m.n)), usedP = new Set(moves.map(m => m.p));
      const r2 = rows.filter(i => !usedN.has(i)), c2 = cols.filter(j => !usedP.has(j));
      br = cappedAssign(D, r2, c2, (i, j) => (M.KIND[i * M.nP + j] === 2 ? M.VAL[i * M.nP + j] : 0), C, Ud);
      br.pairs.forEach(m => moves.push({ n: m.n, p: m.p, kind: 2 }));
    }
    const t3 = Date.now();
    const gMoves = moves.filter(m => m.fixed && m.kind === 1).concat(gPairs.map(m => ({ n: m.n, p: m.p, kind: 1 })));
    const taken = new Set(moves.map(m => m.n));
    return { M, moves, residual: D.needs.filter(n => !taken.has(n.i)).map(n => n.i),
      stats: stats(D, M, moves), directStats: stats(D, M, moves.filter(m => m.kind === 1)), greedyStats: stats(D, M, gMoves), greedyMoves: gMoves,
      meta: { pairs: M.pairs, eligible: M.direct, bridgeable: M.bridge, iter: dir.iter, benched: dir.benched + br.benched, fallback,
        ms: { build: t1 - t0, solve: t2 - t1, greedy: t2b - t2, bridge: t3 - t2b, total: t3 - t0 } } };
  }

  return { hungarian, maxAssign, evalPair, mechanism, buildMatrix, caps, newUsage, cappedAssign, greedy, stats, solve, DEFAULTS, LVL };
})();
if (typeof module !== 'undefined') module.exports = JOpt;
