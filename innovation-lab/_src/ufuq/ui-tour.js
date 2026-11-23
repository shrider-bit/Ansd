/* أُفُق — جولة العرض: ست محطات تقود الواجهة وتروي القصة، وتصلح نصاً للعرض أمام الإدارة. */
(() => {
  'use strict';
  const { S, E, C, $, $$, n0, p1, D, PRESETS } = UF;
  const L = UF.LAST;
  const preset = id => Object.assign({}, D, PRESETS.find(p => p.id === id).L);
  const STEPS = [
    { view: 'scene', target: '#snap', title: 'قوة عاملة افتراضية بحجم حكومة',
      text: () => `${n0(E.TOTAL)} موظفاً في 12 مجموعة وظيفية، بأعمارهم وجنسياتهم. الأرقام تجريبية، لكن النموذج نفسه يعمل على البيانات الفعلية عند ربطه بها.` },
    { view: 'scene', target: '#findings', title: 'ماذا لو لم يتغيّر شيء؟',
      text: () => { const t = E.totals(S.base.R, -1); return `خط الأساس يكشف ثلاث حقائق قبل أن تقع: موجة تقاعد تتصاعد، ونسبة تقطير تتراجع من ${p1(t.q[0])} إلى ${p1(t.q[L])}، وعجز يتّسع إلى ${n0(t.short[L])} وظيفة. السؤال: أي سياسة تغيّر هذا المسار؟`; } },
    { view: 'lab', target: '.kpis', before: () => { UF.setLevers(preset('qat'), true); UF.setMetric('q'); UF.setYear(L); }, title: 'اختبر سياسة: تسريع التقطير',
      text: () => { const t = E.totals(S.cur.R, -1), b = E.totals(S.base.R, -1); return `رفعنا حصة القطريين من التعيينات إلى 90% ووسّعنا الابتعاث 60%. النتيجة فورية: التقطير ${p1(t.q[L])} سنة 2040 بدل ${p1(b.q[L])}، والجاهزية ${S.cur.rd.score.toFixed(0)} بدل ${S.base.rd.score.toFixed(0)}. وكتلة الأجور ترتفع، فلا شيء بلا ثمن.`; } },
    { view: 'lab', target: '#view-lab .chartcard', before: () => { UF.setMetric('q'); UF.setYear(0); setTimeout(() => UF.play(), 500); }, title: 'الزمن يتحرّك أمامك',
      text: () => 'الخط الكهرماني مسار السياسة المختبرة، والمنقّط خط الأساس، والمساحة المظلّلة نطاق عدم اليقين من 200 مسار محتمل. لاحظ أن الأثر لا يظهر قبل 2030: الخريجون يحتاجون وقتاً ليصلوا.' },
    { view: 'inverse', target: '.inv-grid', before: () => { UF.stop(); UF.setLevers(Object.assign({}, D), true); if (!S.inv.running) S.inv.out = null; }, title: 'أو ابدأ من الهدف',
      text: () => 'حدّد الغاية (مثلاً: تقطير 52% بحلول 2035 مع سقف لنمو الأجور وللعجز)، فيحاكي النموذج 1,400 حزمة سياسات. تظهر أسفل الخريطة ثلاثة مسارات: أقل تغيير، أقل تكلفة، والأسرع بلوغاً، ويمكن تطبيق أيٍّ منها بضغطة. وإن استحال الهدف، يسمّي النموذج القيد الذي يمنعه.' },
    { view: 'brief', target: '#paper', before: () => { const b = S.inv.out && S.inv.out.feasible ? S.inv.out.bundles[0].p.L : preset('mix'); UF.setLevers(Object.assign({}, b), true); }, title: 'قرار موثّق في موجز واحد',
      text: () => 'موجز جاهز للطباعة: ما الذي تغيّر، النتائج مقابل خط الأساس، المخاطر، وسجل الافتراضات كاملاً. يمكن تثبيت سيناريوهين ومقارنتهما، وتصدير النتائج السنوية إلى Excel.' },
  ];
  let idx = -1, raf = 0;
  const tour = $('#tour'), spot = $('#tourSpot'), card = $('#tourCard');

  function place() {
    if (idx < 0) return;
    const st = STEPS[idx], t = $(st.target);
    if (!t) return;
    const r = t.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight, pad = 8;
    const top = Math.max(pad, r.top - pad), bottom = Math.min(vh - pad, r.bottom + pad);
    const left = Math.max(pad, r.left - pad), right = Math.min(vw - pad, r.right + pad);
    Object.assign(spot.style, { top: top + 'px', left: left + 'px', width: Math.max(0, right - left) + 'px', height: Math.max(0, bottom - top) + 'px' });
    const cw = card.offsetWidth, chh = card.offsetHeight;
    let cy, cx = Math.max(12, Math.min(vw - cw - 12, right - cw));
    if (vw < 700) { cy = vh - chh - 12; cx = (vw - cw) / 2; if (bottom > cy - 8 && top > chh + 24) cy = 12 + (document.querySelector('.top').offsetHeight || 0); }
    else if (vh - bottom > chh + 24) cy = bottom + 14;
    else if (top > chh + 24) cy = top - chh - 14;
    else { cy = vh - chh - 16; cx = left > cw + 40 ? left - cw - 16 : Math.min(vw - cw - 16, Math.max(16, cx)); }
    card.style.top = cy + 'px'; card.style.left = cx + 'px';
  }
  function show(i) {
    idx = i; const st = STEPS[i];
    tour.hidden = false; document.body.classList.add('touring');
    if (st.before) st.before();
    if (S.view !== st.view) UF.go(st.view);
    const fill = () => {
      $('#tourStep').textContent = `المحطة ${i + 1} من ${STEPS.length}`;
      $('#tourTitle').textContent = st.title; $('#tourText').textContent = UF.bidi(st.text());
      $('#tourPrev').disabled = i === 0; $('#tourNext').textContent = i === STEPS.length - 1 ? 'إنهاء الجولة' : 'التالي';
    };
    fill();
    setTimeout(() => {
      fill();
      const t = $(st.target); if (!t) return;
      const r = t.getBoundingClientRect(), topH = document.querySelector('.top').offsetHeight;
      const small = window.innerWidth < 700, room = window.innerHeight - topH;
      // tall targets: align their top under the sticky bar; short ones: centre them (higher on phones, where the card docks at the bottom)
      const y = window.scrollY + r.top - (r.height > room * .7 ? topH + 16 : small ? topH + 20 : topH + Math.max(16, (room - r.height) / 2 - 80));
      window.scrollTo({ top: Math.max(0, y), behavior: 'auto' });
      requestAnimationFrame(place);
      $('#tourNext').focus({ preventScroll: true });
    }, 140);
  }
  function end() { if (idx < 0) return; idx = -1; tour.hidden = true; document.body.classList.remove('touring'); UF.stop(); }
  $('#tourNext').addEventListener('click', () => { UF.stop(); if (idx >= STEPS.length - 1) { end(); UF.toast('انتهت الجولة. المنصة بين يديك: غيّر أي رافعة وشاهد الأثر.'); } else show(idx + 1); });
  $('#tourPrev').addEventListener('click', () => { UF.stop(); if (idx > 0) show(idx - 1); });
  $('#tourEnd').addEventListener('click', end);
  $('#btnTour').addEventListener('click', () => show(0));
  window.addEventListener('resize', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); });
  window.addEventListener('scroll', () => { if (idx >= 0) { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); } }, { passive: true });
  UF.tour = { start: () => show(0), end, STEPS, get active() { return idx >= 0; } };

  UF.boot();
})();
