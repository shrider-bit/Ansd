/* جسور — UI core: state, helpers, navigation, overlays, guided tour. */
const D = JData, O = JOpt;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const fam = f => D.F[f], famShort = f => D.FSHORT[D.F[f].id], famColor = f => D.FCOLOR[D.F[f].id];
const ent = e => D.E[e];
const band = b => CGB.GRADE_BANDS[b];
const PCT = n => '\u2066' + n + '%\u2069';            // keeps "92%" reading left-to-right inside Arabic text
const pc = v => PCT(Math.round(v * 100));
// Arabic counted-noun agreement: 3–10 plural, 11–99 singular accusative, otherwise the bare singular
const NOUN = { move: ['تحرك', 'تحركات', 'تحركاً'], need: ['احتياج', 'احتياجات', 'احتياجاً'], talent: ['كفاءة', 'كفاءات', 'كفاءة'],
  trainee: ['متدرب', 'متدربين', 'متدرباً'], bridge: ['جسر', 'جسور', 'جسراً'], week: ['أسبوع', 'أسابيع', 'أسبوعاً'], month: ['شهر', 'أشهر', 'شهراً'],
  year: ['سنة', 'سنوات', 'سنة'], day: ['يوم', 'أيام', 'يوماً'], job: ['وظيفة', 'وظائف', 'وظيفة'], emp: ['موظف', 'موظفين', 'موظفاً'], pair: ['زوج', 'أزواج', 'زوجاً'] };
const unit = (n, k) => { const r = Math.abs(n) % 100, w = NOUN[k]; return r >= 3 && r <= 10 ? w[1] : r >= 11 ? w[2] : w[0]; };
const ar = (n, k) => CGB.num(n) + ' ' + unit(n, k);
const yearsAr = n => (n <= 0 ? 'أقل من سنة' : n === 1 ? 'سنة واحدة' : n === 2 ? 'سنتان' : ar(n, 'year'));
const DUR = n => (n.dur === 'perm' ? 'دائم' : n.dur === 'temp' ? `مؤقت ${ar(n.months, 'month')}` : `مشروع ${ar(n.months, 'month')}`);

let tourI = -1;
const S = {
  view: 'map', P: JSON.parse(JSON.stringify(O.DEFAULTS)), preset: 'balanced',
  dec: new Map(), rejected: [], res: null, moves: [], dirty: false, dirtyWhy: '',
  heatMode: 'count', selCell: null, selEnt: null, famFilter: null, arcType: 'all',
  mv: { q: '', status: 'all', type: 'all', crit: 'all', fam: 'all', ent: 'all', sort: 'crit', shown: 12 },
  planAll: true,
};

/* ---- run the engine and decorate the result for display ---- */
function decorate(m) {
  const p = D.people[m.p], n = D.needs[m.n], key = m.n + '|' + m.p;
  const ev = O.evalPair(D, p, n, Object.assign({}, S.P, { minFit: 0, mustThr: 0 }), true) ||
    { fit: 0, comps: { skill: 0, grade: 0, adj: 0, exp: 0 }, matched: [], missing: [], weeks: 0, value: 0 };
  return { key, n: m.n, p: m.p, kind: m.kind, person: p, need: n, ev, mech: O.mechanism(n), status: S.dec.get(key) || 'proposed' };
}
function runSolve() {
  S.res = O.solve(D, S.P, S.dec);
  S.moves = S.res.moves.map(decorate);
  S.dirty = false; S.dirtyWhy = '';
  return S.res;
}
function activeMoves() { return S.moves.filter(m => m.status !== 'rejected'); }
function impact() {
  const A = activeMoves(), P = S.P; let days = 0, cost = 0, q = 0, crit = 0, critB = 0, direct = 0, bridge = 0;
  A.forEach(m => { if (m.kind === 2) { bridge++; days += Math.max(0, P.extDays - P.intDays - m.ev.weeks * 7); if (m.need.crit === 2) critB++; }
    else { direct++; days += Math.max(0, P.extDays - P.intDays); if (m.need.crit === 2) crit++; }
    cost += P.costPerHire; if (m.person.q) q++; });
  const critTotal = D.needs.filter(n => n.crit === 2).length;
  const fitAvg = direct ? A.filter(m => m.kind === 1).reduce((a, m) => a + m.ev.fit, 0) / direct : 0;
  return { total: D.needs.length, direct, bridge, residual: D.needs.length - A.length, crit, critB, critTotal, days, cost, q, moves: A.length, fitAvg };
}
function setDirty(why) { S.dirty = true; S.dirtyWhy = why || S.dirtyWhy; $('#dirtyDot').hidden = false; $('#runbar').classList.add('dirty'); renderRunNote(); renderMoveNotice(); }
function clearDirty() { $('#dirtyDot').hidden = true; $('#runbar').classList.remove('dirty'); }

