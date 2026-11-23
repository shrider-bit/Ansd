/* بيّنة — محرك الأدلة: قواعد معلنة قابلة للتدقيق (ليست ذكاءً اصطناعياً ولا نموذجاً تنبؤياً).
   كل رقم في التوصية ناتج عن الصيغ أدناه ويمكن إعادة احتسابه يدوياً. */
BY.RULES = {
  wWorkload: .6, wBench: .4,          // وزن تقدير عبء العمل وتقدير المقارنة المرجعية في الاحتياج المرجَّح
  redeployRealisation: .5,            // نسبة ما يُعوَّل عليه من المرشحين المناسبين للتدوير
  phasedBelow: .65,                   // دون هذه النسبة من استغلال الموافقات السابقة يصبح الاعتماد مرحلياً
  staleMonths: 18,                    // شاغر تجاوز هذه المدة يُعدّ مجمّداً
  strong: 85, medium: 68,             // حدود درجات قوة الأدلة
  fast: { maxPosts: 15, maxCost: 5e6, minUtil: .7, minAgree: .7 },
  weights: { workload: 30, bench: 20, vac: 10, dep: 10, redeploy: 5, pipeline: 5, digital: 5, track: 15 },
  hours: { manual: 6, fast: .5, deep: 2.5, missing: 1 },
  consistencyBand: .15,
};
BY.GRADES = { strong: 'قوية', medium: 'متوسطة', weak: 'ضعيفة', missing: 'ناقصة' };
BY.LANES = { fast: 'مسار سريع', deep: 'مراجعة معمّقة', missing: 'أدلة ناقصة' };

BY.median = a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

BY.assess = function (q) {
  const K = BY.RULES, cl = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const R = q.requested, S = q.staff, hasW = !!q.workload;
  const dep1 = q.departures.ret[0] + q.departures.attrExp;       // المغادرون المتوقعون في سنة الخطة
  const avail = S - dep1;                                         // الموجود المتوقع في سنة الخطة
  const med = BY.median(q.bench.peers), std = q.bench.std;
  // 1) عبء العمل: إسقاط حجم العمل بمتوسط النمو السنوي ثم قسمته على المعدل المعياري
  let g = null, proj, Qw = null, own = null, stab = 0;
  if (hasW) { const v = q.workload.volume, g1 = v[1] / v[0] - 1, g2 = v[2] / v[1] - 1; g = (g1 + g2) / 2; proj = v[2] * (1 + g); Qw = proj / std; own = v[2] / S;
    stab = 1 - Math.min(1, Math.abs(g2 - g1) / .08); }               // استقرار السلسلة: فرق 8 نقاط بين نموّ السنتين = صفر
  else proj = q.bench.refVolume;                                   // تقدير مركزي عند غياب بيانات الجهة
  // 2) المقارنة المرجعية: العدد اللازم لو عملت الوحدة بإنتاجية وسيط الجهات المماثلة
  const Qb = proj / med;
  const Qstar = Math.ceil(hasW ? K.wWorkload * Qw + K.wBench * Qb : Qb);
  const W = hasW ? Math.max(0, Math.ceil(Qw) - avail) : null, B = Math.max(0, Math.ceil(Qb) - avail);
  const Jraw = Math.max(0, Qstar - avail), J = Math.min(Jraw, R), underBy = Math.max(0, Jraw - R);
  const underAsk = underBy >= Math.max(3, Math.ceil(R * .2)) ? underBy : 0;   // يُنبَّه فقط إذا بلغ الفرق 3 وظائف و20% من المطلوب
  // 3-7) مصادر تغطية الاحتياج قبل استحداث وظائف جديدة — بالترتيب
  let rem = J;
  const useDep = Math.min(rem, dep1); rem -= useDep;               // إحلال على الدرجات التي ستشغر
  const useVac = Math.min(rem, q.vacancies.vacant); rem -= useVac; // شغل الشواغر المعتمدة
  const rdCap = Math.floor(q.redeploy.suitable * K.redeployRealisation);
  const useRd = Math.min(rem, rdCap); rem -= useRd;                // تدوير داخلي بين الجهات
  const autoShare = q.digital.project ? q.digital.auto * q.digital.readiness : 0;
  const useAu = Math.round(rem * autoShare); rem -= useAu;         // بديل رقمي (يُقرَّب لأقرب عدد صحيح)
  const N = rem;                                                   // وظائف جديدة موصى باستحداثها
  // مدى الثقة: نصف الفرق بين التقديرين، أو نصف تقدير المقارنة عند غياب بيانات عبء العمل
  const agree = hasW ? 1 - Math.min(1, Math.max(0, Math.abs(W - B) - 1) / Math.max(W, B, 3)) : 0;   // فرق وظيفة واحدة لا يُعدّ اختلافاً
  const delta = hasW ? Math.ceil(Math.abs(W - B) / 2) : Math.max(2, Math.ceil(B / 2));
  const conf = [Math.max(0, N - delta), Math.min(R + underAsk, N + delta)];
  // قوة الأدلة (0-100): موثوقية قاعدة الأدلة، لا مقدار تأييدها للطلب
  const util = q.track.util, w = K.weights, docsOk = q.docs.filter(Boolean).length, missDocs = q.docs.length - docsOk;
  const qual = { workload: hasW ? .5 * agree + .5 * stab : 0, bench: (q.bench.peers.length >= 6 ? 1 : .7) * (hasW ? .4 + .6 * agree : .5),
    vac: 1, dep: 1, redeploy: 1, pipeline: 1, digital: q.digital.project ? 1 : .5, track: cl((util - .4) / .5, 0, 1) };
  const rawScore = Object.keys(w).reduce((s, k) => s + w[k] * qual[k], 0);
  const score = Math.round(rawScore * (.8 + .2 * docsOk / q.docs.length));
  const grade = (!hasW || missDocs >= 2) ? 'missing' : score >= K.strong ? 'strong' : score >= K.medium ? 'medium' : 'weak';
  const missing = BY.DOCS.filter((d, i) => !q.docs[i]);
  const newCost = N * q.costPerPost;
  const lane = grade === 'missing' ? 'missing'
    : (grade === 'strong' && R <= K.fast.maxPosts && newCost <= K.fast.maxCost && util >= K.fast.minUtil && agree >= K.fast.minAgree && !underAsk) ? 'fast' : 'deep';
  const phased = util < K.phasedBelow && N >= 2;
  const stale = q.vacancies.months > K.staleMonths ? q.vacancies.vacant - useVac : 0;
  const seek = q.pipeline.seekers, pipe = seek >= N ? 'good' : seek >= N * .4 ? 'limited' : 'scarce';
  const sup = v => v == null ? 'na' : v >= R * .85 ? 'yes' : v >= R * .4 ? 'part' : 'no';
  const verdicts = { workload: sup(W), bench: sup(B), dep: useDep ? 'cut' : 'neutral', vac: useVac ? 'cut' : 'neutral',
    redeploy: useRd ? 'cut' : 'neutral', digital: useAu ? 'cut' : 'neutral', pipeline: N ? pipe : 'neutral',
    track: util >= .8 ? 'good' : util >= K.phasedBelow ? 'mid' : 'poor' };
  // أولوية الطلب في المحفظة (0-100)
  const priority = Math.round(100 * BY.SECTOR[q.entity.sector].crit * BY.FAM_CRIT[q.famId] * (.5 + .5 * score / 100)
    * Math.min(1, .45 + 3 * Jraw / S) * (.6 + .4 * util));
  return { R, S, hasW, dep1, avail, med, std, g, stab, proj, Qw, Qb, Qstar, W, B, own, Jraw, J, underAsk, inflation: R - J,
    useDep, useVac, useRd, useAu, rdCap, autoShare, N, fill: useDep + useVac, covered: useDep + useVac + useRd + useAu,
    agree, delta, conf, qual, score, grade, lane, missing, missDocs, phased, stale, pipe, verdicts, priority, newCost,
    recRatio: N / R, supportRatio: J / R,
    steps: [
      { key: 'requested', label: 'المطلوب من الجهة', before: 0, after: R, delta: R },
      { key: 'need', ev: [1, 2], label: 'تعديل الاحتياج بالأدلة', before: R, after: J, delta: J - R },
      { key: 'dep', ev: [4], label: 'إحلال على درجات المغادرين', before: J, after: J - useDep, delta: -useDep },
      { key: 'vac', ev: [3], label: 'شغل الشواغر المعتمدة', before: J - useDep, after: J - useDep - useVac, delta: -useVac },
      { key: 'redeploy', ev: [5], label: 'تدوير داخلي بين الجهات', before: J - useDep - useVac, after: N + useAu, delta: -useRd },
      { key: 'digital', ev: [7], label: 'بديل رقمي', before: N + useAu, after: N, delta: -useAu },
      { key: 'new', label: 'التوصية: وظائف جديدة', before: 0, after: N, delta: N },
    ] };
};

