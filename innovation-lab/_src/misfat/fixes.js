/* مِصفاة — treatments. Every treatment is a pure operation; the current data is always
   original + the list of applied operations replayed in order, so undoing any one of them is exact. */
MF.opChanges = (rows, op) => {
  const out = []; const N = rows.length;
  const each = (cols, fn) => { for (let i = 0; i < N; i++) for (const c of cols) { const v = rows[i][c]; if (v == null || v === '') continue; const nv = fn(v); if (nv != null && nv !== v) out.push({ r: i, c, before: v, after: nv }); } };
  switch (op.kind) {
    case 'trim': each(op.cols, v => MF.cleanSpaces(v)); break;
    case 'digits': each(op.cols, v => MF.hasEasternDigits(v) ? MF.toWestern(v) : null); break;
    case 'placeholder': each(op.cols, v => MF.isPlaceholder(v) ? '' : null); break;
    case 'dates': each([op.col], v => { if (MF.isMissing(v)) return null; const p = MF.parseDate(v, op.order);
      if (!p.ok || p.kind === 'serial' || p.kind === 'hijri') return null; const t = MF.fmtDate(p, op.fmt); return t === MF.toWestern(MF.cleanSpaces(v)) ? null : t; }); break;
    case 'serial': each([op.col], v => { const p = MF.parseDate(v); return p.ok && p.kind === 'serial' ? MF.fmtDate(p, op.fmt) : null; }); break;
    case 'hijri': each([op.col], v => { const p = MF.parseDate(v); if (!p.ok || p.kind !== 'hijri') return null; const g = MF.hijriToGreg(p.y, p.m, p.d); return g ? MF.fmtDate(g, op.fmt) : null; }); break;
    case 'number': each([op.col], v => { if (MF.isMissing(v)) return null; const p = MF.parseNumber(v); return p.ok && p.canon !== MF.cleanSpaces(v) ? p.canon : null; }); break;
    case 'grade': each([op.col], v => { if (MF.isMissing(v)) return null; const p = MF.parseGrade(v); return p.ok && p.canon !== MF.cleanSpaces(v) ? p.canon : null; }); break;
    case 'canon': each([op.col], v => { const k = MF.cleanSpaces(v); const t = op.map[k]; return (t != null && t !== k) ? t : null; }); break;
  }
  return out;
};
MF.applyChanges = (rows, changes) => { for (const ch of changes) rows[ch.r][ch.c] = ch.after; };

// replay(original, ops) -> { rows, log:[{op, label, r, c, before, after}], counts:{opId:n} }
MF.replay = (original, ops) => {
  const rows = original.map(r => r.slice()); const log = [], counts = {};
  for (const op of ops) { const ch = MF.opChanges(rows, op); MF.applyChanges(rows, ch); counts[op.id] = ch.length;
    for (const x of ch) log.push({ op: op.id, label: op.label, r: x.r, c: x.c, before: x.before, after: x.after }); }
  return { rows, log, counts };
};

// Distinct treatments offered by the current diagnosis (several issues may share one treatment).
MF.treatments = issues => {
  const seen = new Map();
  for (const is of issues) { if (!is.fix) continue; let t = seen.get(is.fix.key); if (!t) seen.set(is.fix.key, t = { fix: is.fix, issues: [], cells: 0 }); t.issues.push(is); t.cells += is.cells.length; }
  return [...seen.values()];
};

/* ---------- log / issue exports ---------- */
MF.issuesTable = (issues, headers, rows, idCol) => {
  const h = ['رقم الصف', 'رقم الموظف', 'البُعد', 'الخطورة', 'القاعدة', 'الملاحظة', 'العمود', 'القيمة', 'المعالجة'];
  const out = [];
  for (const is of issues) for (const [r, c] of is.cells)
    out.push([String(r + 2), idCol != null ? rows[r][idCol] : '', MF.DIMS.find(d => d.id === is.dim).ar, MF.SEV[is.sev], is.rule, is.title, headers[c], rows[r][c], is.fix ? (is.fix.safe ? 'معالجة آمنة متاحة' : 'معالجة تحتاج تأكيداً') : 'مراجعة بشرية']);
  return { headers: h, rows: out };
};
MF.logTable = (log, headers, rows, idCol) => ({
  headers: ['رقم الصف', 'رقم الموظف', 'العمود', 'قبل', 'بعد', 'المعالجة'],
  rows: log.map(l => [String(l.r + 2), idCol != null ? rows[l.r][idCol] : '', headers[l.c], l.before, l.after, l.label]),
});
