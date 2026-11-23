/* جسور — SYNTHETIC data model. Everything below is generated deterministically
   from a seed; no figure describes a real entity or a real person. */
const JData = (() => {
  const R = CGB.rng(20261123);
  const F = CGB.FAMILIES, E = CGB.ENTITIES, NF = F.length, NE = E.length;
  const fi = id => F.findIndex(f => f.id === id);

  const FSHORT = { admin: 'إدارية', fin: 'مالية', legal: 'قانونية', eng: 'هندسية', it: 'تقنية', health: 'صحية',
    edu: 'تعليمية', hr: 'موارد بشرية', plan: 'تخطيط', cs: 'متعاملون', tech: 'فنية', audit: 'رقابة' };
  const FCOLOR = { admin: '#4F6F86', fin: '#B8862B', legal: '#7D5BA6', eng: '#D4583B', it: '#1B8FB0', health: '#2F9E74',
    edu: '#E08E45', hr: '#C2487F', plan: '#3F5FB5', cs: '#6BA539', tech: '#8C6D4F', audit: '#5B5F86' };

  // ---- skills taxonomy: 50 skills in 12 domains ----
  const DOMAINS = [
    ['mgmt', 'الإدارة والتنظيم', ['إدارة المشاريع', 'التخطيط التشغيلي', 'إعداد التقارير', 'إدارة اللجان والاجتماعات', 'المراسلات والأرشفة', 'تبسيط الإجراءات']],
    ['fin', 'المالية', ['المحاسبة الحكومية', 'إعداد الموازنات', 'التحليل المالي', 'المشتريات والعقود', 'الرواتب والمستحقات']],
    ['legal', 'القانون', ['الصياغة القانونية', 'مراجعة العقود', 'التحقيقات الإدارية', 'الامتثال التنظيمي']],
    ['eng', 'الهندسة', ['إدارة المشاريع الهندسية', 'مراجعة المخططات', 'حصر الكميات', 'السلامة المهنية', 'إدارة الأصول والصيانة']],
    ['it', 'التقنية والبيانات', ['تحليل البيانات', 'قواعد البيانات', 'الأمن السيبراني', 'تطوير الأنظمة', 'الدعم الفني', 'لوحات المؤشرات']],
    ['health', 'الصحة', ['التمريض السريري', 'الإدارة الصحية', 'الصحة العامة', 'السجلات الطبية']],
    ['edu', 'التعليم', ['التدريس', 'تصميم المناهج', 'الإرشاد الأكاديمي', 'التقويم التربوي']],
    ['hr', 'الموارد البشرية', ['الاستقطاب والتعيين', 'تخطيط القوى العاملة', 'التدريب والتطوير', 'إدارة الأداء']],
    ['plan', 'التخطيط والإحصاء', ['التحليل الإحصائي', 'قياس المؤشرات', 'إعداد الدراسات']],
    ['cs', 'خدمة المتعاملين', ['خدمة المتعاملين', 'معالجة الشكاوى', 'مراكز الاتصال']],
    ['tech', 'الأعمال الفنية', ['الصيانة الكهربائية', 'تشغيل المعدات', 'الفحص الفني']],
    ['audit', 'الرقابة والتدقيق', ['التدقيق الداخلي', 'إدارة المخاطر', 'الرقابة المالية']],
  ];
  const SKILLS = [];
  DOMAINS.forEach(([id, ar, list]) => list.forEach(name => SKILLS.push({ i: SKILLS.length, ar: name, domain: id, domainAr: ar })));
  const NS = SKILLS.length;

  // core / secondary skill pools per family (indices into SKILLS)
  const POOL = {
    admin: { core: [4, 3, 2, 5, 1], sec: [0, 41, 10, 37] }, fin: { core: [6, 7, 8, 9, 10], sec: [2, 49, 39] },
    legal: { core: [11, 12, 13, 14], sec: [2, 9, 48, 3] }, eng: { core: [15, 16, 17, 18, 19], sec: [0, 9, 46] },
    it: { core: [20, 21, 22, 23, 24, 25], sec: [0, 5, 38] }, health: { core: [26, 27, 28, 29], sec: [2, 41, 18] },
    edu: { core: [30, 31, 32, 33], sec: [36, 2, 39] }, hr: { core: [34, 35, 36, 37], sec: [2, 10, 38, 5] },
    plan: { core: [38, 39, 40, 35], sec: [20, 25, 2, 1, 7] }, cs: { core: [41, 42, 43], sec: [4, 5, 2, 24] },
    tech: { core: [44, 45, 46, 19], sec: [18, 24] }, audit: { core: [47, 48, 49, 14], sec: [8, 6, 2, 13] },
  };

  // ---- family adjacency (how transferable a career is between two families) ----
  const ADJ = Array.from({ length: NF }, (_, a) => Array.from({ length: NF }, (_, b) => (a === b ? 1 : 0)));
  [['admin', 'cs', .7], ['admin', 'hr', .7], ['admin', 'plan', .5], ['admin', 'fin', .4], ['admin', 'legal', .3],
   ['fin', 'audit', .8], ['fin', 'plan', .5], ['legal', 'audit', .6], ['eng', 'tech', .7], ['eng', 'it', .4],
   ['it', 'plan', .7], ['it', 'tech', .4], ['hr', 'plan', .6], ['hr', 'cs', .4], ['hr', 'edu', .4],
   ['plan', 'audit', .5], ['health', 'cs', .3], ['edu', 'cs', .3], ['it', 'cs', .3], ['admin', 'audit', .3],
  ].forEach(([a, b, v]) => { ADJ[fi(a)][fi(b)] = v; ADJ[fi(b)][fi(a)] = v; });

  // ---- entity × family table ----
  const BASE = { admin: 14, fin: 5, legal: 2, eng: 3, it: 4, health: .5, edu: .5, hr: 3.5, plan: 2.5, cs: 6, tech: 5, audit: 2 };
  const BOOST = {
    health: { health: 70, tech: 6, cs: 8 }, edu: { edu: 75, cs: 4 }, econ: { fin: 30, audit: 10, plan: 8, legal: 5, it: 6 },
    infra: { eng: 38, tech: 22, it: 5 }, muni: { tech: 22, eng: 14, cs: 16, admin: 8 },
    social: { cs: 20, admin: 10, edu: 6, health: 5, hr: 3 }, energy: { eng: 26, tech: 18, plan: 5, audit: 4 },
    gov: { hr: 14, plan: 12, it: 10, legal: 6, audit: 6, admin: 8 },
  };
  // mean tilt of the staffing balance (positive = tends to surplus)
  const TILT = { admin: 1.15, fin: .35, legal: -.1, eng: -.75, it: -1.1, health: -.6, edu: -.2, hr: .7, plan: -.8, cs: .95, tech: .2, audit: -.7 };
  const cells = [];              // {e,f,filled,approved,need,bal,pool,open}
  const cellAt = (e, f) => cells[e * NF + f];
  E.forEach((ent, e) => {
    const w = F.map(f => (BASE[f.id] + ((BOOST[ent.sector] || {})[f.id] || 0)) * (0.85 + R() * 0.3));
    const tot = w.reduce((a, b) => a + b, 0);
    F.forEach((f, k) => {
      const filled = Math.max(0, Math.round(ent.headcount * w[k] / tot));
      let bal = 0;
      if (filled >= 8) bal = Math.round(R.normal(TILT[f.id], 1.0) * 0.62 * Math.sqrt(filled));
      bal = Math.max(-Math.round(filled * .35), Math.min(Math.round(filled * .3), bal));
      const need = filled - bal;
      const approved = Math.max(filled, need) + Math.round(Math.abs(R.normal(0, 1)) * Math.sqrt(filled) * .25);
      cells.push({ e, f: k, filled, approved, need, bal, pool: 0, open: 0 });
    });
  });

  // spread N items over cells in proportion to weight^0.8 (largest remainder, capped by the cell's own balance)
  function allocate(target, sel, key) {
    const list = cells.filter(sel).map(c => ({ c, w: Math.pow(Math.abs(c.bal), .8), cap: Math.abs(c.bal) }));
    const sw = list.reduce((a, x) => a + x.w, 0);
    let given = 0;
    list.forEach(x => { x.raw = target * x.w / sw; x.n = Math.min(x.cap, Math.floor(x.raw)); given += x.n; });
    list.sort((a, b) => (b.raw - b.n) - (a.raw - a.n));
    for (let i = 0; given < target && i < list.length * 3; i++) { const x = list[i % list.length]; if (x.n < x.cap) { x.n++; given++; } }
    list.forEach(x => { x.c[key] = x.n; });
  }
  allocate(420, c => c.bal > 0, 'pool');
  allocate(310, c => c.bal < 0, 'open');

  // ---- people (movable talent pool) & open needs ----
  const pickW = w => { let r = R() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; } return w.length - 1; };
  const shuffled = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const EXPECT = [1, 4, 8, 12, 16, 20];       // typical years of experience per grade band
  const WILL = [{ ar: 'متحفّظ', v: .35 }, { ar: 'منفتح', v: .7 }, { ar: 'راغب', v: 1 }];
  const CRIT = [{ ar: 'اعتيادي', v: .3 }, { ar: 'مرتفع', v: .65 }, { ar: 'حرج', v: 1 }];
  const UNITS = {
    admin: ['إدارة الشؤون الإدارية', 'قسم الخدمات المساندة', 'مكتب التنسيق والمتابعة', 'قسم المراسلات والوثائق'],
    fin: ['إدارة الشؤون المالية', 'قسم الموازنة', 'قسم الحسابات', 'قسم المشتريات'],
    legal: ['إدارة الشؤون القانونية', 'قسم العقود', 'قسم الفتوى والتشريع'],
    eng: ['إدارة المشاريع', 'قسم التصميم والمراجعة', 'قسم الصيانة والأصول'],
    it: ['إدارة نظم المعلومات', 'قسم البيانات والتحليلات', 'قسم أمن المعلومات', 'قسم التطبيقات'],
    health: ['إدارة الخدمات الصحية', 'قسم التمريض', 'قسم الصحة العامة'],
    edu: ['إدارة الشؤون التعليمية', 'قسم المناهج', 'قسم الإرشاد والتوجيه'],
    hr: ['إدارة الموارد البشرية', 'قسم التخطيط والاستقطاب', 'قسم التدريب والتطوير'],
    plan: ['إدارة التخطيط والجودة', 'قسم الإحصاء', 'قسم قياس الأداء'],
    cs: ['مركز خدمة المتعاملين', 'قسم الشكاوى والمقترحات', 'مركز الاتصال'],
    tech: ['قسم الصيانة الفنية', 'قسم التشغيل', 'قسم الفحص والمعاينة'],
    audit: ['إدارة التدقيق الداخلي', 'قسم المخاطر', 'قسم الرقابة المالية'],
  };

  const people = [], needs = [];
  const codeNums = shuffled(Array.from({ length: 900 }, (_, i) => i + 100));
  cells.forEach(c => {
    const fam = F[c.f], pool = POOL[fam.id];
    for (let k = 0; k < c.pool; k++) {
      const band = pickW([.26, .40, .24, .09, .01]);
      const gb = CGB.GRADE_BANDS[band];
      const sk = new Uint8Array(NS);
      shuffled(pool.core).slice(0, Math.min(pool.core.length, R.int(3, 4))).forEach(s => { sk[s] = [2, 3, 3, 2, 1][R.int(0, 4)]; });
      shuffled(pool.sec).slice(0, R.int(1, 2)).forEach(s => { sk[s] = [1, 2, 2][R.int(0, 2)]; });
      const adjF = ADJ[c.f].map((v, j) => (j === c.f ? 0 : v));
      if (adjF.some(v => v > 0)) {
        const g = pickW(adjF);
        shuffled(POOL[F[g].id].core).slice(0, R.int(1, 2)).forEach(s => { if (!sk[s]) sk[s] = [1, 1, 2][R.int(0, 2)]; });
      }
      let count = sk.reduce((a, v) => a + (v ? 1 : 0), 0);
      const extra = shuffled(DOMAINS[0][2].map((_, i) => i));
      while (count < 5 && extra.length) { const s = extra.pop(); if (!sk[s]) { sk[s] = R.int(1, 2); count++; } }
      people.push({ i: people.length, code: 'ك-' + String(codeNums.pop()).padStart(4, '0'), e: c.e, f: c.f, band,
        grade: R.int(gb.lo, gb.hi), q: R() < fam.qShare, yrs: Math.max(0, Math.round(R.normal(EXPECT[band] + 1.5, 2.6))),
        sk, will: pickW([.17, .38, .45]) });
    }
    for (let k = 0; k < c.open; k++) {
      const lo = pickW([.18, .42, .28, .11, .01]);
      const hi = Math.min(5, lo + (R() < .35 ? 1 : 0));
      const core = shuffled(pool.core);
      const must = core.slice(0, 2);
      const nice = shuffled(core.slice(2).concat(pool.sec)).slice(0, R.int(1, 2));
      const hot = TILT[fam.id] < -.5;
      const r = R();
      const crit = r < (hot ? .27 : .11) ? 2 : r < (hot ? .66 : .46) ? 1 : 0;
      const d = R();
      const dur = d < .6 ? 'perm' : d < .85 ? 'temp' : 'proj';
      const months = dur === 'temp' ? R.int(6, 12) : dur === 'proj' ? R.int(18, 36) : 0;
      needs.push({ i: needs.length, code: 'ح-' + String(codeNums.pop()).padStart(4, '0'), e: c.e, f: c.f,
        unit: R.pick(UNITS[fam.id]), lo, hi, must, nice, crit, dur, months });
    }
  });
  // needs arrive in a mixed order (the "first-come" queue used by the greedy baseline)
  const queue = shuffled(needs.map(n => n.i));
  queue.forEach((ni, pos) => { needs[ni].arrival = pos + 1; });

  // ---- quick family-level estimate of what can be covered internally (before any optimisation) ----
  function addressable() {
    const sur = Array(NF).fill(0), sh = Array(NF).fill(0);
    cells.forEach(c => { if (c.bal > 0) sur[c.f] += c.bal; else sh[c.f] += -c.bal; });
    const left = sur.slice(), cover = Array(NF).fill(0);
    const order = sh.map((v, f) => f).sort((a, b) => sh[b] - sh[a]);
    order.forEach(f => { const t = Math.min(sh[f], left[f]); cover[f] += t; left[f] -= t; });
    order.forEach(f => {
      ADJ[f].map((v, g) => [g, v]).filter(([g, v]) => g !== f && v >= .5).sort((a, b) => b[1] - a[1]).forEach(([g, v]) => {
        const t = Math.min(sh[f] - cover[f], Math.floor(left[g] * v * .5)); if (t > 0) { cover[f] += t; left[g] -= t; }
      });
    });
    return { sur, sh, cover };
  }
  const totals = {
    surplus: cells.reduce((a, c) => a + Math.max(0, c.bal), 0), shortage: cells.reduce((a, c) => a + Math.max(0, -c.bal), 0),
    headcount: cells.reduce((a, c) => a + c.filled, 0),
  };
  return { F, E, NF, NE, NS, FSHORT, FCOLOR, DOMAINS, SKILLS, POOL, ADJ, TILT, cells, cellAt, people, needs, EXPECT, WILL, CRIT, addressable, totals };
})();
if (typeof module !== 'undefined') module.exports = JData;
