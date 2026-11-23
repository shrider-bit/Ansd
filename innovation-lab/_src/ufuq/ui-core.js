/* أُفُق — الحالة المشتركة، الروافع، وبطاقة الأفق الزمني المشتركة بين الشاشات. */
const UF = (() => {
  'use strict';
  const E = UFE, C = CGB, ltr = UFC.ltr, esc = UFC.esc;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const LAST = E.NY - 1;
  const S = { L: Object.assign({}, E.DEFAULTS), base: null, cur: null, year: LAST, fam: -1, metric: 'sd', view: 'scene', pins: { A: null, B: null }, timer: null };
  const views = {};

  // ---------- formatting ----------
  const n0 = v => C.num(Math.round(v));
  const p1 = v => (v * 100).toFixed(1) + '%';
  const num = s => `<span class="num">${s}</span>`;
  const sgn = (v, f) => ltr((v > 0 ? '+' : v < 0 ? '−' : '') + f(Math.abs(v)));
  /* delta chip: good = +1 when an increase is desirable, -1 when a decrease is desirable, 0 neutral */
  function delta(d, f, good, eps = 0) {
    if (Math.abs(d) <= eps) return '<span class="dl flat">مطابق لخط الأساس</span>';
    const cls = good === 0 ? 'flat' : (d * good > 0 ? 'up' : 'down');
    return `<span class="dl ${cls}">${sgn(d, f)} <i>عن خط الأساس</i></span>`;
  }

  // ---------- levers ----------
  const pct0 = v => Math.round(v * 100) + '%';
  const LEVERS = [
    { k: 'retAge', g: 'ret', t: 'range', min: 60, max: 65, step: 1, label: 'سن التقاعد النظامي', fmt: v => v + ' سنة', hint: 'عند التمديد يُفترض أن 65% ممن يبلغون الستين يختارون البقاء.' },
    { k: 'retScope', g: 'ret', t: 'seg', label: 'نطاق التمديد', opts: [['all', 'كل المجموعات'], ['scarce', 'التخصصات النادرة فقط']], fmt: v => v === 'all' ? 'كل المجموعات' : 'التخصصات النادرة فقط' },
    { k: 'earlyMult', g: 'ret', t: 'range', min: .5, max: 2, step: .05, label: 'معدل التقاعد المبكر', fmt: v => Math.abs(v - 1) < .001 ? 'المعدل الحالي' : ltr((v > 1 ? '+' : '−') + Math.round(Math.abs(v - 1) * 100) + '%'), hint: 'أقل من الحالي = حوافز بقاء. أعلى = حوافز خروج.' },
    { k: 'hiringCap', g: 'hire', t: 'range', min: .4, max: 1, step: .05, label: 'طاقة التوظيف', fmt: pct0, hint: 'نسبة الفجوة التي تستطيع الجهات سدّها خلال سنة واحدة.' },
    { k: 'allowNQ', g: 'hire', t: 'switch', label: 'تعويض نقص المرشحين القطريين بغير القطريين', fmt: v => v ? 'مسموح' : 'غير مسموح', hint: 'عند الإيقاف تبقى الوظيفة شاغرة إن لم يتوافر مرشح قطري.' },
    { k: 'qTarget', g: 'qat', t: 'range', min: .3, max: .95, step: .05, label: 'حصة القطريين من التعيينات الجديدة', fmt: pct0, hint: 'هدف تُقيّده أعداد الخريجين المتاحين في كل مجموعة وظيفية.' },
    { k: 'pipeline', g: 'qat', t: 'range', min: 0, max: 1, step: .05, label: 'توسعة الابتعاث والتدريب', fmt: v => ltr('+' + Math.round(v * 100) + '%'), hint: 'زيادة أعداد الخريجين القطريين. يظهر الأثر بعد 4 سنوات.' },
    { k: 'redirect', g: 'qat', t: 'range', min: 0, max: .5, step: .05, label: 'توجيه الخريجين نحو التخصصات النادرة', fmt: pct0, hint: 'نسبة تُحوَّل من مسارات الإدارة والموارد البشرية وخدمة المتعاملين.' },
    { k: 'replace', g: 'qat', t: 'range', min: 0, max: .10, step: .005, label: 'الإحلال السنوي', fmt: v => (v * 100).toFixed(1) + '%', hint: 'نسبة وظائف غير القطريين التي تُحوَّل سنوياً، بشرط توافر مرشح قطري.' },
    { k: 'demand', g: 'dem', t: 'seg', label: 'نمو الطلب على الخدمات', opts: [['low', 'منخفض'], ['med', 'متوسط'], ['high', 'مرتفع']], fmt: v => ({ low: 'منخفض', med: 'متوسط', high: 'مرتفع' }[v]) },
    { k: 'dx', g: 'dem', t: 'range', min: 0, max: 1, step: .05, label: 'طموح التحول الرقمي', fmt: pct0, hint: 'عند 100% ينخفض الطلب على الوظائف الإدارية والمالية وخدمة المتعاملين 25% بحلول 2035 ويرتفع على التقنية 20%.' },
  ];
  const SHOCKS = [
    { on: 'waveOn', label: 'موجة تقاعد مبكر', year: 'waveYear', size: 'waveSize', sMin: .05, sMax: .30, sLabel: 'نسبة المغادرين ممن تجاوزوا الخمسين', desc: L => `موجة تقاعد مبكر سنة ${L.waveYear} (${pct0(L.waveSize)} ممن تجاوزوا الخمسين)` },
    { on: 'freezeOn', label: 'تجميد التوظيف', year: 'freezeStart', dur: 'freezeYears', desc: L => `تجميد التوظيف ${L.freezeYears} ${L.freezeYears > 2 ? 'سنوات' : L.freezeYears === 2 ? 'سنتين' : 'سنة'} ابتداءً من ${L.freezeStart}` },
    { on: 'surgeOn', label: 'طفرة طلب مؤقتة', year: 'surgeYear', size: 'surgeSize', sMin: .05, sMax: .20, sLabel: 'حجم الطفرة في القطاعات الخدمية', desc: L => `طفرة طلب ${pct0(L.surgeSize)} على الخدمات في ${L.surgeYear} و${L.surgeYear + 1}` },
  ];
  const GROUPS = [['ret', 'التقاعد'], ['hire', 'التوظيف'], ['qat', 'التقطير'], ['dem', 'الطلب والتحول الرقمي'], ['shock', 'الصدمات']];
  const D = E.DEFAULTS;
  const PRESETS = [
    { id: 'base', name: 'استمرار الوضع الحالي', L: {} },
    { id: 'ret', name: 'تمديد سن التقاعد', L: { retAge: 63, earlyMult: .8 } },
    { id: 'qat', name: 'تسريع التقطير', L: { qTarget: .9, pipeline: .6, redirect: .3, replace: .05 } },
    { id: 'dx', name: 'تحول رقمي طموح', L: { dx: .9, hiringCap: .85, redirect: .2 } },
    { id: 'mix', name: 'الحزمة المتوازنة', L: { retAge: 62, retScope: 'scarce', qTarget: .8, pipeline: .5, redirect: .3, replace: .03, dx: .6 } },
    { id: 'storm', name: 'العاصفة الكاملة', L: { waveOn: true, freezeOn: true, surgeOn: true, demand: 'high' } },
  ];
  const same = (a, b) => Object.keys(D).every(k => a[k] === b[k] || (typeof a[k] === 'number' && Math.abs(a[k] - b[k]) < 1e-9));
  const presetOf = L => PRESETS.find(p => same(L, Object.assign({}, D, p.L)));
  const scenarioName = L => { const p = presetOf(L); return p ? p.name : 'سياسة مخصّصة'; };
  /* levers that differ from a reference setting, as readable rows */
  function changes(L, ref = D) {
    const out = [];
    for (const lv of LEVERS) if (L[lv.k] !== ref[lv.k] && !(typeof L[lv.k] === 'number' && Math.abs(L[lv.k] - ref[lv.k]) < 1e-9)) {
      if (lv.k === 'retScope' && L.retAge === 60) continue;
      out.push({ k: lv.k, label: lv.label, from: lv.fmt(ref[lv.k]), to: lv.fmt(L[lv.k]) });
    }
    for (const sh of SHOCKS) {
      const keys = [sh.on, sh.year, sh.size, sh.dur].filter(Boolean);
      if (L[sh.on] && (!ref[sh.on] || keys.some(k => L[k] !== ref[k]))) out.push({ k: sh.on, label: sh.label, from: ref[sh.on] ? 'مفعّلة' : 'لا يوجد', to: sh.desc(L), shock: true });
      else if (!L[sh.on] && ref[sh.on]) out.push({ k: sh.on, label: sh.label, from: 'مفعّلة', to: 'لا يوجد', shock: true });
    }
    return out;
  }

  // ---------- scenarios ----------
  function compute(L) {
    const R = E.simulate(L, null, true);
    return { L: Object.assign({}, L), R, mc: E.monteCarlo(L, 200), rd: E.readiness(R), name: scenarioName(L), _b: {} };
  }
  const T = (sc, fam = S.fam) => E.totals(sc.R, fam);
  const band = (sc, key, fam = S.fam) => sc._b[key + fam] || (sc._b[key + fam] = E.bands(sc.mc, key, fam));
  const isBase = () => same(S.L, D);
  const famName = () => S.fam < 0 ? 'كل المجموعات' : E.F[S.fam].ar;

  let pending = null;
  function setLevers(patch, now) {
    Object.assign(S.L, patch);
    clearTimeout(pending);
    const run = () => { S.cur = compute(S.L); refresh(); };
    if (now) run(); else pending = setTimeout(run, 60);
  }
  function setYear(i, keepPlaying) { if (!keepPlaying) stop(); S.year = Math.max(0, Math.min(LAST, i)); refresh('year'); }
  function setFam(i) { S.fam = (i == null || i === S.fam) ? -1 : i; refresh(); }
  function setMetric(m) { S.metric = m; refresh(); }
  function stop() { if (S.timer) { clearInterval(S.timer); S.timer = null; $$('.play').forEach(b => b.setAttribute('aria-pressed', 'false')); } }
  function play() {
    if (S.timer) return stop();
    if (S.year >= LAST) setYear(0, true);
    $$('.play').forEach(b => b.setAttribute('aria-pressed', 'true'));
    S.timer = setInterval(() => { if (S.year >= LAST) return stop(); setYear(S.year + 1, true); }, 620);
  }
  function refresh(what) { const v = views[S.view]; if (v) v.update(what); liveBar(); }
  function go(view, opts = {}) {
    stop(); S.view = view;
    $$('.view').forEach(el => { el.hidden = el.id !== 'view-' + view; });
    $$('.tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.view === view)));
    const v = views[view]; if (!v._mounted) { v.mount($('#view-' + view)); v._mounted = true; }
    v.update(); liveBar();
    if (!opts.keepScroll) window.scrollTo({ top: 0, behavior: 'auto' });
    const t = $(`.tabs button[data-view="${view}"]`); if (t && t.scrollIntoView) t.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  // ---------- shared "horizon" chart card ----------
  const METRICS = {
    sd: { label: 'العرض والطلب', key: 'S', axis: v => C.num(Math.round(v)), val: n0, unit: 'موظف' },
    short: { label: 'العجز', key: 'short', axis: v => C.num(Math.round(v)), val: n0, unit: 'وظيفة شاغرة بلا شاغل', zero: true },
    q: { label: 'التقطير', key: 'q', axis: v => (v * 100).toFixed(0) + '%', val: p1, unit: 'نسبة القطريين', minSpan: .08 },
    wage: { label: 'كتلة الأجور', key: 'W', axis: v => (v / 1e9).toFixed(v < 3e9 ? 2 : 1), val: v => C.qar(v), unit: 'مليار ر.ق سنوياً، بالأسعار الثابتة' },
    ret: { label: 'التقاعدات', key: 'ret', axis: v => C.num(Math.round(v)), val: n0, unit: 'متقاعد في السنة (نظامي ومبكر)', zero: true },
  };
  function cardHTML(title) {
    return `<div class="panel chartcard">
      <div class="panel-h"><h3>${title}</h3>
        <div class="seg cool" role="group" aria-label="المؤشر المعروض">${Object.keys(METRICS).map(m => `<button type="button" data-metric="${m}">${METRICS[m].label}</button>`).join('')}</div>
        <span class="grow"></span><span class="famchip"></span></div>
      <div class="legend" aria-live="off"></div>
      <div class="hz" title="اسحب لتغيير السنة"></div>
      <div class="scrub">
        <button class="play" type="button" aria-pressed="false" aria-label="تشغيل الزمن"><svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path class="i-play" d="M4 2.5v11l9-5.5z"/><path class="i-pause" d="M4 3h3v10H4zM9 3h3v10H9z"/></svg></button>
        <input class="yr" type="range" min="0" max="${LAST}" step="1" aria-label="السنة المعروضة">
        <output class="yr-out num"></output>
      </div>
      <p class="band-note">المساحة المظلّلة: النطاق الذي يقع فيه 80% من 200 مسار محتمل (P10–P90) عند اضطراب معدلات التسرّب والتقاعد المبكر ونمو الطلب.</p>
    </div>`;
  }
  function cardBind(el) {
    el.addEventListener('click', ev => {
      const m = ev.target.closest('[data-metric]'); if (m) return setMetric(m.dataset.metric);
      if (ev.target.closest('.play')) return play();
      if (ev.target.closest('[data-clearfam]')) return setFam(null);
    });
    $('.yr', el).addEventListener('input', ev => setYear(+ev.target.value));
  }
  /* scn = scenario to draw in amber (or null on the scene view where only the baseline exists) */
  function cardUpdate(el, scn) {
    const M = METRICS[S.metric], base = S.base, tb = T(base), ts = scn ? T(scn) : null, lines = [];
    const showScn = scn && !isBase();
    if (showScn) {
      lines.push({ v: tb[M.key], cls: 'base ghost', name: 'خط الأساس' });
      if (S.metric === 'sd') lines.push({ v: ts.D, cls: 'dem', name: 'الطلب' });
      lines.push({ v: ts[M.key], cls: 'scn', band: band(scn, M.key), area: true, name: S.metric === 'sd' ? 'العرض — السياسة المختبرة' : 'السياسة المختبرة' });
    } else {
      if (S.metric === 'sd') lines.push({ v: tb.D, cls: 'dem', name: 'الطلب' });
      lines.push({ v: tb[M.key], cls: 'base', band: band(base, M.key), area: true, name: S.metric === 'sd' ? 'العرض — خط الأساس' : 'خط الأساس' });
    }
    UFC.horizon($('.hz', el), { lines, fmt: M.axis, year: S.year, onYear: i => setYear(i), zero: M.zero, minSpan: M.minSpan,
      bench: S.metric === 'q' ? { v: C.RULES.qatarizationBenchmark, label: 'المستهدف المرجعي 60%' } : null, label: M.label + ' حتى 2040' });
    $('.legend', el).innerHTML = lines.slice().reverse().map(l => `<span class="lg ${l.cls}"><i></i>${l.name}<b class="num">${ltr(M.val(l.v[S.year]))}</b></span>`).join('') +
      `<span class="lg-unit">${M.unit} · سنة ${num(E.Y0 + S.year)}</span>`;
    $$('[data-metric]', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.metric === S.metric)));
    const yr = $('.yr', el); yr.value = S.year; yr.style.setProperty('--fill', (S.year / LAST * 100) + '%');
    $('.yr-out', el).textContent = E.Y0 + S.year;
    $('.famchip', el).innerHTML = S.fam >= 0 ? `<span class="chip on">${esc(famName())}<button type="button" data-clearfam aria-label="إلغاء التصفية">×</button></span>` : '<span class="chip">كل المجموعات الوظيفية</span>';
  }
  function pyramidUpdate(host, sc, stats) {
    const p = E.pyramid(sc.R, S.year, S.fam), p0 = E.pyramid(S.base.R, 0, S.fam);
    const fp = S.fam >= 0 ? E.F[S.fam] : null;
    const ra = (sc.L.retScope === 'all' || (fp ? fp.scarce : true)) ? sc.L.retAge : 60;
    UFC.pyramid(host, { q: p.q, n: p.n, q0: p0.q, n0: p0.n, retAge: ra, key: S.fam });
    if (stats) stats.innerHTML = `<span>متوسط العمر ${num(p.avgAge.toFixed(1))}</span><span>من تجاوزوا الخمسين ${num(p1(p.share50))}</span><span class="ghost-key"><i></i>الخط المنقّط: شكل الهرم سنة 2026</span>`;
  }

  // ---------- small-screen live strip (lab view) ----------
  function liveBar() {
    const el = $('#livebar'); if (!el) return;
    const show = S.view === 'lab' && S.cur && window.matchMedia('(max-width: 1040px)').matches;
    el.hidden = !show; document.body.classList.toggle('has-livebar', !!show); if (!show) return;
    const t = T(S.cur, -1), b = T(S.base, -1), y = S.year;
    el.innerHTML = `<div><span>الجاهزية</span><b class="num">${S.cur.rd.score.toFixed(0)}</b></div>
      <div><span>التقطير ${E.Y0 + y}</span><b class="num">${p1(t.q[y])}</b></div>
      <div><span>العجز ${E.Y0 + y}</span><b class="num">${n0(t.short[y])}</b></div>
      <div><span>الأجور</span><b class="num">${ltr((t.W[y] / 1e9).toFixed(1))}<small> مليار</small></b></div>`;
  }

  // ---------- modal, drawer, toast, tooltip ----------
  let toastT; function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }
  let exp = null;
  function openExport(o) {
    exp = o; $('#modalTitle').textContent = o.title; $('#modalNote').textContent = o.note || ''; $('#modalText').value = o.text; $('#modalStatus').textContent = '';
    $('#modal').hidden = false; $('#modalDownload').focus();
  }
  function closeAll() { $('#modal').hidden = true; $('#drawer').hidden = true; $('#scrim').hidden = true; }
  function bindChrome() {
    $('#modalDownload').addEventListener('click', () => {
      try {
        const blob = new Blob(['﻿' + exp.text], { type: (exp.mime || 'text/plain') + ';charset=utf-8' }), a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = exp.filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        $('#modalStatus').textContent = 'بدأ التنزيل: ' + exp.filename;
      } catch (e) { $('#modalStatus').textContent = 'تعذّر التنزيل. استخدم زر النسخ.'; }
    });
    $('#modalCopy').addEventListener('click', async () => {
      const ta = $('#modalText');
      try { await navigator.clipboard.writeText(exp.text); $('#modalStatus').textContent = 'نُسخ المحتوى إلى الحافظة.'; }
      catch (e) { ta.focus(); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e2) {} $('#modalStatus').textContent = ok ? 'نُسخ المحتوى إلى الحافظة.' : 'حُدّد النص. اضغط Ctrl+C للنسخ.'; }
    });
    document.addEventListener('click', ev => {
      const c = ev.target.closest('[data-close]'); if (c) return closeAll();
      if (ev.target.id === 'scrim' || ev.target.id === 'modal') return closeAll();
      const g = ev.target.closest('[data-go]'); if (g) return go(g.dataset.go);
    });
    document.addEventListener('keydown', ev => { if (ev.key === 'Escape') { closeAll(); if (UF.tour) UF.tour.end(); } });
    $('#btnMethod').addEventListener('click', openMethod);
    $$('.tabs button').forEach(b => b.addEventListener('click', () => go(b.dataset.view)));
    const tip = $('#tip');
    document.addEventListener('mousemove', ev => {
      const c = ev.target.closest && ev.target.closest('.hm-c'); if (!c) { tip.hidden = true; return; }
      const f = +c.dataset.f, t = +c.dataset.t, sc = S.view === 'scene' ? S.base : S.cur, tt = E.totals(sc.R, f), g = tt.D[t] - tt.S[t];
      tip.innerHTML = `<b>${esc(E.F[f].ar)}</b> · ${E.Y0 + t}<br>${g >= 0 ? 'عجز' : 'فائض'} ${num(n0(Math.abs(g)))} من طلب ${num(n0(tt.D[t]))}`;
      tip.hidden = false; const w = tip.offsetWidth;
      tip.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, ev.clientX - w / 2)) + 'px'; tip.style.top = (ev.clientY + 16) + 'px';
    });
    let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => refresh(), 150); });
  }
  function openMethod() {
    const rows = E.F.map((f, i) => `<tr><td>${esc(f.ar)}</td><td class="n">${n0(E.BASE.size[i])}</td><td class="n">${pct0(f.qShare)}</td><td class="n">${ltr((f.g * 100).toFixed(1) + '%')}</td><td class="n">${n0(E.BASE.P0[i])}</td><td class="n">${pct0(f.fill)}</td></tr>`).join('');
    const W = E.WEIGHTS;
    $('#drawerBody').innerHTML = `
      <section><h3>ما هذا النموذج؟</h3><p>نموذج مخزون وتدفقات بالأفواج العمرية (Cohort-component). الحالة هي عدد الموظفين في كل مجموعة وظيفية (12) × الجنسية (قطري / غير قطري) × العمر (22–64). يتقدّم النموذج سنة بسنة من 2026 إلى 2040. كل الأعداد والمعدلات افتراضية مولَّدة لأغراض العرض، وليست تنبؤاً.</p></section>
      <section><h3>خطوة السنة الواحدة</h3><div class="eq">stock[t+1] = stock[t]
          − early_retirement − attrition − statutory_retirement
          + hires_Q + hires_N + replacement
gap        = demand[t+1] − stock_after_exits
hires      = min(gap × hiring_capacity × market_ease, 12% × stock)
hires_Q    = min(hires × qatari_share_target, graduate_pipeline)
hires_N    = allow_NQ ? hires − hires_Q : hires × (1 − target)</div>
        <ul><li>التقاعد النظامي عند بلوغ السن المحددة. عند تمديدها يبقى 65% ممن يبلغون الستين، ويغادر 12% سنوياً ممن تجاوزوها.</li><li>التقاعد المبكر للقطريين من سن 45: 3% (45–49)، 5% (50–54)، 7% (55–59)، مضروبة في رافعة المعدل.</li><li>التسرّب: القطريون 4% دون الثلاثين ثم 2.5% ثم 1.5%. غير القطريين 9% ثم 7% ثم 6%.</li><li>التحول الرقمي يكتمل أثره سنة 2035. توسعة الابتعاث وتوجيهه يبدآن بعد 4 سنوات.</li><li>في تجميد التوظيف تحتفظ التخصصات النادرة بـ 40% من طاقتها.</li></ul></section>
      <section><h3>عدم اليقين</h3><p>200 مسار بمحاكاة مونت كارلو ببذرة ثابتة. يتغيّر في كل مسار معدل التسرّب (±15%)، التقاعد المبكر (±22%)، ونمو الطلب (±0.4 نقطة مئوية). الخط هو المسار المرجّح بلا اضطراب، والمساحة المظلّلة تمتد من المئين العاشر إلى التسعين. تُستخدم الاضطرابات نفسها في كل سيناريو لتبقى المقارنة عادلة.</p></section>
      <section><h3>مؤشر الجاهزية (0–100)</h3><div class="eq">readiness = 100 × ( ${W.coverage} × coverage + ${W.qatar} × qatarisation
                    + ${W.cost} × cost + ${W.experience} × experience )
coverage     = 1 − avg_shortage% ÷ 10%
qatarisation = (Q%[2040] − Q%[2026]) ÷ (60% − Q%[2026])
cost         = 1 − (wage_bill_CAGR − 0.5%) ÷ 2.5%
experience   = 1 − (peak_retirement_rate − 1.5%) ÷ 2%
(each term clamped to 0…1)</div><p>الأوزان افتراض قابل للنقاش، وتُعرض هنا ليُراجعها صاحب القرار.</p></section>
      <section><h3>المسار العكسي</h3><p>بحث عددي: تُحاكى 1,400 حزمة سياسات عشوائية على النموذج المرجّح، ثم يُجرى تحسين موضعي حول أفضلها. ليس ذكاءً اصطناعياً، ولا يضمن الحل الأمثل، لكنه يستكشف الفضاء أوسع مما تتيحه التجربة اليدوية.</p></section>
      <section><h3>افتراضات المجموعات الوظيفية</h3><div class="tbl-scroll"><table class="mini"><thead><tr><th>المجموعة</th><th class="n">العدد 2026</th><th class="n">التقطير</th><th class="n">نمو الطلب</th><th class="n">خريجون / سنة</th><th class="n">يُسر الاستقطاب</th></tr></thead><tbody>${rows}</tbody></table></div></section>
      <section><h3>حدود النموذج</h3><ul><li>لا يمثّل الجهات فرادى ولا الدرجات الوظيفية ولا الترقيات.</li><li>التكلفة متوسطات بحسب الجنسية والفئة العمرية بالأسعار الثابتة، ولا تشمل التزامات التقاعد.</li><li>لا يحاكي سلوك الأفراد، ولا أثر السياسات في جاذبية القطاع الحكومي.</li><li>يحتاج التطبيق الفعلي إلى معايرة بالبيانات التاريخية للتعيين والتسرّب والتقاعد.</li></ul></section>`;
    $('#scrim').hidden = false; $('#drawer').hidden = false;
  }

  function boot() {
    S.base = compute(D); S.cur = S.base;
    bindChrome();
    const h = (location.hash || '').replace('#', '');
    go(views[h] ? h : 'scene');
  }
  return { S, E, C, $, $$, views, LEVERS, SHOCKS, GROUPS, PRESETS, METRICS, D, LAST, n0, p1, num, sgn, delta, pct0, ltr, esc,
    same, presetOf, scenarioName, changes, compute, T, band, isBase, famName, setLevers, setYear, setFam, setMetric, play, stop, refresh, go,
    cardHTML, cardBind, cardUpdate, pyramidUpdate, toast, openExport, openMethod, closeAll, boot };
})();
