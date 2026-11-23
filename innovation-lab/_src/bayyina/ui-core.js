/* بيّنة — الحالة العامة، القرارات، السجل، النوافذ، التصدير، التنقل. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), n = CGB.num, esc = BY.txt.esc;
  BY.$ = $; BY.$$ = (s, r = document) => [...r.querySelectorAll(s)];
  const D = BY.D = BY.generate(); D.reqs.forEach(q => { q.a = BY.assess(q); });
  const st = BY.st = { view: 'inbox', lane: 'all', find: '', sector: '', status: '', sort: 'lane', sel: 0, dec: {}, draft: {}, log: [],
    mode: 'posts', ceil: 0, hours: { manual: BY.RULES.hours.manual, deep: BY.RULES.hours.deep }, formulas: false, logType: '', logOpen: null };
  BY.ANALYST = 'محلل التخطيط (حساب تجريبي)';
  BY.STATUS = { open: 'قيد المراجعة', approve: 'معتمد وفق التوصية', amend: 'معتمد بتعديل', defer: 'مُرجأ', return: 'أُعيد للاستكمال', reopen: 'أُعيد فتحه' };
  BY.status = q => st.dec[q.id] ? st.dec[q.id].type : 'open';
  BY.approvedOf = q => { const d = st.dec[q.id]; return !d ? q.a.N : (d.type === 'approve' || d.type === 'amend') ? d.approved : 0; };
  BY.ico = (name) => ({
    arrow: '<svg viewBox="0 0 16 16" class="ico"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 16 16" class="ico"><path d="m3 8.5 3.2 3.2L13 4.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    x: '<svg viewBox="0 0 16 16" class="ico"><path d="m4 4 8 8m0-8-8 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    down: '<svg viewBox="0 0 16 16" class="ico"><path d="M8 2v8m0 0L4.8 6.8M8 10l3.2-3.2M3 13h10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    print: '<svg viewBox="0 0 16 16" class="ico"><path d="M4.5 6V2.5h7V6M4.5 11.5h-2V6h11v5.5h-2M4.5 9.5h7v4h-7z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    copy: '<svg viewBox="0 0 16 16" class="ico"><path d="M5.5 5.5v-3h8v8h-3M2.5 5.5h8v8h-8z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    fast: '<svg viewBox="0 0 16 16" class="ico"><path d="m9 3-4 5 4 5m5-10-4 5 4 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    deep: '<svg viewBox="0 0 16 16" class="ico"><circle cx="7" cy="7" r="4.2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m10.2 10.2 3.3 3.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    missing: '<svg viewBox="0 0 16 16" class="ico"><circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.6 2.2"/><path d="M8 5v3.4M8 10.8v.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    info: '<svg viewBox="0 0 16 16" class="ico"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 7.2v4M8 4.8v.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  })[name] || '';
  BY.fmtTime = t => `${CGB.gdate(t)} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;

  /* ---------- القرارات والسجل ---------- */
  BY.decide = (q, dec, meta = {}) => {
    if (dec.type === 'amend' && +dec.approved === q.a.N) dec = { type: 'approve' };
    const e = BY.effective(q, dec), t = meta.t || new Date();
    st.dec[q.id] = { type: dec.type, approved: e.approved, reason: e.reason, items: dec.type === 'return' ? [...e.items] : [], t, bulk: !!meta.bulk };
    st.log.push({ t, id: q.id, ref: q.ref, entity: q.entity.ar, unit: q.unit, type: dec.type, requested: q.a.R, recommended: q.a.N, approved: e.approved,
      fill: e.fill, redeploy: e.redeploy, digital: e.digital, reason: dec.type === 'return' ? e.items.join('؛ ') : e.reason,
      override: dec.type === 'amend', bulk: !!meta.bulk, by: BY.ANALYST,
      snap: { score: q.a.score, grade: q.a.grade, lane: q.a.lane, W: q.a.W, B: q.a.B, J: q.a.Jraw, conf: q.a.conf } });
    st.log.sort((a, b) => b.t - a.t); delete st.draft[q.id]; return st.dec[q.id];
  };
  BY.reopen = q => { const d = st.dec[q.id]; if (!d) return;
    st.log.unshift({ t: new Date(), id: q.id, ref: q.ref, entity: q.entity.ar, unit: q.unit, type: 'reopen', requested: q.a.R, recommended: q.a.N, approved: null,
      reason: `إلغاء القرار السابق (${BY.STATUS[d.type]})`, by: BY.ANALYST, snap: { score: q.a.score, grade: q.a.grade, lane: q.a.lane, W: q.a.W, B: q.a.B, J: q.a.Jraw, conf: q.a.conf } });
    delete st.dec[q.id]; };

  // قرارات مُسبقة التسجيل ليكون للمحفظة والاتساق والسجل معنى عند الفتح
  BY.seed = () => {
    const at = (d, h, m) => new Date(2026, 10, d, h, m), used = new Set(), take = (f, k) => D.reqs.filter(q => !used.has(q.id) && f(q)).slice(0, k).map(q => (used.add(q.id), q));
    take(q => q.a.lane === 'fast', 6).forEach((q, i) => BY.decide(q, { type: 'approve' }, { t: at(15 + (i >> 1), 9 + i % 3, 8 + i * 9) }));
    take(q => q.a.lane === 'deep' && q.a.grade === 'strong' && q.a.N >= 4 && !q.a.underAsk, 4).forEach((q, i) => BY.decide(q, { type: 'approve' }, { t: at(17 + i, 10 + i % 2, 20 + i * 11) }));
    take(q => q.a.lane === 'deep' && q.a.phased && q.a.N >= 4, 1).forEach(q => BY.decide(q, { type: 'amend', approved: q.a.N - Math.ceil(q.a.N * .3),
      reason: 'نسبة شغل الموافقات السابقة منخفضة؛ يُكتفى بهذا العدد ويُعاد النظر في الباقي بعد شغل الدفعة الأولى.' }, { t: at(19, 13, 5) }));
    take(q => q.a.lane === 'deep' && q.a.grade === 'strong' && q.a.N >= 6 && q.a.R - q.a.N >= 4, 1).forEach(q => BY.decide(q, { type: 'amend', approved: q.a.N + 2,
      reason: 'إضافة وظيفتين لتغطية مناوبات المساء التي لا تظهر في بيانات عبء العمل السنوية.' }, { t: at(20, 11, 40) }));
    take(q => q.a.lane === 'deep' && (q.a.grade === 'weak' || q.a.grade === 'medium') && q.a.R - q.a.N >= 8 && q.a.R <= 40, 1).forEach(q => BY.decide(q, { type: 'amend', approved: q.a.N + Math.ceil((q.a.R - q.a.N) * .6),
      reason: 'توجيه بدعم الوحدة لارتباطها بمبادرة ذات أولوية لدى الجهة.' }, { t: at(21, 9, 25) }));
    take(q => q.a.lane === 'deep' && q.a.grade === 'weak', 1).forEach(q => BY.decide(q, { type: 'defer', reason: 'تذبذب بيانات عبء العمل واختلافها عن المقارنة المرجعية؛ يُعاد العرض بعد تحديث بيانات الربع الأول.' }, { t: at(21, 14, 10) }));
    take(q => q.a.lane === 'missing', 2).forEach((q, i) => BY.decide(q, { type: 'return', items: q.a.missing }, { t: at(22, 9 + i, 30) }));
  };

  /* ---------- نافذة، إشعار، تصدير ---------- */
  BY.toast = (msg, kind = 'ok') => { const t = $('#toast'); t.textContent = msg; t.className = 'toast show ' + kind; clearTimeout(BY._tt); BY._tt = setTimeout(() => t.className = 'toast', 3200); };
  BY.modal = ({ title, body, foot = '', wide }) => { const m = $('#modal');
    m.innerHTML = `<div class="modal-box${wide ? ' wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header><h3>${esc(title)}</h3><button class="icon-btn" data-act="close-modal" aria-label="إغلاق">${BY.ico('x')}</button></header><div class="modal-body">${body}</div>${foot ? `<footer>${foot}</footer>` : ''}</div>`;
    m.hidden = false; document.body.classList.add('locked'); const f = m.querySelector('footer button, .modal-body button, textarea, input'); if (f) f.focus(); };
  BY.closeModal = () => { $('#modal').hidden = true; $('#modal').innerHTML = ''; document.body.classList.remove('locked'); };
  BY.download = (name, text, mime) => { try { const u = URL.createObjectURL(new Blob([text], { type: mime })), a = document.createElement('a');
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000); BY.toast('بدأ تنزيل الملف: ' + name); } catch (e) { BY.toast('تعذّر التنزيل؛ استخدم «نسخ» ثم الصق في ملف', 'warn'); } };
  BY.copy = (text, area) => { const fb = () => { if (area) { area.focus(); area.select(); try { document.execCommand('copy'); BY.toast('نُسخ المحتوى'); return; } catch (e) {} } BY.toast('حدِّد النص وانسخه يدوياً', 'warn'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => BY.toast('نُسخ المحتوى إلى الحافظة'), fb); else fb(); };
  BY.exportBox = (title, name, text, mime = 'text/plain;charset=utf-8') => { BY._exp = { name, text, mime };
    BY.modal({ title, wide: true, body: `<p class="hint">معاينة المحتوى قبل التنزيل أو النسخ. اسم الملف: <bdi>${esc(name)}</bdi></p><textarea id="exp-area" class="exp-area" readonly dir="auto" aria-label="محتوى التصدير">${esc(text)}</textarea>`,
      foot: `<button class="btn primary" data-act="exp-download">${BY.ico('down')} تنزيل</button><button class="btn" data-act="exp-copy">${BY.ico('copy')} نسخ</button><button class="btn ghost" data-act="close-modal">إغلاق</button>` }); };
  BY.csv = rows => '﻿' + rows.map(r => r.map(c => { const s = c == null ? '' : String(c); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\r\n');
  BY.printMemo = html => { const p = $('#print-root'); p.innerHTML = html; document.body.classList.add('printing');
    const done = () => { document.body.classList.remove('printing'); window.removeEventListener('afterprint', done); }; window.addEventListener('afterprint', done);
    setTimeout(() => { try { window.print(); } catch (e) {} BY.toast('إن لم تظهر نافذة الطباعة فافتح الملف مباشرة في المتصفح', 'warn'); }, 60); };

  /* ---------- التنقل والعرض ---------- */
  BY.views = {}; BY.after = {}; BY.acts = {}; BY.ins = {};
  BY.render = () => { const v = st.view; $('#view').innerHTML = BY.views[v](); $('#view').dataset.view = v;
    BY.$$('.tab').forEach(t => { const on = t.dataset.view === v; t.classList.toggle('on', on); t.setAttribute('aria-selected', on); });
    $('#tab-n-inbox').textContent = n(D.reqs.filter(q => BY.status(q) === 'open').length); $('#tab-n-log').textContent = n(st.log.length);
    const q = D.reqs[st.sel]; $('#tab-n-dossier').textContent = q ? q.no : '—'; if (BY.after[v]) BY.after[v](); };
  BY.go = (view, keepScroll) => { st.view = view; try { history.replaceState(null, '', '#' + view); } catch (e) {} BY.render(); if (!keepScroll) window.scrollTo(0, 0); };
  BY.open = id => { st.sel = +id; BY.go('dossier'); };

  Object.assign(BY.acts, {
    go: el => BY.go(el.dataset.view), open: el => BY.open(el.dataset.id),
    'close-modal': BY.closeModal, 'exp-download': () => BY.download(BY._exp.name, BY._exp.text, BY._exp.mime), 'exp-copy': () => BY.copy(BY._exp.text, $('#exp-area')),
    method: () => { $('#drawer').hidden = false; document.body.classList.add('locked'); $('#drawer .icon-btn').focus(); },
    'close-drawer': () => { $('#drawer').hidden = true; document.body.classList.remove('locked'); },
  });
  document.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (!el) { if (e.target.id === 'modal') BY.closeModal(); if (e.target.id === 'drawer') BY.acts['close-drawer'](); return; }
    const f = BY.acts[el.dataset.act]; if (f) f(el, e); });
  document.addEventListener('input', e => { const el = e.target.closest('[data-in]'); if (el && BY.ins[el.dataset.in]) BY.ins[el.dataset.in](el, e); });
  document.addEventListener('change', e => { const el = e.target.closest('[data-ch]'); if (el && BY.ins[el.dataset.ch]) BY.ins[el.dataset.ch](el, e); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (BY.tourOn) BY.tourEnd(); else if (!$('#modal').hidden) BY.closeModal(); else if (!$('#drawer').hidden) BY.acts['close-drawer'](); }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  });
})();
