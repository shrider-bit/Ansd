/* مِصفاة — «أمان النشر»: statistical disclosure check for a cross-tab before it is published.
   A cell with fewer than k people can identify them; suppression and category merging are the two remedies. */
MF.AGE_BANDS = [[0, 24, 'أقل من 25'], [25, 34, '25–34'], [35, 44, '35–44'], [45, 54, '45–54'], [55, 59, '55–59'], [60, 200, '60 فأكثر']];
MF.EMPTY = '(فارغ)';

// Dimensions the user can group by: every column + bands derived from mapped fields.
MF.disclosureDims = (headers, map) => {
  const dims = headers.map((h, c) => ({ id: 'c' + c, label: h, get: (row) => MF.cleanSpaces(row[c]) || MF.EMPTY }));
  return dims;
};
MF.derivedDims = (map, settings) => {
  const out = [];
  if (map.dob != null) out.push({ id: 'ageband', label: 'الفئة العمرية (مشتقة)', get: row => { const p = MF.parseDate(row[map.dob]); if (!p.ok) return MF.EMPTY; const g = p.kind === 'hijri' ? MF.hijriToGreg(p.y, p.m, p.d) : p; if (!g) return MF.EMPTY; const a = MF.ageAt(g, settings.ref); const b = MF.AGE_BANDS.find(x => a >= x[0] && a <= x[1]); return b ? b[2] : MF.EMPTY; }, order: MF.AGE_BANDS.map(b => b[2]) });
  if (map.grade != null) out.push({ id: 'gradeband', label: 'فئة الدرجة (مشتقة)', get: row => { const g = MF.parseGrade(row[map.grade]); if (!g.ok) return MF.EMPTY; const b = CGB.GRADE_BANDS.find(x => g.n >= x.lo && g.n <= x.hi); return b ? `${b.ar} (${b.lo}–${b.hi})` : 'خارج السلّم'; }, order: CGB.GRADE_BANDS.map(b => `${b.ar} (${b.lo}–${b.hi})`) });
  return out;
};

/* crossTab(rows, dims[1..3], merge?) -> { rowKeys, colKeys, counts, rowTot, colTot, total, rowLabel, colLabel }
   1 dim: one count column. 2 dims: A × B. 3 dims: (A · C) × B.   merge = { dimIndex, set:Set(values) } folds values into «أخرى». */
MF.crossTab = (rows, dims, merge) => {
  const val = (d, i, row) => { const v = d.get(row); return (merge && merge.dimIndex === i && merge.set.has(v)) ? 'أخرى (مدمجة)' : v; };
  const rk = new Map(), ck = new Map(), cells = new Map();
  for (const row of rows) {
    const a = val(dims[0], 0, row), b = dims[1] ? val(dims[1], 1, row) : 'العدد', c = dims[2] ? val(dims[2], 2, row) : null;
    const r = c == null ? a : a + ' · ' + c;
    rk.set(r, (rk.get(r) || 0) + 1); ck.set(b, (ck.get(b) || 0) + 1);
    const k = r + '\u0001' + b; cells.set(k, (cells.get(k) || 0) + 1);
  }
  const sortKeys = (m, d) => { const keys = [...m.keys()]; const ord = d && d.order;
    return keys.sort((x, y) => { if (x === 'أخرى (مدمجة)') return 1; if (y === 'أخرى (مدمجة)') return -1; if (ord) { const ix = ord.indexOf(x), iy = ord.indexOf(y); if (ix !== iy) return (ix < 0 ? 99 : ix) - (iy < 0 ? 99 : iy); } return m.get(y) - m.get(x) || x.localeCompare(y, 'ar'); }); };
  const rowKeys = sortKeys(rk, dims[2] ? null : dims[0]), colKeys = dims[1] ? sortKeys(ck, dims[1]) : ['العدد'];
  const counts = rowKeys.map(r => colKeys.map(b => cells.get(r + '\u0001' + b) || 0));
  return { rowKeys, colKeys, counts, rowTot: rowKeys.map(r => rk.get(r)), colTot: colKeys.map(b => ck.get(b)), total: rows.length,
    rowLabel: dims[2] ? `${dims[0].label} · ${dims[2].label}` : dims[0].label, colLabel: dims[1] ? dims[1].label : '', oneD: !dims[1] };
};

