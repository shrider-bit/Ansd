/* مِصفاة — UI core: state, pipeline (load → map → replay → diagnose), shell rendering, export modal. */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const n0 = v => CGB.num(v), s1 = v => Number(v).toFixed(1);
const tick = () => new Promise(r => setTimeout(r, 0));
const VIEWS = [{ id: 'intake', ar: 'الاستقبال' }, { id: 'diag', ar: 'التشخيص' }, { id: 'treat', ar: 'العلاج' }, { id: 'pass', ar: 'الجواز' }, { id: 'safe', ar: 'أمان النشر' }];
const App = { src: 'sample', name: '', enc: '', delim: '', headers: [], original: [], rows: [], map: {}, conf: {}, how: {}, profiles: [],
  settings: MF.defaultSettings(), ops: [], log: [], counts: {}, ctx: null, score0: null, fp: '', view: 'intake',
  issueFilter: null, sevFilter: 'all', dimFilter: 'all', openIssue: null, page: 0, logPage: 0, opSeq: 0, choices: {}, showAll: {}, safe: null, lastShown: null };
const R = {}, ACT = {}, CHG = {};
const dimAr = id => MF.DIMS.find(d => d.id === id).ar;
const bandK = s => MF.band(s).k;

/* ---------- pipeline ---------- */
function busy(on, title) { $('#busy').hidden = !on; if (on) { $('#busy-t').textContent = title || 'جارٍ التشخيص…'; $('#busy-g').style.width = '0'; $('#busy-s').textContent = ''; } }
async function analyzeAsync(rows, title) {
  const { steps, ctx } = MF.analyzeSteps({ headers: App.headers, rows }, App.map, App.settings);
  const big = rows.length > 4000;
  if (big) { busy(true, title); await tick(); }
  for (let i = 0; i < steps.length; i++) {
    if (big) { $('#busy-g').style.width = Math.round(100 * i / steps.length) + '%'; $('#busy-s').textContent = `${i + 1}/${steps.length} · ${steps[i][0]}`; await tick(); }
    steps[i][1]();
  }
  if (big) busy(false);
  return ctx;
}
async function recompute(opts = {}) {
  if (App.ops.length && (opts.baseline || !App.score0)) App.score0 = (await analyzeAsync(App.original, 'قياس الحالة الأصلية…')).score;
  const rp = MF.replay(App.original, App.ops); App.rows = rp.rows; App.log = rp.log; App.counts = rp.counts;
  App.ctx = await analyzeAsync(App.rows, App.ops.length ? 'إعادة التشخيص بعد المعالجة…' : 'جارٍ التشخيص…');
  if (!App.ops.length) App.score0 = App.ctx.score;
  App.fp = MF.fingerprint(App.headers, App.rows);
  if (App.issueFilter && !App.ctx.issues.some(i => i.id === App.issueFilter)) { App.issueFilter = null; App.page = 0; }
  renderAll();
}
async function loadTable(t, meta) {
  if (t.error || !t.rows.length) { toast(t.error || 'لم نعثر على بيانات.', true); return false; }
  Object.assign(App, { src: meta.src, name: meta.name, enc: meta.enc || '', delim: meta.delim || '', headers: t.headers, original: t.rows, ops: [], choices: {}, showAll: {},
    issueFilter: null, openIssue: null, sevFilter: 'all', dimFilter: 'all', page: 0, logPage: 0, score0: null, lastShown: null });
  const am = MF.autoMap(t.headers, t.rows); App.map = am.map; App.conf = am.conf; App.how = am.how; App.profiles = am.profiles;
  App.safe = defaultSafe();
  await recompute();
  return true;
}
function loadSample() { const s = MF.makeSample(new Date()); return loadTable({ headers: s.headers, rows: s.rows }, { src: 'sample', name: 'مستخرج القوى العاملة — عيّنة افتراضية', enc: 'مولَّدة داخل الصفحة', delim: '—' }); }
function mappedCount() { return Object.keys(App.map).length; }
function treatmentsNow() { return MF.treatments(App.ctx.issues); }

