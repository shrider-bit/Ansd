/* أُفُق — الشاشة 4: موجز القرار (نص يُولَّد بقوالب وقواعد معلنة، مقارنة سيناريوهين، تصدير وطباعة). */
(() => {
  'use strict';
  const { S, E, C, $, $$, n0, p1, num, ltr, esc, sgn, LEVERS, SHOCKS, D } = UF;
  let el;
  const L = UF.LAST, bn = v => (v / 1e9).toFixed(2);
  const cagr = t => Math.pow(t.W[L] / t.W[0], 1 / L) - 1;

  /* two-line mini chart for the paper (light background, prints well) */
  function mini(a, b, fmt, title) {
    const w = 300, h = 110, pr = 8, pl = 44, pt = 10, pb = 20;
    let lo = Math.min(...a, ...b), hi = Math.max(...a, ...b); const pad = (hi - lo || 1) * .15; lo -= pad; hi += pad;
    const X = i => w - pr - i * (w - pr - pl) / L, Y = v => pt + (1 - (v - lo) / (hi - lo)) * (h - pt - pb);
    const d = v => Array.from(v, (x, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(x).toFixed(1)).join('');
    return `<figure class="mini"><figcaption>${title}</figcaption><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}">
      <line x1="${pl}" x2="${w - pr}" y1="${h - pb}" y2="${h - pb}" stroke="#cfc6c9"/>
      <text x="${w - pr}" y="${h - 5}" text-anchor="start" class="mt">2026</text><text x="${pl}" y="${h - 5}" text-anchor="end" class="mt">2040</text>
      <path d="${d(b)}" fill="none" stroke="#5f8f9e" stroke-width="1.6" stroke-dasharray="4 3"/>
      <path d="${d(a)}" fill="none" stroke="#8A1538" stroke-width="2.2"/>
      <circle cx="${X(L)}" cy="${Y(a[L])}" r="3" fill="#8A1538"/>
      <text x="${pl - 6}" y="${Y(a[L]) + 4}" text-anchor="start" class="mv">${ltr(fmt(a[L]))}</text>
    </svg></figure>`;
  }

  function paper(sc) {
    const b = S.base, t = E.totals(sc.R, -1), tb = E.totals(b.R, -1), base = UF.same(sc.L, D);
    const ch = UF.changes(sc.L), ins = UF.insights(sc), bS = E.bands(sc.mc, 'short', -1), bQ = E.bands(sc.mc, 'q', -1);
    let pk = 1; for (let k = 1; k <= L; k++) if (t.ret[k] > t.ret[pk]) pk = k;
    const yrs = [0, 4, 9, 14];
    const row = (name, f, key, unit = '', flow = false) => `<tr><th scope="row">${name}${unit ? `<small>${unit}</small>` : ''}</th>${yrs.map(y => `<td>${flow && !y ? '—' : ltr(f(t[key][y]))}</td>`).join('')}<td class="b">${ltr(f(tb[key][L]))}</td></tr>`;
    const verdict = base ? 'يعرض هذا الموجز خط الأساس: استمرار السياسات الحالية حتى 2040 دون تغيير. يصلح مرجعاً تُقاس عليه البدائل.'
      : `تختبر هذه السياسة ${ch.length === 1 ? 'تغييراً واحداً' : ch.length === 2 ? 'تغييرين' : ch.length + ' تغييرات'} على الوضع الحالي. بحلول 2040 ${ins.dScore > .05 ? 'يرتفع' : ins.dScore < -.05 ? 'ينخفض' : 'يثبت'} مؤشر الجاهزية ${Math.abs(ins.dScore) > .05 ? `من ${b.rd.score.toFixed(0)} إلى ${sc.rd.score.toFixed(0)}` : `عند ${sc.rd.score.toFixed(0)}`}، وتبلغ نسبة التقطير ${p1(t.q[L])} (خط الأساس ${p1(tb.q[L])})، ويبلغ العجز ${n0(t.short[L])} وظيفة (خط الأساس ${n0(tb.short[L])})، وكتلة الأجور ${C.qar(t.W[L])} سنوياً (خط الأساس ${C.qar(tb.W[L])}).`;
    const risks = ins.list.map(i => `<li class="risk ${i.kind}">${i.text}</li>`).join('') +
      `<li class="risk note">تبلغ التقاعدات ذروتها سنة ${E.Y0 + pk} بـ ${n0(t.ret[pk])} متقاعداً (${n0(t.rs[pk])} نظامي و${n0(t.re[pk])} مبكر).</li>` +
      `<li class="risk note">عدم اليقين: في 80% من 200 مسار محتمل يقع عجز 2040 بين ${n0(bS.lo[L])} و${n0(bS.hi[L])} وظيفة، ونسبة التقطير بين ${p1(bQ.lo[L])} و${p1(bQ.hi[L])}.</li>`;
    const allLevers = LEVERS.map(lv => `<tr><th scope="row">${lv.label}</th><td>${esc(lv.fmt(D[lv.k]))}</td><td class="${sc.L[lv.k] !== D[lv.k] ? 'chg' : ''}">${esc(lv.fmt(sc.L[lv.k]))}</td></tr>`).join('') +
      SHOCKS.map(sh => `<tr><th scope="row">${sh.label}</th><td>لا يوجد</td><td class="${sc.L[sh.on] ? 'chg' : ''}">${sc.L[sh.on] ? esc(sh.desc(sc.L)) : 'لا يوجد'}</td></tr>`).join('');
    return UF.bidi(`<header class="p-head">
        <div><p class="p-kicker">موجز القرار · أُفُق</p><h1>${esc(sc.name)}</h1><p class="p-meta">${C.bothDates(new Date())} · أفق المحاكاة 2026–2040 · ${ch.length ? ch.length + ' تغييرات عن الوضع الحالي' : 'بلا تغيير عن الوضع الحالي'}</p></div>
        <div class="p-stamp"><b>${sc.rd.score.toFixed(0)}</b><span>مؤشر الجاهزية</span><small>خط الأساس ${b.rd.score.toFixed(0)}</small></div>
      </header>
      <p class="p-syn">بيانات تجريبية افتراضية: الأعداد مولَّدة آلياً لأغراض العرض ولا تمثّل إحصاءات أي جهة.</p>
      <section><h2>الخلاصة</h2><p>${verdict}</p></section>
      ${ch.length ? `<section><h2>ما الذي تغيّر</h2><table class="p-t chg-t"><thead><tr><th>الرافعة</th><th>الوضع الحالي</th><th>السياسة المختبرة</th></tr></thead><tbody>${ch.map(c => `<tr><th scope="row">${esc(c.label)}</th><td>${esc(c.from)}</td><td class="chg">${esc(c.to)}</td></tr>`).join('')}</tbody></table></section>` : ''}
      <section><h2>النتائج الرئيسية</h2>
        <div class="tbl-scroll"><table class="p-t res-t"><thead><tr><th></th>${yrs.map(y => `<th>${E.Y0 + y}</th>`).join('')}<th class="b">خط الأساس 2040</th></tr></thead><tbody>
          ${row('القوة العاملة', n0, 'S')}${row('الطلب على الوظائف', n0, 'D')}${row('العجز', n0, 'short', 'وظيفة')}${row('نسبة التقطير', p1, 'q')}
          ${row('كتلة الأجور', bn, 'W', 'مليار ر.ق')}${row('التقاعدات السنوية', n0, 'ret', '', true)}${row('التعيينات السنوية', n0, 'hires', '', true)}
        </tbody></table></div>
        <div class="minis">${mini(t.q, tb.q, p1, 'نسبة التقطير')}${mini(t.short, tb.short, n0, 'العجز (وظيفة)')}${mini(Array.from(t.W, v => v / 1e9), Array.from(tb.W, v => v / 1e9), v => v.toFixed(1), 'كتلة الأجور (مليار ر.ق)')}</div>
        <p class="p-key"><span class="s"></span>السياسة المختبرة<span class="bk"></span>خط الأساس · نمو كتلة الأجور ${p1(cagr(t))} سنوياً بالأسعار الثابتة (خط الأساس ${p1(cagr(tb))})</p>
      </section>
      <section><h2>قراءة النتائج والمخاطر</h2><ul class="risks">${risks}</ul></section>
      <section><h2>سجل الافتراضات</h2>
        <table class="p-t chg-t"><thead><tr><th>الرافعة</th><th>الوضع الحالي</th><th>في هذا الموجز</th></tr></thead><tbody>${allLevers}</tbody></table>
        <ul class="assume">
          <li>نموذج أفواج عمرية لـ 12 مجموعة وظيفية وجنسيتين وأعمار 22–64، بخطوة سنوية.</li>
          <li>التقاعد المبكر للقطريين من سن 45 بمعدل 3–7% سنوياً. التسرّب 1.5–4% للقطريين و6–9% لغير القطريين.</li>
          <li>عند تمديد سنّ التقاعد يبقى 65% ممن يبلغون الستين، ويغادر 12% منهم سنوياً بعدها.</li>
          <li>تعيينات القطريين مقيّدة بأعداد الخريجين المتاحين في كل مجموعة. أثر الابتعاث يبدأ بعد 4 سنوات.</li>
          <li>التكلفة متوسطات سنوية بالأسعار الثابتة بحسب الجنسية والفئة العمرية، ولا تشمل التزامات التقاعد.</li>
          <li>النص أعلاه يُولَّد بقوالب وقواعد معلنة من نتائج المحاكاة، وليس بذكاء اصطناعي.</li>
        </ul>
      </section>
      <footer class="p-foot">أُعدّ بمنصة أُفُق (نموذج أولي، مختبر الابتكار). النتائج محاكاة لدعم النقاش وليست تنبؤاً.</footer>`);
  }

  function compare() {
    const cols = [{ tag: 'خط الأساس', sc: S.base, cls: 'base' }];
    if (S.pins.A) cols.push({ tag: 'أ', sc: S.pins.A, pin: 'A' });
    if (S.pins.B) cols.push({ tag: 'ب', sc: S.pins.B, pin: 'B' });
    if (!cols.some(c => UF.same(c.sc.L, S.cur.L))) cols.push({ tag: 'الحالية', sc: S.cur, cur: true });
    const M = [
      ['مؤشر الجاهزية', sc => sc.rd.score, v => v.toFixed(0), 1],
      ['التقطير 2040', sc => E.totals(sc.R, -1).q[L], p1, 1],
      ['العجز 2040', sc => E.totals(sc.R, -1).short[L], n0, -1],
      ['كتلة الأجور 2040', sc => E.totals(sc.R, -1).W[L], v => bn(v), -1],
      ['نمو الأجور السنوي', sc => cagr(E.totals(sc.R, -1)), p1, -1],
      ['ذروة التقاعدات', sc => Math.max(...E.totals(sc.R, -1).ret), n0, -1],
    ];
    const body = M.map(([name, get, f, dir]) => {
      const vals = cols.map(c => get(c.sc)), best = dir > 0 ? Math.max(...vals) : Math.min(...vals);
      return `<tr><th scope="row">${name}</th>${vals.map(v => `<td class="${cols.length > 1 && Math.abs(v - best) < 1e-9 ? 'best' : ''}">${ltr(f(v))}</td>`).join('')}</tr>`;
    }).join('');
    return `<h3>مقارنة السيناريوهات</h3>
      <div class="tbl-scroll"><table class="cmp"><thead><tr><th></th>${cols.map(c => `<th><em>${c.tag}</em>${esc(c.sc.name)}</th>`).join('')}</tr></thead><tbody>${body}
        <tr class="act"><th></th>${cols.map(c => `<td>${c.pin ? `<button class="btn quiet sm" type="button" data-load="${c.pin}">حمّل</button><button class="btn quiet sm" type="button" data-unpin="${c.pin}">أزل</button>` : c.cur ? '<button class="btn quiet sm" type="button" data-pinb="A">ثبّت أ</button><button class="btn quiet sm" type="button" data-pinb="B">ثبّت ب</button>' : ''}</td>`).join('')}</tr>
      </tbody></table></div>
      <p class="cmp-note">${S.pins.A || S.pins.B ? 'القيمة الأفضل في كل صف مظلّلة. كتلة الأجور بالمليار ر.ق.' : 'ثبّت سيناريو أو اثنين من منصة السياسات لتظهر هنا جنباً إلى جنب مع خط الأساس.'}</p>`;
  }

  function csv(sc) {
    const t = E.totals(sc.R, -1), tb = E.totals(S.base.R, -1), bS = E.bands(sc.mc, 'S', -1), bQ = E.bands(sc.mc, 'q', -1);
    const head = ['السنة', 'العرض', 'العرض P10', 'العرض P90', 'الطلب', 'العجز', 'الفائض', 'نسبة التقطير %', 'التقطير P10 %', 'التقطير P90 %', 'كتلة الأجور (ر.ق)', 'تقاعد نظامي', 'تقاعد مبكر', 'استقالات وانتهاء عقود', 'تعيين قطريين', 'تعيين غير قطريين', 'إحلال', 'العرض - خط الأساس', 'العجز - خط الأساس', 'التقطير % - خط الأساس', 'كتلة الأجور - خط الأساس'];
    const r = (v, d = 0) => Number(v).toFixed(d);
    const lines = [`# أُفُق - ${sc.name} - بيانات تجريبية افتراضية - ${C.gdate(new Date())}`, head.join(',')];
    for (let i = 0; i <= L; i++) lines.push([E.Y0 + i, r(t.S[i]), r(bS.lo[i]), r(bS.hi[i]), r(t.D[i]), r(t.short[i]), r(t.surplus[i]), r(t.q[i] * 100, 2), r(bQ.lo[i] * 100, 2), r(bQ.hi[i] * 100, 2), r(t.W[i]), r(t.rs[i]), r(t.re[i]), r(t.at[i]), r(t.hq[i]), r(t.hn[i]), r(t.rp[i]), r(tb.S[i]), r(tb.short[i]), r(tb.q[i] * 100, 2), r(tb.W[i])].join(','));
    return lines.join('\r\n');
  }
  UF.csv = csv;

  UF.views.brief = {
    mount(root) {
      el = root;
      el.innerHTML = `<div class="wrap brief-grid">
        <div class="brief-main">
          <div class="brief-tools">
            <div><p class="eyebrow">موجز القرار</p><h2>موجز جاهز للعرض على صاحب القرار</h2></div>
            <div class="bt-actions">
              <button class="btn primary" type="button" id="bPrint">طباعة / حفظ PDF</button>
              <button class="btn line" type="button" id="bCsv">تصدير النتائج السنوية CSV</button>
              <button class="btn line" type="button" id="bCopy">نسخ نص الموجز</button>
            </div>
          </div>
          <article class="paper" id="paper" lang="ar"></article>
        </div>
        <aside class="brief-side">
          <div class="panel cmp-p" id="cmp"></div>
          <div class="panel side-note"><h3>كيف يُكتب هذا الموجز؟</h3><p>الجداول من نتائج المحاكاة مباشرة. الفقرات والمخاطر تُولَّد بقوالب وقواعد معلنة (مثال: إذا تجاوز نقص المرشحين القطريين ربع التعيينات المستهدفة في مجموعة ما، يُذكر خط الإمداد قيداً حاكماً). لا يُستخدم ذكاء اصطناعي.</p><button class="btn quiet sm" type="button" id="bMethod">اطّلع على المنهجية</button></div>
        </aside>
      </div>`;
      $('#bMethod', el).addEventListener('click', UF.openMethod);
      $('#bPrint', el).addEventListener('click', () => {
        let fired = false; const on = () => { fired = true; }; window.addEventListener('beforeprint', on, { once: true });
        try { window.print(); } catch (e) {}
        setTimeout(() => { window.removeEventListener('beforeprint', on); if (!fired) UF.toast('إن لم تظهر نافذة الطباعة، افتح الملف مباشرة في المتصفح ثم أعد المحاولة.'); }, 700);
      });
      $('#bCsv', el).addEventListener('click', () => UF.openExport({ title: 'تصدير النتائج السنوية', note: `ملف CSV بترميز UTF-8 يفتح في Excel مباشرة: صف لكل سنة من 2026 إلى 2040 للسيناريو «${S.cur.name}» مع خط الأساس.`, text: csv(S.cur), filename: 'ufuq-results.csv', mime: 'text/csv' }));
      $('#bCopy', el).addEventListener('click', () => UF.openExport({ title: 'نص الموجز', note: 'نص الموجز دون تنسيق، جاهز للّصق في بريد أو مذكرة.', text: $('#paper', el).innerText.replace(/\n{3,}/g, '\n\n'), filename: 'ufuq-brief.txt', mime: 'text/plain' }));
      $('#cmp', el).addEventListener('click', ev => {
        const b = ev.target.closest('button'); if (!b) return;
        if (b.dataset.load) { UF.setLevers(Object.assign({}, S.pins[b.dataset.load].L), true); UF.toast('حُمّل السيناريو في منصة السياسات وهذا الموجز.'); }
        if (b.dataset.unpin) { S.pins[b.dataset.unpin] = null; this.update(); }
        if (b.dataset.pinb) { S.pins[b.dataset.pinb] = Object.assign({}, S.cur); this.update(); UF.toast('ثُبّت السيناريو للمقارنة.'); }
      });
    },
    update(what) {
      if (what === 'year') return;
      $('#paper', el).innerHTML = paper(S.cur);
      $('#cmp', el).innerHTML = compare();
    },
  };
})();