/* ---- navigation ---- */
const RENDER = {};
function go(view, opts = {}) {
  S.view = view;
  $$('.view').forEach(v => v.classList.toggle('on', v.id === 'v-' + view));
  $$('.tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.view === view)));
  const t = $(`.tab[data-view="${view}"]`); if (t && t.scrollIntoView) t.scrollIntoView({ block: 'nearest', inline: 'center' });
  if (RENDER[view]) RENDER[view]();
  if (!opts.keepScroll) window.scrollTo({ top: 0, behavior: 'auto' });
  try { history.replaceState(null, '', '#' + view); } catch (e) { /* file:// may refuse */ }
}

/* ---- small UI utilities ---- */
function toast(msg, ms = 2600) {
  if (tourI >= 0) return;                    // keep the tour card clear
  const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg; $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), ms);
}
function countUp(el, to, fmt = v => CGB.num(Math.round(v)), ms = 700) {
  if (REDUCED || !el) { if (el) el.textContent = fmt(to); return; }
  const from = Number(el.dataset.v || 0), t0 = performance.now(); el.dataset.v = to;
  (function step(t) { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); })(t0);
}
const ringSVG = (v, color) => { const c = 2 * Math.PI * 18;
  return `<svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="18" fill="none" stroke="#E2E9E6" stroke-width="5"/><circle cx="22" cy="22" r="18" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(c * v).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 22 22)"/></svg>`; };
const arcIcon = (color = '#0F4C5C') => `<svg viewBox="0 0 34 18" aria-hidden="true"><path d="M31 15 A14 13 0 0 0 3 15" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/><path d="M6.5 11.5 L3 15.5 L-0.5 11.8" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" transform="translate(0.5 0)"/><circle cx="31" cy="15" r="2" fill="${color}"/></svg>`;

