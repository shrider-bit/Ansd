/* بيّنة — دورة تخطيط افتراضية (خطة القوى العاملة 2027).
   كل ما في هذا الملف بيانات تجريبية مولَّدة آلياً ببذرة ثابتة؛ لا تمثّل أي جهة حقيقية. */
const BY = { CYCLE: 2027 };

// خصائص المجموعات الوظيفية: مُحرِّك عبء العمل، المعدل المعياري للإنتاجية، نسبة قابلية الأتمتة، وحدات تنظيمية نموذجية
BY.FAM = {
  admin: { driver: 'المعاملات الإدارية المنجزة', std: 1800, auto: .32, seekers: 420, units: ['إدارة الشؤون الإدارية', 'قسم الخدمات المساندة', 'قسم المراسلات والأرشفة'] },
  fin:   { driver: 'المطالبات والقيود المالية', std: 2400, auto: .28, seekers: 160, units: ['إدارة الشؤون المالية', 'قسم الحسابات', 'قسم الموازنة'] },
  legal: { driver: 'العقود والمذكرات القانونية', std: 220, auto: .10, seekers: 95, units: ['إدارة الشؤون القانونية', 'قسم العقود والاتفاقيات', 'قسم القضايا'] },
  eng:   { driver: 'طلبات المراجعة والتصاريح الهندسية', std: 140, auto: .08, seekers: 70, units: ['إدارة المشاريع', 'قسم التصميم الهندسي', 'قسم التشغيل والصيانة'] },
  it:    { driver: 'طلبات الدعم الفني والتغيير', std: 900, auto: .15, seekers: 55, units: ['إدارة نظم المعلومات', 'قسم الأمن السيبراني', 'قسم تحليل البيانات'] },
  health:{ driver: 'زيارات المراجعين', std: 2600, auto: .05, seekers: 40, units: ['إدارة الرعاية الأولية', 'قسم الطوارئ', 'قسم المختبرات', 'قسم التمريض'] },
  edu:   { driver: 'الطلبة المسجَّلون', std: 14, auto: .04, seekers: 180, units: ['إدارة شؤون المدارس', 'قسم التعليم المبكر', 'قسم التوجيه التربوي'] },
  hr:    { driver: 'معاملات شؤون الموظفين', std: 1500, auto: .25, seekers: 140, units: ['إدارة الموارد البشرية', 'قسم التدريب والتطوير'] },
  plan:  { driver: 'التقارير والدراسات المنجزة', std: 36, auto: .18, seekers: 45, units: ['إدارة التخطيط والجودة', 'قسم الإحصاء'] },
  cs:    { driver: 'معاملات المتعاملين', std: 5200, auto: .35, seekers: 260, units: ['إدارة خدمة المتعاملين', 'مركز الاتصال', 'قسم الخدمات الإلكترونية'] },
  tech:  { driver: 'أوامر الصيانة المنفَّذة', std: 480, auto: .06, seekers: 25, units: ['قسم الصيانة الفنية', 'قسم المرافق', 'قسم النقل والآليات'] },
  audit: { driver: 'مهام التدقيق والتفتيش', std: 48, auto: .12, seekers: 38, units: ['إدارة التدقيق الداخلي', 'قسم الرقابة والتفتيش'] },
};

