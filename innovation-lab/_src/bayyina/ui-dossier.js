/* بيّنة — ② ملف الطلب: الأدلة، شلّال التوصية، القرار، كتاب الرد */
(() => {
  const { $, st, D } = BY, n = CGB.num, esc = BY.txt.esc, pct = CGB.pct;
  const L = s => `<span class="ltr" dir="ltr">${s}</span>`, f1 = v => (Math.round(v * 10) / 10).toFixed(1), prod = v => n(v, v < 100 ? 1 : 0);
  const EXTRA_ITEMS = ['تحديث بيانات عبء العمل حتى نهاية الربع الأخير', 'تفصيل المسوّغات لكل وظيفة مطلوبة'];

  BY.draftOf = q => st.draft[q.id] || (st.draft[q.id] = { type: q.a.lane === 'missing' ? 'return' : 'approve', approved: q.a.N, reason: '', items: [...q.a.missing] });
  const laneWhy = q => { const a = q.a, K = BY.RULES.fast, w = [];
    if (a.lane === 'missing') return 'بيانات عبء العمل أو مرفقان أساسيان على الأقل لم ترد من الجهة.';
    if (a.lane === 'fast') return `أدلة قوية، تقديران متقاربان، طلب لا يتجاوز ${K.maxPosts} وظيفة، وسجل استغلال جيد.`;
    if (a.grade !== 'strong') w.push(`قوة الأدلة ${BY.GRADES[a.grade]}`); if (a.R > K.maxPosts) w.push(`الطلب يتجاوز ${K.maxPosts} وظيفة`);
    if (a.newCost > K.maxCost) w.push('كلفة الاستحداث تتجاوز 5 ملايين ر.ق'); if (q.track.util < K.minUtil) w.push(`سجل الاستغلال دون ${pct(K.minUtil)}`);
    if (a.agree < K.minAgree) w.push('التقديران متباعدان'); if (a.underAsk) w.push('المطلوب دون الاحتياج');
    return w.join('، ') + '.'; };

  /* ---------- شلّال الأدلة ---------- */
  const formula = (q, a, key) => { const r = BY.RULES; switch (key) {
    case 'requested': return `كما ورد في كتاب الجهة المؤرخ ${CGB.gdate(q.submitted)}.`;
    case 'need': return (a.hasW ? `الاحتياج = ${L(`⌈${r.wWorkload} × ${f1(a.Qw)} + ${r.wBench} × ${f1(a.Qb)}⌉ − (${a.S} − ${a.dep1}) = ${a.Qstar} − ${a.avail} = ${a.Jraw}`)}` : `الاحتياج (تقدير المقارنة وحده) = ${L(`⌈${f1(a.Qb)}⌉ − (${a.S} − ${a.dep1}) = ${a.Jraw}`)}`)
      + (a.Jraw > a.R ? ` · يُحدّ بالمطلوب (${a.R})` : '') + ` · الفرق عن المطلوب: ${L(CGB.signed(a.J - a.R))}`;
    case 'dep': return `الأقل من المتبقي (${a.J}) والمغادرين في 2027 (${a.dep1}) = ${a.useDep}. الدرجة قائمة في الملاك فلا تُستحدث.`;
    case 'vac': return `الأقل من المتبقي (${a.J - a.useDep}) والشواغر المعتمدة (${q.vacancies.vacant}) = ${a.useVac}.`;
    case 'redeploy': return `الأقل من المتبقي (${a.J - a.useDep - a.useVac}) و${L(`⌊${q.redeploy.suitable} × ${r.redeployRealisation}⌋ = ${a.rdCap}`)} مرشحاً يُعوَّل عليهم = ${a.useRd}.`;
    case 'digital': return q.digital.project ? `المتبقي × قابلية الأتمتة × جاهزية المشروع = ${L(`${a.N + a.useAu} × ${Math.round(q.digital.auto * 100)}% × ${Math.round(q.digital.readiness * 100)}% ≈ ${a.useAu}`)}` : 'لا مشروع أتمتة معتمداً يغطي إجراءات الوحدة؛ الأثر صفر.';
    case 'new': return `${L(`${a.R} ${a.J - a.R ? CGB.signed(a.J - a.R) + ' ' : ''}− ${a.useDep} − ${a.useVac} − ${a.useRd} − ${a.useAu} = ${a.N}`)}`; } };
  const waterfall = (q, a) => { const max = a.R, P = v => (v / max * 100).toFixed(2);
    return `<div class="wf${st.formulas ? ' show-f' : ''}" id="wf">${a.steps.map((s, i) => { const lo = Math.min(s.before, s.after), w = Math.abs(s.delta), total = s.key === 'requested' || s.key === 'new', nil = !total && s.delta === 0;
      return `<div class="wf-row wf-${s.key}${nil ? ' nil' : ''}${total ? ' total' : ''}" ${s.ev ? `data-act="ev-jump" data-ev="${s.ev[0]}" role="button" tabindex="0"` : ''}>
        <div class="wf-lab">${s.ev ? `<span class="wf-evn">${s.ev.length > 1 ? 'دليل ' + s.ev.join(' و') : 'دليل ' + s.ev[0]}</span>` : ''}<span>${s.label}</span></div>
        <div class="wf-track"><i class="wf-bar" style="inset-inline-start:${P(total ? 0 : lo)}%;width:${P(total ? s.after : w)}%"></i>${i < a.steps.length - 2 ? `<i class="wf-link" style="inset-inline-start:${P(s.after)}%"></i>` : ''}</div>
        <div class="wf-val">${total ? '' : nil ? 'لا أثر' : L(CGB.signed(s.delta))}</div><div class="wf-run">${n(s.after)}</div>
        <div class="wf-f">${formula(q, a, s.key)}</div></div>`; }).join('')}</div>`; };

  /* ---------- بطاقات الأدلة الثماني ---------- */
  const V = { yes: ['sup', 'يؤيّد الطلب'], part: ['part', 'يؤيّد جزءاً منه'], no: ['against', 'لا يؤيّد الطلب'], na: ['na', 'بيانات ناقصة'], neutral: ['neutral', 'لا أثر على العدد'],
    good: ['sup', ''], limited: ['part', ''], scarce: ['against', ''], mid: ['part', ''], poor: ['against', ''] };
  const card = (i, key, title, a, chart, keyline, verdict, vtext, details) => { const w = BY.RULES.weights[key], got = Math.round(w * a.qual[key]);
    return `<article class="ev v-${verdict}" id="ev-${i}"><header><span class="ev-n">${i}</span><h3>${title}</h3><span class="ev-w" title="إسهام هذا الدليل في درجة قوة الأدلة">${got} من ${w}</span></header>
      <div class="ev-chart">${chart}</div><p class="ev-key">${keyline}</p><p class="verdict vd-${verdict}">${vtext}</p>
      <details class="ev-det"${st.formulas ? ' open' : ''}><summary>الصيغة والمدخلات</summary><div>${details}</div></details></article>`; };
  const evidence = (q, a) => { const v = a.verdicts, r = BY.RULES, dl = rows => `<dl>${rows.map(x => `<div><dt>${x[0]}</dt><dd>${x[1]}</dd></div>`).join('')}</dl>`;
    const qNew = a.N ? Math.min(1, (q.pipeline.qShare * a.S + Math.min(a.N, q.pipeline.seekers)) / (a.S + a.N)) : q.pipeline.qShare, sk = q.pipeline.seekers;
    return [
      card(1, 'workload', 'عبء العمل', a, BY.ch.workload(q, a) + (a.hasW ? `<span class="ch-note">الخط المنقّط: طاقة الكادر المتوقع بالمعدل المعياري</span>` : ''),
        a.hasW ? `<b>${n(Math.ceil(a.Qw))}</b> موظفاً يلزمون لحجم ${BY.CYCLE} المتوقع من ${q.fam.driver}، والمتاح <b>${n(a.avail)}</b>.` : 'اعتُمد آخر حجم عمل موثّق مركزياً مع نمو قطاعي افتراضي.',
        V[v.workload][0], a.hasW ? (v.workload === 'part' ? `يؤيّد ${n(a.W)} من ${n(a.R)}` : V[v.workload][1]) : 'بيانات ناقصة',
        a.hasW ? dl([['حجم العمل 2024 ← 2026', q.workload.volume.map(x => n(x)).join(' ← ')], ['متوسط النمو السنوي', L((a.g * 100).toFixed(1) + '%')], ['استقرار السلسلة', pct(a.stab)], ['الحجم المتوقع 2027', n(Math.round(a.proj))], ['المعدل المعياري للموظف', n(a.std)], ['العدد اللازم = الحجم ÷ المعيار', f1(a.Qw)], ['الإضافي = ⌈اللازم⌉ − المتاح', L(`${Math.ceil(a.Qw)} − ${a.avail} = ${a.W}`)]]) : dl([['الحجم المرجعي المستخدم', n(q.bench.refVolume)], ['المطلوب من الجهة', BY.DOCS[0]]])),
      card(2, 'bench', 'المقارنة المرجعية', a, BY.ch.strip(q, a) + `<span class="ch-note">الدوائر: جهات مماثلة · الخط: الوسيط${a.own ? ' · المعيَّن: الوحدة' : ''}</span>`,
        `وسيط الإنتاجية في <b>${n(q.bench.peers.length)}</b> جهات مماثلة <b>${prod(a.med)}</b> لكل موظف${a.own ? `، وفي الوحدة <b>${prod(a.own)}</b>` : ''}.`,
        V[v.bench][0], v.bench === 'part' ? `يؤيّد ${n(a.B)} من ${n(a.R)}` : V[v.bench][1],
        dl([['وسيط الجهات المماثلة', prod(a.med)], ['العدد اللازم = الحجم ÷ الوسيط', f1(a.Qb)], ['الإضافي = ⌈اللازم⌉ − المتاح', L(`${Math.ceil(a.Qb)} − ${a.avail} = ${a.B}`)], ['تقارب التقديرين', a.hasW ? pct(a.agree) : '—']])),
      card(3, 'vac', 'الشواغر المعتمدة', a, BY.ch.units(q.vacancies.vacant, a.useVac, false),
        q.vacancies.vacant ? `<b>${n(q.vacancies.vacant)}</b> شاغراً معتمداً في المجموعة نفسها، متوسط الشغور <b>${n(q.vacancies.months)}</b> شهراً.` : 'لا شواغر معتمدة في المجموعة لدى الجهة.',
        v.vac === 'cut' ? 'cut' : 'neutral', v.vac === 'cut' ? `يُغني عن استحداث ${n(a.useVac)}` : 'لا أثر على العدد',
        dl([['القاعدة', 'تُشغل الشواغر المعتمدة قبل أي استحداث'], ['المستخدَم منها', n(a.useVac)], ['شواغر مجمّدة (أكثر من ' + r.staleMonths + ' شهراً) غير مستغلة', n(a.stale)]])),
      card(4, 'dep', 'المغادرون المتوقعون', a, BY.ch.departures(q) + `<span class="ch-note">تقاعد ببلوغ سن ${CGB.RULES.retirementAge} · الجزء الفاتح: ترك متوقع</span>`,
        `<b>${n(a.dep1)}</b> مغادراً في ${BY.CYCLE}: ${n(q.departures.ret[0])} تقاعداً و${n(q.departures.attrExp)} تركاً متوقعاً.`,
        v.dep === 'cut' ? 'cut' : 'neutral', v.dep === 'cut' ? `إحلال على درجات قائمة: ${n(a.useDep)}` : 'لا أثر على العدد',
        dl([['معدل الترك السنوي الأخير', L((q.departures.attr * 100).toFixed(1) + '%')], ['تقاعد 2027 / 2028 / 2029', q.departures.ret.join(' / ')], ['القاعدة', 'من يغادر تبقى درجته في الملاك؛ الإحلال تعيين لا استحداث']])),
      card(5, 'redeploy', 'التدوير الداخلي', a, BY.ch.units(q.redeploy.suitable, a.useRd, true, a.rdCap),
        q.redeploy.suitable ? `<b>${n(q.redeploy.suitable)}</b> مرشحاً مناسباً في جهات أخرى، متوسط الملاءمة <b>${pct(q.redeploy.fit)}</b>. <a class="link" href="03-jusoor-talent-bridges.html">استعرضهم في «جسور»</a>` : `لا فائض مناسباً في الجهات الأخرى حالياً. <a class="link" href="03-jusoor-talent-bridges.html">افتح «جسور»</a>`,
        v.redeploy === 'cut' ? 'cut' : 'neutral', v.redeploy === 'cut' ? `يغطي ${n(a.useRd)} بالنقل أو الندب` : 'لا أثر على العدد',
        dl([['حدّ الملاءمة', '70% فأعلى'], ['نسبة ما يُعوَّل عليه', pct(r.redeployRealisation)], ['الحد الأعلى المحتسب', n(a.rdCap)], ['القاعدة', 'المنقول ينتقل بدرجته فلا تُستحدث له وظيفة']])),
      card(6, 'pipeline', 'الكوادر الوطنية المتاحة', a, `<div class="hbars"><div><span>باحثون عن عمل في التخصص</span><i style="width:${Math.min(100, sk / Math.max(sk, a.N, 1) * 100)}%" class="hb-a"></i><b>${n(sk)}</b></div><div><span>وظائف جديدة موصى بها</span><i style="width:${Math.min(100, a.N / Math.max(sk, a.N, 1) * 100)}%" class="hb-b"></i><b>${n(a.N)}</b></div></div>`,
        `نسبة التقطير في الوحدة <b>${pct(q.pipeline.qShare)}</b>${a.N ? `، وتبلغ <b>${pct(qNew)}</b> إن شُغل الجديد بكوادر وطنية.` : '.'}`,
        V[v.pipeline][0], !a.N ? 'لا وظائف جديدة' : a.pipe === 'good' ? 'الشغل بكوادر وطنية ممكن' : a.pipe === 'limited' ? 'المتاح يغطي جزءاً فقط' : 'تخصص نادر بين الباحثين',
        dl([['المعيار المرجعي للتقطير', pct(CGB.RULES.qatarizationBenchmark)], ['القاعدة', 'لا تغيّر العدد؛ تحدّد شروط الشغل والتأهيل']])),
      card(7, 'digital', 'البديل الرقمي', a, `<div class="ring-row">${BY.ch.ring(q.digital.auto, q.digital.project)}<span>من عبء عمل «${q.fam.ar}» قابل للأتمتة</span></div>`,
        q.digital.project ? `مشروع أتمتة معتمد لدى الجهة، جاهزيته <b>${pct(q.digital.readiness)}</b>.` : 'لا مشروع أتمتة معتمداً يغطي إجراءات الوحدة.',
        v.digital === 'cut' ? 'cut' : 'neutral', v.digital === 'cut' ? `يُغني عن ${n(a.useAu)}` : 'لا أثر على العدد',
        dl([['النسبة المطبَّقة = القابلية × الجاهزية', q.digital.project ? pct(a.autoShare) : '0%'], ['تُطبَّق على', 'المتبقي بعد الإحلال والشواغر والتدوير']])),
      card(8, 'track', 'سجل الجهة في شغل الموافقات', a, BY.ch.track(q.track) + `<span class="ch-note">المفرَّغ: المعتمد · المملوء: ما شُغل فعلاً</span>`,
        `شغلت الجهة <b>${pct(q.track.util)}</b> مما اعتُمد لها في الدورتين السابقتين (${n(q.track.filled)} من ${n(q.track.approved)}).`,
        V[v.track][0], v.track === 'good' ? 'سجل جيد' : v.track === 'mid' ? 'سجل متوسط' : 'سجل ضعيف: اعتماد مرحلي',
        dl([['حدّ الاعتماد المرحلي', 'دون ' + pct(r.phasedBelow)], ['القاعدة', 'لا يغيّر العدد؛ يشترط الإفراج على دفعتين ويخفض الأولوية']])),
    ].join(''); };

  /* ---------- لوحة القرار ---------- */
  const decideHTML = q => { const a = q.a, d = st.dec[q.id], max = a.R + a.underAsk;
    if (d) return `<h2>القرار <span class="pill st-${d.type}">${BY.STATUS[d.type]}</span></h2>
      <dl class="dc-done"><div><dt>وظائف جديدة معتمدة</dt><dd>${d.type === 'approve' || d.type === 'amend' ? n(d.approved) : '—'}</dd></div><div><dt>التوصية</dt><dd>${n(a.N)}</dd></div><div><dt>سُجِّل في</dt><dd>${BY.fmtTime(d.t)}</dd></div><div><dt>بواسطة</dt><dd>${BY.ANALYST}${d.bulk ? ' · اعتماد جماعي' : ''}</dd></div></dl>
      ${d.reason ? `<p class="dc-reason"><b>السبب المسجَّل:</b> ${esc(d.reason)}</p>` : ''}${d.items && d.items.length ? `<p class="dc-reason"><b>المطلوب استكماله:</b> ${d.items.map(esc).join('؛ ')}</p>` : ''}
      <button class="btn" data-act="dc-reopen">إعادة فتح الطلب</button><p class="hint">إعادة الفتح تُسجَّل في السجل ولا تمحو القرار السابق منه.</p>`;
    const dr = BY.draftOf(q), opt = (t, l, s) => `<button class="dc-opt${dr.type === t ? ' on' : ''}" role="radio" aria-checked="${dr.type === t}" data-act="dc-type" data-type="${t}"><b>${l}</b><span>${s}</span></button>`;
    const items = [...new Set([...a.missing, ...EXTRA_ITEMS])];
    const panel = { approve: `<p class="dc-sum">استحداث <b>${n(a.N)}</b> · شغل وظائف قائمة <b>${n(a.fill)}</b> · تدوير <b>${n(a.useRd)}</b> · بديل رقمي <b>${n(a.useAu)}</b></p>`,
      amend: `<div class="form-row"><label for="dc-num">عدد الوظائف الجديدة المعتمدة</label><input id="dc-num" type="number" inputmode="numeric" min="0" max="${max}" step="1" value="${dr.approved}" data-in="dc-num"><span class="dc-diff" id="dc-diff"></span></div>
        <label for="dc-reason">سبب مخالفة التوصية <em>إلزامي · يُحفظ في السجل ويظهر في الكتاب</em></label><textarea id="dc-reason" rows="3" data-in="dc-reason" placeholder="مثال: مناوبات مسائية لا تظهر في بيانات عبء العمل السنوية">${esc(dr.reason)}</textarea>`,
      defer: `<label for="dc-reason">سبب الإرجاء <em>اختياري</em></label><textarea id="dc-reason" rows="3" data-in="dc-reason" placeholder="مثال: بانتظار اعتماد الهيكل التنظيمي الجديد">${esc(dr.reason)}</textarea>`,
      return: `<fieldset class="dc-items"><legend>المطلوب استكماله من الجهة</legend>${items.map((x, i) => `<label><input type="checkbox" id="dc-it-${i}" data-ch="dc-item" value="${esc(x)}"${dr.items.includes(x) ? ' checked' : ''}> ${esc(x)}</label>`).join('')}</fieldset>` }[dr.type];
    return `<h2>القرار</h2><div class="dc-opts" role="radiogroup" aria-label="نوع القرار">${opt('approve', 'اعتماد وفق التوصية', `${n(a.N)} وظيفة جديدة`)}${opt('amend', 'اعتماد بتعديل', 'يتطلب سبباً مكتوباً')}${opt('defer', 'إرجاء', 'إلى الدورة التالية')}${opt('return', 'إعادة للاستكمال', a.missing.length === 0 ? 'لطلب بيانات إضافية' : a.missing.length === 1 ? 'بند واحد ناقص' : a.missing.length === 2 ? 'بندان ناقصان' : `${n(a.missing.length)} بنود ناقصة`)}</div>
      <div class="dc-panel">${panel}</div><p class="dc-err" id="dc-err" role="alert"></p><button class="btn primary big" data-act="dc-save">${BY.ico('check')} تسجيل القرار</button>`; };
  const memoHTML = q => { const d = st.dec[q.id]; return BY.memo(q, d || BY.draftOf(q), !!d); };
  const refreshMemo = () => { const q = D.reqs[st.sel]; $('#memo-wrap').innerHTML = memoHTML(q);
    const dr = st.draft[q.id], df = $('#dc-diff'); if (df && dr) { const x = (+dr.approved || 0) - q.a.N; df.innerHTML = x ? `${L(CGB.signed(x))} عن التوصية` : 'مطابق للتوصية'; } };
  const refreshDecide = () => { $('#decide').innerHTML = decideHTML(D.reqs[st.sel]); refreshMemo(); };

  BY.views.dossier = () => { const q = D.reqs[st.sel], a = q.a, s = BY.status(q), list = BY.filtered(), ix = list.findIndex(x => x.id === q.id);
    const flags = [];
    if (a.underAsk) flags.push(['up', `الأدلة تشير إلى احتياج يزيد على المطلوب بـ ${n(a.underAsk)} وظيفة. التوصية لا تتجاوز المطلوب؛ يُنصح بمخاطبة الجهة.`]);
    if (!a.hasW) flags.push(['warn', 'تقدير أولي: لم ترد بيانات عبء العمل، فاعتُمدت المقارنة المرجعية وحدها.']);
    else if (a.agree < .4) flags.push(['warn', `التقديران متباعدان: عبء العمل يؤيّد ${n(a.W)} والمقارنة المرجعية ${n(a.B)}. راجع المعيار المستخدم.`]);
    if (a.phased) flags.push(['warn', `سجل الاستغلال ${pct(q.track.util)}: يُقترح الإفراج عن الوظائف على دفعتين.`]);
    if (a.stale > 0) flags.push(['note', `${n(a.stale)} شاغراً مجمّداً منذ أكثر من ${BY.RULES.staleMonths} شهراً لدى الجهة.`]);
    return `<header class="ds-head">
        <div class="ds-nav"><button class="link back" data-act="go" data-view="inbox">${BY.ico('arrow')} صندوق الطلبات</button>
          <span class="ds-pager"><button class="icon-btn" data-act="ds-step" data-d="-1" aria-label="الطلب السابق" ${ix <= 0 ? 'disabled' : ''}><span class="flip">${BY.ico('arrow')}</span></button><span>${ix >= 0 ? `${n(ix + 1)} من ${n(list.length)}` : q.ref}</span><button class="icon-btn" data-act="ds-step" data-d="1" aria-label="الطلب التالي" ${ix < 0 || ix >= list.length - 1 ? 'disabled' : ''}>${BY.ico('arrow')}</button></span></div>
        <div class="ds-title"><span class="ref-tag">${q.ref}</span><h1>${q.entity.ar} <span>${esc(q.unit)}</span></h1></div>
        <ul class="ds-meta"><li><span>المجموعة</span>${q.fam.ar}</li><li><span>المستوى</span>${q.band.ar}</li><li><span>الكادر الحالي</span>${n(a.S)}</li><li><span>كلفة الوظيفة سنوياً</span>${CGB.qar(q.costPerPost)}</li><li><span>تاريخ التقديم</span>${CGB.gdate(q.submitted)}</li>
          <li class="ds-pills"><span class="pill ln-${a.lane}">${BY.ico(a.lane)} ${BY.LANES[a.lane]}</span><span class="pill st-${s}">${BY.STATUS[s]}</span></li></ul>
      </header>
      <section class="ds-top">
        <div class="ds-ask"><span class="eyebrow">ما طلبته الجهة</span><p class="ask-num"><b>${n(a.R)}</b> وظيفة <span class="tag">${BY.JUST[q.justType].ar}</span></p>
          <blockquote>${esc(q.justText)}</blockquote>
          <ul class="docs">${BY.DOCS.map((d, i) => `<li class="${q.docs[i] ? 'ok' : 'no'}">${q.docs[i] ? BY.ico('check') : BY.ico('x')} ${d}</li>`).join('')}</ul></div>
        <div class="ds-say" id="ds-say"><span class="eyebrow">ما تقوله الأدلة</span>
          <p class="say-num"><b>${n(a.N)}</b> وظيفة جديدة <small>مدى الثقة من ${n(a.conf[0])} إلى ${n(a.conf[1])}</small></p>
          <ul class="say-parts"><li><b>${n(a.fill)}</b>شغل وظائف قائمة</li><li><b>${n(a.useRd)}</b>تدوير داخلي</li><li><b>${n(a.useAu)}</b>بديل رقمي</li><li><b>${n(a.R - a.J)}</b>غير مؤيَّد</li></ul>
          <p class="say-strength">${BY.ch.meter(a, true)} <span>قوة الأدلة من 100 · ${laneWhy(q)}</span></p>
          ${flags.map(f => `<p class="flag fl-${f[0]}">${f[1]}</p>`).join('')}</div>
      </section>
      <section class="ds-wf"><div class="sec-h"><h2>كيف صار المطلوب توصية</h2><button class="btn small" data-act="formulas" aria-pressed="${st.formulas}">${st.formulas ? 'إخفاء الصيغ' : 'إظهار الصيغ والمدخلات'}</button></div>${waterfall(q, a)}
        <p class="rule-note">${BY.ico('info')} القواعد معلنة وثابتة لكل الطلبات، وليست ذكاءً اصطناعياً. يمكن إعادة احتساب كل رقم يدوياً من المدخلات المعروضة.</p></section>
      <section class="ds-ev"><div class="sec-h"><h2>الأدلة الثمانية</h2><span class="hint">الرقم بجوار العنوان: إسهام الدليل في درجة قوة الأدلة</span></div><div class="ev-grid">${evidence(q, a)}</div></section>
      <section class="ds-bottom"><div class="decide" id="decide">${decideHTML(q)}</div>
        <div class="memo-col"><div class="sec-h"><h2>كتاب الرد</h2><span class="memo-tools"><span class="hint" id="memo-state">${st.dec[q.id] ? 'يعكس القرار المسجَّل' : 'مسودة تتغيّر مع اختيارك'}</span>
          <button class="btn small" data-act="memo-print">${BY.ico('print')} طباعة</button><button class="btn small" data-act="memo-export">${BY.ico('down')} تصدير</button></span></div>
          <div id="memo-wrap">${memoHTML(q)}</div></div></section>`; };
  BY.after.dossier = () => { const q = D.reqs[st.sel], df = $('#dc-diff'); if (df) { const x = (+BY.draftOf(q).approved || 0) - q.a.N; df.innerHTML = x ? `${L(CGB.signed(x))} عن التوصية` : 'مطابق للتوصية'; } };

  Object.assign(BY.ins, {
    'dc-num': el => { BY.draftOf(D.reqs[st.sel]).approved = el.value === '' ? '' : Math.round(+el.value); refreshMemo(); },
    'dc-reason': el => { BY.draftOf(D.reqs[st.sel]).reason = el.value; $('#dc-err').textContent = ''; refreshMemo(); },
    'dc-item': () => { BY.draftOf(D.reqs[st.sel]).items = BY.$$('.dc-items input:checked').map(i => i.value); refreshMemo(); },
  });
  Object.assign(BY.acts, {
    'dc-type': el => { BY.draftOf(D.reqs[st.sel]).type = el.dataset.type; refreshDecide(); const f = $('#dc-num') || $('#dc-reason'); if (f && el.dataset.type !== 'approve') f.focus(); },
    'dc-save': () => { const q = D.reqs[st.sel], a = q.a, dr = BY.draftOf(q), err = m => { $('#dc-err').textContent = m; };
      if (dr.type === 'amend') { const v = dr.approved, max = a.R + a.underAsk;
        if (v === '' || !Number.isInteger(+v) || +v < 0 || +v > max) { err(`أدخل عدداً صحيحاً بين 0 و${max}.`); $('#dc-num').focus(); return; }
        if (+v !== a.N && dr.reason.trim().length < 15) { err('اكتب سبب مخالفة التوصية (15 حرفاً على الأقل). يُحفظ السبب في السجل ويظهر في كتاب الرد.'); $('#dc-reason').focus(); return; } }
      if (dr.type === 'return' && !dr.items.length) { err('حدِّد بنداً واحداً على الأقل مطلوباً من الجهة.'); return; }
      const d = BY.decide(q, { type: dr.type, approved: +dr.approved, reason: dr.reason, items: dr.items }); BY.render();
      $('#decide').scrollIntoView({ block: 'center' }); BY.toast(`سُجِّل القرار: ${BY.STATUS[d.type]} — ${q.ref}`); },
    'dc-reopen': () => { const q = D.reqs[st.sel]; BY.reopen(q); BY.render(); $('#decide').scrollIntoView({ block: 'center' }); BY.toast('أُعيد فتح الطلب وسُجِّل ذلك في السجل', 'warn'); },
    'ds-step': el => { const list = BY.filtered(), ix = list.findIndex(x => x.id === st.sel), nx = list[ix + (+el.dataset.d)]; if (nx) BY.open(nx.id); },
    formulas: () => { st.formulas = !st.formulas; const y = window.scrollY; BY.render(); window.scrollTo(0, y); },
    'ev-jump': el => { const c = $('#ev-' + el.dataset.ev); if (!c) return; c.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash'); },
    'memo-print': () => BY.printMemo($('#memo-wrap').innerHTML),
    'memo-export': () => { const q = D.reqs[st.sel]; BY.exportBox('تصدير كتاب الرد', `bayyina-memo-${q.no}.txt`, $('#memo-wrap .memo').innerText.replace(/\n{3,}/g, '\n\n')); },
  });
})();
