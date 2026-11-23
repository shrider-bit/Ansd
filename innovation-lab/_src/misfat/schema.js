/* مِصفاة — standard schema and automatic column mapping (header aliases + value sniffing). */
MF.FIELDS = [
  { id: 'emp_id', ar: 'رقم الموظف', type: 'id', aliases: ['رقم الموظف', 'الرقم الوظيفي', 'رقم وظيفي', 'رقم القيد', 'الرقم الشخصي', 'employee id', 'emp id', 'emp no', 'employee no', 'employee number', 'staff id', 'personnel number', 'pernr', 'id'] },
  { id: 'dob', ar: 'تاريخ الميلاد', type: 'date', aliases: ['تاريخ الميلاد', 'الميلاد', 'تاريخ الولادة', 'dob', 'date of birth', 'birth date', 'birthdate', 'gbdat'] },
  { id: 'hire', ar: 'تاريخ التعيين', type: 'date', aliases: ['تاريخ التعيين', 'تاريخ الالتحاق', 'تاريخ المباشرة', 'تاريخ بدء الخدمة', 'تاريخ التوظيف', 'hire date', 'join date', 'joining date', 'date of joining', 'appointment date', 'start date'] },
  { id: 'nat', ar: 'الجنسية', type: 'cat', aliases: ['الجنسية', 'nationality', 'nat', 'citizenship'] },
  { id: 'gender', ar: 'الجنس', type: 'cat', aliases: ['الجنس', 'النوع', 'النوع الاجتماعي', 'gender', 'sex'] },
  { id: 'entity', ar: 'الجهة', type: 'cat', aliases: ['الجهة', 'جهة العمل', 'الجهة الحكومية', 'الوزارة', 'اسم الجهة', 'entity', 'organization', 'organisation', 'ministry', 'employer', 'agency'] },
  { id: 'dept', ar: 'الإدارة', type: 'cat', aliases: ['الإدارة', 'القسم', 'الوحدة التنظيمية', 'الوحدة الإدارية', 'department', 'dept', 'division', 'org unit', 'unit'] },
  { id: 'title', ar: 'المسمى الوظيفي', type: 'cat', aliases: ['المسمى الوظيفي', 'مسمى الوظيفة', 'الوظيفة', 'المسمى', 'job title', 'position', 'title', 'job'] },
  { id: 'family', ar: 'المجموعة الوظيفية', type: 'cat', aliases: ['المجموعة الوظيفية', 'المجموعة النوعية', 'الفئة الوظيفية', 'job family', 'job group', 'occupational group', 'family'] },
  { id: 'grade', ar: 'الدرجة', type: 'grade', aliases: ['الدرجة', 'الدرجة المالية', 'الدرجة الوظيفية', 'grade', 'pay grade', 'level'] },
  { id: 'qual', ar: 'المؤهل', type: 'cat', aliases: ['المؤهل', 'المؤهل العلمي', 'الدرجة العلمية', 'المستوى التعليمي', 'qualification', 'education', 'degree', 'education level'] },
  { id: 'salary', ar: 'الراتب الإجمالي', type: 'num', aliases: ['الراتب الإجمالي', 'إجمالي الراتب', 'الراتب', 'اجمالي الراتب الشهري', 'total salary', 'gross salary', 'salary', 'monthly salary'] },
  { id: 'status', ar: 'الحالة الوظيفية', type: 'cat', aliases: ['الحالة الوظيفية', 'حالة الموظف', 'الحالة', 'حالة الخدمة', 'status', 'employment status', 'employee status'], anti: ['اجتماعيه', 'marital', 'صحيه'] },
];
MF.field = id => MF.FIELDS.find(f => f.id === id);
MF.CAT_FIELDS = ['nat', 'gender', 'entity', 'dept', 'title', 'family', 'qual', 'status'];