// وزن حضور كل مجموعة وظيفية في القطاع (لتوزيع الطلبات توزيعاً معقولاً) + أولوية القطاع الخدمية
BY.SECTOR = {
  health: { crit: 1.00, fam: { health: 5, admin: 1.5, it: 1, cs: 1, fin: .7, tech: .8, hr: .5 } },
  edu:    { crit: .95, fam: { edu: 5, admin: 1.5, it: .8, cs: .6, hr: .6, plan: .4 } },
  econ:   { crit: .70, fam: { fin: 3, audit: 2, legal: 1.2, it: 1, plan: 1, admin: 1 } },
  infra:  { crit: .80, fam: { eng: 4, tech: 2.5, it: 1, admin: 1, legal: .6, fin: .6 } },
  muni:   { crit: .75, fam: { tech: 3, eng: 2, cs: 2, audit: 1.5, admin: 1 } },
  social: { crit: .80, fam: { cs: 3, admin: 1.5, hr: .8, plan: .8, legal: .8, it: .6 } },
  energy: { crit: .70, fam: { eng: 3, tech: 2, audit: 1.2, it: 1, plan: .8, fin: .6 } },
  gov:    { crit: .60, fam: { hr: 2.5, plan: 2, it: 1.5, admin: 1.5, legal: 1, audit: 1, fin: 1 } },
};
BY.FAM_CRIT = { health: 1, edu: .95, eng: .9, it: .9, audit: .8, legal: .75, plan: .75, tech: .75, fin: .7, cs: .7, hr: .6, admin: .55 };
BY.GRADE_COST = { entry: 156000, spec: 252000, senior: 348000, mgr: 468000 };
BY.FAM_COST = { health: 1.18, it: 1.15, eng: 1.15, legal: 1.10 };
BY.DOCS = ['بيانات عبء العمل لثلاث سنوات', 'الهيكل التنظيمي المعتمد للوحدة', 'بطاقات الوصف الوظيفي', 'بيان الشواغر الحالية', 'خطة التقطير للوظائف المطلوبة'];
BY.JUST = {
  growth: { ar: 'نمو حجم الخدمة', text: q => `شهدت الوحدة ارتفاعاً متواصلاً في ${q.fam.driver} خلال السنوات الثلاث الماضية، وأصبح الكادر الحالي (${q.staff} موظفاً) غير كافٍ للوفاء بمستويات الخدمة المستهدفة. وعليه نطلب استحداث ${q.requested} وظيفة لمواكبة النمو المتوقع في عام 2027.` },
  mandate:{ ar: 'اختصاص جديد', text: q => `أُسندت إلى الوحدة اختصاصات إضافية ضمن إعادة تنظيم الجهة، ويتطلب تشغيلها استحداث ${q.requested} وظيفة في المجموعة ${q.fam.ar} لتغطية المهام المضافة دون الإخلال بالأعمال القائمة.` },
  retire: { ar: 'إحلال المتقاعدين', text: q => `يُتوقع أن يبلغ عدد من موظفي الوحدة سن التقاعد خلال الأعوام القليلة المقبلة، ونطلب استحداث ${q.requested} وظيفة لضمان استمرارية العمل ونقل المعرفة قبل مغادرتهم.` },
  overtime:{ ar: 'تقليل العمل الإضافي والإسناد', text: q => `تعتمد الوحدة حالياً على العمل الإضافي وعقود الإسناد الخارجي لتغطية حجم العمل، ونطلب استحداث ${q.requested} وظيفة دائمة لخفض هذه التكاليف وتحسين استقرار الخدمة.` },
  qatar:  { ar: 'رفع نسبة التقطير', text: q => `ضمن خطة الجهة لرفع نسبة التقطير في المجموعة ${q.fam.ar}، نطلب استحداث ${q.requested} وظيفة تُخصَّص لاستقطاب الكفاءات الوطنية في الوحدة وتأهيلها.` },
};

