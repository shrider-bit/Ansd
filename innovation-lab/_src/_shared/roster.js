/* Shared SYNTHETIC reference data + helpers for all Innovation Lab prototypes.
   Everything here is invented for demonstration. Entity names are deliberately
   neutral ("جهة الصحة (أ)") so nothing can be mistaken for a real government body. */
const CGB = (() => {
  // Deterministic PRNG (mulberry32) so every demo run shows the same numbers.
  function rng(seed) {
    let a = seed >>> 0;
    const r = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    r.int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
    r.pick = arr => arr[Math.floor(r() * arr.length)];
    r.normal = (mu = 0, sd = 1) => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r();
      return mu + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    return r;
  }
  const SECTORS = [
    { id: 'health', ar: 'الصحة' }, { id: 'edu', ar: 'التعليم' },
    { id: 'econ', ar: 'الاقتصاد والمالية' }, { id: 'infra', ar: 'البنية التحتية' },
    { id: 'muni', ar: 'الخدمات البلدية' }, { id: 'social', ar: 'الشؤون الاجتماعية' },
    { id: 'energy', ar: 'الطاقة والبيئة' }, { id: 'gov', ar: 'الإدارة الحكومية' },
  ];
  const SIZES = { health: [16800, 9400, 2100], edu: [18900, 3300, 1250], econ: [2450, 1380, 760],
    infra: [5900, 3150, 1420], muni: [6700, 2250, 980], social: [2900, 1150, 640],
    energy: [2050, 890, 560], gov: [1950, 1100, 430] };
  const LETTERS = ['أ', 'ب', 'ج'];
  const ENTITIES = [];
  SECTORS.forEach(s => SIZES[s.id].forEach((n, i) => ENTITIES.push({
    id: 'E' + String(ENTITIES.length + 1).padStart(2, '0'), sector: s.id, sectorAr: s.ar,
    ar: `جهة ${s.ar} (${LETTERS[i]})`, short: `${s.ar} ${LETTERS[i]}`, headcount: n })));
  // 12 job families (المجموعات الوظيفية). qShare = synthetic share of Qatari staff.
  const FAMILIES = [
    { id: 'admin', ar: 'الإدارية والمكتبية', qShare: .78 }, { id: 'fin', ar: 'المالية والمحاسبية', qShare: .58 },
    { id: 'legal', ar: 'القانونية', qShare: .70 }, { id: 'eng', ar: 'الهندسية', qShare: .31 },
    { id: 'it', ar: 'تقنية المعلومات والبيانات', qShare: .34 }, { id: 'health', ar: 'الصحية والطبية', qShare: .22 },
    { id: 'edu', ar: 'التعليمية والتربوية', qShare: .46 }, { id: 'hr', ar: 'الموارد البشرية', qShare: .81 },
    { id: 'plan', ar: 'التخطيط والإحصاء', qShare: .49 }, { id: 'cs', ar: 'خدمة المتعاملين', qShare: .74 },
    { id: 'tech', ar: 'الفنية والحرفية', qShare: .18 }, { id: 'audit', ar: 'الرقابة والتدقيق', qShare: .62 },
  ];
  // Grade bands follow the convention used in the department's own reference notes.
  const GRADE_BANDS = [
    { id: 'entry', ar: 'مساعد', lo: 1, hi: 3 }, { id: 'spec', ar: 'أخصائي', lo: 4, hi: 6 },
    { id: 'senior', ar: 'أخصائي أول / مشرف', lo: 7, hi: 9 }, { id: 'mgr', ar: 'مدير', lo: 10, hi: 12 },
    { id: 'dir', ar: 'مدير عام', lo: 13, hi: 15 }, { id: 'exec', ar: 'قيادي', lo: 16, hi: 18 },
  ];
  const RULES = { retirementAge: 60, earlyRetirementService: 25, qatarizationBenchmark: .60, baseYear: 2026 };
  // ---- formatting helpers (Western digits everywhere for consistency) ----
  const num = (v, d = 0) => (v == null || isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const pct = (v, d = 0) => (v == null || isNaN(v)) ? '—' : (v * 100).toFixed(d) + '%';
  const signed = (v, d = 0) => (v > 0 ? '+' : v < 0 ? '−' : '') + num(Math.abs(v), d);
  // Compact riyal amounts: 1,250,000 -> "1.25 مليون ر.ق"
  const qar = v => { const a = Math.abs(v), s = v < 0 ? '−' : '';
    if (a >= 1e9) return s + (a / 1e9).toFixed(2) + ' مليار ر.ق';
    if (a >= 1e6) return s + (a / 1e6).toFixed(a >= 1e8 ? 0 : 1) + ' مليون ر.ق';
    if (a >= 1e3) return s + num(Math.round(a / 1e3)) + ' ألف ر.ق'; return s + num(a) + ' ر.ق'; };
  const pad2 = n => String(n).padStart(2, '0');
  const gdate = (d = new Date()) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
  // Hijri (Umm al-Qura) date as DD/MM/YYYYهـ; falls back to '' if the browser lacks the calendar.
  const hijri = (d = new Date()) => { try {
      const p = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(d);
      const g = t => p.find(x => x.type === t).value; return `${g('day')}/${g('month')}/${g('year')}هـ`; } catch (e) { return ''; } };
  const bothDates = (d = new Date()) => { const h = hijri(d); return gdate(d) + 'م' + (h ? ' — ' + h : ''); };
  // Arabic text normalisation for matching (strip diacritics/tatweel, unify alef/ya/ta-marbuta).
  const normAr = s => String(s || '').replace(/[ً-ْٰـ]/g, '').replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/\s+/g, ' ').trim().toLowerCase();
  const byId = (arr, id) => arr.find(x => x.id === id);
  return { rng, SECTORS, ENTITIES, FAMILIES, GRADE_BANDS, RULES, num, pct, signed, qar, gdate, hijri, bothDates, normAr, byId };
})();
if (typeof module !== 'undefined') module.exports = CGB;
