/* أُفُق — الشاشة 1: المشهد (صورة اليوم وخط الأساس). */
(() => {
  'use strict';
  const { S, E, C, $, $$, n0, p1, num, ltr, esc, T } = UF;
  let el, card, pyr, pyrStats;

  function facts() {
    const b = S.base, t = E.totals(b.R, -1), L = UF.LAST;
    let retSum = 0, peakT = 1;
    for (let i = 1; i <= L; i++) { retSum += t.ret[i]; if (t.ret[i] > t.ret[peakT]) peakT = i; }
    const fams = E.F.map((f, i) => { const tt = E.totals(b.R, i); return { i, ar: f.ar, short: Math.max(0, tt.D[L] - tt.S[L]) }; }).sort((a, x) => x.short - a.short);
    const top2 = fams[0].short + fams[1].short;
    const p0 = E.pyramid(b.R, 0, -1);
    return { t, L, retSum, peakT, fams, top2, p0 };
  }

  UF.views.scene = {
    mount(root) {
      el = root; const f = facts(), t = f.t;
      el.innerHTML = `
      <div class="hero">
        <div class="hero-sky" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="wrap hero-in">
          <p class="eyebrow">محاكاة تمتد من 2026 إلى 2040 · قوة عاملة حكومية افتراضية</p>
          <h1>اختبر القرار<br>قبل أن يصدر</h1>
          <p class="lede">أُفُق يتقدّم بالقوة العاملة خمسة عشر عاماً إلى الأمام: من يتقاعد، من يُعيَّن، وأين يتّسع العجز. غيّر سنّ التقاعد أو حصة القطريين من التعيينات أو وتيرة التحول الرقمي، وشاهد الأثر قبل اعتماد السياسة.</p>
          <div class="hero-cta">
            <button class="btn primary" type="button" data-go="lab">اختبر سياسة</button>
            <button class="btn line" type="button" data-go="inverse">ابدأ من الهدف</button>
            <button class="btn quiet" type="button" id="heroTour">جولة العرض في دقيقتين</button>
          </div>
        </div>
      </div>
      <div class="wrap">
        <div class="snap" id="snap" aria-label="صورة سنة 2026">
          <div><span>إجمالي القوة العاملة</span><b class="num">${n0(t.S[0])}</b><small>موظف في 24 جهة افتراضية</small></div>
          <div><span>نسبة التقطير</span><b class="num">${p1(t.q[0])}</b><small>المستهدف المرجعي 60%</small></div>
          <div><span>من تجاوزوا الخمسين</span><b class="num">${p1(f.p0.share50)}</b><small>يبلغون سنّ التقاعد خلال عشر سنوات</small></div>
          <div><span>كتلة الأجور السنوية</span><b class="num">${ltr((t.W[0] / 1e9).toFixed(1))}</b><small>مليار ر.ق</small></div>
          <div><span>العجز الحالي</span><b class="num">${n0(t.short[0])}</b><small>وظيفة، أي ${p1(t.shortPct[0])} من الطلب</small></div>
        </div>

        <div class="sec-h">
          <h2>إن لم يتغيّر شيء</h2>
          <p>خط الأساس يفترض استمرار السياسات الحالية حتى 2040. هذه هي الصورة التي تُقاس عليها كل سياسة تختبرها.</p>
        </div>
        <div class="findings" id="findings">
          <article>
            <div class="f-top"><b class="num">${n0(f.retSum)}</b>${UFC.spark(Array.from(t.ret), 110, 30)}</div>
            <h3>موظف يغادرون بالتقاعد حتى 2040</h3>
            <p>أي ${p1(f.retSum / t.S[0])} من قوة اليوم. ترتفع التقاعدات السنوية من ${num(n0(t.ret[2]))} سنة 2028 إلى ذروة ${num(n0(t.ret[f.peakT]))} سنة ${num(E.Y0 + f.peakT)}.</p>
          </article>
          <article>
            <div class="f-top"><b class="num">${p1(t.q[f.L])}</b>${UFC.spark(Array.from(t.q, v => v - t.q[0]), 110, 30, 'neg')}</div>
            <h3>نسبة التقطير سنة 2040، نزولاً من ${p1(t.q[0])}</h3>
            <p>الطلب ينمو في الصحة والتقنية والهندسة، حيث أعداد الخريجين القطريين أقل من الحاجة، فيُسدّ الفرق بغير القطريين.</p>
          </article>
          <article>
            <div class="f-top"><b class="num">${n0(t.short[f.L])}</b>${UFC.spark(Array.from(t.short), 110, 30, 'neg')}</div>
            <h3>وظيفة بلا شاغل سنة 2040</h3>
            <p>مقابل ${num(n0(t.short[0]))} اليوم. ${esc(f.fams[0].ar)} و${esc(f.fams[1].ar)} تحملان ${p1(f.top2 / t.short[f.L])} من العجز.</p>
          </article>
        </div>

        <div class="grid-chart">
          ${UF.cardHTML('الأفق الزمني لخط الأساس')}
          <div class="panel pyr">
            <div class="panel-h"><h3>الهرم العمري</h3><span class="sub">سنة <span class="num pyr-year"></span></span></div>
            <div class="panel-b"><div class="pyr-host"></div><div class="pyr-stats"></div></div>
          </div>
        </div>

        <div class="panel famp">
          <div class="panel-h"><h3>المجموعات الوظيفية في خط الأساس</h3><span class="sub">اضغط على مجموعة لتصفية الرسمين أعلاه</span></div>
          <div class="panel-b"><div class="tbl-scroll"><table class="fam" id="famTable"></table></div></div>
        </div>

        <div class="next">
          <div><h2>ما الذي يمكن تغييره؟</h2><p>أحد عشر رافعة وثلاث صدمات. اختبرها واحدة واحدة أو ابدأ بسيناريو جاهز.</p></div>
          <button class="btn primary" type="button" data-go="lab">انتقل إلى منصة السياسات</button>
        </div>
      </div>`;
      card = $('.chartcard', el); UF.cardBind(card);
      pyr = $('.pyr-host', el); pyrStats = $('.pyr-stats', el);
      $('#heroTour', el).addEventListener('click', () => UF.tour.start());
      $('#famTable', el).addEventListener('click', ev => { const r = ev.target.closest('tr[data-f]'); if (!r) return; UF.setFam(+r.dataset.f); card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
      this.table();
    },
    table() {
      const b = S.base, L = UF.LAST;
      const rows = E.F.map((f, i) => {
        const t = E.totals(b.R, i), g = (t.D[L] - t.S[L]) / t.D[L], p = E.pyramid(b.R, 0, i);
        const series = Array.from(t.D, (d, k) => (d - t.S[k]) / d);
        return `<tr data-f="${i}" tabindex="0" class="${S.fam === i ? 'sel' : ''}">
          <th scope="row">${esc(f.ar)}${f.scarce ? '<em>تخصص نادر</em>' : ''}</th>
          <td class="n">${n0(t.S[0])}</td>
          <td class="n q">${p1(t.q[0]).replace('.0', '')}<i>←</i><b class="${t.q[L] < t.q[0] - .005 ? 'down' : t.q[L] > t.q[0] + .005 ? 'up' : ''}">${p1(t.q[L])}</b></td>
          <td class="n">${p1(p.share50)}</td>
          <td class="gapc"><span class="gbar"><i style="width:${Math.min(100, Math.abs(g) / .10 * 100).toFixed(0)}%;background:${UFC.heatColor(g)}"></i></span><b class="num">${ltr((g * 100).toFixed(1) + '%')}</b><small class="num">${n0(Math.abs(t.D[L] - t.S[L]))}</small></td>
          <td class="sp">${UFC.spark(series, 96, 24, g > 0 ? 'neg' : '')}</td></tr>`;
      }).join('');
      $('#famTable', el).innerHTML = `<thead><tr><th>المجموعة الوظيفية</th><th class="n">العدد 2026</th><th class="n">التقطير 2026 ← 2040</th><th class="n">تجاوزوا الخمسين</th><th>العجز سنة 2040</th><th>مسار العجز</th></tr></thead><tbody>${rows}</tbody>`;
    },
    update(what) {
      UF.cardUpdate(card, null);
      UF.pyramidUpdate(pyr, S.base, pyrStats);
      $('.pyr-year', el).textContent = E.Y0 + S.year;
      if (what !== 'year') $$('#famTable tr[data-f]', el).forEach(r => r.classList.toggle('sel', +r.dataset.f === S.fam));
    },
  };
  document.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.matches && ev.target.matches('#famTable tr[data-f]')) ev.target.click(); });
})();