BY.generate = function () {
  const R = CGB.rng(20270114), U = (a, b) => a + R() * (b - a);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const wpick = obj => { const ks = Object.keys(obj); let t = ks.reduce((s, k) => s + obj[k], 0) * R();
    for (const k of ks) { t -= obj[k]; if (t <= 0) return k; } return ks[ks.length - 1]; };

  // سجل استغلال الموافقات السابقة لكل جهة (دورتا 2025 و2026)
  const track = {};
  CGB.ENTITIES.forEach(e => {
    const u = clamp(R.normal(.76, .2), .38, .99), cyc = [2025, 2026].map(y => {
      const approved = Math.max(6, Math.round(e.headcount * U(.006, .016)));
      return { year: y, approved, filled: Math.min(approved, Math.round(approved * clamp(u + U(-.07, .07), .2, 1))) }; });
    const a = cyc[0].approved + cyc[1].approved, f = cyc[0].filled + cyc[1].filled;
    track[e.id] = { cycles: cyc, approved: a, filled: f, util: f / a, readiness: U(.35, .95) };
  });

  // رزمة الأنماط: تضمن تنوّع الحالات (مبرَّرة، مبالغ فيها، تُسدّ بالشواغر، بالتدوير، بالأتمتة، إحلال، ناقصة، دون الاحتياج)
  const deck = [];
  Object.entries({ solid: 16, inflated: 12, vacancy: 9, redeploy: 6, digital: 5, retire: 5, missing: 5, underask: 2 })
    .forEach(([k, n]) => { for (let i = 0; i < n; i++) deck.push(k); });
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }

  const reqs = [];
  CGB.ENTITIES.forEach((e, ei) => {
    const n = e.headcount >= 15000 ? (ei === 0 ? 5 : 4) : e.headcount >= 9000 ? 4 : e.headcount >= 2500 ? 3 : 2;
    const used = new Set();
    for (let k = 0; k < n; k++) {
      const arche = deck[reqs.length % deck.length];
      const weights = Object.assign({}, BY.SECTOR[e.sector].fam);
      let famId = wpick(weights);
      if (arche === 'digital') famId = R.pick(['admin', 'cs', 'fin', 'hr']);
      const F = BY.FAM[famId], fam = Object.assign({ }, CGB.byId(CGB.FAMILIES, famId), F);
      let unit = R.pick(F.units), guard = 0;
      while (used.has(famId + unit) && guard++ < 8) unit = R.pick(F.units);
      used.add(famId + unit);
      const share = (BY.SECTOR[e.sector].fam[famId] || .8) / 11;
      const S = clamp(Math.max(R.int(18, 64), Math.round(e.headcount * share * U(.06, .2))), 18, 420);
      const T = arche === 'retire' ? R.int(0, 2) : clamp(Math.round(S * U(.05, .14)), arche === 'digital' ? 7 : 3, 36);
      const g = arche === 'inflated' && R() < .4 ? U(.005, .025) : U(.03, .09);
      const std = Math.max(2, +(F.std * U(.96, 1.04)).toPrecision(3));
      const ret = [arche === 'retire' ? clamp(Math.round(S * U(.05, .1)), 4, 14) : Math.round(S * (arche === 'digital' || arche === 'redeploy' ? U(0, .008) : U(.003, .018))),
        Math.round(S * U(.008, .035)), Math.round(S * U(.01, .04))];
      const attr = U(.005, .02), attrExp = Math.round(S * attr), dep1 = ret[0] + attrExp, Jtrue = T + dep1;
      const mult = { solid: U(1.02, 1.12), inflated: U(1.6, 2.5), vacancy: U(1, 1.25), redeploy: U(1, 1.2), digital: U(1.05, 1.3),
        retire: 1, missing: U(1.1, 1.8), underask: U(.55, .72) }[arche];
      const requested = clamp(Math.round(Jtrue * mult) + (arche === 'retire' ? R.int(0, 2) : 0), 2, 120);
      // سلسلة عبء العمل: تُبنى بحيث يساوي الاحتياج المحتسب (S + T) تقريباً؛ المحرك يشتق الأرقام منها ولا يقرؤها جاهزة
      const volatile = arche !== 'solid' && R() < .3;   // سلسلة متذبذبة: تُضعف موثوقية الإسقاط
      const proj = (S + T) * std, v26 = proj / (1 + g), v24 = v26 / (1 + g * U(.92, 1.08)) / (1 + g * U(.92, 1.08));
      const v25 = Math.sqrt(v26 * v24) * (volatile ? 1 + (R() < .5 ? -1 : 1) * U(.03, .055) : 1 + U(-.004, .004));
      const rv = v => v > 2000 ? Math.round(v / 10) * 10 : Math.round(v);
      const s25 = Math.round(S * U(.96, 1)), s24 = Math.round(s25 * U(.96, 1));
      const hasW = arche !== 'missing';
      // الجهات المماثلة: توزيع الإنتاجية حول وسيط قريب من المعيار، مع حالات يختلف فيها النظراء عن المعيار
      const pf = arche === 'solid' ? U(.992, 1.008) : R() < .28 ? U(1.07, 1.2) : U(.96, 1.04);
      const peers = Array.from({ length: R.int(6, 9) }, () => +(std * pf * (1 + R.normal(0, .07))).toPrecision(4));
      const vacant = arche === 'vacancy' ? Math.round(T * U(.6, 1.4)) + 2 : (arche === 'digital' || arche === 'redeploy') ? 0 : (R() < .45 ? R.int(1, 3) : 0);
      const suitable = arche === 'redeploy' ? Math.round(T * U(1, 2.2)) + 3 : arche === 'digital' ? 0 : (R() < .4 ? R.int(1, 4) : 0);
      const project = arche === 'digital' ? true : R() < .22;
      const readiness = arche === 'digital' ? U(.75, 1) : track[e.id].readiness;
      const band = arche === 'retire' ? R.pick(['spec', 'senior']) : wpick({ entry: 2, spec: 5, senior: 2.5, mgr: .5 });
      const oneMissing = arche !== 'missing' && R() < .2 ? R.int(1, 4) : -1;   // طلب مكتمل قد ينقصه مرفق واحد غير أساسي
      const docs = BY.DOCS.map((d, i) => i === 0 ? hasW : arche === 'missing' ? R() > .45 : i !== oneMissing);
      const jt = arche === 'retire' ? 'retire' : arche === 'digital' ? R.pick(['growth', 'overtime']) : wpick({ growth: 4, mandate: 2, overtime: 2, qatar: 1.5 });
      const day = R.int(0, 52), sub = new Date(2026, 8, 1 + day);
      const q = { arche, entity: e, unit, fam, famId, band: CGB.byId(CGB.GRADE_BANDS, band), staff: S, requested,
        costPerPost: Math.round(BY.GRADE_COST[band] * (BY.FAM_COST[famId] || 1) / 1000) * 1000, submitted: sub, justType: jt,
        workload: hasW ? { years: [2024, 2025, 2026], volume: [rv(v24), rv(v25), rv(v26)], staff: [s24, s25, S], std } : null,
        bench: { peers, refVolume: rv(v25 * 1.06), std },   // refVolume: آخر حجم عمل موثّق مركزياً (2025) + نمو قطاعي 3% سنوياً
        vacancies: { vacant, months: vacant ? R.int(4, 30) : 0 },
        departures: { ret, attr, attrExp },
        redeploy: { suitable, fit: suitable ? U(.72, .9) : 0 },
        pipeline: { seekers: Math.max(4, Math.round(F.seekers * U(.75, 1.25) / 10)), qShare: clamp(fam.qShare + U(-.12, .12), .05, .95) },
        digital: { project, readiness, auto: F.auto },
        track: track[e.id], docs };
      q.justText = BY.JUST[jt].text(q);
      reqs.push(q);
    }
  });
  reqs.sort((a, b) => a.submitted - b.submitted);
  reqs.forEach((q, i) => { q.id = i; q.no = String(i + 1).padStart(3, '0'); q.ref = `خ/2027/${q.no}`; q.memoRef = `ب/2027/${q.no}`; });
  return { reqs, track };
};
if (typeof module !== 'undefined') module.exports = BY;