/* تخصيص المحفظة: خوارزمية «حقيبة الظهر» الجشعة على القيمة الحدّية لكل ريال.
   كل وظيفة موصى بها بند مستقل؛ قيمة الوظيفة k في الطلب تتناقص خطياً حتى النصف؛ يُموَّل الترتيب من الأعلى حتى السقف. */
BY.allocate = function (items, mode, ceiling) {
  const posts = [];
  items.forEach(it => { for (let k = 1; k <= it.n; k++) {
    const mv = it.p * (1 - .5 * (k - 1) / it.n); posts.push({ id: it.id, k, cost: it.cost, mv, density: mv / (it.cost / 1e6) }); } });
  posts.sort((a, b) => b.density - a.density || a.id - b.id || a.k - b.k);
  const funded = {}; let usedPosts = 0, usedCost = 0, cut = posts.length;
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    if (mode === 'posts' ? usedPosts + 1 > ceiling : usedCost + p.cost > ceiling) { cut = i; break; }
    funded[p.id] = (funded[p.id] || 0) + 1; usedPosts++; usedCost += p.cost;
  }
  return { posts, funded, usedPosts, usedCost, cut, cutDensity: cut < posts.length ? posts[cut].density : 0,
    totalPosts: posts.length, totalCost: posts.reduce((s, p) => s + p.cost, 0) };
};

/* اتساق القرارات: نسبة ما اعتُمد إلى المطلوب مقابل ما أيّدته الأدلة؛ الخارج عن النطاق يُبرَز للمراجعة. */
BY.consistency = function (decided) {
  const band = BY.RULES.consistencyBand;
  return decided.map(d => { const x = d.a.recRatio, y = d.approved / d.a.R, dev = y - x;
    return { id: d.id, x, y, dev, out: Math.abs(dev) > band, generousOnWeak: dev > band && (d.a.grade === 'weak' || d.a.grade === 'missing' || d.a.grade === 'medium'), grade: d.a.grade }; });
};

BY.reviewHours = function (list, h) {
  const manual = list.length * h.manual;
  const assisted = list.reduce((s, x) => s + (x.a.lane === 'fast' ? h.fast : x.a.lane === 'missing' ? h.missing : h.deep), 0);
  return { manual, assisted, saved: manual - assisted };
};