/* ---- drawer & export modal ---- */
function openDrawer() { $('#drawer').classList.add('on'); $('#drawer .x').focus(); }
let exportState = null;
function openExport({ title, hint, text, filename, mime }) {
  exportState = { text, filename, mime: mime || 'text/csv;charset=utf-8' };
  $('#xTitle').textContent = title; $('#xHint').textContent = hint || ''; $('#xText').value = text; $('#xInfo').textContent = filename;
  $('#modal').classList.add('on'); $('#xDown').focus();
}
function closeOverlays() { $('#drawer').classList.remove('on'); $('#modal').classList.remove('on'); }
function initOverlays() {
  $$('[data-close]').forEach(b => b.addEventListener('click', closeOverlays));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeOverlays(); tourEnd(); } });
  $('#xDown').addEventListener('click', () => {
    try {
      const blob = new Blob(['﻿' + exportState.text], { type: exportState.mime });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = exportState.filename;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
      toast('بدأ تنزيل الملف: ' + exportState.filename);
    } catch (e) { toast('تعذّر التنزيل في هذا العرض — استخدم «نسخ»'); }
  });
  $('#xCopy').addEventListener('click', async () => {
    const ta = $('#xText');
    try { await navigator.clipboard.writeText(exportState.text); toast('نُسخ المحتوى إلى الحافظة'); }
    catch (e) { ta.focus(); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (_) { /* ignore */ }
      toast(ok ? 'نُسخ المحتوى إلى الحافظة' : 'حُدِّد النص — اضغط Ctrl+C للنسخ'); }
  });
}
const csv = rows => rows.map(r => r.map(c => { const s = String(c == null ? '' : c); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\r\n');

/* ---- guided tour ---- */
const TOUR = [
  { view: 'map', sel: '#heatPanel', title: 'أين الفائض وأين العجز؟',
    text: 'كل خانة جهة × مجموعة وظيفية. الأحمر عجز والأزرق فائض. الملاحظة الأهم: التخصص نفسه ناقص في جهة وزائد في أخرى، وهذه هي فرصة التدوير.' },
  { view: 'lab', sel: '#controls', title: 'أولويات السياسة بيد صاحب القرار',
    text: 'سبعة أوزان تحدد ما يُعظَّم: المهارات، سدّ الحرج، التقطير، رغبة الموظف… وضوابط تحمي الجهات المانحة من الاستنزاف.' },
  { view: 'lab', sel: '#results', title: 'تشغيل واحد يقيّم كل الأزواج الممكنة', act: () => animateRun(),
    text: 'تُقيَّم جميع أزواج (موظف، احتياج) ثم تُحلّ مسألة التخصيص الأمثل. النتيجة: كم احتياجاً يُسدّ داخلياً، وكم يوماً ورِيالاً نوفّر، وما يبقى للتوظيف الخارجي.' },
  { view: 'lab', sel: '#cmp', title: 'لماذا خوارزمية وليس الأسبقية؟',
    text: 'المقارنة بالشروط نفسها: أسلوب «من يطلب أولاً يأخذ الأفضل» يستنزف الكفاءات النادرة مبكراً. الحل الأمثل يسدّ احتياجات حرجة أكثر بالكفاءات نفسها.' },
  { view: 'bridges', sel: '.bridge-grid', title: 'الجسور: من يمنح ومن يستقبل', act: () => { if (!S.selEnt && S.selEnt !== 0) selectEntity(busiestEntity()); },
    text: 'كل قوس جسر بين جهتين. اختر جهة لتعرف وجهات كفاءاتها ومصادر ما يرد إليها، وكيف تتغير تغطيتها قبل التدوير وبعده.' },
  { view: 'moves', sel: '#cards', title: 'القرار للإنسان',
    text: 'كل مقترح مفسَّر: المهارات المطابقة والناقصة وآلية التحرك. اعتمد أو ثبّت أو ارفض، ثم أعد التخصيص فيُبنى الحل حول قراراتك. بعدها تصدر «خطة التدوير» ورقةَ قرار جاهزة.' },
];
function tourStart() { tourI = -1; $('#tour').classList.add('on'); tourStep(0); }
function tourEnd() { if (tourI < 0) return; tourI = -1; $('#tour').classList.remove('on'); }
function tourStep(i) {
  if (i < 0) return; if (i >= TOUR.length) { tourEnd(); go('plan'); toast('انتهت الجولة — هذه خطة التدوير الجاهزة للتصدير'); return; }
  tourI = i; const st = TOUR[i];
  if (S.view !== st.view) go(st.view);
  if (st.act) st.act();
  const card = $('#tourCard');
  card.innerHTML = `<div class="step">الخطوة ${i + 1} من ${TOUR.length}</div><h4>${st.title}</h4><p>${st.text}</p>
    <div class="row"><div class="dots">${TOUR.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div><span class="sp"></span>
    <button class="btn sm ghost" type="button" data-t="end">إنهاء</button>${i ? '<button class="btn sm" type="button" data-t="prev">السابق</button>' : ''}
    <button class="btn sm primary" type="button" data-t="next">${i === TOUR.length - 1 ? 'إلى خطة التدوير' : 'التالي'}</button></div>`;
  card.querySelector('[data-t="next"]').onclick = () => tourStep(tourI + 1);
  const pv = card.querySelector('[data-t="prev"]'); if (pv) pv.onclick = () => tourStep(tourI - 1);
  card.querySelector('[data-t="end"]').onclick = tourEnd;
  const target = $(st.sel);
  if (target) target.scrollIntoView({ block: 'start', behavior: 'auto' });
  setTimeout(() => { tourPlace(); card.querySelector('[data-t="next"]').focus({ preventScroll: true }); }, 60);
}
function tourPlace() {
  if (tourI < 0) return; const target = $(TOUR[tourI].sel); if (!target) return;
  const r = target.getBoundingClientRect(), vw = innerWidth, vh = innerHeight, hole = $('#tourHole'), card = $('#tourCard');
  const top = Math.max(r.top, 118), bottom = Math.min(r.bottom, vh - 8), left = Math.max(r.left, 6), right = Math.min(r.right, vw - 6);
  Object.assign(hole.style, { top: top + 'px', left: left + 'px', width: Math.max(40, right - left) + 'px', height: Math.max(40, bottom - top) + 'px' });
  const cw = card.offsetWidth, ch = card.offsetHeight; let cx, cy;
  if (vw < 760) { cx = (vw - cw) / 2; cy = vh - ch - 14; hole.style.height = Math.max(40, Math.min(bottom, cy - 14) - top) + 'px'; }
  else if (vw - right > cw + 30) { cx = right + 18; cy = Math.max(126, Math.min(top, vh - ch - 16)); }
  else if (left > cw + 30) { cx = left - cw - 18; cy = Math.max(126, Math.min(top, vh - ch - 16)); }
  else { cx = Math.min(Math.max(16, right - cw - 20), vw - cw - 16); cy = Math.max(126, vh - ch - 20); }
  Object.assign(card.style, { left: cx + 'px', top: cy + 'px' });
}
window.addEventListener('resize', tourPlace); window.addEventListener('scroll', tourPlace, { passive: true });