MF.headerTokens = h => CGB.normAr(MF.toWestern(h)).replace(/[_\-./\\()\[\]:#]+/g, ' ').split(/\s+/).filter(Boolean).map(t => t.replace(/^ال(?=.{2,})/, ''));

// 0..1 similarity between a header and one field's aliases.
MF.headerScore = (header, field) => {
  const ht = MF.headerTokens(header); if (!ht.length) return 0;
  const hs = ht.join(' ');
  if (field.anti && field.anti.some(a => hs.includes(MF.headerTokens(a).join(' ')))) return 0;
  let best = 0;
  for (const al of field.aliases) {
    const at = MF.headerTokens(al), as = at.join(' ');
    let sc = 0;
    if (hs === as) sc = 1;
    else if (at.every(t => ht.includes(t))) sc = 0.55 + 0.35 * (at.length / ht.length);
    else if (ht.every(t => at.includes(t))) sc = 0.5 + 0.3 * (ht.length / at.length);
    else if (hs.length >= 5 && as.length >= 5) { const d = MF.editDistance(hs, as, 2); if (d <= 2) sc = d === 1 ? 0.8 : 0.68; }
    if (sc > best) best = sc;
  }
  return best;
};

MF.VOCAB = {
  nat: ['قطري', 'قطرية', 'غير قطري', 'غير قطرية', 'qatari', 'non-qatari', 'non qatari', 'مواطن', 'مقيم'].map(v => CGB.normAr(v)),
  gender: ['ذكر', 'أنثى', 'male', 'female', 'm', 'f'].map(v => CGB.normAr(v)),
  status: ['نشط', 'على رأس العمل', 'متقاعد', 'منتهي الخدمة', 'مستقيل', 'إجازة طويلة', 'موقوف', 'active', 'retired', 'terminated', 'resigned', 'on leave'].map(v => CGB.normAr(v)),
  qual: ['بكالوريوس', 'ماجستير', 'دكتوراه', 'دبلوم', 'ثانوية', 'ثانوية عامة', 'bachelor', 'master', 'phd', 'diploma'].map(v => CGB.normAr(v)),
};

// Profile a column from a sample of its values.
MF.profileColumn = (rows, c) => {
  const vals = []; const step = Math.max(1, Math.floor(rows.length / 400));
  for (let i = 0; i < rows.length && vals.length < 400; i += step) { const v = MF.cleanSpaces(rows[i][c]); if (v && !MF.isPlaceholder(v)) vals.push(v); }
  const n = vals.length || 1; const p = { n: vals.length, date: 0, num: 0, gradeLike: 0, salaryLike: 0, nat: 0, gender: 0, status: 0, qual: 0, years: [] };
  const distinct = new Set();
  for (const v of vals) {
    distinct.add(v);
    const d = MF.parseDate(v); if (d.ok && d.kind !== 'serial') { p.date++; if (d.kind !== 'hijri') p.years.push(d.y); }
    const g = MF.parseGrade(v); if (g.ok && g.n >= 0 && g.n <= 30) p.gradeLike++;
    const x = MF.parseNumber(v); if (x.ok) { p.num++; if (x.n >= 1500 && x.n <= 500000) p.salaryLike++; }
    const k = CGB.normAr(v); for (const f of ['nat', 'gender', 'status', 'qual']) if (MF.VOCAB[f].includes(k)) p[f]++;
  }
  ['date', 'num', 'gradeLike', 'salaryLike', 'nat', 'gender', 'status', 'qual'].forEach(k => p[k] /= n);
  p.distinctRatio = distinct.size / n; p.distinct = distinct.size;
  p.years.sort((a, b) => a - b); p.medianYear = p.years.length ? p.years[Math.floor(p.years.length / 2)] : null;
  p.examples = [...distinct].slice(0, 3);
  return p;
};

// How well do the values of a column fit a field? 0..1
MF.sniffScore = (p, f, ctx) => {
  if (!p.n) return 0;
  switch (f.id) {
    case 'emp_id': return (p.distinctRatio > 0.9 && p.date < 0.2) ? (p.num > 0.6 ? 0.8 : 0.5) : 0;
    case 'dob': return p.date > 0.6 && p.medianYear != null && p.medianYear <= ctx.year - 20 && p.medianYear === ctx.minDateYear ? 0.9 : (p.date > 0.6 ? 0.35 : 0);
    case 'hire': return p.date > 0.6 && p.medianYear != null && p.medianYear !== ctx.minDateYear ? 0.8 : (p.date > 0.6 ? 0.35 : 0);
    case 'nat': return p.nat; case 'gender': return p.gender; case 'status': return p.status; case 'qual': return p.qual;
    case 'grade': return p.gradeLike > 0.7 && p.distinct <= 25 ? 0.8 : 0;
    case 'salary': return p.salaryLike > 0.7 && p.distinct > 25 ? 0.8 : 0;
    default: return 0;
  }
};

/* autoMap(headers, rows) -> { map: {fieldId: colIndex}, conf: {fieldId: 0..1}, how: {fieldId: 'header'|'values'} } */
MF.autoMap = (headers, rows) => {
  const profiles = headers.map((_, c) => MF.profileColumn(rows, c));
  const dateYears = profiles.filter(p => p.date > 0.6 && p.medianYear != null).map(p => p.medianYear);
  const ctx = { year: new Date().getFullYear(), minDateYear: dateYears.length ? Math.min(...dateYears) : null };
  const cands = [];
  headers.forEach((h, c) => MF.FIELDS.forEach(f => {
    const hs = MF.headerScore(h, f), ss = MF.sniffScore(profiles[c], f, ctx);
    let conf = 0, how = 'header';
    if (hs >= 0.5) { conf = Math.min(1, hs * 0.75 + ss * 0.25 + (hs === 1 ? 0.1 : 0)); }
    else if (ss >= 0.75) { conf = 0.4 + ss * 0.2; how = 'values'; }
    if (conf >= 0.45) cands.push({ f: f.id, c, conf, how });
  }));
  cands.sort((a, b) => b.conf - a.conf);
  const map = {}, conf = {}, how = {}, usedCols = new Set();
  for (const k of cands) { if (k.f in map || usedCols.has(k.c)) continue; map[k.f] = k.c; conf[k.f] = k.conf; how[k.f] = k.how; usedCols.add(k.c); }
  return { map, conf, how, profiles };
};
