/* أُفُق — محرّك المحاكاة (Cohort-component stock-and-flow model).
   Pure computation, no DOM. Runs in the browser and in Node (for sanity tests).
   State: headcount[family(12)][nationality Q/N][age 22..64]. Everything is SYNTHETIC. */
const UFE = (() => {
  'use strict';
  const C = (typeof CGB !== 'undefined') ? CGB : require('../_shared/roster.js');
  const A0 = 22, A1 = 64, NA = A1 - A0 + 1;
  const Y0 = C.RULES.baseYear, Y1 = 2040, NY = Y1 - Y0 + 1;
  const FAM = C.FAMILIES, NF = FAM.length;
  const TOTAL = C.ENTITIES.reduce((a, e) => a + e.headcount, 0);
  const UPTAKE = 0.65;            // share of staff who accept to stay when the retirement age is extended
  const LATE_EXIT = 0.12;         // yearly voluntary exit of staff working beyond 60
  const MAX_INTAKE = 0.12;        // a family cannot absorb more new hires than 12% of its headcount in one year
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

  // Per-family synthetic parameters.
  // share: of total headcount · vac: initial demand/supply − 1 · g: yearly demand growth (medium scenario)
  // sens: sensitivity to the service-demand scenario · pipe: yearly Qatari graduates available ÷ family size
  // cost: pay multiplier · bulge: Qatari age bulge at 45–56 · dxCut/dxAdd: demand removed/added by full digital transformation
  // fill: labour-market ease of filling a vacancy (scarce specialties are harder to recruit)
  const FP = {
    admin:  { share: .150, vac: -.03, g: -.005, sens: .5, pipe: .040, cost: .90, bulge: true,  dxCut: .25, dxAdd: 0,   fill: 1, scarce: false, local: true },
    fin:    { share: .050, vac: .01,  g: .004,  sens: .5, pipe: .032, cost: 1.00, bulge: true, dxCut: .25, dxAdd: 0,   fill: 1, scarce: false, local: true },
    legal:  { share: .020, vac: .02,  g: .008,  sens: .5, pipe: .040, cost: 1.10, bulge: true, dxCut: .05, dxAdd: 0,   fill: 1, scarce: false, local: true },
    eng:    { share: .070, vac: .05,  g: .015,  sens: 1,  pipe: .022, cost: 1.10, bulge: false, dxCut: 0,  dxAdd: .03, fill: .85, scarce: true,  local: true },
    it:     { share: .045, vac: .09,  g: .035,  sens: .5, pipe: .030, cost: 1.10, bulge: false, dxCut: 0,  dxAdd: .20, fill: .75, scarce: true,  local: true },
    health: { share: .240, vac: .06,  g: .020,  sens: 1,  pipe: .012, cost: 1.15, bulge: false, dxCut: 0,  dxAdd: 0,   fill: .80, scarce: true,  local: false },
    edu:    { share: .220, vac: .04,  g: .012,  sens: 1,  pipe: .026, cost: 1.00, bulge: false, dxCut: 0,  dxAdd: 0,   fill: .90, scarce: true,  local: false },
    hr:     { share: .030, vac: .00,  g: .002,  sens: .5, pipe: .045, cost: .95, bulge: true,  dxCut: .15, dxAdd: 0,   fill: 1, scarce: false, local: true },
    plan:   { share: .015, vac: .06,  g: .020,  sens: .5, pipe: .020, cost: 1.05, bulge: false, dxCut: 0,  dxAdd: .10, fill: .85, scarce: true,  local: true },
    cs:     { share: .070, vac: -.01, g: .003,  sens: 1,  pipe: .040, cost: .85, bulge: true,  dxCut: .25, dxAdd: 0,   fill: 1, scarce: false, local: true },
    tech:   { share: .070, vac: .02,  g: .005,  sens: 1,  pipe: .004, cost: .80, bulge: false, dxCut: .05, dxAdd: 0,   fill: .95, scarce: false, local: false },
    audit:  { share: .020, vac: .03,  g: .012,  sens: .5, pipe: .028, cost: 1.05, bulge: true, dxCut: .08, dxAdd: 0,   fill: 1, scarce: false, local: true },
  };
  const F = FAM.map(f => Object.assign({ id: f.id, ar: f.ar, qShare: f.qShare }, FP[f.id]));
  const DONORS = ['admin', 'hr', 'cs'].map(id => F.findIndex(f => f.id === id));   // families whose graduate supply can be redirected
  const DEMAND_ADJ = { low: -.008, med: 0, high: .010 };
  const COST = [[290e3, 390e3, 480e3, 560e3], [150e3, 190e3, 230e3, 265e3]];        // [Q, N] × age band, ر.ق / year
  const band4 = age => age <= 30 ? 0 : age <= 40 ? 1 : age <= 50 ? 2 : 3;

  // Age-shaped rates, precomputed per age index.
  const ATTR = [new Float64Array(NA), new Float64Array(NA)], EARLY = new Float64Array(NA);
  const COSTA = [new Float64Array(NA), new Float64Array(NA)], HIREW = [new Float64Array(NA), new Float64Array(NA)];
  for (let a = 0; a < NA; a++) {
    const age = A0 + a;
    ATTR[0][a] = age < 30 ? .040 : age < 40 ? .025 : .015;
    ATTR[1][a] = age < 30 ? .090 : age < 45 ? .070 : .060;
    EARLY[a] = age < 45 ? 0 : age < 50 ? .030 : age < 55 ? .050 : age < 60 ? .070 : LATE_EXIT;
    COSTA[0][a] = COST[0][band4(age)]; COSTA[1][a] = COST[1][band4(age)];
    HIREW[0][a] = age <= 32 ? Math.exp(-Math.pow(age - 24, 2) / (2 * 2.5 * 2.5)) : 0;
    HIREW[1][a] = (age >= 26 && age <= 46) ? Math.exp(-Math.pow(age - 33, 2) / (2 * 4 * 4)) : 0;
  }
  for (const w of HIREW) { let s = 0; for (const v of w) s += v; for (let a = 0; a < NA; a++) w[a] /= s; }

  const idx = (f, nat, a) => (f * 2 + nat) * NA + a;
  const gauss = (x, mu, sd) => Math.exp(-Math.pow(x - mu, 2) / (2 * sd * sd));

  // ---------- base-year population (deterministic) ----------
  const BASE = (() => {
    const r = C.rng(20260);
    const pop = new Float64Array(NF * 2 * NA), size = new Array(NF), D0 = new Float64Array(NF), P0 = new Float64Array(NF);
    let acc = 0;
    F.forEach((f, i) => { size[i] = i < NF - 1 ? Math.round(TOTAL * f.share) : 0; acc += size[i]; });
    size[NF - 1] = TOTAL - acc;
    F.forEach((f, i) => {
      const nQ = Math.round(size[i] * f.qShare), nN = size[i] - nQ;
      [nQ, nN].forEach((target, nat) => {
        let s = 0; const tmp = new Float64Array(NA);
        for (let a = 0; a <= 59 - A0; a++) {
          const age = A0 + a;
          let w = nat === 0
            ? (f.bulge ? .52 * gauss(age, 33, 5.5) / 5.5 + .48 * gauss(age, 50, 4.2) / 4.2
                       : .76 * gauss(age, 34, 6.5) / 6.5 + .24 * gauss(age, 49, 5) / 5)
            : gauss(age, 40, 7) / 7;
          if (age < 24) w *= .45;
          w *= 1 + (r() - .5) * .12;
          tmp[a] = w; s += w;
        }
        for (let a = 0; a < NA; a++) pop[idx(i, nat, a)] = tmp[a] / s * target;
      });
      D0[i] = size[i] * (1 + f.vac);
      P0[i] = size[i] * f.pipe;
    });
    return { pop, size, D0, P0 };
  })();

  const DEFAULTS = Object.freeze({
    retAge: 60, retScope: 'all', earlyMult: 1,
    hiringCap: .70, qTarget: .65, allowNQ: true,
    pipeline: 0, redirect: 0, replace: 0,
    demand: 'med', dx: .20,
    waveOn: false, waveYear: 2028, waveSize: .15,
    freezeOn: false, freezeStart: 2028, freezeYears: 2,
    surgeOn: false, surgeYear: 2030, surgeSize: .10,
  });
  const ZERO = { attr: 1, early: 1, dg: 0, famG: new Float64Array(NF), yr: new Float64Array(NY).fill(1) };
  const KEYS = ['S', 'SQ', 'D', 'W', 'RS', 'RE', 'AT', 'HQ', 'HN', 'RP', 'PB'];

  /* One projection 2026→2040. L = levers, nz = noise multipliers (Monte Carlo), keepPyr = keep full age structure. */
  function simulate(L, nz, keepPyr) {
    nz = nz || ZERO;
    const R = { pyr: keepPyr ? [] : null };
    for (const k of KEYS) R[k] = new Float64Array(NY * NF);
    let pop = BASE.pop.slice(), next = new Float64Array(pop.length);
    const Dg = Float64Array.from(BASE.D0), pipe = new Float64Array(NF);
    const scarceD = F.reduce((s, f, i) => s + (f.scarce ? BASE.D0[i] : 0), 0);
    const adj = DEMAND_ADJ[L.demand] || 0;
    const stock = (t) => {
      for (let f = 0; f < NF; f++) {
        let s = 0, sq = 0, w = 0;
        for (let a = 0; a < NA; a++) { const q = pop[idx(f, 0, a)], n = pop[idx(f, 1, a)]; s += q + n; sq += q; w += q * COSTA[0][a] + n * COSTA[1][a]; }
        R.S[t * NF + f] = s; R.SQ[t * NF + f] = sq; R.W[t * NF + f] = w * F[f].cost;
      }
      if (keepPyr) R.pyr.push(Float32Array.from(pop));
    };
    for (let f = 0; f < NF; f++) R.D[f] = BASE.D0[f];
    stock(0);

    for (let t = 0; t < NY - 1; t++) {
      const y = Y0 + t + 1, o = (t + 1) * NF;
      const rampP = clamp((y - (Y0 + 3)) / 2);              // graduate-pipeline levers act after a 4-year lag
      const rampDx = clamp((y - Y0) / (2035 - Y0));          // digital transformation matures by 2035
      const frozen = L.freezeOn && y >= L.freezeStart && y < L.freezeStart + L.freezeYears;
      // graduate pipeline this year, after expansion and redirection towards scarce families
      let moved = 0;
      for (let f = 0; f < NF; f++) pipe[f] = BASE.P0[f] * (1 + L.pipeline * rampP);
      for (const f of DONORS) { const m = pipe[f] * L.redirect * rampP; pipe[f] -= m; moved += m; }
      for (let f = 0; f < NF; f++) if (F[f].scarce) pipe[f] += moved * BASE.D0[f] / scarceD;
      next.fill(0);

      for (let f = 0; f < NF; f++) {
        const fp = F[f];
        const retAge = (L.retScope === 'all' || fp.scarce) ? L.retAge : 60;
        let rs = 0, re = 0, at = 0, sup = 0, nqStock = 0;
        for (let nat = 0; nat < 2; nat++) {
          for (let a = 0; a < NA; a++) {
            let n = pop[idx(f, nat, a)]; if (n <= 0) continue;
            const age = A0 + a;
            let er = 0;
            if (age >= 60) er = LATE_EXIT;
            else if (nat === 0 && age >= 45) {
              er = EARLY[a] * L.earlyMult * nz.early;
              if (L.waveOn && y === L.waveYear && age >= 50) er += L.waveSize;
            }
            er = Math.min(er, .9);
            const eOut = n * er; n -= eOut; re += eOut;
            const aOut = n * Math.min(.5, ATTR[nat][a] * nz.attr * nz.yr[t + 1]); n -= aOut; at += aOut;
            const na = age + 1;
            if (na >= retAge || a + 1 >= NA) { rs += n; continue; }
            if (na === 60) { rs += n * (1 - UPTAKE); n *= UPTAKE; }
            next[idx(f, nat, a + 1)] += n; sup += n; if (nat === 1) nqStock += n;
          }
        }
        // demand for the coming year
        Dg[f] *= 1 + fp.g + fp.sens * adj + nz.dg + nz.famG[f];
        let D = Dg[f] * (1 - fp.dxCut * L.dx * rampDx + fp.dxAdd * L.dx * rampDx);
        if (L.surgeOn && fp.sens === 1 && (y === L.surgeYear || y === L.surgeYear + 1)) D *= 1 + L.surgeSize;
        // hiring against the gap, Qatari share capped by the graduate pipeline
        let avail = pipe[f], hq = 0, hn = 0, pb = 0;
        const gap = D - sup;
        if (gap > 0) {
          const cap = L.hiringCap * (frozen ? (fp.scarce ? .4 : 0) : 1);     // essential services keep 40% of hiring in a freeze
          const hires = Math.min(gap * cap * fp.fill, MAX_INTAKE * sup), want = hires * L.qTarget;
          hq = Math.min(want, avail); pb = want - hq; avail -= hq;
          hn = L.allowNQ ? hires - hq : hires * (1 - L.qTarget);
        }
        // replacement (إحلال): convert a share of non-Qatari posts when Qatari candidates remain
        let rp = 0;
        if (L.replace > 0 && fp.local && !frozen && nqStock > 0) {
          rp = Math.min(L.replace * nqStock, avail);
          const k = 1 - rp / nqStock;
          for (let a = 0; a < NA; a++) next[idx(f, 1, a)] *= k;
        }
        const addQ = hq + rp;
        if (addQ > 0 || hn > 0) for (let a = 0; a < NA; a++) {
          if (HIREW[0][a]) next[idx(f, 0, a)] += addQ * HIREW[0][a];
          if (HIREW[1][a]) next[idx(f, 1, a)] += hn * HIREW[1][a];
        }
        R.D[o + f] = D; R.RS[o + f] = rs; R.RE[o + f] = re; R.AT[o + f] = at;
        R.HQ[o + f] = hq; R.HN[o + f] = hn; R.RP[o + f] = rp; R.PB[o + f] = pb;
      }
      const sw = pop; pop = next; next = sw;
      stock(t + 1);
    }
    return R;
  }

  /* Yearly series for all families (fam = -1) or one family index. */
  function totals(R, fam = -1) {
    const key = '_t' + fam; if (R[key]) return R[key];
    const T = {}; ['S', 'SQ', 'D', 'W', 'rs', 're', 'at', 'hq', 'hn', 'rp', 'pb', 'short', 'surplus', 'q', 'ret', 'hires', 'shortPct']
      .forEach(k => T[k] = new Float64Array(NY));
    const map = { S: 'S', SQ: 'SQ', D: 'D', W: 'W', RS: 'rs', RE: 're', AT: 'at', HQ: 'hq', HN: 'hn', RP: 'rp', PB: 'pb' };
    for (let t = 0; t < NY; t++) {
      for (let f = 0; f < NF; f++) {
        if (fam >= 0 && f !== fam) continue;
        const i = t * NF + f;
        for (const k of KEYS) T[map[k]][t] += R[k][i];
        const g = R.D[i] - R.S[i];
        if (g > 0) T.short[t] += g; else T.surplus[t] -= g;
      }
      T.q[t] = T.SQ[t] / T.S[t]; T.ret[t] = T.rs[t] + T.re[t]; T.hires[t] = T.hq[t] + T.hn[t];
      T.shortPct[t] = T.short[t] / T.D[t];
    }
    return (R[key] = T);
  }
  /* Age structure in year index t: { q[NA], n[NA], avgAge, share50 } */
  function pyramid(R, t, fam = -1) {
    const p = R.pyr[t], q = new Float64Array(NA), n = new Float64Array(NA);
    let tot = 0, ageSum = 0, s50 = 0;
    for (let f = 0; f < NF; f++) {
      if (fam >= 0 && f !== fam) continue;
      for (let a = 0; a < NA; a++) {
        const vq = p[idx(f, 0, a)], vn = p[idx(f, 1, a)]; q[a] += vq; n[a] += vn;
        tot += vq + vn; ageSum += (vq + vn) * (A0 + a); if (A0 + a >= 50) s50 += vq + vn;
      }
    }
    return { q, n, avgAge: ageSum / tot, share50: s50 / tot, total: tot };
  }

  // ---------- Monte Carlo ----------
  const NOISE = [];
  function noiseSet(n) {
    while (NOISE.length < n) {
      const r = C.rng(7000 + NOISE.length * 13);
      const nz = { attr: Math.exp(r.normal(0, .15)), early: Math.exp(r.normal(0, .22)), dg: r.normal(0, .004),
        famG: new Float64Array(NF), yr: new Float64Array(NY) };
      for (let f = 0; f < NF; f++) nz.famG[f] = r.normal(0, .003);
      for (let t = 0; t < NY; t++) nz.yr[t] = Math.exp(r.normal(0, .08));
      NOISE.push(nz);
    }
    return NOISE.slice(0, n);
  }
  // Same noise draws for every scenario (common random numbers) so comparisons are stable.
  const monteCarlo = (L, n = 200) => noiseSet(n).map(nz => simulate(L, nz, false));
  function bands(runs, key, fam = -1) {
    const lo = new Float64Array(NY), hi = new Float64Array(NY), tmp = new Float64Array(runs.length);
    const series = runs.map(r => totals(r, fam)[key]);
    for (let t = 0; t < NY; t++) {
      for (let i = 0; i < runs.length; i++) tmp[i] = series[i][t];
      const s = Array.from(tmp).sort((a, b) => a - b);
      lo[t] = s[Math.floor(.10 * (s.length - 1))]; hi[t] = s[Math.ceil(.90 * (s.length - 1))];
    }
    return { lo, hi };
  }

  // ---------- composite readiness index (0–100) ----------
  const WEIGHTS = { coverage: .40, qatar: .25, cost: .20, experience: .15 };
  function readiness(R) {
    const T = totals(R), last = NY - 1;
    let sp = 0, peak = 0;
    for (let t = 1; t < NY; t++) { sp += T.shortPct[t]; peak = Math.max(peak, T.ret[t] / T.S[t - 1]); }
    const avgShort = sp / (NY - 1), cagr = Math.pow(T.W[last] / T.W[0], 1 / last) - 1;
    const bench = C.RULES.qatarizationBenchmark;
    const parts = {
      coverage: clamp(1 - avgShort / .10),
      qatar: clamp((T.q[last] - T.q[0]) / (bench - T.q[0])),
      cost: clamp(1 - (cagr - .005) / .025),
      experience: clamp(1 - (peak - .015) / .02),
    };
    const score = 100 * Object.keys(WEIGHTS).reduce((s, k) => s + WEIGHTS[k] * parts[k], 0);
    return { score, parts, raw: { avgShort, cagr, peak, q: T.q[last] } };
  }

  // ---------- inverse mode: numerical search over the lever space ----------
  const SPACE = [
    { k: 'retAge', lo: 60, hi: 65, step: 1 }, { k: 'earlyMult', lo: .5, hi: 1.5, step: .05 },
    { k: 'hiringCap', lo: .4, hi: 1, step: .05 }, { k: 'qTarget', lo: .3, hi: .95, step: .05 },
    { k: 'pipeline', lo: 0, hi: 1, step: .05 }, { k: 'redirect', lo: 0, hi: .5, step: .05 },
    { k: 'replace', lo: 0, hi: .10, step: .005 }, { k: 'dx', lo: 0, hi: 1, step: .05 },
  ];
  const snap = (s, v) => +(clamp(Math.round(v / s.step) * s.step, s.lo, s.hi)).toFixed(4);
  function evaluate(L, tg) {
    const T = totals(simulate(L, null, false)), last = NY - 1, ty = tg.year - Y0;
    let peak = 0, cum = 0, reach = null;
    for (let t = 2; t < NY; t++) peak = Math.max(peak, T.shortPct[t]);
    for (let t = 1; t < NY; t++) { cum += T.W[t]; if (reach === null && T.q[t] >= tg.q) reach = Y0 + t; }
    const m = { qAt: T.q[ty], qEnd: T.q[last], cagr: Math.pow(T.W[last] / T.W[0], 1 / last) - 1, peak, cum, reach };
    const v = { q: Math.max(0, tg.q - m.qAt) / .05, cagr: Math.max(0, m.cagr - tg.cagr) / .01, peak: Math.max(0, m.peak - tg.short) / .02 };
    return { L, m, v, viol: v.q + v.cagr + v.peak, feasible: v.q + v.cagr + v.peak === 0 };
  }
  const distance = (a, b) => SPACE.reduce((s, sp) => s + Math.abs(a[sp.k] - b[sp.k]) / (sp.hi - sp.lo), 0) + (a.allowNQ !== b.allowNQ ? .5 : 0);

  /* Incremental search so the UI can show progress: call step(n) until done, then finish(). */
  function createSearch(cur, tg, total = 1400, seed = 4242) {
    const r = C.rng(seed), pts = [];
    const sample = () => { const L = Object.assign({}, cur); for (const s of SPACE) L[s.k] = snap(s, s.lo + r() * (s.hi - s.lo)); L.allowNQ = r() < .75; return L; };
    pts.push(evaluate(Object.assign({}, cur), tg));
    const perturb = (L, scale) => { const n = Object.assign({}, L); for (const s of SPACE) if (r() < .45) n[s.k] = snap(s, n[s.k] + (r() - .5) * 2 * scale * (s.hi - s.lo)); return n; };
    function refine(start, score, rounds) {            // stochastic hill-climb that never leaves the feasible set
      let best = start;
      for (let i = 0; i < rounds; i++) {
        const c = evaluate(perturb(best.L, i < rounds / 2 ? .18 : .08), tg); pts.push(c);
        if (c.feasible && score(c) < score(best)) best = c;
      }
      return best;
    }
    function shrink(p) {                                // pull a feasible point towards the current levers (least change)
      let best = p;
      for (const lam of [.15, .3, .45, .6, .75, .9]) {
        const L = Object.assign({}, p.L); for (const s of SPACE) L[s.k] = snap(s, cur[s.k] + lam * (p.L[s.k] - cur[s.k]));
        const c = evaluate(L, tg); pts.push(c);
        if (c.feasible) { best = c; break; }
      }
      for (const s of SPACE) {                           // then try resetting single levers back to their current value
        if (best.L[s.k] === cur[s.k]) continue;
        const L = Object.assign({}, best.L); L[s.k] = cur[s.k];
        const c = evaluate(L, tg); pts.push(c); if (c.feasible) best = c;
      }
      if (best.L.allowNQ !== cur.allowNQ) { const c = evaluate(Object.assign({}, best.L, { allowNQ: cur.allowNQ }), tg); pts.push(c); if (c.feasible) best = c; }
      return best;
    }
    const S = { pts, total, done: 0, cur, tg };
    S.step = n => { for (let i = 0; i < n && S.done < total; i++, S.done++) pts.push(evaluate(sample(), tg)); return S.done >= total; };
    S.finish = () => {
      const feas = pts.filter(p => p.feasible), out = { feasible: feas.length > 0, explored: 0, nFeasible: feas.length, bundles: [] };
      if (feas.length) {
        const dist = p => distance(p.L, cur), cost = p => p.m.cum, speed = p => (p.m.reach || 9999) * 1e3 + distance(p.L, cur);
        const top = (score, k) => feas.slice().sort((a, b) => score(a) - score(b)).slice(0, k);
        let least = top(dist, 4).map(shrink).sort((a, b) => dist(a) - dist(b))[0];
        let cheap = refine(top(cost, 1)[0], cost, 70);
        let fast = refine(top(speed, 1)[0], speed, 70);
        out.bundles.push({ kind: 'least', p: least });
        if (distance(cheap.L, least.L) > .12) out.bundles.push({ kind: 'cheap', p: cheap });
        if (out.bundles.every(b => distance(fast.L, b.p.L) > .12)) out.bundles.push({ kind: 'fast', p: fast });
      } else {
        let best = pts.slice().sort((a, b) => a.viol - b.viol)[0];
        for (let i = 0; i < 120; i++) { const c = evaluate(perturb(best.L, .12), tg); pts.push(c); if (c.viol < best.viol) best = c; }
        // Which constraint binds? Re-run the closest bundle with the graduate pipeline cap lifted.
        const free = evaluate(Object.assign({}, best.L, { pipeline: 4 }), tg);
        const worst = Object.keys(best.v).sort((a, b) => best.v[b] - best.v[a])[0];
        out.bundles.push({ kind: 'closest', p: best });
        out.binding = (best.v.q > 0 && free.v.q < best.v.q * .5) ? 'pipeline' : worst;
        out.freeQ = free.m.qAt;
      }
      out.explored = pts.length; out.nFeasible = pts.filter(p => p.feasible).length;
      return out;
    };
    return S;
  }

  return { A0, A1, NA, Y0, Y1, NY, NF, F, TOTAL, UPTAKE, LATE_EXIT, MAX_INTAKE, COST, ATTR, EARLY, DEFAULTS, WEIGHTS, SPACE, BASE,
    simulate, totals, pyramid, monteCarlo, bands, readiness, evaluate, createSearch, distance, clamp, idx };
})();
if (typeof module !== 'undefined') module.exports = UFE;
