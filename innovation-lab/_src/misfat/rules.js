/* مِصفاة — the diagnosis engine. Rules and descriptive statistics only (no machine learning).
   analyzeSteps() returns small step functions so the UI can yield between them on large files. */
MF.DIMS = [
  { id: 'comp', ar: 'الاكتمال', w: .25, q: 'هل كل حقل مطلوب مُعبّأ؟' },
  { id: 'uniq', ar: 'التفرّد', w: .20, q: 'هل يظهر كل موظف مرة واحدة؟' },
  { id: 'valid', ar: 'الصحة', w: .25, q: 'هل القيم ممكنة ومقروءة؟' },
  { id: 'cons', ar: 'الاتساق', w: .20, q: 'هل تُكتب القيمة نفسها بالطريقة نفسها؟' },
  { id: 'plaus', ar: 'المعقولية', w: .10, q: 'هل القيم منطقية قياساً بنظيراتها؟' },
];
MF.SEV = { high: 'حرجة', med: 'متوسطة', low: 'بسيطة' };
MF.defaultSettings = (now = new Date()) => ({
  retAge: CGB.RULES.retirementAge, minAge: 18, gradeMin: CGB.GRADE_BANDS[0].lo, gradeMax: CGB.GRADE_BANDS[CGB.GRADE_BANDS.length - 1].hi,
  dateFmt: 'dmy', mgrGrade: 10, mgrMinAge: 26, ref: { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() },
});

