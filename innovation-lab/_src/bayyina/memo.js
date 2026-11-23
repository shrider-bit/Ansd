/* بيّنة — توليد كتاب الرد الرسمي من الأدلة والقرار (قوالب نصية ثابتة؛ لا توليد لغوي آلي). */
(() => {
  const n = CGB.num, esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // مطابقة العدد والمعدود: 1 مفرد، 2 مثنى، 3-10 جمع، 11+ مفرد
  const cnt = (v, one, two, plural, sing) => { const m = v % 100;
    return v === 1 ? one : v === 2 ? two : (m >= 3 && m <= 10) ? `(${n(v)}) ${plural}` : `(${n(v)}) ${sing}`; };
  const posts = v => cnt(v, 'وظيفة واحدة', 'وظيفتين', 'وظائف', 'وظيفة');
  const staff = v => cnt(v, 'موظف واحد', 'موظفَين', 'موظفين', 'موظفاً');
  const cands = v => cnt(v, 'مرشح واحد', 'مرشحَين', 'مرشحين', 'مرشحاً');
  const ORD = ['أولاً', 'ثانياً', 'ثالثاً', 'رابعاً', 'خامساً', 'سادساً'];
  BY.txt = { posts, staff, cands, esc };

  // القرار الفعلي المعروض في الكتاب: المسجَّل، أو مسودة المحلل، أو التوصية
  BY.effective = function (q, dec) {
    const a = q.a, type = dec ? dec.type : 'approve';
    const approved = type === 'approve' ? a.N : type === 'amend' ? Math.max(0, +dec.approved || 0) : 0;
    return { type, approved, reason: dec && dec.reason ? dec.reason.trim().replace(/[.،؛:\s]+$/, '') : '', items: dec && dec.items ? dec.items : a.missing,
      fill: type === 'defer' || type === 'return' ? 0 : a.fill, redeploy: type === 'defer' || type === 'return' ? 0 : a.useRd,
      digital: type === 'defer' || type === 'return' ? 0 : a.useAu };
  };

  BY.reasons = function (q, e) {
    const a = q.a, K = BY.RULES, out = [];
    if (a.hasW) out.push(['عبء العمل', `بلغ حجم ${q.fam.driver} ${n(q.workload.volume[2])} في عام 2026 بمتوسط نمو سنوي ${(a.g * 100).toFixed(1)}%، ويُتوقع أن يبلغ نحو ${n(Math.round(a.proj))} في عام 2027. وبالمعدل المعياري (${n(a.std)} لكل موظف) يلزم نحو ${staff(Math.ceil(a.Qw))}، مقابل ${staff(a.S)} حالياً.`]);
    else out.push(['عبء العمل', 'لم ترد بيانات عبء العمل للسنوات الثلاث الأخيرة، فاعتُمد في التقدير آخر حجم عمل موثّق لدينا مع نمو قطاعي افتراضي؛ وهو تقدير أولي يُحدَّث عند استكمال البيانات.']);
    out.push(['المقارنة المرجعية', `يبلغ وسيط الإنتاجية في ${n(q.bench.peers.length)} جهات مماثلة ${n(Math.round(a.med * 10) / 10, a.med < 100 ? 1 : 0)} لكل موظف${a.hasW ? `، مقابل ${n(Math.round(a.own * 10) / 10, a.own < 100 ? 1 : 0)} في الوحدة` : ''}؛ وبهذا الوسيط يلزم نحو ${staff(Math.ceil(a.Qb))}.`]);
    out.push(['الاحتياج المبرَّر', `${a.hasW ? 'بترجيح التقديرين (60% لعبء العمل و40% للمقارنة المرجعية)' : 'استناداً إلى تقدير المقارنة المرجعية وحده'}، وبعد احتساب المغادرين المتوقعين في عام 2027 (${n(a.dep1)})، ${a.Jraw ? `يبلغ الاحتياج ${posts(a.Jraw)}` : 'لا يظهر احتياج إضافي'}، مقابل (${n(a.R)}) مطلوبة.`]);
    if (a.useDep) out.push(['الإحلال', `يُغطّى من الاحتياج (${n(a.useDep)}) بالتعيين على الدرجات التي ستشغر بالتقاعد وانتهاء الخدمة؛ وهي قائمة في الملاك الوظيفي ولا تستلزم استحداثاً.`]);
    if (a.useVac) out.push(['الشواغر', `في ملاك الجهة شواغر معتمدة في المجموعة نفسها عددها (${n(q.vacancies.vacant)})، ومتوسط مدة شغورها ${n(q.vacancies.months)} شهراً، ويُشغل منها (${n(a.useVac)}) قبل أي استحداث.`]);
    if (a.useRd) out.push(['التدوير الداخلي', `يتوافر في جهات حكومية أخرى مرشحون بدرجة ملاءمة لا تقل عن 70% عددهم (${n(q.redeploy.suitable)})، ويُعوَّل على نقل أو ندب (${n(a.useRd)}) منهم.`]);
    if (a.useAu) out.push(['البديل الرقمي', `مشروع الأتمتة المعتمد لدى الجهة يغطي ما يعادل ${posts(a.useAu)} من الاحتياج المتبقي.`]);
    out.push(['سجل الاستغلال', `شغلت الجهة ${CGB.pct(q.track.util)} من الوظائف المعتمدة لها في الدورتين السابقتين (${n(q.track.filled)} من ${n(q.track.approved)}).`]);
    if (e.type === 'amend' && e.approved !== a.N) out.push(['تعديل التوصية', `رُئي اعتماد (${n(e.approved)}) بدلاً من (${n(a.N)}) الموصى بها، للاعتبار الآتي: «${esc(e.reason || '…')}».`]);
    return out;
  };

  BY.followups = function (q, e) {
    const a = q.a, K = BY.RULES, f = [];
    if (e.approved > 0) f.push('مباشرة إجراءات شغل الوظائف المستحدثة خلال عام 2027 وإفادتنا بنسب الإنجاز كل ثلاثة أشهر.');
    if (a.phased && e.approved >= 2) f.push(`يُفرج عن ${posts(Math.ceil(e.approved / 2))} فوراً، وعن الباقي بعد شغل 80% من الدفعة الأولى، نظراً إلى انخفاض نسبة استغلال الموافقات السابقة.`);
    if (e.fill) f.push('شغل الشواغر والدرجات المشار إليها خلال ستة أشهر من تاريخه.');
    if (e.redeploy) f.push('التنسيق معنا لترشيح الموظفين المناسبين للنقل أو الندب.');
    if (e.digital) f.push('موافاتنا بخطة تنفيذ مشروع الأتمتة ومواعيد تشغيله.');
    if (e.approved > 0 && a.pipe === 'good') f.push(`إعطاء الأولوية في التعيين للباحثين عن عمل من القطريين المسجَّلين في التخصص (المتاح حالياً: ${n(q.pipeline.seekers)}).`);
    if (e.approved > 0 && a.pipe !== 'good') f.push('نظراً إلى قلة الباحثين عن عمل في هذا التخصص، يُنصح بربط الوظائف ببرنامج تأهيل أو ابتعاث.');
    if (a.stale > 0) f.push(`مراجعة الشواغر التي تجاوزت مدة شغورها ${K.staleMonths} شهراً (${n(a.stale)})، تمهيداً لإلغائها أو إعادة توزيعها.`);
    if (a.underAsk) f.push(`تشير البيانات إلى احتياج يزيد على المطلوب بنحو ${posts(a.underAsk)}؛ وللجهة التقدّم بطلب تكميلي مدعوم ببياناته.`);
    f.push('تحديث بيانات عبء العمل في نهاية كل ربع سنة.');
    return f;
  };

  BY.memo = function (q, dec, decided) {
    const a = q.a, e = BY.effective(q, dec), today = decided && dec.t ? dec.t : new Date();
    const intro = `بالإشارة إلى كتابكم المؤرخ ${CGB.gdate(q.submitted)}م بشأن طلب استحداث ${posts(a.R)} في ${esc(q.unit)} ضمن خطة القوى العاملة لعام ${BY.CYCLE}، `, studied = `نفيدكم بأن الطلب دُرس في ضوء ${a.hasW ? 'بيانات عبء العمل' : 'البيانات المتاحة لدينا'} والمقارنات المرجعية ووضع الملاك الوظيفي للجهة، `;
    let body = '';
    if (e.type === 'return') {
      body = `<p>${intro}نفيدكم بأن البتّ في الطلب يتوقف على استكمال الآتي:</p><ol class="memo-dec">${(e.items.length ? e.items : ['—']).map(x => `<li>${esc(x)}.</li>`).join('')}</ol>
        <p>وعليه يُعاد الطلب إليكم لاستكماله خلال (15) يوم عمل من تاريخه، وسيُنظر فيه فور ورود المطلوب دون حاجة إلى تقديمه من جديد.</p>`;
    } else if (e.type === 'defer') {
      body = `<p>${intro}${studied}وانتهت الدراسة إلى إرجاء البتّ فيه إلى الدورة التخطيطية التالية${e.reason ? `، للاعتبار الآتي: «${esc(e.reason)}»` : ''}.</p>
        <p>ويبقى الطلب مقيَّداً لدينا برقمه المرجعي، ويُعاد عرضه تلقائياً مع بياناته المحدَّثة.</p>`;
    } else {
      const d = [];
      d.push(e.approved > 0 ? `الموافقة على استحداث ${posts(e.approved)} في مجموعة الوظائف «${q.fam.ar}» بمستوى «${q.band.ar}» في ${esc(q.unit)}.`
        : a.Jraw ? 'عدم استحداث وظائف جديدة في هذه الدورة؛ إذ يمكن تغطية الاحتياج المبرَّر بالوسائل المبيَّنة أدناه.' : 'عدم استحداث وظائف جديدة في هذه الدورة؛ إذ لا تُظهر الأدلة احتياجاً إضافياً في عام 2027.');
      if (e.fill) d.push(`شغل ${posts(e.fill)} من الملاك القائم للجهة${a.useDep && a.useVac ? ` (${n(a.useVac)} من الشواغر المعتمدة و${n(a.useDep)} على الدرجات التي ستشغر خلال العام)` : a.useDep ? ' على الدرجات التي ستشغر خلال العام' : ' من الشواغر المعتمدة'}.`);
      if (e.redeploy) d.push(`تغطية ${posts(e.redeploy)} بالنقل أو الندب من الكفاءات المتاحة في جهات حكومية أخرى.`);
      if (e.digital) d.push(`معالجة ما يعادل ${posts(e.digital)} بأتمتة الإجراءات ضمن مشروع الجهة الرقمي.`);
      body = `<p>${intro}${studied}وانتهت الدراسة إلى الآتي:</p><ol class="memo-dec">${d.map((x, i) => `<li><b>${ORD[i]}:</b> ${x}</li>`).join('')}</ol>
        <table class="memo-table"><thead><tr><th>المطلوب</th><th>استحداث جديد</th><th>شغل وظائف قائمة</th><th>تدوير داخلي</th><th>بديل رقمي</th><th>غير معتمد</th></tr></thead>
        <tbody><tr><td>${n(a.R)}</td><td><b>${n(e.approved)}</b></td><td>${n(e.fill)}</td><td>${n(e.redeploy)}</td><td>${n(e.digital)}</td><td>${n(Math.max(0, a.R - e.approved - e.fill - e.redeploy - e.digital))}</td></tr></tbody></table>
        <h4>أسانيد القرار</h4><ul class="memo-why">${BY.reasons(q, e).map(r => `<li><b>${r[0]}:</b> ${r[1]}</li>`).join('')}</ul>
        <h4>المطلوب من الجهة</h4><ol class="memo-follow">${BY.followups(q, e).map(x => `<li>${x}</li>`).join('')}</ol>`;
    }
    const subj = e.type === 'return' ? 'استكمال بيانات طلب استحداث وظائف' : e.type === 'defer' ? 'إرجاء البتّ في طلب استحداث وظائف' : 'الرد على طلب استحداث وظائف';
    return `<article class="memo" data-memo="${q.id}">
      <div class="memo-mark">نموذج تجريبي — غير صادر رسمياً</div>
      <header class="memo-head">
        <div class="memo-org"><b>الجهة المختصة بتخطيط القوى العاملة — نموذج</b><span>إدارة تخطيط القوى العاملة</span></div>
        <dl class="memo-meta"><div><dt>الرقم</dt><dd>${q.memoRef}</dd></div><div><dt>التاريخ</dt><dd>${CGB.bothDates(today)}</dd></div><div><dt>المرجع</dt><dd>طلبكم ${q.ref}</dd></div></dl>
      </header>
      <p class="memo-to">السادة / ${q.entity.ar} <span>المحترمين</span></p>
      <p class="memo-greet">السلام عليكم ورحمة الله وبركاته، وبعد،</p>
      <p class="memo-subject"><b>الموضوع:</b> ${subj} — ${esc(q.unit)} (خطة القوى العاملة ${BY.CYCLE})</p>
      ${body}
      <p class="memo-close">وتفضلوا بقبول فائق الاحترام والتقدير،</p>
      <div class="memo-sign"><b>مدير إدارة تخطيط القوى العاملة</b><span>خانة التوقيع — نموذج</span></div>
      <footer class="memo-foot">وثيقة مولَّدة من قواعد معلنة وبيانات تجريبية افتراضية لأغراض العرض. الأرقام لا تمثّل أي جهة حقيقية.</footer>
    </article>`;
  };
})();