/* ---------- shell ---------- */
function renderAll() { renderBadge(); renderLabel(); renderStepper(); R[App.view](); }
function renderBadge() {
  const b = $('#badge'); b.className = 'badge' + (App.src === 'user' ? ' user' : '');
  b.lastElementChild.textContent = App.src === 'user' ? 'بياناتك — تُعالج محلياً ولا تغادر هذا المتصفح' : 'عيّنة تجريبية افتراضية';
}
function animateNum(el, to) {
  const from = parseFloat(el.dataset.v || to); el.dataset.v = to;
  if (from === to || matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden) { el.textContent = s1(to); return; }
  const t0 = performance.now(), dur = 700;
  const f = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = s1(from + (to - from) * e); if (p < 1 && el.dataset.v == to) requestAnimationFrame(f); else el.textContent = s1(+el.dataset.v); };
  requestAnimationFrame(f);
}
function renderLabel() {
  const sc = App.ctx.score, b = sc.band, prev = App.lastShown;
  $('#label').innerHTML = `<div class="meta">
      <div class="tag"><span>بطاقة العيّنة</span><span class="ltr">MSF-${esc(App.fp)}</span></div>
      <h2>${esc(App.name)}</h2>
      <dl><dt>السجلات</dt><dd>${n0(App.rows.length)}</dd>
        <dt>الأعمدة</dt><dd>${App.headers.length} <span style="font-family:var(--sans);color:var(--mute)">(منها ${mappedCount()} مطابَقة)</span></dd>
        <dt>المصدر</dt><dd style="font-family:var(--sans)">${esc(App.enc)}${App.delim && App.delim !== '—' ? ' · الفاصل: ' + esc(App.delim) : ''}</dd>
        <dt>المعالجات</dt><dd>${App.ops.length ? `${App.ops.length} <span style="font-family:var(--sans);color:var(--mute)">(${n0(App.log.length)} خلية تغيّرت)</span>` : '<span style="font-family:var(--sans);color:var(--mute)">لم تُطبَّق بعد</span>'}</dd></dl>
    </div>
    <div class="score" id="score-box"><span class="cap">درجة الجودة</span><span class="num" id="score-num" data-v="${prev == null ? sc.overall : prev}">${s1(prev == null ? sc.overall : prev)}</span><span class="of">/ 100</span>
      <span class="band ${b.k}">${b.ar}</span>${App.ops.length ? `<span class="was">كانت ${s1(App.score0.overall)} <b>${sc.overall >= App.score0.overall ? '+' : '−'}${s1(Math.abs(sc.overall - App.score0.overall))}</b></span>` : ''}</div>`;
  animateNum($('#score-num'), +s1(sc.overall)); App.lastShown = +s1(sc.overall);
}
function renderStepper() {
  const c = App.ctx, tr = treatmentsNow(), safeN = tr.filter(t => t.fix.safe).length;
  const sub = { intake: `${n0(App.rows.length)} سجلاً · ${mappedCount()} حقلاً`, diag: `${n0(c.issues.length)} ملاحظة`,
    treat: safeN ? `${safeN} معالجة آمنة متاحة` : (App.ops.length ? `طُبّقت ${App.ops.length}` : 'لا معالجات آمنة'), pass: `${s1(c.score.overall)} · ${c.score.band.ar}`, safe: 'فحص الجداول قبل النشر' };
  $('#stepper').innerHTML = VIEWS.map((v, i) => `<button class="step" data-act="go" data-view="${v.id}" id="step-${v.id}" ${v.id === App.view ? 'aria-current="step"' : ''}><span class="n">${i + 1}</span><span><span class="t">${v.ar}</span><span class="s">${sub[v.id]}</span></span></button>`).join('');
}
function go(view, scroll = true) {
  App.view = view; VIEWS.forEach(v => $('#v-' + v.id).hidden = v.id !== view);
  renderStepper(); R[view]();
  const st = $('.stepper'); if (scroll && st.getBoundingClientRect().top <= 0) window.scrollTo({ top: st.offsetTop, behavior: 'auto' });
  const cur = $('#step-' + view); if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
ACT.go = el => go(el.dataset.view);
function toast(msg, err) { const t = $('#toast'); t.innerHTML = `<div class="${err ? 'err' : ''}">${esc(msg)}</div>`; clearTimeout(toast.t); toast.t = setTimeout(() => t.innerHTML = '', err ? 6500 : 4200); }

/* ---------- export modal: preview + download (UTF-8 BOM for Excel) + copy ---------- */
let EXP = null;
function openExport(o) {
  EXP = o; $('#modal-title').textContent = o.title; $('#modal-note').textContent = o.note || '';
  const big = o.text.length > 60000;
  $('#modal-text').value = big ? o.text.slice(0, 60000) + '\n… (معاينة مختصرة؛ التنزيل والنسخ يشملان الملف كاملاً)' : o.text;
  $('#modal-dl').textContent = 'تنزيل ' + o.filename; $('#modal').hidden = false; $('#modal-dl').focus();
}
function exportTable(title, filename, tbl, note) { openExport({ title, filename, text: MF.toCSV(tbl.headers, tbl.rows), note: `${note ? note + ' ' : ''}${n0(tbl.rows.length)} صفاً. ملف CSV بترميز UTF-8 مع علامة BOM ليفتحه Excel بالعربية مباشرة.` }); }
ACT['modal-close'] = () => { $('#modal').hidden = true; EXP = null; };
ACT['modal-download'] = () => {
  if (!EXP) return; const blob = new Blob(['﻿' + EXP.text], { type: 'text/csv;charset=utf-8' }); const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = EXP.filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('بدأ تنزيل ' + EXP.filename + '. إن لم يبدأ، استخدم «نسخ» والصق في Excel.');
};
ACT['modal-copy'] = () => {
  if (!EXP) return; const text = EXP.text, fallback = () => { const ta = $('#modal-text'); ta.focus(); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) { /* ignore */ } toast(ok ? 'نُسخ المحتوى الظاهر.' : 'حُدّد النص؛ اضغط Ctrl+C لنسخه.'); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast('نُسخ المحتوى كاملاً إلى الحافظة.'), fallback); else fallback();
};
document.addEventListener('click', e => {
  if (e.target.id === 'modal') return ACT['modal-close']();
  const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  if (el.tagName === 'A' && el.getAttribute('href') === '#') e.preventDefault();
  const f = ACT[el.dataset.act]; if (f) f(el, e);
});
document.addEventListener('change', e => { const el = e.target.closest('[data-chg]'); if (el && CHG[el.dataset.chg]) CHG[el.dataset.chg](el, e); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (!$('#modal').hidden) ACT['modal-close'](); else if (!$('#tour').hidden) ACT['tour-end'](); } });
const slug = () => (App.src === 'sample' ? 'misfat-sample' : 'misfat-' + App.name.replace(/\.[^.]+$/, '').replace(/[^\w؀-ۿ-]+/g, '_').slice(0, 40));