MF.analyzeSteps = (table, map, settings) => {
  const { headers, rows } = table, N = rows.length, S = settings;
  const ctx = { issues: [], notes: [], dimRows: {}, assessed: {}, parsed: {} };
  MF.DIMS.forEach(d => { ctx.dimRows[d.id] = new Uint8Array(N); ctx.assessed[d.id] = false; });
  const has = f => map[f] != null;
  const col = f => map[f];
  const mappedCols = MF.FIELDS.filter(f => has(f.id)).map(f => map[f.id]);
  const fname = f => MF.field(f).ar;
  const add = (o) => {
    const rs = [...new Set(o.cells.map(c => c[0]))].sort((a, b) => a - b); if (!rs.length) return;
    const flags = ctx.dimRows[o.dim]; for (const r of rs) flags[r] = 1;
    ctx.issues.push(Object.assign({ rows: rs, n: rs.length, review: !o.fix }, o));
  };
  const refNum = MF.ymdNum(S.ref);
  const P = ctx.parsed;
  const steps = [];

  steps.push(['قراءة التواريخ والأرقام', () => {
    for (const f of ['dob', 'hire']) {
      if (!has(f)) continue; const c = col(f);
      const ord = MF.dateOrder(rows.map(r => r[c])); const arr = new Array(N);
      for (let i = 0; i < N; i++) {
        const v = rows[i][c]; if (MF.isMissing(v)) { arr[i] = null; continue; }
        const p = MF.parseDate(v, ord.order);
        if (p.ok && p.kind === 'hijri') { const g = MF.hijriToGreg(p.y, p.m, p.d); p.g = g; }
        else if (p.ok) p.g = { y: p.y, m: p.m, d: p.d };
        arr[i] = p;
      }
      P[f] = arr; P[f + 'Order'] = ord;
    }
    if (has('grade')) { const c = col('grade'); let ok = 0, tot = 0; P.grade = rows.map(r => { if (MF.isMissing(r[c])) return null; tot++; const g = MF.parseGrade(r[c]); if (g.ok) ok++; return g; }); P.gradeNumeric = tot === 0 || ok / tot >= 0.5; }
    if (has('salary')) { const c = col('salary'); P.salary = rows.map(r => MF.isMissing(r[c]) ? null : MF.parseNumber(r[c])); }
    P.active = new Uint8Array(N).fill(1);
    if (has('status')) { const c = col('status'); for (let i = 0; i < N; i++) if (MF.INACTIVE.has(MF.catKey(rows[i][c]))) P.active[i] = 0; }
  }]);

  steps.push(['الاكتمال', () => {
    ctx.assessed.comp = mappedCols.length > 0;
    for (const f of MF.FIELDS) {
      if (!has(f.id)) continue; const c = col(f.id); const cells = []; let ph = 0;
      for (let i = 0; i < N; i++) if (MF.isMissing(rows[i][c])) { cells.push([i, c]); if (MF.isPlaceholder(rows[i][c])) ph++; }
      add({ id: 'C1:' + f.id, rule: 'C1', dim: 'comp', sev: ['emp_id', 'dob', 'nat', 'entity'].includes(f.id) ? 'high' : 'med', field: f.id, cells,
        title: `قيم مفقودة في «${f.ar}»`, explain: `خانات فارغة أو تحمل رمزاً بديلاً عن الفراغ (مثل — أو N/A)${ph ? `؛ منها ${CGB.num(ph)} برمز بديل` : ''}. لا يمكن استنتاج القيمة آلياً؛ تُستكمل من المصدر.` });
    }
  }]);

  steps.push(['التفرّد', () => {
    if (has('emp_id')) {
      ctx.assessed.uniq = true; const c = col('emp_id'); const g = new Map();
      for (let i = 0; i < N; i++) { if (MF.isMissing(rows[i][c])) continue; const k = MF.toWestern(MF.cleanSpaces(rows[i][c])).toLowerCase(); (g.get(k) || g.set(k, []).get(k)).push(i); }
      const cells = []; let groups = 0; for (const a of g.values()) if (a.length > 1) { groups++; a.forEach(i => cells.push([i, c])); }
      add({ id: 'U1', rule: 'U1', dim: 'uniq', sev: 'high', field: 'emp_id', cells, title: 'رقم موظف مكرر',
        explain: `${CGB.num(groups)} رقماً يظهر في أكثر من سجل. التكرار يضخّم الأعداد والتكاليف في أي تقرير. يحتاج قراراً بشرياً: أي السجلين هو الصحيح؟` });
    }
    if (has('dob') && has('entity') && has('title')) {
      ctx.assessed.uniq = true; const g = new Map(); const ce = col('entity'), ct = col('title'), cd = col('dob'), cg = has('gender') ? col('gender') : -1, ci = has('emp_id') ? col('emp_id') : -1;
      for (let i = 0; i < N; i++) { const p = P.dob[i]; if (!p || !p.ok || !p.g) continue; const e = MF.catKey(rows[i][ce]), t = MF.catKey(rows[i][ct]); if (!e || !t) continue;
        const k = MF.ymdNum(p.g) + '|' + e + '|' + t + '|' + (cg >= 0 ? (MF.SYN_INDEX.gender[MF.catKey(rows[i][cg])] || MF.catKey(rows[i][cg])) : ''); (g.get(k) || g.set(k, []).get(k)).push(i); }
      const cells = []; let groups = 0;
      for (const a of g.values()) { if (a.length < 2) continue;
        if (ci >= 0) { const ids = new Set(a.map(i => MF.toWestern(MF.cleanSpaces(rows[i][ci])).toLowerCase())); if (ids.size === 1 && !ids.has('')) continue; }
        groups++; a.forEach(i => { cells.push([i, cd]); cells.push([i, ct]); }); }
      add({ id: 'U2', rule: 'U2', dim: 'uniq', sev: 'med', field: 'dob', cells, title: 'سجلات يُحتمل أنها لشخص واحد',
        explain: `${CGB.num(groups)} مجموعة تتطابق في تاريخ الميلاد والجهة والمسمى الوظيفي برقمي موظف مختلفين. قد تكون مصادفة في الجهات الكبيرة، لذا تُعرض للمراجعة ولا تُحذف آلياً.` });
    }
  }]);

  steps.push(['صحة التواريخ', () => {
    for (const f of ['dob', 'hire']) {
      if (!has(f)) continue; ctx.assessed.valid = true; const c = col(f), arr = P[f], ord = P[f + 'Order'];
      const bad = [], fmt = [], mdy = [], serial = [], hij = [], fut = []; let amb = 0;
      for (let i = 0; i < N; i++) { const p = arr[i]; if (!p) continue;
        if (!p.ok) { bad.push([i, c]); continue; }
        if (p.kind === 'serial') serial.push([i, c]);
        else if (p.kind === 'hijri') hij.push([i, c]);
        else { if (p.amb) amb++; if (ord.mixed && p.kind !== ord.order && (p.kind === 'mdy' || p.kind === 'dmy')) mdy.push([i, c]);
          else if (MF.fmtDate(p, S.dateFmt) !== MF.toWestern(MF.cleanSpaces(rows[i][c]))) fmt.push([i, c]); }
        if (p.g && MF.ymdNum(p.g) > refNum) fut.push([i, c]);
      }
      const target = S.dateFmt === 'ymd' ? 'YYYY-MM-DD' : 'DD/MM/YYYY';
      add({ id: 'V1:' + f, rule: 'V1', dim: 'valid', sev: 'high', field: f, cells: bad, title: `تواريخ غير مقروءة في «${fname(f)}»`,
        explain: 'قيم لا تمثّل تاريخاً صالحاً (سنة فقط، يوم غير موجود في الشهر، سنة من رقمين، أو نص). تُصحَّح من المصدر.' });
      add({ id: 'V2:' + f, rule: 'V2', dim: 'valid', sev: 'low', field: f, cells: fmt, title: `تنسيقات تاريخ غير موحّدة في «${fname(f)}»`,
        explain: `تواريخ صحيحة لكنها مكتوبة بغير التنسيق المعتمد ${target} (مثل 1990-03-05 أو 5/3/1990 أو مع وقت). التوحيد لا يغيّر التاريخ نفسه.`,
        fix: { key: 'dates:' + c, kind: 'dates', col: c, fmt: S.dateFmt, order: ord.order, safe: true, label: `توحيد تنسيق «${fname(f)}» إلى ${target}` } });
      add({ id: 'V3:' + f, rule: 'V3', dim: 'valid', sev: 'med', field: f, cells: mdy, title: `ترتيب اليوم والشهر مختلط في «${fname(f)}»`,
        explain: `العمود يخلط بين يوم/شهر وشهر/يوم. هذه القيم مؤكدة الترتيب (أحد الرقمين أكبر من 12) فيمكن توحيدها بأمان.${amb ? ` تنبيه: ${CGB.num(amb)} قيمة أخرى يصلح فيها الترتيبان ولا يمكن التحقق منها آلياً؛ فُسّرت وفق الترتيب الغالب.` : ''}`,
        fix: { key: 'dates:' + c, kind: 'dates', col: c, fmt: S.dateFmt, order: ord.order, safe: true, label: `توحيد تنسيق «${fname(f)}» إلى ${target}` } });
      add({ id: 'V4:' + f, rule: 'V4', dim: 'valid', sev: 'med', field: f, cells: serial, title: `أرقام Excel التسلسلية بدل التاريخ في «${fname(f)}»`,
        explain: 'رقم مثل 32874 هو تاريخ فقد تنسيقه عند النسخ من Excel. يُحوَّل حسابياً إلى التاريخ المقابل.',
        fix: { key: 'serial:' + c, kind: 'serial', col: c, fmt: S.dateFmt, safe: true, label: `تحويل أرقام Excel التسلسلية في «${fname(f)}» إلى تواريخ` } });
      add({ id: 'V5:' + f, rule: 'V5', dim: 'valid', sev: 'med', field: f, cells: hij, title: `تواريخ هجرية على ما يبدو في «${fname(f)}»`,
        explain: 'السنة بين 1300 و1500، أي أنها هجرية داخل عمود ميلادي. التحويل وفق تقويم أم القرى متاح، لكنه يحتاج تأكيدك لأن السنة قد تكون خطأ إدخال.',
        fix: { key: 'hijri:' + c, kind: 'hijri', col: c, fmt: S.dateFmt, safe: false, label: `تحويل التواريخ الهجرية في «${fname(f)}» إلى ميلادية (أم القرى)` } });
      add({ id: 'V6:' + f, rule: 'V6', dim: 'valid', sev: 'high', field: f, cells: fut, title: `تواريخ في المستقبل في «${fname(f)}»`,
        explain: `تاريخ يقع بعد تاريخ المرجع ${MF.fmtDate(S.ref, 'dmy')}. غالباً خطأ إدخال في السنة.` });
    }
  }]);

  steps.push(['صحة الأعمار والدرجات والرواتب', () => {
    if (has('dob')) {
      const c = col('dob'), young = [], old = [];
      for (let i = 0; i < N; i++) { const p = P.dob[i]; if (!p || !p.ok || !p.g || MF.ymdNum(p.g) > refNum) continue; const age = MF.ageAt(p.g, S.ref);
        if (age < S.minAge) young.push([i, c]); else if (age >= S.retAge && P.active[i]) old.push([i, c]); }
      add({ id: 'V7', rule: 'V7', dim: 'valid', sev: 'high', field: 'dob', cells: young, title: `العمر أقل من ${S.minAge} سنة`, explain: 'تاريخ ميلاد يجعل الموظف دون السن النظامية للتوظيف. يُراجع تاريخ الميلاد في المصدر.' });
      add({ id: 'V8', rule: 'V8', dim: 'valid', sev: 'high', field: 'dob', cells: old, title: `بلغ ${S.retAge} سنة وما زال على رأس العمل`, explain: `العمر عند تاريخ المرجع يساوي سن التقاعد (${S.retAge}) أو يتجاوزه والحالة الوظيفية نشطة. إمّا تمديد خدمة غير موثّق، أو حالة لم تُحدَّث، أو خطأ في تاريخ الميلاد.` });
    }
    if (has('dob') && has('hire')) {
      const c = col('hire'), minor = [], before = [];
      for (let i = 0; i < N; i++) { const a = P.dob[i], b = P.hire[i]; if (!a || !b || !a.ok || !b.ok || !a.g || !b.g) continue;
        if (MF.ymdNum(b.g) <= MF.ymdNum(a.g)) before.push([i, c]); else if (MF.ageAt(a.g, b.g) < S.minAge) minor.push([i, c]); }
      add({ id: 'V9', rule: 'V9', dim: 'valid', sev: 'med', field: 'hire', cells: minor, title: `تعيين قبل بلوغ ${S.minAge} سنة`, explain: 'الفرق بين تاريخ الميلاد وتاريخ التعيين أقل من السن النظامية. أحد التاريخين خطأ.' });
      add({ id: 'V10', rule: 'V10', dim: 'valid', sev: 'high', field: 'hire', cells: before, title: 'تاريخ التعيين يسبق تاريخ الميلاد', explain: 'مستحيل منطقياً؛ غالباً تبديل بين الحقلين أو خطأ في السنة.' });
    }
    if (has('grade')) {
      ctx.assessed.valid = true; const c = col('grade');
      if (!P.gradeNumeric) ctx.notes.push('عمود الدرجة نصّي في أغلبه؛ تخطّينا فحص نطاق السلّم وعاملناه كعمود تصنيفي.');
      else { const nonnum = [], out = [];
        for (let i = 0; i < N; i++) { const g = P.grade[i]; if (!g) continue; if (!g.ok) nonnum.push([i, c]); else if (g.n < S.gradeMin || g.n > S.gradeMax) out.push([i, c]); }
        add({ id: 'V11a', rule: 'V11', dim: 'valid', sev: 'med', field: 'grade', cells: nonnum, title: 'درجة غير رقمية', explain: 'قيمة لا يمكن قراءتها كدرجة على السلّم.' });
        add({ id: 'V11b', rule: 'V11', dim: 'valid', sev: 'high', field: 'grade', cells: out, title: `درجة خارج السلّم (${S.gradeMin}–${S.gradeMax})`, explain: 'رقم درجة غير موجود في سلّم الدرجات المعتمد في الإعدادات. يمكن تعديل حدود السلّم من «إعدادات القواعد».' });
      }
    }
    if (has('salary')) {
      ctx.assessed.valid = true; const c = col('salary'), nonnum = [], zero = [];
      for (let i = 0; i < N; i++) { const s = P.salary[i]; if (!s) continue; if (!s.ok) nonnum.push([i, c]); else if (s.n <= 0) zero.push([i, c]); }
      add({ id: 'V12a', rule: 'V12', dim: 'valid', sev: 'med', field: 'salary', cells: nonnum, title: 'راتب غير رقمي', explain: 'نص أو رموز في خانة الراتب تمنع الجمع والمتوسطات.' });
      add({ id: 'V12b', rule: 'V12', dim: 'valid', sev: 'high', field: 'salary', cells: zero, title: 'راتب صفري أو سالب', explain: 'قيمة غير ممكنة لموظف على رأس العمل؛ تُراجع من نظام الرواتب.' });
    }
  }]);

  steps.push(['اتساق الكتابة', () => {
    ctx.assessed.cons = mappedCols.length > 0;
    const sp = [], dg = [], ph = [];
    for (let i = 0; i < N; i++) for (const c of mappedCols) { const v = rows[i][c]; if (!v) continue;
      if (MF.cleanSpaces(v) !== v) sp.push([i, c]); if (MF.hasEasternDigits(v)) dg.push([i, c]); if (MF.isPlaceholder(v)) ph.push([i, c]); }
    add({ id: 'S1', rule: 'S1', dim: 'cons', sev: 'low', field: null, cells: sp, title: 'مسافات زائدة أو محارف خفية', explain: 'مسافة في أول القيمة أو آخرها أو مسافات مزدوجة تجعل «قطري» و« قطري» قيمتين مختلفتين في أي جدول محوري.',
      fix: { key: 'trim', kind: 'trim', cols: mappedCols, safe: true, label: 'حذف المسافات الزائدة والمحارف الخفية' } });
    add({ id: 'S2', rule: 'S2', dim: 'cons', sev: 'low', field: null, cells: dg, title: 'أرقام هندية (٠–٩) مختلطة بالأرقام 0–9', explain: 'الأرقام ٠١٢٣ تُقرأ نصاً في Excel فلا تُجمع ولا تُرتّب. تُحوَّل إلى 0–9 دون تغيير القيمة.',
      fix: { key: 'digits', kind: 'digits', cols: mappedCols, safe: true, label: 'توحيد الأرقام إلى 0–9' } });
    add({ id: 'S6', rule: 'S6', dim: 'cons', sev: 'low', field: null, cells: ph, title: 'رموز متعددة للقيمة المفقودة', explain: 'القيمة المفقودة مكتوبة بأشكال مختلفة (—، N/A، 0000، غير محدد). توحيدها إلى خانة فارغة يمنع عدّها فئةً مستقلة. تبقى مفقودة في بُعد الاكتمال.',
      fix: { key: 'placeholder', kind: 'placeholder', cols: mappedCols, safe: true, label: 'توحيد رموز القيم المفقودة إلى خانة فارغة' } });
    if (has('salary')) { const c = col('salary'), cells = []; for (let i = 0; i < N; i++) { const s = P.salary[i]; if (s && s.ok && s.canon !== MF.cleanSpaces(rows[i][c])) cells.push([i, c]); }
      add({ id: 'S5', rule: 'S5', dim: 'cons', sev: 'low', field: 'salary', cells, title: 'تنسيق رقمي غير موحّد في الراتب', explain: 'فواصل آلاف أو رمز عملة داخل الخانة (24,500 أو 24500 ر.ق) يحوّلان الرقم إلى نص.',
        fix: { key: 'number:' + c, kind: 'number', col: c, safe: true, label: 'تحويل الراتب إلى رقم مجرّد' } }); }
    if (has('grade') && P.gradeNumeric) { const c = col('grade'), cells = []; for (let i = 0; i < N; i++) { const g = P.grade[i]; if (g && g.ok && g.canon !== MF.cleanSpaces(rows[i][c])) cells.push([i, c]); }
      add({ id: 'S7', rule: 'S7', dim: 'cons', sev: 'low', field: 'grade', cells, title: 'صياغة الدرجة غير موحّدة', explain: 'الدرجة مكتوبة نصاً («الدرجة 7» أو G7 أو 07) بدل الرقم وحده.',
        fix: { key: 'grade:' + c, kind: 'grade', col: c, safe: true, label: 'كتابة الدرجة رقماً مجرّداً' } }); }
  }]);

  steps.push(['عناقيد التهجئة', () => {
    const cats = MF.CAT_FIELDS.slice(); if (has('grade') && !P.gradeNumeric) cats.push('grade');
    for (const f of cats) {
      if (!has(f)) continue; const c = col(f);
      const clusters = MF.clusterColumn(rows, c, f); const inCluster = new Set();
      clusters.forEach(cl => cl.variants.forEach(v => inCluster.add(v.value)));
      for (const safe of [true, false]) {
        const group = clusters.filter(cl => (cl.kind !== 'fuzzy') === safe); if (!group.length) continue;
        const map = {}, non = new Set();
        group.forEach(cl => cl.variants.forEach(v => { map[v.value] = cl.canonical; if (v.value !== cl.canonical) non.add(v.value); }));
        const cells = []; for (let i = 0; i < N; i++) if (non.has(MF.cleanSpaces(rows[i][c]))) cells.push([i, c]);
        const show = group.slice(0, 3).map(cl => cl.variants.map(v => `«${v.value}»`).join(' = ')).join('؛ ');
        add({ id: (safe ? 'S3:' : 'S3f:') + f, rule: safe ? 'S3' : 'S3f', dim: 'cons', sev: safe ? 'low' : 'med', field: f, cells, clusters: group,
          title: safe ? `القيمة نفسها بأكثر من صيغة في «${fname(f)}»` : `قيم متشابهة إملائياً في «${fname(f)}»`,
          explain: (safe ? `${CGB.num(group.length)} قيمة مكتوبة بأكثر من صيغة: فروق همزة أو ياء أو تاء مربوطة أو مسافة، أو مقابلها بلغة أخرى. مثال: ${show}. كل صيغة تُعدّ فئة مستقلة في أي تقرير.`
            : `${CGB.num(group.length)} قيمة نادرة تبعد حرفاً أو حرفين عن قيمة شائعة. مثال: ${show}. قد تكون خطأ إملائياً وقد تكون قيمة مختلفة فعلاً، لذا لا تُوحَّد إلا بتأكيدك.`),
          fix: { key: `canon:${c}:${safe ? 'safe' : 'fuzzy'}`, kind: 'canon', col: c, map, safe, clusters: group, label: safe ? `توحيد صيغ الكتابة في «${fname(f)}»` : `توحيد القيم المتشابهة إملائياً في «${fname(f)}»` } });
      }
      // values written in the column's minority script that no cluster explains
      let ar = 0, la = 0; const cells = [];
      for (let i = 0; i < N; i++) { const v = MF.cleanSpaces(rows[i][c]); if (!v || MF.isPlaceholder(v)) continue; if (MF.hasArabic(v)) ar++; else if (MF.hasLatin(v)) la++; }
      if (ar && la && Math.min(ar, la) / (ar + la) < 0.25) { const minorLatin = la < ar;
        for (let i = 0; i < N; i++) { const v = MF.cleanSpaces(rows[i][c]); if (!v || inCluster.has(v) || MF.isPlaceholder(v)) continue; if (minorLatin ? (!MF.hasArabic(v) && MF.hasLatin(v)) : MF.hasArabic(v)) cells.push([i, c]); }
        add({ id: 'S4:' + f, rule: 'S4', dim: 'cons', sev: 'low', field: f, cells, title: `لغتان في عمود واحد: «${fname(f)}»`, explain: `أغلب القيم ${minorLatin ? 'عربية' : 'لاتينية'} وهذه القيم مكتوبة باللغة الأخرى دون مقابل معروف. تُوحَّد يدوياً أو بجدول مطابقة.` }); }
    }
  }]);

  steps.push(['المعقولية', () => {
    if (has('salary')) {
      ctx.assessed.plaus = true; const c = col('salary'), groups = new Map(), cn = has('nat') ? col('nat') : -1;
      for (let i = 0; i < N; i++) { const s = P.salary[i]; if (!s || !s.ok || s.n <= 0) continue;
        const g = (P.grade && P.gradeNumeric && P.grade[i] && P.grade[i].ok ? P.grade[i].n : (has('grade') ? MF.catKey(rows[i][col('grade')]) : '*')) + '|' + (cn >= 0 ? (MF.SYN_INDEX.nat[MF.catKey(rows[i][cn])] || MF.catKey(rows[i][cn])) : '');
        (groups.get(g) || groups.set(g, []).get(g)).push(i); }
      const cells = [];
      for (const idx of groups.values()) { if (idx.length < 8) continue; const v = idx.map(i => P.salary[i].n).sort((a, b) => a - b);
        const q1 = MF.quantile(v, .25), q3 = MF.quantile(v, .75), iqr = q3 - q1, lo = q1 - 1.5 * iqr, hi = q3 + 1.5 * iqr;
        if (iqr <= 0) continue; for (const i of idx) { const n = P.salary[i].n; if (n < lo || n > hi) cells.push([i, c]); } }
      add({ id: 'P1', rule: 'P1', dim: 'plaus', sev: 'med', field: 'salary', cells, title: 'راتب شاذ قياساً بنظرائه في الدرجة',
        explain: `قاعدة المدى الربيعي: القيمة خارج [Q1 − 1.5×IQR ، Q3 + 1.5×IQR] ضمن موظفي الدرجة نفسها${cn >= 0 ? ' والجنسية نفسها' : ''} (للمجموعات من 8 سجلات فأكثر). قد يكون صفراً زائداً أو ناقصاً، وقد يكون صحيحاً؛ لا يُعدَّل آلياً.` });
    }
    if (has('grade') && has('dob') && P.gradeNumeric) {
      ctx.assessed.plaus = true; const c = col('grade'), cells = [];
      for (let i = 0; i < N; i++) { const g = P.grade[i], p = P.dob[i]; if (!g || !g.ok || !p || !p.ok || !p.g) continue; const age = MF.ageAt(p.g, S.ref);
        if (g.n >= S.mgrGrade && g.n <= S.gradeMax && age >= S.minAge && age < S.mgrMinAge) cells.push([i, c]); }
      add({ id: 'P2', rule: 'P2', dim: 'plaus', sev: 'med', field: 'grade', cells, title: `درجة إدارية (${S.mgrGrade} فأعلى) في سن دون ${S.mgrMinAge}`, explain: 'الجمع بين درجة إدارية أو قيادية وعمر صغير جداً غير مألوف؛ غالباً خطأ في الدرجة أو في تاريخ الميلاد.' });
    }
  }]);

  steps.push(['احتساب الدرجات', () => {
    const order = { high: 0, med: 1, low: 2 };
    ctx.issues.sort((a, b) => order[a.sev] - order[b.sev] || b.n - a.n);
    ctx.score = MF.score(ctx, N);
    // per-cell index: worst severity + which issues touch the cell (drives table highlighting and tooltips)
    const marks = new Map(), cellIss = new Map(); const rank = { low: 1, med: 2, high: 3 };
    ctx.issues.forEach((is, k) => { for (const [r, c] of is.cells) { const key = r * 4096 + c; const cur = marks.get(key);
      if (!cur || rank[is.sev] > rank[cur]) marks.set(key, is.sev); const a = cellIss.get(key); if (a) a.push(k); else cellIss.set(key, [k]); } });
    ctx.marks = marks; ctx.cellIss = cellIss;
  }]);
  return { steps, ctx };
};

