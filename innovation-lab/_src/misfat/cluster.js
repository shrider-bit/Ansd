/* مِصفاة — spelling-variant clustering for categorical columns.
   Phase A (safe): identical after Arabic normalisation, or known cross-language synonyms.
   Phase B (needs confirmation): a rare value one typo away from a frequent one. */
MF.SYN = {
  nat: [['قطري', 'قطرية', 'qatari', 'qatar', 'qat', 'qa', 'مواطن', 'مواطنة'],
        ['غير قطري', 'غير قطرية', 'non-qatari', 'non qatari', 'nonqatari', 'non-q', 'nq', 'expat', 'expatriate', 'مقيم', 'وافد']],
  gender: [['ذكر', 'male', 'm', 'ذ', 'رجل', 'man'], ['أنثى', 'female', 'f', 'امرأة', 'woman']],
  status: [['نشط', 'active'], ['متقاعد', 'retired'], ['مستقيل', 'resigned'], ['منتهي الخدمة', 'terminated']],
  qual: [['بكالوريوس', 'bachelor', 'bachelors', 'bsc', 'ba'], ['ماجستير', 'master', 'masters', 'msc', 'ma'], ['دكتوراه', 'phd', 'doctorate'], ['دبلوم', 'diploma']],
};
MF.catTokens = v => CGB.normAr(MF.toWestern(MF.cleanSpaces(v))).replace(/[()\[\]{}.,،؛;:'"`\-_/\\|]+/g, ' ').split(/\s+/).filter(Boolean);
MF._keyCache = new Map();
MF.catKey = v => { let k = MF._keyCache.get(v); if (k === undefined) { k = MF.catTokens(v).join(''); if (MF._keyCache.size > 200000) MF._keyCache.clear(); MF._keyCache.set(v, k); } return k; };
MF.SYN_INDEX = (() => { const o = {}; for (const f in MF.SYN) { o[f] = {}; MF.SYN[f].forEach((g, i) => g.forEach(v => o[f][MF.catKey(v)] = 'syn#' + i)); } return o; })();

MF.ACTIVE = new Set(['نشط', 'فعال', 'على رأس العمل', 'مستمر', 'قائم بالعمل', 'يعمل', 'active', 'employed', 'working', 'إجازة طويلة', 'إجازة', 'on leave'].map(v => MF.catKey(v)));
MF.INACTIVE = new Set(['متقاعد', 'منتهي الخدمة', 'منتهية خدمته', 'مستقيل', 'مفصول', 'متوفى', 'موقوف', 'retired', 'terminated', 'resigned', 'inactive', 'deceased', 'separated'].map(v => MF.catKey(v)));

MF.pickCanonical = variants => variants.slice().sort((a, b) => b.count - a.count || (MF.hasArabic(b.value) - MF.hasArabic(a.value)) || a.value.localeCompare(b.value))[0].value;

// One differing token, long enough to be a word, not a feminine ة ending, within 1–2 edits.
MF.fuzzyTokens = (ta, tb) => {
  if (ta.length !== tb.length) return false;
  let diff = -1;
  for (let i = 0; i < ta.length; i++) if (ta[i] !== tb[i]) { if (diff !== -1) return false; diff = i; }
  if (diff === -1) return false;
  const a = ta[diff], b = tb[diff];
  if (a.length < 4 || b.length < 4 || /\d/.test(a + b)) return false;
  if (a + 'ه' === b || b + 'ه' === a) return false;                    // محاسب / محاسبة are both valid
  const max = Math.min(a.length, b.length) >= 8 ? 2 : 1;
  return MF.editDistance(a, b, max) <= max;
};

/* clusterColumn(rows, col, fieldId) -> [{ kind:'norm'|'syn'|'fuzzy', variants:[{value,count}], canonical }] */
MF.clusterColumn = (rows, col, fieldId) => {
  const counts = new Map();
  for (const r of rows) { const v = MF.cleanSpaces(r[col]); if (!v || MF.isPlaceholder(v)) continue; counts.set(v, (counts.get(v) || 0) + 1); }
  const syn = MF.SYN_INDEX[fieldId] || {};
  const groups = new Map();
  for (const [value, count] of counts) {
    const key = MF.catKey(value); const gid = syn[key] || key; if (!gid) continue;
    let g = groups.get(gid); if (!g) groups.set(gid, g = { gid, variants: [], total: 0, keys: new Set() });
    g.variants.push({ value, count }); g.total += count; g.keys.add(key);
  }
  const out = [];
  const list = [...groups.values()];
  for (const g of list) if (g.variants.length > 1) out.push({ kind: g.keys.size > 1 ? 'syn' : 'norm', variants: g.variants.slice().sort((a, b) => b.count - a.count), canonical: MF.pickCanonical(g.variants) });
  // Phase B — fuzzy, only when the number of distinct groups is manageable.
  if (list.length <= 3000) {
    for (const g of list) g.tokens = MF.catTokens(MF.pickCanonical(g.variants));
    const big = list.filter(g => g.total >= 5).sort((a, b) => b.total - a.total);
    const taken = new Set();
    const byHost = new Map();
    for (const s of list) {
      if (String(s.gid).startsWith('syn#')) continue;
      for (const b of big) {
        if (b === s || taken.has(b.gid)) continue;
        if (s.total > Math.max(2, b.total * 0.34)) continue;
        if (MF.fuzzyTokens(s.tokens, b.tokens)) { taken.add(s.gid); if (!byHost.has(b.gid)) byHost.set(b.gid, { host: b, minors: [] }); byHost.get(b.gid).minors.push(s); break; }
      }
    }
    for (const { host, minors } of byHost.values()) {
      const variants = [...host.variants, ...minors.flatMap(m => m.variants)].sort((a, b) => b.count - a.count);
      out.push({ kind: 'fuzzy', variants, canonical: MF.pickCanonical(host.variants) });
    }
  }
  return out;
};
