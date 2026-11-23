/* مِصفاة — core helpers, text decoding and delimited-text parsing.
   Pure functions only (no DOM) so the whole engine can be tested in Node. */
const MF = {};

MF.toWestern = s => String(s == null ? '' : s)
  .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660))
  .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06F0));
MF.hasEasternDigits = s => /[٠-٩۰-۹]/.test(s);
// Invisible direction marks / BOM / zero-width space are removed; ZWJ and ZWNJ are legitimate and kept.
MF._dirty = /[\u200B\u200E\u200F\u202A-\u202E\uFEFF\u00A0\t\r\n]|^ | $|  /;
MF.cleanSpaces = s => { s = s == null ? '' : String(s); if (!MF._dirty.test(s)) return s;      // fast path: already clean
  return s.replace(/[\u200B\u200E\u200F\u202A-\u202E\uFEFF]/g, '').replace(/[\u00A0\t\r\n ]+/g, ' ').trim(); };
MF.hasArabic = s => /[؀-ۿ]/.test(s);
MF.hasLatin = s => /[A-Za-z]/.test(s);

MF.PLACEHOLDERS = new Set(['-', '—', '–', '--', '---', 'n/a', 'na', 'n.a', 'null', 'none', 'nil', 'nan', '#n/a',
  '0000', '00/00/0000', '0000-00-00', '?', '؟', '.', '..', 'x', 'xx', 'xxx', 'tbd',
  'غير محدد', 'غير متوفر', 'غير معروف', 'لا يوجد', 'لايوجد', 'بدون', 'فارغ'].map(v => CGB.normAr(v)));
MF.isPlaceholder = v => { if (!v || v.length > 14) return false; const c = MF.cleanSpaces(v); return c !== '' && MF.PLACEHOLDERS.has(CGB.normAr(c)); };
MF.isMissing = v => { if (v == null || v === '') return true; if (v.length > 14) return MF.cleanSpaces(v) === ''; const c = MF.cleanSpaces(v); return c === '' || MF.PLACEHOLDERS.has(CGB.normAr(c)); };

/* ---------- decoding ---------- */
// UTF-16 (Excel "Unicode Text"), UTF-8 with/without BOM, falling back to windows-1256 when UTF-8 is clearly wrong.
MF.decode = buf => {
  const b = new Uint8Array(buf);
  if (b[0] === 0xFF && b[1] === 0xFE) return { text: new TextDecoder('utf-16le').decode(b.subarray(2)), encoding: 'UTF-16LE' };
  if (b[0] === 0xFE && b[1] === 0xFF) return { text: new TextDecoder('utf-16be').decode(b.subarray(2)), encoding: 'UTF-16BE' };
  const hasBom = b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF;
  const utf8 = new TextDecoder('utf-8').decode(hasBom ? b.subarray(3) : b);
  if (utf8.indexOf('\uFFFD') === -1) return { text: utf8, encoding: hasBom ? 'UTF-8 (BOM)' : 'UTF-8' };
  try { return { text: new TextDecoder('windows-1256').decode(b), encoding: 'Windows-1256' }; }
  catch (e) { return { text: utf8, encoding: 'UTF-8 (أحرف تالفة)' }; }
};

/* ---------- delimiter detection ---------- */
MF.detectDelimiter = text => {
  const cands = ['\t', ',', ';', '|'];
  const lines = []; let cur = '', q = false;
  for (let i = 0; i < text.length && lines.length < 25; i++) {
    const ch = text[i];
    if (ch === '"') q = !q;
    if ((ch === '\n') && !q) { if (cur.trim()) lines.push(cur); cur = ''; } else if (ch !== '\r') cur += ch;
  }
  if (cur.trim() && lines.length < 25) lines.push(cur);
  let best = ',', bestScore = -1;
  for (const d of cands) {
    const counts = lines.map(l => { let n = 0, inq = false; for (const ch of l) { if (ch === '"') inq = !inq; else if (ch === d && !inq) n++; } return n; });
    const first = counts[0] || 0; if (!first) continue;
    const same = counts.filter(c => c === first).length / counts.length;
    const score = same * 100 + Math.min(first, 40) + (d === '\t' ? 0.5 : 0);
    if (score > bestScore) { bestScore = score; best = d; }
  }
  return best;
};

/* ---------- RFC-4180 style parser (quotes, doubled quotes, embedded newlines) ---------- */
MF.parseDelimited = (text, delim) => {
  const rows = []; let row = [], cell = '', q = false, i = 0; const n = text.length;
  while (i < n) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i += 2; continue; } q = false; i++; continue; }
      cell += ch; i++; continue;
    }
    if (ch === '"' && cell === '') { q = true; i++; continue; }
    if (ch === delim) { row.push(cell); cell = ''; i++; continue; }
    if (ch === '\r') { i++; continue; }
    if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; i++; continue; }
    cell += ch; i++;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ''));
};

// text -> { headers, rows, delim }. First non-empty line is the header row.
MF.toTable = (text, forcedDelim) => {
  const delim = forcedDelim || MF.detectDelimiter(text);
  const raw = MF.parseDelimited(text, delim);
  if (raw.length < 2) return { headers: [], rows: [], delim, error: 'لم نعثر على صف عناوين يتبعه صف بيانات واحد على الأقل.' };
  const width = raw.reduce((m, r) => Math.max(m, r.length), 0);
  const seen = {};
  const headers = Array.from({ length: width }, (_, i) => {
    let h = MF.cleanSpaces(raw[0][i] || '') || `عمود ${i + 1}`;
    if (seen[h]) { seen[h]++; h = `${h} (${seen[h]})`; } else seen[h] = 1;
    return h;
  });
  const rows = raw.slice(1).map(r => { const o = r.slice(0, width); while (o.length < width) o.push(''); return o; });
  return { headers, rows, delim };
};

MF.delimName = d => ({ '\t': 'جدولة (Tab)', ',': 'فاصلة', ';': 'فاصلة منقوطة', '|': 'خط عمودي' }[d] || d);

MF.toCSV = (headers, rows, delim = ',') => {
  const esc = v => { v = v == null ? '' : String(v); return (v.includes(delim) || /["\n\r]/.test(v) || /^\s|\s$/.test(v)) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const out = [headers.map(esc).join(delim)];
  for (const r of rows) out.push(r.map(esc).join(delim));
  return out.join('\r\n');
};

// FNV-1a fingerprint of the current data, shown on the passport so a passport is tied to one data version.
MF.fingerprint = (headers, rows) => {
  let h = 0x811c9dc5;
  const eat = s => { for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } h ^= 31; h = Math.imul(h, 0x01000193); };
  headers.forEach(eat); for (const r of rows) for (const c of r) eat(c);
  return (h >>> 0).toString(16).toUpperCase().padStart(8, '0');
};

/* ---------- small string metrics ---------- */
// Damerau–Levenshtein (optimal string alignment) with early exit above `max`.
MF.editDistance = (a, b, max = 3) => {
  if (a === b) return 0; const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > max) return max + 1;
  let prev2 = null, prev = Array.from({ length: lb + 1 }, (_, j) => j);
  for (let i = 1; i <= la; i++) {
    const cur = [i]; let rowMin = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur[j] = v; if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev; prev = cur;
  }
  return prev[lb];
};
MF.quantile = (sorted, p) => { if (!sorted.length) return NaN; const x = (sorted.length - 1) * p, lo = Math.floor(x), hi = Math.ceil(x); return sorted[lo] + (sorted[hi] - sorted[lo]) * (x - lo); };
