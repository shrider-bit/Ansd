/* بيّنة — جولة العرض، درج المنهجية، التشغيل */
(() => {
  const { $, st, D } = BY, n = CGB.num, pct = CGB.pct;

  /* ---------- جولة العرض: ست محطات تروي القصة وتقود الواجهة ---------- */
  const sc = q => q.a.steps.filter(s => s.delta < 0).length * 100 + (q.a.grade === 'strong' ? 150 : 0) + Math.min(q.a.R, 60);
  const showcase = () => { const pick = D.reqs.filter(q => BY.status(q) === 'open' && q.a.lane === 'deep' && q.a.hasW && q.a.R >= 18 && q.a.N >= 3)
      .sort((x, y) => sc(y) - sc(x))[0]; return pick || D.reqs.find(q => BY.status(q) === 'open'); };
  BY.showcaseId = () => showcase().id;
  const STEPS = [
    { sel: '#cycle', pre: () => { Object.assign(st, { lane: 'all', find: '', sector: '', status: '', sort: 'lane' }); BY.go('inbox'); },
      t: 'كل طلب يصل ومعه أدلته', b: () => { const t = BY.totals(); return `وصل ${n(D.reqs.length)} طلباً بمجموع ${n(t.R)} وظيفة. جمعت «بيّنة» أدلة كل طلب وطبّقت القواعد نفسها على الجميع: ${n(t.N)} وظيفة فقط تحتاج إلى استحداث، و${n(t.fill + t.rd + t.au)} تُغطّى من وظائف قائمة أو تدوير أو أتمتة، و${n(t.unsup)} لا تؤيّدها الأدلة.`; } },
    { sel: '#lanes', pre: () => BY.go('inbox', true),
      t: 'ثلاثة مسارات بدل طابور واحد', b: () => `الطلبات الصغيرة ذات الأدلة القوية تُعتمد جماعياً من «المسار السريع»، والناقصة تُعاد إلى الجهة بقائمة ما ينقصها، ويبقى وقت المحلل للمراجعة المعمّقة. التقدير الحالي: ${n(Math.round(BY.hours().saved))} ساعة مراجعة موفَّرة في الدورة.` },
    { sel: '#wf', pre: () => { st.formulas = false; BY.open(showcase().id); },
      t: 'الشلّال: كيف صار المطلوب توصية', b: () => { const q = D.reqs[st.sel]; return `${q.entity.ar} طلبت ${n(q.a.R)} وظيفة. كل شريط دليل: الاحتياج المبرَّر بعبء العمل والمقارنة المرجعية، ثم ما يُسدّ بالإحلال والشواغر والتدوير والأتمتة. الباقي ${n(q.a.N)} وظيفة جديدة. اضغط أي شريط لترى دليله، أو أظهر الصيغ والمدخلات.`; } },
    { sel: '.ds-bottom', pre: () => { const q = D.reqs[st.sel]; BY.go('dossier', true); const d = BY.draftOf(q); d.type = 'amend'; d.approved = Math.min(q.a.R, q.a.N + 3); d.reason = ''; BY.render(); },
      t: 'القرار للمحلل، والمخالفة بسبب مكتوب', b: () => 'يستطيع المحلل اعتماد التوصية أو تعديلها أو إرجاء الطلب أو إعادته. إن خالف الأدلة صار السبب إلزامياً، ويُحفظ في السجل ويظهر في كتاب الرد الذي يُكتب تلقائياً من الأدلة ويُطبع جاهزاً.' },
    { sel: '#pf-top', pre: () => BY.go('portfolio'),
      t: 'السقف وخط القطع', b: () => 'حين يكون للاستحداث سقف، تُرتَّب كل الوظائف الموصى بها بقيمتها لكل ريال. حرِّك السقف لترى فوراً ما يدخل وما يخرج، وتوزيع ذلك على القطاعات. وفي أسفل الصفحة رسم يكشف القرارات الخارجة عن نسق مثيلاتها.' },
    { sel: '#lg-head', pre: () => BY.go('log'),
      t: 'كل قرار مسجَّل وقابل للمراجعة', b: () => `في السجل ${n(st.log.length)} قيداً، مع كل قرار وقته وسببه ولقطة من أدلته ساعة اتخاذه. يُصدَّر السجل إلى Excel، وتبقى المخالفات ظاهرة لرئيس القسم.` },
  ];
  let ix = 0;
  const place = () => { const s = STEPS[ix], el = $(s.sel), spot = $('#tour-spot'); if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY, head = $('.top').offsetHeight + 12;
    window.scrollTo({ top: Math.max(0, top - head), behavior: 'auto' });
    const r = el.getBoundingClientRect(); spot.style.cssText = `top:${r.top + window.scrollY - 6}px;left:${Math.max(4, r.left - 6)}px;width:${Math.min(window.innerWidth - 8, r.width + 12)}px;height:${r.height + 12}px`; };
  const show = () => { const s = STEPS[ix]; s.pre(); const c = $('#tour-card');
    c.innerHTML = `<p class="tc-step">المحطة ${n(ix + 1)} من ${n(STEPS.length)}</p><h3>${s.t}</h3><p>${s.b()}</p>
      <div class="tc-nav"><button class="btn ghost" data-act="tour-end">إنهاء الجولة</button><span><button class="btn" data-act="tour-prev" ${ix ? '' : 'disabled'}>السابق</button> <button class="btn primary" data-act="tour-next">${ix === STEPS.length - 1 ? 'إنهاء' : 'التالي'}</button></span></div>`;
    requestAnimationFrame(() => { place(); const b = c.querySelector('[data-act="tour-next"]'); if (b) b.focus({ preventScroll: true }); }); };
  BY.tourStart = () => { BY.tourOn = true; ix = 0; $('#tour').hidden = false; document.body.classList.add('touring'); show(); };
  BY.tourEnd = () => { BY.tourOn = false; $('#tour').hidden = true; document.body.classList.remove('touring'); const q = D.reqs[st.sel]; if (q && st.draft[q.id] && !st.draft[q.id].reason) delete st.draft[q.id]; BY.render(); };
  Object.assign(BY.acts, { tour: BY.tourStart, 'tour-end': BY.tourEnd, 'tour-prev': () => { if (ix) { ix--; show(); } }, 'tour-next': () => { if (ix < STEPS.length - 1) { ix++; show(); } else BY.tourEnd(); } });
  window.addEventListener('resize', () => { if (BY.tourOn) place(); });

  /* ---------- درج المنهجية ---------- */
  const K = BY.RULES, W = K.weights;
  $('#drawer-body').innerHTML = `
    <p class="lead">«بيّنة» مجموعة قواعد معلنة تُطبَّق بالطريقة نفسها على كل طلب. ليست ذكاءً اصطناعياً ولا نموذجاً تنبؤياً، وكل رقم فيها يمكن إعادة احتسابه يدوياً من مدخلاته المعروضة.</p>
    <p class="note-box">كل البيانات في هذا النموذج تجريبية افتراضية مولَّدة آلياً ببذرة ثابتة. أسماء الجهات محايدة، والأرقام لا تمثّل أي جهة حقيقية ولا إحصاءات رسمية.</p>
    <h4>من المطلوب إلى التوصية</h4>
    <ol><li><b>الاحتياج بعبء العمل:</b> يُسقَط حجم العمل على ${BY.CYCLE} بمتوسط نمو السنتين الأخيرتين، ويُقسم على المعدل المعياري لإنتاجية الموظف.</li>
      <li><b>الاحتياج بالمقارنة المرجعية:</b> الحجم المتوقع مقسوماً على وسيط إنتاجية الجهات المماثلة.</li>
      <li><b>الاحتياج المبرَّر:</b> ${L(`⌈${K.wWorkload} × عبء العمل + ${K.wBench} × المقارنة⌉`)} ناقص الموجود المتوقع (الكادر الحالي − مغادرو السنة)، ولا يتجاوز المطلوب. عند غياب بيانات الجهة يُعتمد تقدير المقارنة وحده.</li>
      <li><b>الإحلال:</b> من يغادر تبقى درجته في الملاك الوظيفي، فالتعيين مكانه لا يحتاج إلى استحداث.</li>
      <li><b>الشواغر المعتمدة:</b> تُشغل قبل أي استحداث.</li>
      <li><b>التدوير الداخلي:</b> يُعوَّل على ${pct(K.redeployRealisation)} من المرشحين ذوي الملاءمة 70% فأعلى؛ المنقول ينتقل بدرجته.</li>
      <li><b>البديل الرقمي:</b> المتبقي × قابلية أتمتة المجموعة × جاهزية مشروع الجهة، إن وُجد مشروع معتمد.</li>
      <li><b>التوصية:</b> ما بقي بعد ذلك وظائف جديدة. مدى الثقة نصف الفرق بين التقديرين.</li></ol>
    <h4>قوة الأدلة (0 إلى 100)</h4>
    <p>تقيس موثوقية قاعدة الأدلة، لا مقدار تأييدها للطلب. أوزانها: عبء العمل ${W.workload}، المقارنة المرجعية ${W.bench}، سجل الجهة ${W.track}، الشواغر ${W.vac}، المغادرون ${W.dep}، التدوير ${W.redeploy}، الكوادر الوطنية ${W.pipeline}، البديل الرقمي ${W.digital}. يخفض الدرجة تباعد التقديرين، وتذبذب سلسلة عبء العمل، وضعف سجل الاستغلال، ونقص المرفقات.</p>
    <p>قوية: ${K.strong} فأعلى · متوسطة: ${K.medium} إلى ${K.strong - 1} · ضعيفة: دون ${K.medium} · ناقصة: غابت بيانات عبء العمل أو مرفقان أساسيان.</p>
    <h4>المسارات</h4>
    <p><b>مسار سريع:</b> أدلة قوية، تقارب التقديرين ${pct(K.fast.minAgree)} فأعلى، طلب لا يتجاوز ${K.fast.maxPosts} وظيفة ولا تتجاوز كلفة الجديد ${CGB.qar(K.fast.maxCost)}، وسجل استغلال ${pct(K.fast.minUtil)} فأعلى. <b>أدلة ناقصة:</b> درجة «ناقصة». <b>مراجعة معمّقة:</b> ما عدا ذلك.</p>
    <h4>تخصيص المحفظة</h4>
    <p>خوارزمية «حقيبة الظهر» الجشعة على القيمة الحدّية: أولوية الطلب = أولوية القطاع × أولوية المجموعة × قوة الأدلة × شدة الاحتياج × سجل الجهة. تتناقص قيمة كل وظيفة إضافية في الطلب نفسه خطياً حتى النصف، وتُموَّل الوظائف بترتيب قيمتها لكل ريال حتى السقف. أوزان الأولوية افتراضات للعرض تحدّدها الإدارة عند التطبيق.</p>
    <h4>اتساق القرارات</h4>
    <p>تُقارَن نسبة المعتمد إلى المطلوب بنسبة ما أيّدته الأدلة. ما ابتعد أكثر من ${Math.round(K.consistencyBand * 100)} نقطة مئوية يُبرَز للمراجعة، ولا يُمنع.</p>
    <h4>تقدير الوقت</h4>
    <p>افتراضات قابلة للتعديل: ${K.hours.manual} ساعات للمراجعة اليدوية للطلب، ${K.hours.fast} ساعة للمسار السريع، ${K.hours.deep} للمراجعة المعمّقة، ${K.hours.missing} لطلب الأدلة الناقصة. تقدير للعرض وليس قياساً.</p>
    <h4>حدود النموذج</h4>
    <ul><li>المعدلات المعيارية وقابلية الأتمتة وأوزان الأولوية قيم افتراضية تحتاج إلى اعتماد من أصحاب الاختصاص.</li><li>لا يحفظ النموذج القرارات بعد إغلاق الصفحة، ولا يتصل بأي نظام.</li><li>كتاب الرد نموذج تجريبي غير صادر رسمياً، ولا يحمل شعاراً أو ختماً أو توقيعاً.</li></ul>`;
  function L(s) { return `<span class="ltr" dir="ltr">${s}</span>`; }

  /* ---------- التشغيل ---------- */
  BY.seed(); st.sel = showcase().id;
  const fromHash = () => { const h = location.hash.replace('#', ''); return BY.views[h] ? h : 'inbox'; };
  st.view = fromHash(); BY.render();
  window.addEventListener('hashchange', () => { const v = fromHash(); if (v !== st.view && !BY.tourOn) { st.view = v; BY.render(); } });
})();
