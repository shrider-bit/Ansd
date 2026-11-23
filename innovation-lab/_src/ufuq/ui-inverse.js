/* أُفُق — الشاشة 3: المسار العكسي (بحث عددي عن السياسات التي تبلغ هدفاً معلناً). */
(() => {
  'use strict';
  const { S, E, C, $, $$, n0, p1, num, ltr, esc } = UF;
  const TOTAL = 1400;
  const I = S.inv = { tg: { q: .52, year: 2035, cagr: .015, short: .06 }, out: null, search: null, running: false, seed: 4242 };
  let el, canvas;
  const KIND = {
    least: ['أقل تغيير', 'أقرب حزمة إلى الروافع الحالية تحقق الأهداف'],
    cheap: ['أقل تكلفة', 'أدنى كتلة أجور تراكمية حتى 2040 بين الحزم المحققة'],
    fast: ['الأسرع بلوغاً', 'أبكر سنة تُبلَغ فيها نسبة التقطير المستهدفة'],
    closest: ['أقرب حزمة ممكنة', 'لا تحقق كل الأهداف، لكنها الأقرب إليها'],
  };
  const pc = (v, d = 1) => ltr((v * 100).toFixed(d) + '%');

  function fixedNote() {
    const L = S.L, sh = UF.SHOCKS.filter(s => L[s.on]).map(s => s.desc(L));
    return `نمو الطلب على الخدمات: ${({ low: 'منخفض', med: 'متوسط', high: 'مرتفع' })[L.demand]}` + (sh.length ? ' · ' + sh.join(' · ') : ' · بلا صدمات');
  }
  function sync() {
    const t = I.tg;
    const set = (id, v, txt) => { const i = $('#' + id, el); i.value = v; i.style.setProperty('--fill', ((v - i.min) / (i.max - i.min) * 100) + '%'); $(`output[for="${id}"]`, el).textContent = txt; };
    set('tgQ', t.q, pc(t.q, 0)); set('tgC', t.cagr, pc(t.cagr)); set('tgS', t.short, pc(t.short, 0));
    $('#tgY', el).value = t.year; $('#invFixed', el).textContent = fixedNote();
    $('#axX', el).textContent = `نسبة التقطير سنة ${t.year} (تزداد نحو اليسار)`;
  }

  function bundleHTML(b, i, tg) {
    const p = b.p, m = p.m, rd = E.readiness(E.simulate(p.L, null, false)), ch = UF.changes(p.L, S.L);
    const ok = (good) => `<i class="${good ? 'ok' : 'no'}">${good ? '✓' : '✕'}</i>`;
    return `<article class="bundle ${b.kind}">
      <header><span class="b-no num">${i + 1}</span><div><h3>${KIND[b.kind][0]}</h3><p>${KIND[b.kind][1]}</p></div><div class="b-score"><b class="num">${rd.score.toFixed(0)}</b><span>الجاهزية</span></div></header>
      <dl class="b-metrics">
        <div><dt>التقطير سنة ${tg.year}</dt><dd>${ok(p.v.q === 0)}<b class="num">${pc(m.qAt)}</b><small>الهدف ≥ ${pc(tg.q, 0)}</small></dd></div>
        <div><dt>نمو كتلة الأجور</dt><dd>${ok(p.v.cagr === 0)}<b class="num">${pc(m.cagr, 2)}</b><small>السقف ≤ ${pc(tg.cagr)}</small></dd></div>
        <div><dt>أقصى عجز</dt><dd>${ok(p.v.peak === 0)}<b class="num">${pc(m.peak)}</b><small>السقف ≤ ${pc(tg.short, 0)}</small></dd></div>
        <div><dt>سنة بلوغ هدف التقطير</dt><dd><b class="num">${m.reach || '—'}</b><small>${m.reach ? '' : 'لا يُبلَغ قبل 2040'}</small></dd></div>
      </dl>
      <h4>التغييرات المطلوبة على الروافع الحالية (${ch.length})</h4>
      <ul class="b-diff">${ch.length ? ch.map(c => `<li><span>${esc(c.label)}</span><em>${esc(c.from)}</em><b>${esc(c.to)}</b></li>`).join('') : '<li><span>الروافع الحالية تحقق الأهداف دون تغيير.</span></li>'}</ul>
      <button class="btn ${b.kind === 'closest' ? 'line' : 'primary'}" type="button" data-apply="${i}">طبّق في منصة السياسات</button>
    </article>`;
  }
  function results() {
    const out = I.out, tg = out.tg, host = $('#invResults', el);
    let head;
    if (out.feasible) head = `<div class="inv-verdict ok"><h3>وُجدت ${num(n0(out.nFeasible))} حزمة تحقق الأهداف الثلاثة</h3><p>من أصل ${num(n0(out.explored))} حزمة جرت محاكاتها. هذه ${out.bundles.length === 1 ? 'أبرزها' : 'أبرز ' + out.bundles.length + ' منها'}، كلٌّ بمنطق اختيار مختلف.</p></div>`;
    else {
      const p = out.bundles[0].p;
      const why = {
        pipeline: `القيد الحاكم هو خط إمداد الخريجين القطريين. أقصى ما تبلغه الروافع المتاحة ${pc(p.m.qAt)} سنة ${tg.year}. لو رُفع هذا القيد لبلغت النسبة ${pc(out.freeQ)}، أي أن المشكلة في أعداد الخريجين وتخصصاتهم، لا في قرار التعيين.`,
        q: `هدف التقطير يتجاوز ما تتيحه الروافع في هذا الأفق الزمني: أقصى ما يُبلَغ ${pc(p.m.qAt)} سنة ${tg.year}.`,
        cagr: `القيد الحاكم هو سقف نمو الأجور. رفع نسبة القطريين وتمديد الخدمة يرفعان متوسط تكلفة الموظف، فيتجاوز النمو السقف المحدد (${pc(p.m.cagr, 2)}).`,
        peak: `القيد الحاكم هو سقف العجز. بلوغ نسبة التقطير بهذه السرعة يتطلب كبح تعيين غير القطريين، فيرتفع العجز إلى ${pc(p.m.peak)}.`,
      }[out.binding];
      head = `<div class="inv-verdict no"><h3>لا توجد حزمة تحقق الأهداف الثلاثة معاً</h3><p>ضمن ${num(n0(out.explored))} حزمة جرت محاكاتها. ${why}</p><p class="try">جرّب تأخير سنة الهدف، أو تخفيف أحد السقفين، ثم أعد البحث.</p></div>`;
    }
    host.innerHTML = head + `<div class="bundles n${out.bundles.length}">${out.bundles.map((b, i) => bundleHTML(b, i, tg)).join('')}</div>`;
  }

  function run(instant) {
    if (I.running) return;
    I.running = true; I.out = null;
    const tg = Object.assign({}, I.tg), btn = $('#invRun', el), prog = $('#invProg', el);
    btn.disabled = true; btn.textContent = 'جارٍ البحث…';
    $('#invResults', el).innerHTML = '<p class="empty">تُحاكى حزم السياسات واحدة واحدة. كل نقطة على الخريطة حزمة.</p>';
    const s = I.search = E.createSearch(Object.assign({}, S.L), tg, TOTAL, I.seed);
    const reduce = instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const done = () => {
      const out = s.finish(); out.tg = tg; I.out = out; I.running = false;
      btn.disabled = false; btn.textContent = 'أعد البحث';
      prog.innerHTML = `اكتمل: ${num(n0(out.explored))} حزمة، منها ${num(n0(out.nFeasible))} تحقق الأهداف`;
      UFC.scatter(canvas, s, out.bundles); results();
    };
    if (reduce) { s.step(TOTAL); return done(); }
    const tick = () => {
      const fin = s.step(50);
      UFC.scatter(canvas, s, null);
      prog.innerHTML = `جرت محاكاة ${num(n0(s.done))} من ${num(n0(TOTAL))} حزمة`;
      if (fin) done(); else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  I.run = run;

  UF.views.inverse = {
    mount(root) {
      el = root;
      el.innerHTML = `<div class="wrap inv">
        <div class="sec-h first"><p class="eyebrow">المسار العكسي</p><h2>ابدأ من الهدف، ودع النموذج يبحث عن السياسة</h2>
          <p>بدل تجربة الروافع واحدة واحدة، حدّد ما تريد بلوغه. يحاكي النموذج ${num(n0(TOTAL))} حزمة سياسات، ثم يعرض ما يحقق أهدافك منها.</p></div>
        <div class="inv-grid">
          <form class="panel inv-form" id="invForm">
            <h3>الأهداف</h3>
            <div class="tg"><div class="lv-top"><label for="tgQ">نسبة التقطير لا تقل عن</label><output class="num" for="tgQ"></output></div><input type="range" id="tgQ" min=".44" max=".62" step=".01">
              <label class="tg-year">بحلول سنة <select id="tgY">${Array.from({ length: 11 }, (_, i) => `<option value="${2030 + i}">${2030 + i}</option>`).join('')}</select></label></div>
            <div class="tg"><div class="lv-top"><label for="tgC">نمو كتلة الأجور السنوي لا يتجاوز</label><output class="num" for="tgC"></output></div><input type="range" id="tgC" min=".005" max=".03" step=".001"></div>
            <div class="tg"><div class="lv-top"><label for="tgS">أقصى عجز (من 2028) لا يتجاوز</label><output class="num" for="tgS"></output></div><input type="range" id="tgS" min=".03" max=".12" step=".01"><p class="lv-hint">كنسبة من الطلب الكلي على الوظائف.</p></div>
            <p class="fixed"><b>يبقى ثابتاً أثناء البحث:</b> <span id="invFixed"></span>. تُغيَّر هذه من منصة السياسات.</p>
            <button class="btn primary big" type="submit" id="invRun">ابحث عن المسارات</button>
            <p class="honest">بحث عددي: عيّنة عشوائية من فضاء الروافع ثم تحسين موضعي على النموذج المرجّح. ليس ذكاءً اصطناعياً، ولا يضمن الحل الأمثل.</p>
          </form>
          <div class="panel inv-map">
            <div class="panel-h"><h3>خريطة البحث</h3><span class="sub" id="invProg" role="status"></span></div>
            <div class="panel-b">
              <div class="cv-wrap"><span class="ax-y">نمو كتلة الأجور السنوي</span><canvas id="invCanvas" role="img" aria-label="كل نقطة حزمة سياسات جرت محاكاتها"></canvas></div>
              <p class="ax-x" id="axX"></p>
              <p class="inv-leg"><span class="k f"><i></i>تحقق الأهداف الثلاثة</span><span class="k r"><i></i>تحقق التقطير والتكلفة لكن العجز يتجاوز السقف</span><span class="k g"><i></i>لا تحقق الأهداف</span><span class="k c"><i></i>الروافع الحالية</span><span class="k w"><i></i>المنطقة المستهدفة</span></p>
            </div>
          </div>
        </div>
        <div class="inv-results" id="invResults"></div>
      </div>`;
      canvas = $('#invCanvas', el);
      $('#invForm', el).addEventListener('submit', ev => { ev.preventDefault(); run(); });
      $('#invForm', el).addEventListener('input', ev => {
        const id = ev.target.id; if (id === 'tgQ') I.tg.q = +ev.target.value; if (id === 'tgC') I.tg.cagr = +ev.target.value; if (id === 'tgS') I.tg.short = +ev.target.value; if (id === 'tgY') I.tg.year = +ev.target.value;
        sync();
      });
      $('#invResults', el).addEventListener('click', ev => {
        const b = ev.target.closest('[data-apply]'); if (!b) return;
        const p = I.out.bundles[+b.dataset.apply].p;
        UF.setLevers(Object.assign({}, p.L), true); UF.go('lab'); UF.toast('طُبّقت الحزمة. راجع أثرها ثم ثبّتها أو عدّلها.');
      });
    },
    update(what) {
      if (what === 'year') return;
      sync();
      if (!I.out && !I.running) run();                       // open in a working state: first search runs by itself
      else if (I.search) {
        UFC.scatter(canvas, I.search, I.out ? I.out.bundles : null);
        if (I.out && !UF.same(I.search.cur, S.L)) $('#invProg', el).innerHTML = '<span class="stale">تغيّرت الروافع منذ آخر بحث. أعد البحث لتحديث النتائج.</span>';
      }
    },
  };
})();