// assess(tab, k) -> { unsafe: cells with 0<n<k, people: people in those cells }
MF.assess = (tab, k) => { let unsafe = 0, people = 0, cells = 0;
  for (const row of tab.counts) for (const n of row) { if (n > 0) cells++; if (n > 0 && n < k) { unsafe++; people += n; } }
  return { unsafe, people, cells }; };

/* suppress(tab, k, complementary) -> mask[r][c]: 0 shown, 1 primary (n<k), 2 complementary; rowSup[], colSup[] for totals.
   Complementary step (heuristic): a lone hidden cell in a row/column equals total − the rest, so hide one more
   (the smallest remaining) until no row or column has exactly one hidden cell. */
MF.suppress = (tab, k, complementary) => {
  const R = tab.rowKeys.length, C = tab.colKeys.length;
  const mask = tab.counts.map(row => row.map(n => (n > 0 && n < k) ? 1 : 0));
  const rowSup = new Array(R).fill(false), colSup = new Array(C).fill(false);
  if (complementary) {
    let changed = true, guard = 0;
    while (changed && guard++ < 200) {
      changed = false;
      const colHidden = c => { let n = 0; for (let r = 0; r < R; r++) if (mask[r][c]) n++; return n; };
      const rowHidden = r => mask[r].reduce((a, m) => a + (m ? 1 : 0), 0);
      if (!tab.oneD) for (let r = 0; r < R; r++) {
        if (rowHidden(r) !== 1 || rowSup[r]) continue;
        let best = -1; for (let c = 0; c < C; c++) { if (mask[r][c] || tab.counts[r][c] === 0) continue;
          if (best < 0 || colHidden(c) > colHidden(best) || (colHidden(c) === colHidden(best) && tab.counts[r][c] < tab.counts[r][best])) best = c; }
        if (best >= 0) mask[r][best] = 2; else rowSup[r] = true; changed = true;
      }
      for (let c = 0; c < C; c++) {
        if (colHidden(c) !== 1 || colSup[c]) continue;
        let best = -1; for (let r = 0; r < R; r++) { if (mask[r][c] || tab.counts[r][c] === 0) continue;
          if (best < 0 || rowHidden(r) > rowHidden(best) || (rowHidden(r) === rowHidden(best) && tab.counts[r][c] < tab.counts[best][c])) best = r; }
        if (best >= 0) mask[best][c] = 2; else colSup[c] = true; changed = true;
      }
    }
  }
  let primary = 0, comp = 0; for (const row of mask) for (const m of row) { if (m === 1) primary++; else if (m === 2) comp++; }
  return { mask, rowSup, colSup, primary, comp };
};

/* bestMerge(rows, dims, dimIndex, k): fold the m smallest categories of one dimension into «أخرى»,
   choosing the smallest m that leaves no cell under k (or, failing that, the fewest people at risk). */
MF.bestMerge = (rows, dims, dimIndex, k) => {
  const tot = new Map(); for (const row of rows) { const v = dims[dimIndex].get(row); tot.set(v, (tot.get(v) || 0) + 1); }
  const cats = [...tot.entries()].sort((a, b) => a[1] - b[1]).map(e => e[0]);
  const base = MF.assess(MF.crossTab(rows, dims), k);
  let best = { m: 0, set: new Set(), people: base.people, unsafe: base.unsafe };
  const maxM = cats.length - 1, step = Math.max(1, Math.ceil(maxM / 60));
  for (let m = 2; m <= maxM; m += step) {
    const set = new Set(cats.slice(0, m)); const a = MF.assess(MF.crossTab(rows, dims, { dimIndex, set }), k);
    if (a.people < best.people) best = { m, set, people: a.people, unsafe: a.unsafe };
    if (a.unsafe === 0) break;
  }
  return best;
};

MF.safeTable = (tab, sup, k) => {
  const mark = `<${k}`;
  const headers = [tab.rowLabel, ...tab.colKeys, ...(tab.oneD ? [] : ['المجموع'])];
  const rows = tab.rowKeys.map((rk, r) => [rk, ...tab.counts[r].map((n, c) => sup && sup.mask[r][c] ? mark : String(n)), ...(tab.oneD ? [] : [sup && sup.rowSup[r] ? mark : String(tab.rowTot[r])])]);
  rows.push(['المجموع', ...tab.colTot.map((n, c) => (tab.oneD ? String(tab.total) : (sup && sup.colSup[c] ? mark : String(n)))), ...(tab.oneD ? [] : [String(tab.total)])]);
  return { headers, rows };
};
