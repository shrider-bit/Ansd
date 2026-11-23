/* أُفُق — الشاشة 2: منصة السياسات (الروافع والنتائج الحيّة). */
(() => {
  'use strict';
  const { S, E, C, $, $$, n0, p1, num, ltr, esc, sgn, delta, D, LEVERS, SHOCKS, GROUPS, PRESETS, T } = UF;
  let el, card, pyr, pyrStats, heat;
  const years = (a, b) => { let s = ''; for (let y = a; y <= b; y++) s += `<option value="${y}">${y}</option>`; return s; };

  function leverHTML(lv) {
    if (lv.t === 'range') {
      const p = (D[lv.k] - lv.min) / (lv.max - lv.min);
      return `<div class="lv" data-k="${lv.k}"><div class="lv-top"><label for="lv-${lv.k}">${lv.label}</label><output class="num" for="lv-${lv.k}"></output></div>
        <div class="lv-range"><input type="range" id="lv-${lv.k}" data-k="${lv.k}" min="${lv.min}" max="${lv.max}" step="${lv.step}"><i class="lv-def" style="inset-inline-start:calc(7px + (100% - 14px) * ${p.toFixed(4)})" title="الوضع الحالي"></i></div>
        ${lv.hint ? `<p class="lv-hint">${UF.bidi(lv.hint)}</p>` : ''}</div>`;
    }
    if (lv.t === 'seg') return `<div class="lv" data-k="${lv.k}"><div class="lv-top"><span class="lab">${lv.label}</span>
        <div class="seg" role="group" aria-label="${lv.label}">${lv.opts.map(o => `<button type="button" data-k="${lv.k}" data-v="${o[0]}">${o[1]}</button>`).join('')}</div></div></div>`;
    return `<div class="lv" data-k="${lv.k}"><div class="lv-top"><span class="lab" id="lb-${lv.k}">${lv.label}</span><button type="button" class="switch" role="switch" data-k="${lv.k}" aria-labelledby="lb-${lv.k}"></button></div>
        ${lv.hint ? `<p class="lv-hint">${lv.hint}</p>` : ''}</div>`;
  }
  function shockHTML(sh) {
    return `<div class="lv shock" data-on="${sh.on}"><div class="lv-top"><span class="lab" id="lb-${sh.on}">${sh.label}</span><button type="button" class="switch" role="switch" data-k="${sh.on}" aria-labelledby="lb-${sh.on}"></button></div>
      <div class="shock-body">
        <label>تبدأ سنة <select data-k="${sh.year}" id="sel-${sh.year}">${years(2027, 2038)}</select></label>
        ${sh.dur ? `<label>لمدة <select data-k="${sh.dur}" id="sel-${sh.dur}"><option value="1">سنة</option><option value="2">سنتين</option><option value="3">3 سنوات</option><option value="4">4 سنوات</option></select></label>` : ''}
        ${sh.size ? `<div class="lv-range wide"><div class="lv-top"><label for="lv-${sh.size}">${sh.sLabel}</label><output class="num" for="lv-${sh.size}"></output></div><input type="range" id="lv-${sh.size}" data-k="${sh.size}" min="${sh.sMin}" max="${sh.sMax}" step=".01"></div>` : ''}
      </div></div>`;
  }

  /* Rule-based reading of a scenario against the baseline (plain rules, no AI). Shared with the brief. */
  function insights(sc) {
    const out = [], b = S.base, L = UF.LAST, t = E.totals(sc.R, -1), tb = E.totals(b.R, -1), lv = sc.L;
    const dq = t.q[L] - tb.q[L], dS = t.short[L] - tb.short[L], dW = t.W[L] - tb.W[L], dScore = sc.rd.score - b.rd.score;
    // where does the graduate pipeline bind?
    const bind = E.F.map((f, i) => { const x = E.totals(sc.R, i); let pb = 0, hq = 0; for (let k = 1; k <= L; k++) { pb += x.pb[k]; hq += x.hq[k]; } return { ar: f.ar, pb, share: pb / Math.max(1, pb + hq) }; })
      .filter(x => x.share > .25 && x.pb > 150).sort((a, c) => c.pb - a.pb);
    if (bind.length && lv.qTarget >= D.qTarget) out.push({ kind: 'warn', key: 'pipeline', text: `خط إمداد الخريجين القطريين هو القيد الحاكم في: ${bind.slice(0, 3).map(x => x.ar).join('، ')}. رفع حصة القطريين من التعيينات لا يُترجم إلى تعيينات فعلية هناك دون توسعة الابتعاث أو توجيهه.` });
    if (lv.retAge > 60) {
      let r = 0, rb = 0, pk = 1, pkb = 1; for (let k = 1; k <= L; k++) { r += t.rs[k]; rb += tb.rs[k]; if (t.ret[k] > t.ret[pk]) pk = k; if (tb.ret[k] > tb.ret[pkb]) pkb = k; }
      out.push({ kind: 'note', key: 'ret', text: `تمديد سنّ التقاعد إلى ${lv.retAge} يؤجّل ${n0(rb - r)} حالة تقاعد نظامي حتى 2040، لكنه لا يلغي الموجة: ذروة التقاعدات ${pk === pkb ? 'تبقى سنة ' + (E.Y0 + pk) : 'تنتقل من ' + (E.Y0 + pkb) + ' إلى ' + (E.Y0 + pk)}.` });
    }
    if (dq > .01 && dS > tb.short[L] * .08) out.push({ kind: 'warn', key: 'tradeoff', text: `تحسّن نسبة التقطير (${sgn(dq * 100, v => v.toFixed(1))} نقطة) يصاحبه اتّساع العجز بمقدار ${n0(dS)} وظيفة. جزء من التحسّن ناتج عن تقليص التعيينات، لا عن زيادة أعداد القطريين.` });
    if (!lv.allowNQ) out.push({ kind: 'warn', key: 'nq', text: 'منع التعويض بغير القطريين يترك الوظائف شاغرة في التخصصات التي يقلّ فيها الخريجون. راقب عمود العجز في الصحة وتقنية المعلومات.' });
    if (lv.dx > D.dx + .2) {
      let cut = 0; E.F.forEach((f, i) => { if (f.dxCut >= .15) cut += E.totals(b.R, i).D[L] - E.totals(sc.R, i).D[L]; });
      const it = E.F.findIndex(f => f.id === 'it'), dIt = E.totals(sc.R, it).D[L] - E.totals(b.R, it).D[L];
      out.push({ kind: 'note', key: 'dx', text: `التحول الرقمي يخفض الطلب على الوظائف الإدارية والمالية وخدمة المتعاملين بـ ${n0(cut)} وظيفة سنة 2040 مقارنة بخط الأساس، ويرفع الطلب على تقنية المعلومات بـ ${n0(dIt)}. يتحقق الخفض بالتقاعد والتسرّب الطبيعي دون استغناء، لكنه لا يسدّ عجز التقنية دون إعادة تأهيل.` });
    }
    if (lv.freezeOn) { let pk = 1; for (let k = 1; k <= L; k++) if (t.shortPct[k] > t.shortPct[pk]) pk = k; out.push({ kind: 'warn', key: 'freeze', text: `تجميد التوظيف يرفع العجز إلى ${p1(t.shortPct[pk])} من الطلب سنة ${E.Y0 + pk}، ويحتاج التعافي منه سنوات بعد رفع التجميد.` }); }
    if (Math.abs(dW) > 2e8) out.push({ kind: dW > 0 ? 'cost' : 'good', key: 'cost', text: `كتلة الأجور سنة 2040: ${C.qar(t.W[L])}، أي ${dW > 0 ? 'أعلى' : 'أقل'} من خط الأساس بـ ${C.qar(Math.abs(dW))} سنوياً.` });
    if (dq > .02 && !out.some(o => o.key === 'tradeoff')) out.push({ kind: 'good', key: 'q', text: `نسبة التقطير تبلغ ${p1(t.q[L])} سنة 2040 مقابل ${p1(tb.q[L])} في خط الأساس.` });
    return { list: out, dq, dS, dW, dScore, bind };
  }
  UF.insights = insights;

  const PARTS = [['coverage', 'تغطية الطلب'], ['qatar', 'التقدّم في التقطير'], ['cost', 'الاستدامة المالية'], ['experience', 'استمرارية الخبرة']];

  UF.views.lab = {
    mount(root) {
      el = root;
      el.innerHTML = `<div class="wrap lab">
        <aside class="levers" id="levers" aria-label="روافع السياسة">
          <div class="lev-head"><h2>روافع السياسة</h2><button class="btn quiet sm" type="button" id="resetL">إعادة الضبط</button></div>
          <p class="lev-sub">سيناريوهات جاهزة</p>
          <div class="presets" role="group" aria-label="سيناريوهات جاهزة">${PRESETS.map(p => `<button type="button" class="preset" data-preset="${p.id}">${p.name}</button>`).join('')}</div>
          ${GROUPS.map(([g, name]) => `<details class="lgrp" ${g === 'shock' ? '' : 'open'} data-g="${g}"><summary><span>${name}</span><em class="cnt"></em></summary>
            <div class="lgrp-b">${g === 'shock' ? SHOCKS.map(shockHTML).join('') : LEVERS.filter(l => l.g === g).map(leverHTML).join('')}</div></details>`).join('')}
        </aside>
        <div class="results">
          <div class="scn-head">
            <div class="scn-t"><p class="eyebrow">السياسة المختبرة</p><h2 id="scnName"></h2><div class="scn-diff" id="scnDiff"></div></div>
            <div class="scn-actions"><button class="btn line sm" type="button" data-pin="A">ثبّت كسيناريو أ</button><button class="btn line sm" type="button" data-pin="B">ثبّت كسيناريو ب</button><button class="btn primary sm" type="button" data-go="brief">موجز القرار</button></div>
          </div>
          <div class="kpis">
            <div class="panel gaugec" id="kGauge"></div>
            <div class="kgrid" id="kGrid"></div>
          </div>
          <div class="insight" id="insight" aria-live="polite"></div>
          ${UF.cardHTML('الأفق الزمني')}
          <div class="grid-chart two">
            <div class="panel pyr"><div class="panel-h"><h3>الهرم العمري</h3><span class="sub">سنة <span class="num pyr-year"></span></span></div><div class="panel-b"><div class="pyr-host"></div><div class="pyr-stats"></div></div></div>
            <div class="panel"><div class="panel-h"><h3>حركة الداخلين والخارجين</h3><span class="sub">خلال سنة <span class="num flow-year"></span></span></div><div class="panel-b" id="flows"></div></div>
          </div>
          <div class="panel"><div class="panel-h"><h3>خريطة العجز والفائض</h3><span class="sub">المجموعة الوظيفية × السنة، في السياسة المختبرة</span></div><div class="panel-b"><div id="heat"></div></div></div>
        </div>
      </div>`;
      card = $('.chartcard', el); UF.cardBind(card);
      pyr = $('.pyr-host', el); pyrStats = $('.pyr-stats', el); heat = $('#heat', el);
      const lev = $('#levers', el);
      lev.addEventListener('input', ev => {
        const k = ev.target.dataset.k; if (!k || ev.target.type !== 'range') return;
        UF.setLevers({ [k]: +ev.target.value }); this.sync();
      });
      lev.addEventListener('change', ev => { const k = ev.target.dataset.k; if (k && ev.target.tagName === 'SELECT') { UF.setLevers({ [k]: +ev.target.value }, true); } });
      lev.addEventListener('click', ev => {
        const b = ev.target.closest('button'); if (!b) return;
        if (b.id === 'resetL') { UF.setLevers(Object.assign({}, D), true); return UF.toast('أُعيدت الروافع إلى الوضع الحالي'); }
        if (b.dataset.preset) { const p = PRESETS.find(x => x.id === b.dataset.preset); UF.setLevers(Object.assign({}, D, p.L), true); if (p.L.waveOn) $('details[data-g="shock"]', el).open = true; return; }
        if (b.classList.contains('switch')) return UF.setLevers({ [b.dataset.k]: !S.L[b.dataset.k] }, true);
        if (b.dataset.v) return UF.setLevers({ [b.dataset.k]: b.dataset.v }, true);
      });
      el.addEventListener('click', ev => {
        const p = ev.target.closest('[data-pin]'); if (!p) return;
        S.pins[p.dataset.pin] = Object.assign({}, S.cur, { name: S.cur.name });
        UF.toast(`ثُبّت «${S.cur.name}» كسيناريو ${p.dataset.pin === 'A' ? 'أ' : 'ب'}. قارن بينهما في موجز القرار.`);
        this.update();
      });
    },
    sync() {                                     // controls ← state
      const L = S.L;
      $$('input[type="range"][data-k]', el).forEach(i => {
        const k = i.dataset.k; i.value = L[k]; i.style.setProperty('--fill', ((L[k] - i.min) / (i.max - i.min) * 100) + '%');
        const lv = LEVERS.find(x => x.k === k), out = $(`output[for="lv-${k}"]`, el);
        if (out) out.textContent = lv ? lv.fmt(L[k]) : UF.pct0(L[k]);
        const row = i.closest('.lv'); if (row && lv) row.classList.toggle('changed', Math.abs(L[k] - D[k]) > 1e-9);
      });
      $$('.seg button[data-v]', el).forEach(b => b.setAttribute('aria-pressed', String(String(L[b.dataset.k]) === b.dataset.v)));
      $$('.switch[data-k]', el).forEach(b => b.setAttribute('aria-checked', String(!!L[b.dataset.k])));
      $$('select[data-k]', el).forEach(s => { s.value = L[s.dataset.k]; });
      $$('.shock', el).forEach(s => s.classList.toggle('on', !!L[s.dataset.on]));
      const p = UF.presetOf(L); $$('.preset', el).forEach(b => b.setAttribute('aria-pressed', String(!!p && p.id === b.dataset.preset)));
      const ch = UF.changes(L);
      $$('.lgrp', el).forEach(g => { const ks = g.dataset.g === 'shock' ? SHOCKS.map(s => s.on) : LEVERS.filter(l => l.g === g.dataset.g).map(l => l.k); const n = ch.filter(c => ks.includes(c.k)).length; $('.cnt', g).textContent = n ? n : ''; });
    },
    update(what) {
      const sc = S.cur, b = S.base, y = S.year, t = T(sc), tb = T(b);
      if (what !== 'year') {
        this.sync();
        const ch = UF.changes(sc.L);
        $('#scnName', el).textContent = sc.name;
        $('#scnDiff', el).innerHTML = ch.length ? ch.map(c => `<span class="chip on" title="${esc(c.label)}: ${esc(c.from)} ← ${esc(c.to)}">${esc(c.shock ? c.to : c.label + ' ' + c.to)}</span>`).join('') : '<span class="sub">لم تُغيَّر أي رافعة بعد. اختر سيناريو جاهزاً أو حرّك الروافع.</span>';
        const rd = sc.rd, d = rd.score - b.rd.score;
        $('#kGauge', el).innerHTML = `<div class="g-head"><h3>مؤشر الجاهزية</h3><button type="button" class="linkb" id="gMethod">كيف يُحسب؟</button></div>
          <div class="g-arc">${UFC.gauge(rd.score, b.rd.score)}<b class="num g-score">${rd.score.toFixed(0)}</b></div>
          <p class="g-delta">${Math.abs(d) < .05 ? '<span class="flat">مطابق لخط الأساس</span>' : `<span class="${d > 0 ? 'up' : 'down'}">${sgn(d, v => v.toFixed(1))} نقطة</span> عن خط الأساس (${num(b.rd.score.toFixed(0))})`}<small>لكامل الأفق حتى 2040 ولكل المجموعات</small></p>
          <div class="g-parts">${PARTS.map(([k, name]) => `<div class="g-part"><span>${name}<small>${Math.round(E.WEIGHTS[k] * 100)}%</small></span><div class="g-bar"><i style="width:${(rd.parts[k] * 100).toFixed(1)}%"></i><u style="inset-inline-start:${(b.rd.parts[k] * 100).toFixed(1)}%"></u></div><b class="num">${Math.round(rd.parts[k] * 100)}</b></div>`).join('')}</div>`;
        $('#gMethod', el).addEventListener('click', UF.openMethod);
        const ins = insights(sc);
        $('#insight', el).innerHTML = UF.isBase()
          ? '<p class="note"><b>قراءة سريعة:</b> ما تراه الآن هو خط الأساس بلونه البارد. عند تغيير أي رافعة يظهر مسار السياسة المختبرة بلون الأفق، ويبقى خط الأساس منقّطاً للمقارنة.</p>'
          : `<p class="note"><b>قراءة سريعة:</b> ${ins.dScore >= .05 ? `ترتفع الجاهزية ${ins.dScore.toFixed(1)} نقطة.` : ins.dScore <= -.05 ? `تنخفض الجاهزية ${Math.abs(ins.dScore).toFixed(1)} نقطة.` : 'الجاهزية لا تتغيّر.'}</p>` + ins.list.slice(0, 2).map(i => `<p class="${i.kind}">${i.text}</p>`).join('') + (ins.list.length > 2 ? `<p class="more">و${ins.list.length - 2 === 1 ? 'ملاحظة أخرى' : (ins.list.length - 2) + ' ملاحظات أخرى'} في <button type="button" class="linkb" data-go="brief">موجز القرار</button>.</p>` : '');
        const rows = E.F.map((f, i) => { const x = E.totals(sc.R, i); return { i, label: f.ar, v: Array.from(x.D, (dd, k) => (dd - x.S[k]) / dd) }; });
        UFC.heatmap(heat, { rows, year: y, fam: S.fam, onCell: (f, tt, isLab) => { if (isLab) UF.setFam(f); else if (tt != null) UF.setYear(tt); } });
      } else {
        $$('.hm-c.on, .hm-y.on', heat).forEach(c => c.classList.remove('on'));
        $$(`.hm-c[data-t="${y}"], .hm-y[data-t="${y}"]`, heat).forEach(c => c.classList.add('on'));
      }
      // year-dependent tiles
      const yr = E.Y0 + y, fam = UF.famName(), big = t.W[y] >= 1e9;
      const tile = (label, val, sub, dl) => `<div class="kpi"><span>${label}</span><b class="num">${val}</b><small>${sub}</small>${dl}</div>`;
      $('#kGrid', el).innerHTML = `<p class="kgrid-h">سنة <b class="num">${yr}</b> · ${esc(fam)}</p>` +
        tile('العجز', n0(t.short[y]), `${p1(t.shortPct[y])} من الطلب`, delta(t.short[y] - tb.short[y], n0, -1, .5)) +
        tile('نسبة التقطير', p1(t.q[y]), `${n0(t.SQ[y])} قطري من ${n0(t.S[y])}`, delta((t.q[y] - tb.q[y]) * 100, v => v.toFixed(1), 1, .05, 'نقطة')) +
        tile('كتلة الأجور', big ? (t.W[y] / 1e9).toFixed(2) : (t.W[y] / 1e6).toFixed(0), (big ? 'مليار' : 'مليون') + ' ر.ق سنوياً', delta((t.W[y] - tb.W[y]) / 1e6, v => C.num(Math.round(v)), -1, 5, 'مليون ر.ق')) +
        tile('التقاعدات', n0(t.ret[y]), y ? `${n0(t.rs[y])} نظامي و${n0(t.re[y])} مبكر` : 'سنة الأساس', delta(t.ret[y] - tb.ret[y], n0, -1, .5));
      UF.cardUpdate(card, sc);
      UF.pyramidUpdate(pyr, sc, pyrStats);
      $('.pyr-year', el).textContent = yr; $('.flow-year', el).textContent = yr;
      // flows in the selected year
      const F = [['hq', 'تعيين قطريين', 'in'], ['hn', 'تعيين غير قطريين', 'in'], ['rp', 'إحلال', 'in'], ['rs', 'تقاعد نظامي', 'out'], ['re', 'تقاعد مبكر', 'out'], ['at', 'استقالات وانتهاء عقود', 'out']];
      if (!y) $('#flows', el).innerHTML = '<p class="empty">2026 هي سنة الأساس ولا تدفقات قبلها. حرّك مؤشر السنة أو اضغط زر التشغيل.</p>';
      else {
        let mx = 1; for (const [k] of F) mx = Math.max(mx, t[k][y], tb[k][y]);
        $('#flows', el).innerHTML = F.map(([k, name, dir]) => `<div class="flow ${dir}"><span>${name}</span><div class="fbars"><i class="s" style="width:${(t[k][y] / mx * 100).toFixed(1)}%"></i><i class="b" style="width:${(tb[k][y] / mx * 100).toFixed(1)}%"></i></div><b class="num">${n0(t[k][y])}</b></div>`).join('') +
          `<p class="flow-key"><span class="s"><i></i>السياسة المختبرة</span><span class="b"><i></i>خط الأساس</span><span>صافي التغيّر ${num(sgn(t.S[y] - t.S[y - 1], n0))}</span></p>`;
      }
    },
  };
})();