/* درجة البُعد = السجلات الخالية من ملاحظات البُعد ÷ إجمالي السجلات × 100 ؛ الدرجة الكلية = متوسط موزون للأبعاد المقيَّمة */
MF.score = (ctx, N) => {
  const dims = {}; let wsum = 0, acc = 0;
  for (const d of MF.DIMS) {
    const flags = ctx.dimRows[d.id]; let bad = 0; for (let i = 0; i < N; i++) bad += flags[i];
    const s = N ? 100 * (1 - bad / N) : 100; dims[d.id] = { score: s, bad, assessed: ctx.assessed[d.id] };
    if (ctx.assessed[d.id]) { wsum += d.w; acc += d.w * s; }
  }
  const overall = wsum ? acc / wsum : 100;
  return { dims, overall, band: MF.band(overall) };
};
MF.band = s => s >= 95 ? { ar: 'ممتاز', k: 'ok' } : s >= 85 ? { ar: 'جيد', k: 'ok' } : s >= 70 ? { ar: 'مقبول', k: 'warn' } : { ar: 'يحتاج معالجة', k: 'bad' };

MF.analyzeSync = (table, map, settings) => { const { steps, ctx } = MF.analyzeSteps(table, map, settings); steps.forEach(s => s[1]()); return ctx; };
