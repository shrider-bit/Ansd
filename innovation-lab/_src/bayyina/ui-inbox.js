/* بيّنة — ① صندوق الطلبات */
(() => {
  const { $, st, D } = BY, n = CGB.num, esc = BY.txt.esc;
  const LANE_DESC = { fast: 'أدلة قوية ومتسقة وطلب صغير؛ يُعتمد وفق التوصية بنقرة واحدة.', deep: 'حجم كبير أو أدلة متباينة؛ يحتاج إلى نظر المحلل.', missing: 'لا يُبتّ فيه قبل أن تستكمل الجهة بياناتها.' };
  const maxR = Math.max(...D.reqs.map(q => q.requested));

  BY.totals = () => { const t = { R: 0, N: 0, fill: 0, rd: 0, au: 0, decided: 0, byType: {} };
    D.reqs.forEach(q => { t.R += q.a.R; t.N += q.a.N; t.fill += q.a.fill; t.rd += q.a.useRd; t.au += q.a.useAu; const s = BY.status(q); if (s !== 'open') { t.decided++; t.byType[s] = (t.byType[s] || 0) + 1; } });
    t.unsup = t.R - t.N - t.fill - t.rd - t.au; return t; };
  BY.hours = () => { const h = Object.assign({}, BY.RULES.hours, st.hours); return BY.reviewHours(D.reqs, h); };

  BY.filtered = () => { const f = CGB.normAr(st.find);
    let list = D.reqs.filter(q => (st.lane === 'all' || q.a.lane === st.lane) && (!st.sector || q.entity.sector === st.sector)
      && (!st.status || (st.status === 'decided' ? BY.status(q) !== 'open' : BY.status(q) === st.status))
      && (!f || CGB.normAr(`${q.ref} ${q.entity.ar} ${q.unit} ${q.fam.ar}`).includes(f)));
    const order = { fast: 0, deep: 1, missing: 2 }, by = {
      lane: (a, b) => order[a.a.lane] - order[b.a.lane] || b.a.priority - a.a.priority,
      priority: (a, b) => b.a.priority - a.a.priority, size: (a, b) => b.a.R - a.a.R,
      gap: (a, b) => (b.a.R - b.a.N - b.a.covered) - (a.a.R - a.a.N - a.a.covered), date: (a, b) => a.submitted - b.submitted };
    return list.sort(by[st.sort]); };

  const row = q => { const a = q.a, s = BY.status(q), d = st.dec[q.id], shown = d && (s === 'approve' || s === 'amend') ? d.approved : a.N;
    return `<article class="req st-${s}" data-act="open" data-id="${q.id}" role="button" tabindex="0" aria-label="فتح ملف الطلب ${q.ref}">
      <div class="rq-ref"><b>${q.ref}</b><span>${CGB.gdate(q.submitted)}</span></div>
      <div class="rq-who"><b>${q.entity.ar}</b><span>${esc(q.unit)}</span></div>
      <div class="rq-fam"><span>${q.fam.ar}</span><small>${q.band.ar} · ${BY.JUST[q.justType].ar}</small></div>
      <div class="rq-num"><span class="rq-R" title="المطلوب">${n(a.R)}</span>${BY.ch.reqbar(a, maxR)}<span class="rq-N${s === 'amend' ? ' amended' : ''}" title="${s === 'open' ? 'الموصى باستحداثه' : 'المعتمد'}">${s === 'defer' || s === 'return' ? '—' : n(shown)}</span></div>
      <div class="rq-ev">${BY.ch.meter(a)}</div>
      <div class="rq-cost">${a.N ? CGB.qar(a.newCost) : '—'}</div>
      <div class="rq-st"><span class="pill st-${s}">${BY.STATUS[s]}</span></div>
    </article>`; };

  BY.listHTML = () => { const list = BY.filtered(); if (!list.length) return `<div class="empty">لا طلبات تطابق عوامل التصفية. <button class="link" data-act="clear-filters">إزالة التصفية</button></div>`;
    let h = '', last = null; const group = st.sort === 'lane' && st.lane === 'all';
    list.forEach(q => { if (group && q.a.lane !== last) { last = q.a.lane; const c = list.filter(x => x.a.lane === last).length;
      h += `<h3 class="lane-sep ln-${last}"><span class="ln-ico">${BY.ico(last)}</span>${BY.LANES[last]} <em>${n(c)}</em><small>${LANE_DESC[last]}</small></h3>`; } h += row(q); });
    return h; };

  BY.views.inbox = () => { const t = BY.totals(), h = BY.hours(), seg = (v, c, l) => v ? `<i class="sp-${c}" style="flex:${v}" title="${l}: ${n(v)}"></i>` : '';
    const lanes = ['fast', 'deep', 'missing'].map(l => { const all = D.reqs.filter(q => q.a.lane === l), open = all.filter(q => BY.status(q) === 'open').length;
      return `<button class="lane ln-${l}${st.lane === l ? ' on' : ''}" data-act="lane" data-lane="${l}" aria-pressed="${st.lane === l}">
        <span class="ln-top"><span class="ln-ico">${BY.ico(l)}</span><span class="ln-name">${BY.LANES[l]}</span><b>${n(all.length)}</b></span>
        <span class="ln-desc">${LANE_DESC[l]}</span><span class="ln-open">${open ? `${n(open)} بانتظار البتّ` : 'اكتمل البتّ'} · ${n(all.reduce((s, q) => s + q.a.R, 0))} وظيفة مطلوبة</span></button>`; }).join('');
    const fastOpen = D.reqs.filter(q => q.a.lane === 'fast' && BY.status(q) === 'open').length;
    const opt = (v, l, cur) => `<option value="${v}"${cur === v ? ' selected' : ''}>${l}</option>`;
    return `<section class="cycle" id="cycle">
      <div class="cy-head"><span class="eyebrow">دورة التخطيط السنوية</span><h1>خطة القوى العاملة ${BY.CYCLE}</h1>
        <p>${n(D.reqs.length)} طلباً من ${n(CGB.ENTITIES.length)} جهة · بُتَّ في <b>${n(t.decided)}</b> منها</p>
        <div class="progress" role="img" aria-label="تقدّم البتّ">${seg(t.byType.approve || 0, 'approve', 'معتمد وفق التوصية')}${seg(t.byType.amend || 0, 'amend', 'معتمد بتعديل')}${seg(t.byType.defer || 0, 'defer', 'مُرجأ')}${seg(t.byType.return || 0, 'return', 'أُعيد للاستكمال')}${seg(D.reqs.length - t.decided, 'open', 'قيد المراجعة')}</div></div>
      <div class="cy-split" id="cy-split"><span class="eyebrow">ما الذي تؤيّده الأدلة من ${n(t.R)} وظيفة مطلوبة؟</span>
        <div class="splitbar" role="img" aria-label="تفكيك الوظائف المطلوبة">${seg(t.N, 'new', 'استحداث جديد')}${seg(t.fill, 'fill', 'شغل وظائف قائمة')}${seg(t.rd, 'rd', 'تدوير داخلي')}${seg(t.au, 'au', 'بديل رقمي')}${seg(t.unsup, 'un', 'غير مؤيَّد بالأدلة')}</div>
        <ul class="split-leg"><li class="lg-new"><b>${n(t.N)}</b>استحداث جديد</li><li class="lg-fill"><b>${n(t.fill)}</b>شغل وظائف قائمة</li><li class="lg-rd"><b>${n(t.rd)}</b>تدوير داخلي</li><li class="lg-au"><b>${n(t.au)}</b>بديل رقمي</li><li class="lg-un"><b>${n(t.unsup)}</b>غير مؤيَّد بالأدلة</li></ul></div>
      <div class="cy-hours"><span class="eyebrow">وقت المراجعة · تقدير</span><p class="big"><b>${n(Math.round(h.saved))}</b> ساعة موفَّرة</p>
        <p>${n(h.manual)} ساعة يدوياً مقابل ${n(Math.round(h.assisted))} بمساندة القواعد</p><button class="link" data-act="hours">الافتراضات قابلة للتعديل</button></div>
    </section>
    <section class="lanes" id="lanes" aria-label="مسارات المراجعة">${lanes}</section>
    <section class="reqs">
      <div class="toolbar">
        <label class="search"><span class="sr">بحث</span><input id="f-find" type="search" data-in="find" placeholder="ابحث برقم الطلب أو الجهة أو الوحدة" value="${esc(st.find)}"></label>
        <label><span class="sr">القطاع</span><select id="f-sector" data-ch="sector">${opt('', 'كل القطاعات', st.sector)}${CGB.SECTORS.map(s => opt(s.id, s.ar, st.sector)).join('')}</select></label>
        <label><span class="sr">الحالة</span><select id="f-status" data-ch="status">${opt('', 'كل الحالات', st.status)}${opt('open', 'قيد المراجعة', st.status)}${opt('decided', 'بُتَّ فيها', st.status)}${opt('amend', 'معتمد بتعديل', st.status)}${opt('defer', 'مُرجأ', st.status)}${opt('return', 'أُعيد للاستكمال', st.status)}</select></label>
        <label><span class="sr">الترتيب</span><select id="f-sort" data-ch="sort">${opt('lane', 'الترتيب: المسار ثم الأولوية', st.sort)}${opt('priority', 'الترتيب: الأولوية', st.sort)}${opt('size', 'الترتيب: الأكبر عدداً', st.sort)}${opt('gap', 'الترتيب: الأبعد عن الأدلة', st.sort)}${opt('date', 'الترتيب: تاريخ التقديم', st.sort)}</select></label>
        ${st.lane !== 'all' ? `<button class="chip" data-act="lane" data-lane="all">${BY.LANES[st.lane]} ${BY.ico('x')}</button>` : ''}
        <span class="tb-count" id="req-count"></span>
        <button class="btn primary" id="bulk-btn" data-act="bulk" ${fastOpen ? '' : 'disabled'}>${BY.ico('fast')} اعتماد المسار السريع (${n(fastOpen)})</button>
      </div>
      <div class="req-head" aria-hidden="true"><span>الطلب</span><span>الجهة والوحدة</span><span>المجموعة والمسوّغ</span><span>المطلوب ← الموصى به</span><span>قوة الأدلة</span><span>كلفة الجديد سنوياً</span><span>الحالة</span></div>
      <div id="req-list">${BY.listHTML()}</div>
    </section>`; };
  const refreshList = () => { $('#req-list').innerHTML = BY.listHTML(); $('#req-count').textContent = `${n(BY.filtered().length)} طلباً`; };
  BY.after.inbox = () => { $('#req-count').textContent = `${n(BY.filtered().length)} طلباً`; };

  Object.assign(BY.ins, { find: el => { st.find = el.value; refreshList(); }, sector: el => { st.sector = el.value; refreshList(); },
    status: el => { st.status = el.value; refreshList(); }, sort: el => { st.sort = el.value; refreshList(); },
    'h-manual': el => { st.hours.manual = Math.max(1, +el.value || 1); hoursOut(); }, 'h-deep': el => { st.hours.deep = Math.max(.5, +el.value || .5); hoursOut(); } });
  const hoursOut = () => { const h = BY.hours(), o = $('#hours-out'); if (o) o.innerHTML = `${n(h.manual)} ساعة يدوياً − ${n(Math.round(h.assisted))} بمساندة القواعد = <b>${n(Math.round(h.saved))} ساعة</b> (نحو ${n(Math.round(h.saved / 7))} يوم عمل)`; };
  Object.assign(BY.acts, {
    lane: el => { st.lane = st.lane === el.dataset.lane ? 'all' : el.dataset.lane; BY.render(); },
    'clear-filters': () => { Object.assign(st, { lane: 'all', find: '', sector: '', status: '' }); BY.render(); },
    hours: () => { const K = BY.RULES.hours; BY.modal({ title: 'افتراضات تقدير وقت المراجعة',
      body: `<p class="hint">تقدير تقريبي لأغراض العرض، وليس قياساً فعلياً. عدِّل الافتراضين بما يوافق واقع العمل لديكم.</p>
        <div class="form-row"><label for="h-manual">ساعات مراجعة الطلب الواحد يدوياً</label><input id="h-manual" type="number" min="1" max="40" step="0.5" value="${st.hours.manual}" data-in="h-manual"></div>
        <div class="form-row"><label for="h-deep">ساعات المراجعة المعمّقة بمساندة القواعد</label><input id="h-deep" type="number" min="0.5" max="20" step="0.5" value="${st.hours.deep}" data-in="h-deep"></div>
        <p class="hint">ثابتان: المسار السريع ${K.fast} ساعة للطلب، وطلب الأدلة الناقصة ${K.missing} ساعة.</p><p class="calc" id="hours-out"></p>`,
      foot: `<button class="btn primary" data-act="hours-done">تطبيق</button>` }); hoursOut(); },
    'hours-done': () => { BY.closeModal(); BY.render(); },
    bulk: () => { const list = D.reqs.filter(q => q.a.lane === 'fast' && BY.status(q) === 'open'); if (!list.length) return;
      BY.modal({ title: `اعتماد المسار السريع وفق التوصية (${n(list.length)} طلباً)`, wide: true,
        body: `<p class="hint">هذه الطلبات استوفت شروط المسار السريع: أدلة قوية، تقديران متقاربان، طلب لا يتجاوز ${BY.RULES.fast.maxPosts} وظيفة، وسجل استغلال لا يقل عن ${CGB.pct(BY.RULES.fast.minUtil)}. يُسجَّل لكل طلب قرار مستقل في السجل.</p>
          <div class="tbl-wrap"><table class="tbl"><thead><tr><th>الطلب</th><th>الجهة</th><th>الوحدة</th><th>المطلوب</th><th>استحداث جديد</th><th>شغل قائم وتدوير</th></tr></thead><tbody>
          ${list.map(q => `<tr><td>${q.ref}</td><td>${q.entity.ar}</td><td>${esc(q.unit)}</td><td>${n(q.a.R)}</td><td><b>${n(q.a.N)}</b></td><td>${n(q.a.fill + q.a.useRd)}</td></tr>`).join('')}
          </tbody><tfoot><tr><td colspan="3">المجموع</td><td>${n(list.reduce((s, q) => s + q.a.R, 0))}</td><td><b>${n(list.reduce((s, q) => s + q.a.N, 0))}</b></td><td>${n(list.reduce((s, q) => s + q.a.fill + q.a.useRd, 0))}</td></tr></tfoot></table></div>`,
        foot: `<button class="btn primary" data-act="bulk-confirm">${BY.ico('check')} اعتماد الكل</button><button class="btn ghost" data-act="close-modal">تراجع</button>` }); },
    'bulk-confirm': () => { const list = D.reqs.filter(q => q.a.lane === 'fast' && BY.status(q) === 'open'); list.forEach(q => BY.decide(q, { type: 'approve' }, { bulk: true }));
      BY.closeModal(); BY.render(); BY.toast(`سُجِّل ${n(list.length)} قراراً في السجل`); },
  });
})();
