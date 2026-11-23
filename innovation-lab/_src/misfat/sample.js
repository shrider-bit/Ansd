/* مِصفاة — SYNTHETIC sample generator. Every row is invented; defects are injected on purpose
   and recorded in `manifest` (rule -> row indexes) so tests can prove each one is detected. */
MF.SAMPLE_HEADERS = ['الرقم الوظيفي', 'تاريخ الميلاد', 'تاريخ التعيين', 'الجنسية', 'الجنس', 'الجهة', 'الإدارة', 'المسمى الوظيفي', 'المجموعة الوظيفية', 'الدرجة', 'المؤهل العلمي', 'إجمالي الراتب', 'الحالة الوظيفية', 'ملاحظات'];
MF.makeSample = (now = new Date(), n = 1200, seed = 20261123) => {
  const R = CGB.rng(seed), Y = now.getFullYear();
  const [ID, DOB, HIRE, NAT, GEN, ENT, DEPT, TITLE, FAM, GRADE, QUAL, SAL, STATUS, NOTE] = MF.SAMPLE_HEADERS.map((_, i) => i);
  const TITLES = { admin: ['منسق إداري', 'سكرتير تنفيذي', 'أخصائي شؤون إدارية'], fin: ['محاسب', 'محاسب أول', 'محلل مالي'], legal: ['باحث قانوني', 'مستشار قانوني'],
    eng: ['مهندس مدني', 'مهندس كهرباء', 'مهندس مشاريع'], it: ['محلل بيانات', 'مهندس شبكات', 'مطور برمجيات'], health: ['طبيب عام', 'ممرض', 'فني مختبر', 'صيدلي'],
    edu: ['معلم', 'أخصائي مناهج', 'مشرف تربوي'], hr: ['أخصائي موارد بشرية', 'أخصائي تخطيط قوى عاملة'], plan: ['أخصائي إحصاء', 'محلل تخطيط استراتيجي'],
    cs: ['موظف خدمة متعاملين', 'مشرف مركز خدمات'], tech: ['فني صيانة', 'فني كهرباء'], audit: ['مدقق داخلي', 'أخصائي رقابة'] };
  const DEPTS = { admin: 'إدارة الشؤون الإدارية', fin: 'إدارة الشؤون المالية', legal: 'إدارة الشؤون القانونية', eng: 'إدارة المشاريع الهندسية', it: 'إدارة نظم المعلومات', health: 'إدارة الخدمات العلاجية',
    edu: 'إدارة الشؤون التعليمية', hr: 'إدارة الموارد البشرية', plan: 'إدارة التخطيط والجودة', cs: 'إدارة خدمة المتعاملين', tech: 'إدارة الخدمات الفنية', audit: 'إدارة التدقيق الداخلي' };
  const CORE = { health: 'health', edu: 'edu', econ: 'fin', infra: 'eng', muni: 'cs', social: 'cs', energy: 'eng', gov: 'admin' };
  const ents = [CGB.ENTITIES[1], CGB.ENTITIES[4], CGB.ENTITIES[6], CGB.ENTITIES[9], CGB.ENTITIES[13], CGB.ENTITIES[21]];
  const entW = [0.27, 0.22, 0.11, 0.17, 0.13, 0.10];
  const B = new Set([ents[2].ar, ents[5].ar]);                         // "source B": a second system with ISO dates and English values
  const wpick = (items, w) => { let x = R() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < items.length; i++) { x -= w[i]; if (x <= 0) return items[i]; } return items[items.length - 1]; };
  const p2 = MF.pad2, dmy = (y, m, d) => `${p2(d)}/${p2(m)}/${y}`, iso = (y, m, d) => `${y}-${p2(m)}-${p2(d)}`;
  const QUALS = ['ثانوية عامة', 'دبلوم', 'بكالوريوس', 'ماجستير', 'دكتوراه'];
  const salaryFor = (g, q) => Math.round((7000 + 2400 * g) * (0.93 + R() * 0.14) * (q ? 1.3 : 1) / 50) * 50;
  const rows = [], meta = [];
  for (let i = 0; i < n; i++) {
    const e = wpick(ents, entW), core = CORE[e.sector];
    const famId = R() < 0.46 ? core : R() < 0.3 ? 'admin' : R() < 0.3 ? 'it' : R.pick(CGB.FAMILIES).id, fam = CGB.byId(CGB.FAMILIES, famId);
    const gb = wpick([[1, 3], [4, 6], [7, 9], [10, 12], [13, 15], [16, 18]], [18, 38, 26, 13, 4.5, 0.5]), grade = R.int(gb[0], gb[1]);
    const age = Math.min(57, Math.max(grade >= 10 ? 34 : 22, Math.round(22 + grade * 1.9 + R() * 10)));
    const by = Y - age - 1, bm = R.int(1, 12), bd = R.int(1, 28);
    const hy = by + Math.max(21, age - R.int(0, Math.max(0, age - 22))), hm = R.int(1, 12), hd = R.int(1, 28);
    const qatari = R() < fam.qShare, female = R() < (['health', 'edu'].includes(famId) ? 0.62 : 0.42), src = B.has(e.ar);
    const qual = QUALS[Math.min(4, Math.max(0, Math.round(grade / 5 + R() * 1.4)))];
    const st = R() < 0.95 ? 'على رأس العمل' : R() < 0.6 ? 'إجازة طويلة' : 'منتهي الخدمة';
    rows.push([String(300100 + i * 3), src ? iso(by, bm, bd) : dmy(by, bm, bd), src ? iso(hy, hm, hd) : dmy(hy, hm, hd),
      src ? (qatari ? 'Qatari' : 'Non-Qatari') : (qatari ? 'قطري' : 'غير قطري'), src ? (female ? 'Female' : 'Male') : (female ? 'أنثى' : 'ذكر'),
      e.ar, DEPTS[famId], R.pick(TITLES[famId]), fam.ar, String(grade), qual, String(salaryFor(grade, qatari)), st,
      R() < 0.03 ? R.pick(['منقول من جهة أخرى', 'ندب داخلي', 'يستكمل ملفه']) : '']);
    meta.push({ src, by, bm, bd, hy, hm, hd, grade, qatari });
  }
  /* ---------- defect injection ---------- */
  const manifest = {}; const mark = (rule, i) => (manifest[rule] || (manifest[rule] = [])).push(i);
  const pool = Array.from({ length: n }, (_, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const used = new Set();
  const take = (k, ok = () => true) => { const out = []; for (const i of pool) { if (out.length >= k) break; if (used.has(i) || !ok(i)) continue; used.add(i); out.push(i); } return out; };
  const A = i => !meta[i].src, active = i => rows[i][STATUS] !== 'منتهي الخدمة', any = () => true;
  const inj = (rule, k, ok, fn) => take(k, ok).forEach((i, j) => { fn(i, j); mark(rule, i); });

  // probable duplicate people (same DOB + entity + title, different id) and duplicate ids
  { const a = take(5, A), b = take(5, A); a.forEach((x, j) => { const id = rows[b[j]][ID]; rows[b[j]] = rows[x].slice(); rows[b[j]][ID] = id; meta[b[j]] = Object.assign({}, meta[x]); mark('U2', x); mark('U2', b[j]); }); }
  { const a = take(8, any), b = take(8, any); a.forEach((x, j) => { rows[b[j]][ID] = rows[x][ID]; mark('U1', x); mark('U1', b[j]); }); }
  // completeness
  [[DOB, 6], [HIRE, 5], [NAT, 7], [GEN, 4], [TITLE, 8], [QUAL, 12], [SAL, 6], [GRADE, 4]].forEach(([c, k]) => inj('C1', k, any, i => rows[i][c] = ''));
  [[QUAL, 5, '—'], [SAL, 3, 'N/A'], [DEPT, 4, 'غير محدد'], [HIRE, 2, '0000'], [TITLE, 2, '-']].forEach(([c, k, v]) => inj('S6', k, any, i => rows[i][c] = v));
  // date shapes
  inj('V2', 26, i => A(i) && (meta[i].bd < 10 || meta[i].bm < 10), i => rows[i][DOB] = `${meta[i].bd}/${meta[i].bm}/${meta[i].by}`);
  inj('V2', 10, A, i => rows[i][HIRE] = `${p2(meta[i].hd)}-${p2(meta[i].hm)}-${meta[i].hy}`);
  inj('V2', 6, A, i => rows[i][HIRE] = `${dmy(meta[i].hy, meta[i].hm, meta[i].hd)} 00:00:00`);
  inj('V2', 4, A, i => rows[i][DOB] = `${meta[i].bd} ${['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'][meta[i].bm - 1]} ${meta[i].by}`);
  inj('V4', 12, A, i => rows[i][HIRE] = String(Math.round((Date.UTC(meta[i].hy, meta[i].hm - 1, meta[i].hd) - Date.UTC(1899, 11, 30)) / 864e5)));
  inj('V5', 8, A, i => rows[i][DOB] = `${p2(R.int(1, 29))}/${p2(R.int(1, 12))}/${R.int(1396, 1418)}`);
  { const bad = ['1988', '31/02/1985', '12-1990', 'مواليد 1979']; inj('V1', 4, A, (i, j) => rows[i][DOB] = bad[j]); const bad2 = ['00/13/2011', '15/06/09']; inj('V1', 2, A, (i, j) => rows[i][HIRE] = bad2[j]); }
  inj('V6', 4, A, i => rows[i][HIRE] = dmy(Y + R.int(1, 4), meta[i].hm, meta[i].hd));
  inj('V3', 6, A, i => rows[i][HIRE] = `${p2(meta[i].hm)}/${p2(R.int(13, 28))}/${meta[i].hy}`);
  // impossible / implausible ages
  inj('V7', 5, A, i => rows[i][DOB] = dmy(Y - R.int(6, 14), meta[i].bm, meta[i].bd));
  inj('V8', 14, i => A(i) && active(i), i => { const y = Y - R.int(62, 67); rows[i][DOB] = dmy(y, meta[i].bm, meta[i].bd); });
  inj('V9', 6, A, i => rows[i][HIRE] = dmy(meta[i].by + R.int(10, 16), meta[i].hm, meta[i].hd));
  inj('V10', 3, A, i => rows[i][HIRE] = dmy(meta[i].by - R.int(1, 3), meta[i].hm, meta[i].hd));
  inj('P2', 5, i => A(i) && active(i), i => { const g = R.int(13, 15); rows[i][GRADE] = String(g); rows[i][SAL] = String(salaryFor(g, meta[i].qatari)); rows[i][DOB] = dmy(Y - 24, meta[i].bm, meta[i].bd); rows[i][HIRE] = dmy(Y - 2, meta[i].hm, meta[i].hd); });
  // grades and salaries
  { const g = ['0', '19', '25', '99', '21', '-1', '30']; inj('V11', 7, any, (i, j) => rows[i][GRADE] = g[j]); }
  inj('S7', 8, any, (i, j) => rows[i][GRADE] = j % 2 ? 'G' + rows[i][GRADE] : 'الدرجة ' + rows[i][GRADE]);
  inj('S7', 3, i => +rows[i][GRADE] < 10, i => rows[i][GRADE] = '0' + rows[i][GRADE]);
  { const s = ['ثلاثون ألف', '24500*', '~18000', 'حسب العقد', '25000+بدلات']; inj('V12', 5, any, (i, j) => rows[i][SAL] = s[j]); }
  inj('V12', 4, active, i => rows[i][SAL] = '0'); inj('V12', 2, any, i => rows[i][SAL] = '-' + rows[i][SAL]);
  const th = v => Number(v).toLocaleString('en-US');
  inj('S5', 18, any, i => rows[i][SAL] = th(rows[i][SAL])); inj('S5', 10, any, i => rows[i][SAL] = rows[i][SAL] + ' ر.ق'); inj('S5', 6, any, i => rows[i][SAL] = 'QAR ' + th(rows[i][SAL]));
  const common = i => A(i) && +rows[i][GRADE] >= 2 && +rows[i][GRADE] <= 9 && /^\d+$/.test(rows[i][SAL]);
  inj('P1', 6, common, i => rows[i][SAL] = String(+rows[i][SAL] * 10)); inj('P1', 3, common, i => rows[i][SAL] = String(Math.round(+rows[i][SAL] / 10)));
  // spelling variants
  inj('S3', 26, i => A(i) && rows[i][NAT] === 'قطري', i => rows[i][NAT] = 'قطرى'); inj('S3', 10, i => A(i) && rows[i][NAT] === 'قطري' && rows[i][GEN] === 'أنثى', i => rows[i][NAT] = 'قطرية');
  inj('S3', 14, i => A(i) && rows[i][NAT] === 'غير قطري', i => rows[i][NAT] = 'غير قطرى'); inj('S3', 8, i => rows[i][NAT] === 'Qatari', i => rows[i][NAT] = 'QATARI');
  inj('S3', 30, i => rows[i][GEN] === 'أنثى', i => rows[i][GEN] = 'انثى'); inj('S3', 6, i => rows[i][GEN] === 'ذكر', i => rows[i][GEN] = 'ذكـر');
  inj('S3', 5, i => rows[i][GEN] === 'Female', i => rows[i][GEN] = 'F'); inj('S3', 5, i => rows[i][GEN] === 'Male', i => rows[i][GEN] = 'M');
  inj('S3', 18, any, i => rows[i][ENT] = rows[i][ENT].replace(/ة/g, 'ه')); inj('S3', 12, any, i => rows[i][ENT] = rows[i][ENT].replace(/\((.)\)/, '( $1 )'));
  inj('S3', 26, i => /[أإ]/.test(rows[i][TITLE]), i => rows[i][TITLE] = rows[i][TITLE].replace(/[أإ]/g, 'ا')); inj('S3', 10, i => /ي( |$)/.test(rows[i][TITLE]), i => rows[i][TITLE] = rows[i][TITLE].replace(/ي( |$)/g, 'ى$1'));
  inj('S3', 6, i => rows[i][FAM] === 'تقنية المعلومات والبيانات', i => rows[i][FAM] = 'تقنية المعلومات و البيانات');
  inj('S3', 12, i => rows[i][STATUS] === 'على رأس العمل', i => rows[i][STATUS] = 'علي راس العمل');
  // rare typos one letter away from a common value (need the analyst's confirmation); kept under a quarter of the host value
  const typo = (c, good, bad, k) => { const cnt = rows.filter((r, i) => r[c] === good && !used.has(i)).length; inj('S3f', Math.min(k, Math.floor(cnt * 0.25)), i => rows[i][c] === good, i => rows[i][c] = bad); };
  typo(TITLE, 'محلل بيانات', 'محلل بينات', 4); typo(TITLE, 'مهندس مدني', 'مهندس مدنني', 3); typo(TITLE, 'أخصائي موارد بشرية', 'أخصائي موراد بشرية', 4); typo(QUAL, 'بكالوريوس', 'بكالريوس', 5);
  inj('S4', 4, i => rows[i][TITLE] === 'مطور برمجيات', i => rows[i][TITLE] = 'Software Developer');
  // spaces and Arabic-Indic digits
  inj('S1', 48, any, (i, j) => { const c = [NAT, TITLE, ENT, DEPT][j % 4]; const v = rows[i][c]; if (!v) { rows[i][c] = ' '; return; } rows[i][c] = j % 3 === 0 ? ' ' + v : j % 3 === 1 ? v + '  ' : (v.includes(' ') ? v.replace(' ', '  ') : v + ' '); });
  const east = s => String(s).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  inj('S2', 10, any, i => rows[i][ID] = east(rows[i][ID])); inj('S2', 10, A, i => rows[i][DOB] = east(rows[i][DOB])); inj('S2', 5, any, i => rows[i][GRADE] = east(rows[i][GRADE])); inj('S2', 5, any, i => rows[i][SAL] = east(rows[i][SAL]));
  return { headers: MF.SAMPLE_HEADERS.slice(), rows, manifest, name: 'عيّنة تجريبية افتراضية' };
};
