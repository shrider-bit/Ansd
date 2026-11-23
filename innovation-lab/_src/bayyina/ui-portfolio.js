/* بيّنة — ③ المحفظة: السقف وخط القطع، توزيع القطاعات، سجل الجهات، اتساق القرارات · ④ سجل القرارات */
(() => {
  const { $, st, D } = BY, n = CGB.num, esc = BY.txt.esc, pct = CGB.pct;
  const L = s => `<span class="ltr" dir="ltr">${s}</span>`;
  BY.items = () => D.reqs.map(q => ({ id: q.id, n: BY.approvedOf(q), cost: q.costPerPost, p: q.a.priority }));
  const full = () => { const it = BY.items(); return { posts: it.reduce((s, i) => s + i.n, 0), cost: it.reduce((s, i) => s + i.n * i.cost, 0) }; };
  BY.alloc = () => { const f = full(); if (!st.ceil) st.ceil = st.mode === 'posts' ? Math.round(f.posts * .7) : Math.round(f.cost * .7 / 1e5) * 1e5;
    st.ceil = Math.min(st.ceil, st.mode === 'posts' ? f.posts : Math.ceil(f.cost / 1e5) * 1e5); return BY.allocate(BY.items(), st.mode, st.ceil); };
  const ceilText = () => st.mode === 'posts' ? `${n(st.ceil)} وظيفة` : CGB.qar(st.ceil);

  const dyn = () => { const al = BY.alloc(), f = full(); let fullN = 0, part = 0, below = 0, decBelow = 0;
    const rows = D.reqs.filter(q => BY.approvedOf(q) > 0).map(q => { const want = BY.approvedOf(q), got = al.funded[q.id] || 0, dec = BY.status(q) !== 'open';
      if (got === want) fullN++; else if (got > 0) part++; else below++; if (dec && got < want) decBelow++;
      return { q, want, got, dec, top: q.a.priority / (q.costPerPost / 1e6) }; }).sort((a, b) => b.top - a.top);
    const sect = CGB.SECTORS.map(s => { const qs = D.reqs.filter(q => q.entity.sector === s.id);
      return { s, R: qs.reduce((t, q) => t + q.a.R, 0), want: qs.reduce((t, q) => t + BY.approvedOf(q), 0), got: qs.reduce((t, q) => t + (al.funded[q.id] || 0), 0) }; });
    const smax = Math.max(...sect.map(x => x.R));
    return `<div class="pf-kpis"><div><b>${n(al.usedPosts)}</b><span>وظيفة ضمن السقف من ${n(f.posts)}</span></div><div><b>${CGB.qar(al.usedCost)}</b><span>كلفتها السنوية من ${CGB.qar(f.cost)}</span></div>
        <div><b>${n(fullN)}</b><span>طلباً يُموَّل كاملاً</span></div><div><b>${n(part)}</b><span>يُموَّل جزئياً</span></div><div><b>${n(below)}</b><span>دون خط القطع</span></div>
        <div class="${decBelow ? 'warn' : ''}"><b>${n(decBelow)}</b><span>قراراً معتمداً يتجاوز السقف</span></div></div>
      <section class="pf-curve"><div class="sec-h"><h2>منحنى القيمة الحدّية وخط القطع</h2><span class="hint">كل درجة في المنحنى وظيفة؛ المظلَّل ما يتّسع له السقف</span></div>
        <div class="axis-y">قيمة الوظيفة لكل مليون ر.ق</div><div class="ch-scroll">${BY.ch.curve(al, st.mode)}</div><div class="axis-x">${st.mode === 'posts' ? 'الوظائف مرتّبة من الأعلى قيمة (عدد تراكمي)' : 'الكلفة السنوية التراكمية (مليون ر.ق) للوظائف مرتّبة من الأعلى قيمة'}</div>
        <p class="rule-note">${BY.ico('info')} خوارزمية «حقيبة الظهر» الجشعة على القيمة الحدّية: تُرتَّب الوظائف بقيمتها لكل ريال (أولوية القطاع والمجموعة × قوة الأدلة × شدة الاحتياج × سجل الجهة) وتتناقص قيمة كل وظيفة إضافية في الطلب نفسه، ثم يُموَّل الترتيب حتى السقف.</p></section>
      <section class="pf-two"><div class="pf-rank"><div class="sec-h"><h2>ترتيب الطلبات</h2><span class="hint">${n(rows.length)} طلباً فيها استحداث</span></div>
          <div class="tbl-wrap tall"><table class="tbl"><thead><tr><th>الطلب</th><th>الجهة والوحدة</th><th>الأولوية</th><th>ضمن السقف</th><th>الموقع</th></tr></thead><tbody>
          ${rows.map(r => `<tr class="${r.got === 0 ? 'below' : r.got < r.want ? 'partial' : ''}" data-act="open" data-id="${r.q.id}" tabindex="0" role="button"><td>${r.q.ref}${r.dec ? ' <span class="dot" title="بُتَّ فيه"></span>' : ''}</td><td>${r.q.entity.ar}<small>${esc(r.q.unit)}</small></td><td>${n(r.q.a.priority)}</td>
            <td class="nw"><span class="fund"><i style="width:${r.got / r.want * 100}%"></i></span> ${L(`${r.got} / ${r.want}`)}</td><td>${r.got === r.want ? 'فوق الخط' : r.got ? 'على الخط' : 'دون الخط'}</td></tr>`).join('')}</tbody></table></div></div>
        <div class="pf-sector"><div class="sec-h"><h2>التوزيع على القطاعات</h2></div><ul class="sect">${sect.map(x => `<li><span>${x.s.ar}</span><div class="sbar"><i class="sb-r" style="width:${x.R / smax * 100}%"></i><i class="sb-w" style="width:${x.want / smax * 100}%"></i><i class="sb-g" style="width:${x.got / smax * 100}%"></i></div><b>${n(x.got)}</b><small>من ${n(x.want)} · طُلب ${n(x.R)}</small></li>`).join('')}</ul>
          <p class="leg3"><i class="sb-g"></i>ضمن السقف <i class="sb-w"></i>موصى به أو معتمد <i class="sb-r"></i>مطلوب</p></div></section>`; };

  BY.views.portfolio = () => { const f = full(); BY.alloc(); const max = st.mode === 'posts' ? f.posts : Math.ceil(f.cost / 1e5) * 1e5, step = st.mode === 'posts' ? 1 : 1e5;
    const decided = D.reqs.filter(q => ['approve', 'amend', 'defer'].includes(BY.status(q))).map(q => ({ id: q.id, a: q.a, approved: BY.approvedOf(q) }));
    const pts = BY.consistency(decided), outs = pts.filter(p => p.out);
    const ents = CGB.ENTITIES.map(e => ({ e, t: D.track[e.id] })).sort((a, b) => b.t.util - a.t.util);
    return `<section class="pf-top" id="pf-top"><div class="pf-ctrl"><span class="eyebrow">سقف الاستحداث في خطة ${BY.CYCLE}</span>
        <div class="seg" role="group" aria-label="نوع السقف"><button class="${st.mode === 'posts' ? 'on' : ''}" data-act="pf-mode" data-mode="posts" aria-pressed="${st.mode === 'posts'}">بعدد الوظائف</button><button class="${st.mode === 'budget' ? 'on' : ''}" data-act="pf-mode" data-mode="budget" aria-pressed="${st.mode === 'budget'}">بالكلفة السنوية</button></div>
        <p class="ceil-out"><output id="ceil-out" for="pf-ceil">${ceilText()}</output></p>
        <input type="range" id="pf-ceil" min="0" max="${max}" step="${step}" value="${st.ceil}" data-in="ceil" aria-label="السقف"><p class="ceil-scale"><span>0</span><span>كل الموصى به: ${st.mode === 'posts' ? n(max) + ' وظيفة' : CGB.qar(max)}</span></p>
        <p class="hint">حرِّك السقف لترى ما يدخل وما يخرج. يشمل الحساب المعتمد فعلاً والموصى به لما لم يُبتّ فيه.</p></div>
      </section><div id="pf-dyn">${dyn()}</div>
      <section class="pf-two"><div class="pf-cons" id="pf-cons"><div class="sec-h"><h2>اتساق القرارات</h2><span class="hint">${n(pts.length)} قراراً</span></div>
          <div class="cons-wrap"><div class="axis-y">نسبة المعتمد إلى المطلوب</div>${BY.ch.scatter(pts)}<div class="axis-x">نسبة ما أيّدته الأدلة إلى المطلوب</div></div>
          <p class="leg3 shapes"><span class="sh-c"></span>أدلة قوية <span class="sh-s"></span>متوسطة <span class="sh-t"></span>ضعيفة <span class="sh-o"></span>خارج النطاق (±${Math.round(BY.RULES.consistencyBand * 100)} نقطة)</p>
          ${outs.length ? `<ul class="outs">${outs.map(p => { const q = D.reqs[p.id], d = st.dec[p.id]; return `<li data-act="open" data-id="${p.id}" tabindex="0" role="button"><b>${q.ref}</b> ${q.entity.ar}: اعتُمد ${n(d.approved)} والتوصية ${n(q.a.N)} من ${n(q.a.R)} مطلوبة${p.generousOnWeak ? ' <em>زيادة مع أدلة غير قوية</em>' : ''}<small>${esc(d.reason || '')}</small></li>`; }).join('')}</ul>` : '<p class="hint">كل القرارات ضمن النطاق.</p>'}</div>
        <div class="pf-track"><div class="sec-h"><h2>مؤشر دقة الطلبات</h2><span class="hint">ما شغلته كل جهة مما اعتُمد لها في الدورتين السابقتين</span></div>
          <ul class="track">${ents.map(x => `<li class="${x.t.util < BY.RULES.phasedBelow ? 'low' : ''}"><span>${x.e.ar}</span><div class="tbar"><i style="width:${x.t.util * 100}%"></i></div><b>${pct(x.t.util)}</b></li>`).join('')}</ul>
          <p class="hint">دون ${pct(BY.RULES.phasedBelow)}: يصبح الاعتماد مرحلياً وتنخفض أولوية الطلب.</p></div></section>`; };
  Object.assign(BY.ins, { ceil: el => { st.ceil = +el.value; $('#ceil-out').textContent = ceilText(); $('#pf-dyn').innerHTML = dyn(); } });
  Object.assign(BY.acts, { 'pf-mode': el => { if (st.mode === el.dataset.mode) return; const f = full(), share = st.mode === 'posts' ? st.ceil / (f.posts || 1) : st.ceil / (f.cost || 1);
    st.mode = el.dataset.mode; st.ceil = st.mode === 'posts' ? Math.round(f.posts * share) : Math.round(f.cost * share / 1e5) * 1e5; BY.render(); } });

  /* ---------- ④ سجل القرارات ---------- */
  BY.views.log = () => { const list = st.log.filter(l => !st.logType || (st.logType === 'override' ? l.override : l.type === st.logType));
    const fastOpen = D.reqs.filter(q => q.a.lane === 'fast' && BY.status(q) === 'open').length, opt = (v, l) => `<option value="${v}"${st.logType === v ? ' selected' : ''}>${l}</option>`;
    return `<section class="lg-head" id="lg-head"><div><span class="eyebrow">أثر تدقيق كامل</span><h1>سجل القرارات</h1>
        <p>كل قرار يُحفظ بوقته وسببه ولقطة من أدلته ساعة اتخاذه. لا يُحذف قيد ولا يُعدَّل.</p></div>
      <ul class="lg-stats"><li><b>${n(st.log.length)}</b>قيداً</li><li><b>${n(st.log.filter(l => l.override).length)}</b>مخالفة للتوصية بسبب مكتوب</li><li><b>${n(st.log.filter(l => l.bulk).length)}</b>باعتماد جماعي</li></ul>
      <div class="lg-tools"><label><span class="sr">نوع القيد</span><select id="lg-type" data-ch="log-type">${opt('', 'كل القيود')}${opt('approve', 'معتمد وفق التوصية')}${opt('override', 'مخالف للتوصية')}${opt('defer', 'مُرجأ')}${opt('return', 'أُعيد للاستكمال')}${opt('reopen', 'إعادة فتح')}</select></label>
        <button class="btn" data-act="log-export">${BY.ico('down')} تصدير CSV</button><button class="btn primary" data-act="bulk" ${fastOpen ? '' : 'disabled'}>${BY.ico('fast')} اعتماد المسار السريع (${n(fastOpen)})</button></div></section>
      <div class="tbl-wrap"><table class="tbl log"><thead><tr><th>الوقت</th><th>الطلب</th><th>الجهة والوحدة</th><th>القرار</th><th>المطلوب</th><th>التوصية</th><th>المعتمد</th><th>السبب</th><th><span class="sr">لقطة الأدلة</span></th></tr></thead><tbody>
      ${list.map((l, i) => { const k = l.t.getTime() + '-' + l.id + '-' + l.type, open = st.logOpen === k;
        return `<tr class="${l.override ? 'ovr' : ''}"><td>${BY.fmtTime(l.t)}</td><td><button class="link" data-act="open" data-id="${l.id}">${l.ref}</button></td><td>${l.entity}<small>${esc(l.unit)}</small></td>
          <td><span class="pill st-${l.type}">${BY.STATUS[l.type]}</span>${l.bulk ? '<small>اعتماد جماعي</small>' : ''}</td><td>${n(l.requested)}</td><td>${n(l.recommended)}</td><td><b>${l.approved == null || l.type === 'defer' || l.type === 'return' ? '—' : n(l.approved)}</b></td>
          <td class="why">${esc(l.reason || '—')}</td><td><button class="btn small" data-act="log-snap" data-k="${k}" aria-expanded="${open}">${open ? 'إخفاء' : 'الأدلة'}</button></td></tr>
          ${open ? `<tr class="snap"><td colspan="9"><dl><div><dt>قوة الأدلة ساعة القرار</dt><dd>${l.snap.score} من 100 (${BY.GRADES[l.snap.grade]})</dd></div><div><dt>المسار</dt><dd>${BY.LANES[l.snap.lane]}</dd></div><div><dt>تقدير عبء العمل</dt><dd>${l.snap.W == null ? 'لم يرد' : n(l.snap.W)}</dd></div><div><dt>تقدير المقارنة المرجعية</dt><dd>${n(l.snap.B)}</dd></div><div><dt>الاحتياج المبرَّر</dt><dd>${n(l.snap.J)}</dd></div><div><dt>مدى الثقة</dt><dd>من ${n(l.snap.conf[0])} إلى ${n(l.snap.conf[1])}</dd></div><div><dt>بواسطة</dt><dd>${l.by}</dd></div></dl></td></tr>` : ''}`; }).join('') || '<tr><td colspan="9" class="empty">لا قيود من هذا النوع.</td></tr>'}
      </tbody></table></div>`; };
  Object.assign(BY.ins, { 'log-type': el => { st.logType = el.value; BY.render(); } });
  Object.assign(BY.acts, {
    'log-snap': el => { st.logOpen = st.logOpen === el.dataset.k ? null : el.dataset.k; const y = window.scrollY; BY.render(); window.scrollTo(0, y); },
    'log-export': () => { const rows = [['الوقت', 'رقم الطلب', 'الجهة', 'الوحدة', 'القرار', 'المطلوب', 'التوصية', 'المعتمد', 'شغل وظائف قائمة', 'تدوير داخلي', 'بديل رقمي', 'مخالف للتوصية', 'اعتماد جماعي', 'السبب', 'قوة الأدلة', 'درجة القوة', 'المسار', 'تقدير عبء العمل', 'تقدير المقارنة', 'بواسطة']];
      st.log.forEach(l => rows.push([BY.fmtTime(l.t), l.ref, l.entity, l.unit, BY.STATUS[l.type], l.requested, l.recommended, l.approved == null ? '' : l.approved, l.fill || 0, l.redeploy || 0, l.digital || 0, l.override ? 'نعم' : 'لا', l.bulk ? 'نعم' : 'لا', l.reason || '', l.snap.score, BY.GRADES[l.snap.grade], BY.LANES[l.snap.lane], l.snap.W == null ? '' : l.snap.W, l.snap.B, l.by]));
      BY.exportBox('تصدير سجل القرارات', 'bayyina-decision-log.csv', BY.csv(rows), 'text/csv;charset=utf-8'); },
  });
})();
