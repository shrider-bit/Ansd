/* مِصفاة — value parsers: dates (Gregorian in several shapes, Excel serials, Hijri-looking), numbers, grades. */
MF.MONTHS = (() => {
  const m = {};
  ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].forEach((k, i) => m[k] = i + 1);
  ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].forEach((k, i) => m[k] = i + 1);
  ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'].forEach((k, i) => m[CGB.normAr(k)] = i + 1);
  m[CGB.normAr('ابريل')] = 4; m[CGB.normAr('اغسطس')] = 8; m[CGB.normAr('اكتوبر')] = 10; m.sept = 9;
  return m;
})();
MF.validYMD = (y, m, d) => { if (m < 1 || m > 12 || d < 1) return false; const dim = new Date(Date.UTC(y, m, 0)).getUTCDate(); return d <= dim; };
MF.pad2 = n => String(n).padStart(2, '0');
MF.fmtDate = (p, fmt) => fmt === 'ymd' ? `${p.y}-${MF.pad2(p.m)}-${MF.pad2(p.d)}` : `${MF.pad2(p.d)}/${MF.pad2(p.m)}/${p.y}`;
MF.ymdNum = p => p.y * 10000 + p.m * 100 + p.d;

/* parseDate(raw, order) -> { ok, y, m, d, kind, amb } | { ok:false, reason }
   kind: dmy | mdy | ymd | text | serial | hijri.  `order` ('dmy' default) resolves ambiguous a/b/yyyy. */
MF.parseDate = (raw, order = 'dmy') => {
  let s = MF.toWestern(MF.cleanSpaces(raw));
  if (!s) return { ok: false, reason: 'empty' };
  s = s.replace(/[T ]\d{1,2}:\d{2}(:\d{2})?(\.\d+)?\s*(am|pm|ص|م|z)?$/i, '').trim();        // drop a time part
  let m;
  if (/^\d{4,5}(\.\d+)?$/.test(s)) {                                                           // Excel serial day number
    const n = Math.floor(parseFloat(s));
    if (n >= 10000 && n <= 60000) { const d = new Date(Date.UTC(1899, 11, 30) + n * 864e5);
      return { ok: true, y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), kind: 'serial' }; }
    return { ok: false, reason: 'شكل غير مكتمل' };
  }
  const mk = (y, mo, d, kind, amb) => {
    if (y >= 1300 && y <= 1500) return (mo >= 1 && mo <= 12 && d >= 1 && d <= 30) ? { ok: true, y, m: mo, d, kind: 'hijri' } : { ok: false, reason: 'تاريخ غير موجود' };
    if (y < 1900 || y > 2100) return { ok: false, reason: 'سنة خارج النطاق' };
    if (!MF.validYMD(y, mo, d)) return { ok: false, reason: 'تاريخ غير موجود في التقويم' };
    return { ok: true, y, m: mo, d, kind, amb: !!amb };
  };
  if ((m = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/))) return mk(+m[1], +m[2], +m[3], 'ymd');
  if ((m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/))) {
    const a = +m[1], b = +m[2], y = +m[3];
    if (y >= 1300 && y <= 1500) return mk(y, b, a, 'hijri');
    if (a > 12 && b <= 12) return mk(y, b, a, 'dmy');
    if (b > 12 && a <= 12) return mk(y, a, b, 'mdy');
    return order === 'mdy' ? mk(y, a, b, 'mdy', a !== b) : mk(y, b, a, 'dmy', a !== b);
  }
  if ((m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2})$/))) return { ok: false, reason: 'السنة من رقمين' };
  if ((m = s.match(/^(\d{1,2})[\s\-\/,]+([^\d\s\-\/,]+)[\s\-\/,]+(\d{4})$/))) {                 // 5 يناير 1990 / 12-Jan-2020
    const mo = MF.MONTHS[CGB.normAr(m[2]).replace(/\.$/, '')]; if (mo) return mk(+m[3], mo, +m[1], 'text');
  }
  if ((m = s.match(/^([^\d\s\-\/,]+)[\s\-\/,]+(\d{1,2})[\s,]+(\d{4})$/))) {                    // Jan 12, 2020
    const mo = MF.MONTHS[CGB.normAr(m[1]).replace(/\.$/, '')]; if (mo) return mk(+m[3], mo, +m[2], 'text');
  }
  return { ok: false, reason: 'شكل غير معروف' };
};

// Which day/month order does a column use? Unambiguous values vote.
MF.dateOrder = values => {
  let dmy = 0, mdy = 0;
  for (const v of values) { const m = MF.toWestern(MF.cleanSpaces(v)).match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/); if (!m) continue;
    const a = +m[1], b = +m[2]; if (a > 12 && b <= 12) dmy++; else if (b > 12 && a <= 12) mdy++; }
  return { order: mdy > dmy ? 'mdy' : 'dmy', dmy, mdy, mixed: dmy > 0 && mdy > 0 };
};

/* Hijri (Umm al-Qura) -> Gregorian by searching the browser's own calendar. Returns {y,m,d} or null. */
MF.hijriToGreg = (hy, hm, hd) => {
  let fmt; try { fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return null; }
  const read = t => { const p = fmt.formatToParts(new Date(t)); const g = k => parseInt(p.find(x => x.type === k).value, 10); return g('year') * 10000 + g('month') * 100 + g('day'); };
  if (isNaN(read(Date.UTC(2000, 0, 1)))) return null;
  const target = hy * 10000 + hm * 100 + hd;
  let lo = Date.UTC(1880, 0, 1) / 864e5, hi = Date.UTC(2080, 0, 1) / 864e5;
  while (lo < hi) { const mid = Math.floor((lo + hi) / 2); if (read(mid * 864e5) < target) lo = mid + 1; else hi = mid; }
  if (read(lo * 864e5) !== target) return null;
  const d = new Date(lo * 864e5); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
};

MF.ageAt = (p, ref) => { let a = ref.y - p.y; if (ref.m < p.m || (ref.m === p.m && ref.d < p.d)) a--; return a; };

/* Numbers such as "24,500", "24500 ر.ق", "QAR 24,500.50". Returns { ok, n, canon } */
MF.parseNumber = raw => {
  let s = MF.toWestern(MF.cleanSpaces(raw)); if (!s) return { ok: false };
  s = s.replace(/ر\.?\s?ق\.?|ريال(?:\s*قطري)?|qar|q\.?r\.?/gi, '').replace(/[٬\s]/g, '').replace(/٫/g, '.');
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(s)) return { ok: false };
  const n = parseFloat(s);
  return { ok: true, n, canon: Number.isInteger(n) ? String(n) : String(+n.toFixed(2)) };
};

/* Grades: "7", "الدرجة 7", "G7", "Grade 07". Returns { ok, n, canon } */
MF.parseGrade = raw => {
  const s = MF.toWestern(MF.cleanSpaces(raw)); if (!s) return { ok: false };
  if (/^-?\d{1,3}$/.test(s)) return { ok: true, n: parseInt(s, 10), canon: String(parseInt(s, 10)) };
  const m = s.match(/^(?:الدرجة|الدرجه|درجة|درجه|grade|gr\.?|g)\s*[-:#]?\s*(\d{1,2})$/i);
  if (m) return { ok: true, n: parseInt(m[1], 10), canon: String(parseInt(m[1], 10)), textual: true };
  return { ok: false };
};
