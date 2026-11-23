/* جسور — view 1 (map) and view 2 (allocation lab). */

/* ===== 1 · map ===== */
const mixHex = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const ramp = (stops, t) => { t = Math.max(0, Math.min(1, t)); const k = t * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(k)); return mixHex(stops[i], stops[i + 1], k - i); };
const RAMP_SU = ['#EEF2EF', '#D4E5E4', '#7FB7BE', '#1F7A8C', '#0F4C5C'], RAMP_SH = ['#F3EFEC', '#F8DED5', '#EE9C86', '#DF6248', '#8A1538'];
function heatStyle(c) {
  let t, pos;
  if (S.heatMode === 'count') { t = Math.sqrt(Math.min(1, Math.abs(c.bal) / 70)); pos = c.bal >= 0; }
  else { const cov = c.need ? c.filled / c.need : 1; t = Math.min(1, Math.abs(cov - 1) / .22); pos = cov >= 1; }
  if (!c.filled || (S.heatMode === 'count' && c.bal === 0)) return 'background:#F4F6F3;color:#9FB1B3';
  return `background:${ramp(pos ? RAMP_SU : RAMP_SH, t)};color:${t > .52 ? '#fff' : (pos ? '#0F4C5C' : '#8A2B1A')}`;
}
function renderFacts() {
  const T = D.totals;
  $('#facts').innerHTML = `
    <div class="fact sh"><div class="v num">${CGB.num(T.shortage)}<small>${unit(T.shortage, 'job')}</small></div><div class="l">عجز موزّع على الجهات مقارنةً بعبء العمل</div></div>
    <div class="fact su"><div class="v num">${CGB.num(T.surplus)}<small>${unit(T.surplus, 'emp')}</small></div><div class="l">فائض في جهات أخرى، وغالباً في التخصصات نفسها</div></div>
    <div class="fact"><div class="v num">${CGB.num(D.needs.length)}<small>${unit(D.needs.length, 'need')}</small></div><div class="l">مفتوحاً ومسجلاً في دورة التدوير الحالية</div></div>
    <div class="fact"><div class="v num">${CGB.num(D.people.length)}<small>${unit(D.people.length, 'talent')}</small></div><div class="l">متاحة للتنقل من خانات الفائض، برموز مجهولة</div></div>`;
}
function renderHeat() {
  const F = D.F; let h = '<thead><tr><th class="ent">الجهة</th>';
  F.forEach((f, k) => { h += `<th title="${esc(f.ar)}"><i style="background:${famColor(k)}"></i>${famShort(k)}</th>`; });
  h += '<th>الصافي</th></tr></thead><tbody>';
  CGB.SECTORS.forEach(sec => {
    h += `<tr><th class="sec" colspan="${F.length + 2}">قطاع ${sec.ar}</th></tr>`;
    D.E.forEach((e, ei) => { if (e.sector !== sec.id) return;
      let net = 0; h += `<tr><th class="ent" scope="row">${esc(e.ar)}</th>`;
      F.forEach((f, k) => { const c = D.cellAt(ei, k); net += c.bal;
        const label = S.heatMode === 'count' ? (c.filled ? (c.bal ? CGB.signed(c.bal) : '·') : '') : (c.need ? Math.round(c.filled / c.need * 100) : '');
        const sel = S.selCell && S.selCell.e === ei && S.selCell.f === k;
        h += `<td><button type="button" data-e="${ei}" data-f="${k}" aria-pressed="${sel}" style="${heatStyle(c)}" aria-label="${esc(e.ar)}، ${esc(f.ar)}: الرصيد ${c.bal}"><bdi>${label}</bdi></button></td>`; });
      h += `<td class="tot ${net < 0 ? 'neg' : 'pos'}"><bdi>${CGB.signed(net)}</bdi></td></tr>`; });
  });
  h += '</tbody><tfoot>';
  const A = D.addressable();
  h += '<tr><th class="ent">مجموع العجز</th>' + A.sh.map(v => `<td class="neg"><bdi>${v ? '−' + CGB.num(v) : '0'}</bdi></td>`).join('') + `<td class="neg"><bdi>−${CGB.num(D.totals.shortage)}</bdi></td></tr>`;
  h += '<tr><th class="ent">مجموع الفائض</th>' + A.sur.map(v => `<td class="pos"><bdi>${v ? '+' + CGB.num(v) : '0'}</bdi></td>`).join('') + `<td class="pos"><bdi>+${CGB.num(D.totals.surplus)}</bdi></td></tr>`;
  $('#heat').innerHTML = h + '</tfoot>';
}
function renderCell() {
  const c = S.selCell, e = ent(c.e), f = fam(c.f), cov = c.need ? c.filled / c.need : 1;
  const inM = activeMoves().filter(m => m.need.e === c.e && m.need.f === c.f).length, outM = activeMoves().filter(m => m.person.e === c.e && m.person.f === c.f).length;
  const lo = .7, hi = 1.3, pos = v => Math.max(0, Math.min(100, (v - lo) / (hi - lo) * 100));
  $('#cellDetail').innerHTML = `
    <h3>${esc(e.ar)}</h3><p class="sub">المجموعة ${esc(f.ar)}</p>
    <dl class="kv">
      <dt>الملاك المعتمد</dt><dd class="num">${CGB.num(c.approved)}</dd>
      <dt>الموظفون الحاليون</dt><dd class="num">${CGB.num(c.filled)}</dd>
      <dt>الحاجة وفق عبء العمل</dt><dd class="num">${CGB.num(c.need)}</dd>
      <dt>الرصيد</dt><dd class="num ${c.bal < 0 ? 'neg' : 'pos'}"><bdi>${CGB.signed(c.bal)}</bdi> ${c.bal < 0 ? 'عجز' : c.bal > 0 ? 'فائض' : 'متوازن'}</dd>
    </dl>
    <div class="cov-bar" title="التغطية ${pc(cov)}"><i style="width:${pos(cov)}%;background:${cov < 1 ? 'var(--coral)' : 'var(--sea-2)'}"></i><u style="inset-inline-start:${pos(1)}%"></u></div>
    <p class="hint">التغطية <b class="num">${pc(cov)}</b> من الحاجة (العلامة = ${PCT(100)})</p>
    <dl class="kv" style="margin-top:10px;border-top:1px solid var(--line-2);padding-top:10px">
      ${c.open ? `<dt>احتياجات مفتوحة في الدورة</dt><dd class="num">${c.open}</dd><dt>يسدّها التخصيص الحالي</dt><dd class="num pos">${inM} من ${c.open}</dd>` : ''}
      ${c.pool ? `<dt>كفاءات متاحة للتنقل</dt><dd class="num">${c.pool}</dd><dt>مقترح تحركها</dt><dd class="num">${outM} من ${c.pool}</dd>` : ''}
      ${!c.open && !c.pool ? '<dt>لا تسجيل لهذه الخانة في الدورة الحالية</dt><dd></dd>' : ''}
    </dl>
    ${(inM + outM) ? `<button class="btn sm" type="button" id="cellMoves" style="margin-top:12px">عرض تحركات هذه الخانة</button>` : ''}`;
  const b = $('#cellMoves'); if (b) b.onclick = () => { Object.assign(S.mv, { ent: String(c.e), fam: 'all', status: 'all', type: 'all', crit: 'all', q: '', shown: 12 }); go('moves'); };
}
function renderAddr() {
  const A = D.addressable(), totC = A.cover.reduce((a, b) => a + b, 0);
  const order = A.sh.map((v, f) => f).filter(f => A.sh[f] > 0).sort((a, b) => A.sh[b] - A.sh[a]);
  const max = Math.max(...A.sh);
  $('#addr').innerHTML = `<h3>كم من العجز يمكن سدّه من الداخل؟</h3>
    <div class="big-n num">${pc(totC / D.totals.shortage)}<small>≈ ${CGB.num(totC)} من ${ar(D.totals.shortage, 'job')}</small></div>
    <p class="hint">تقدير أولي على مستوى المجموعات: الفائض في المجموعة نفسها أولاً ثم في المجموعات القريبة منها. الخوارزمية في المختبر تحسمه على مستوى الأفراد والمهارات.</p>
    ${order.map(f => `<div class="addr-row"><span>${famShort(f)}</span><span class="bar" style="width:${Math.max(6, A.sh[f] / max * 100)}%"><i style="width:${A.cover[f] / A.sh[f] * 100}%"></i></span><span class="n num">${A.cover[f]} / ${A.sh[f]}</span></div>`).join('')}
    <div class="addr-key"><span><i class="sw" style="background:var(--sea-2)"></i>قابل للسدّ داخلياً</span><span><i class="sw" style="background:var(--coral-2)"></i>يبقى للتوظيف أو التأهيل</span></div>`;
}
RENDER.map = () => { renderFacts(); renderHeat(); renderCell(); renderAddr(); };
function initMap() {
  S.selCell = D.cells.filter(c => D.F[c.f].id === 'it').sort((a, b) => a.bal - b.bal)[0];
  $('#heat').addEventListener('click', ev => { const b = ev.target.closest('button[data-e]'); if (!b) return;
    S.selCell = D.cellAt(+b.dataset.e, +b.dataset.f); $$('#heat button[aria-pressed="true"]').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); renderCell(); });
  $$('[data-heat]').forEach(b => b.addEventListener('click', () => { S.heatMode = b.dataset.heat; $$('[data-heat]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); renderHeat(); }));
}

/* ===== 2 · lab ===== */
const PRESETS = {
  balanced: { ar: 'متوازن', w: O.DEFAULTS.w },
  crit: { ar: 'سدّ الحرج أولاً', w: { skill: 7, grade: 3, adj: 3, exp: 3, crit: 10, qat: 2, will: 3 } },
  qat: { ar: 'تعظيم التقطير', w: { skill: 6, grade: 3, adj: 3, exp: 3, crit: 5, qat: 10, will: 4 } },
  calm: { ar: 'أقل اضطراب للموظف', w: { skill: 8, grade: 5, adj: 6, exp: 4, crit: 4, qat: 3, will: 10 } },
};
const WLAB = { skill: 'تطابق المهارات', grade: 'ملاءمة الدرجة', adj: 'القرب بين المجموعتين', exp: 'سنوات الخبرة', crit: 'أهمية الاحتياج', qat: 'أولوية التقطير', will: 'رغبة الموظف في التنقل' };
function slider(id, label, min, max, step, val, fmt) {
  return `<div class="sl"><label for="${id}">${label}</label><output id="${id}-o" for="${id}">${fmt(val)}</output><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"></div>`;
}
const CFMT = { minFit: v => Math.round(v * 100) + '%', mustThr: v => Math.round(v * 100) + '%', floorCov: v => (v * 100).toFixed(1).replace('.0', '') + '%', maxOut: v => String(v) };
function renderControls() {
  const P = S.P;
  $('#controls').innerHTML = `
    <div class="panel-head"><h3>أولويات السياسة</h3><button class="btn sm ghost" type="button" id="resetP">استعادة الافتراضي</button></div>
    <div class="presets" role="group" aria-label="إعدادات جاهزة">${Object.entries(PRESETS).map(([k, p]) => `<button type="button" class="chip" data-preset="${k}" aria-pressed="${S.preset === k}">${p.ar}</button>`).join('')}</div>
    <fieldset><legend>ملاءمة الشخص للوظيفة</legend>${['skill', 'grade', 'adj', 'exp'].map(k => slider('w-' + k, WLAB[k], 0, 10, 1, P.w[k], String)).join('')}</fieldset>
    <fieldset><legend>أولويات الحكومة والموظف</legend>${['crit', 'qat', 'will'].map(k => slider('w-' + k, WLAB[k], 0, 10, 1, P.w[k], String)).join('')}</fieldset>
    <fieldset><legend>ضوابط لا تُتجاوز</legend>
      ${slider('c-minFit', 'الحد الأدنى للملاءمة', .5, .85, .01, P.minFit, CFMT.minFit)}
      ${slider('c-mustThr', 'تغطية المهارات الأساسية', .4, 1, .05, P.mustThr, CFMT.mustThr)}
      ${slider('c-floorCov', 'أدنى تغطية تبقى للجهة المانحة', 1, 1.05, .005, P.floorCov, CFMT.floorCov)}
      ${slider('c-maxOut', 'سقف الصادر من الجهة الواحدة', 4, 60, 1, P.maxOut, CFMT.maxOut)}
      <label class="tog"><input type="checkbox" id="c-bridge" ${P.allowBridge ? 'checked' : ''}> السماح بالجسور التأهيلية (تحرك بعد برنامج قصير)</label>
    </fieldset>
    <fieldset><legend>افتراضات تقدير الأثر</legend>
      <div class="assume">
        <label for="a-ext">مدة التوظيف الخارجي (يوم)</label><input id="a-ext" type="number" min="30" max="400" value="${P.extDays}">
        <label for="a-int">مدة إتمام التحرك الداخلي (يوم)</label><input id="a-int" type="number" min="5" max="200" value="${P.intDays}">
        <label for="a-cost">تكلفة التعيين الخارجي (ر.ق)</label><input id="a-cost" type="number" min="0" step="1000" value="${P.costPerHire}">
      </div>
      <p class="assume-note">قيم افتراضية للعرض، تُستبدل بأرقام الجهة عند التطبيق. تغييرها يحدّث مؤشرات الأثر فوراً دون إعادة التخصيص.</p>
    </fieldset>`;
}
function initLab() {
  renderControls();
  const form = $('#controls');
  form.addEventListener('input', ev => { const t = ev.target, P = S.P;
    if (t.id.startsWith('w-')) { const k = t.id.slice(2); P.w[k] = +t.value; $('#' + t.id + '-o').textContent = t.value; S.preset = null; $$('[data-preset]').forEach(b => b.setAttribute('aria-pressed', 'false')); setDirty('تغيّرت الأوزان'); }
    else if (t.id.startsWith('c-') && t.type === 'range') { const k = t.id.slice(2); P[k] = +t.value; $('#' + t.id + '-o').textContent = CFMT[k](+t.value); setDirty('تغيّرت الضوابط'); }
    else if (t.id === 'c-bridge') { P.allowBridge = t.checked; setDirty('تغيّرت الضوابط'); }
    else if (t.id === 'a-ext' || t.id === 'a-int' || t.id === 'a-cost') { P.extDays = Math.max(0, +$('#a-ext').value || 0); P.intDays = Math.max(0, +$('#a-int').value || 0); P.costPerHire = Math.max(0, +$('#a-cost').value || 0); renderKpis(); }
  });
  form.addEventListener('click', ev => { const b = ev.target.closest('[data-preset]');
    if (b) { S.preset = b.dataset.preset; S.P.w = Object.assign({}, PRESETS[S.preset].w); renderControls(); setDirty('اختير إعداد «' + PRESETS[S.preset].ar + '»'); return; }
    if (ev.target.closest('#resetP')) { S.P = JSON.parse(JSON.stringify(O.DEFAULTS)); S.preset = 'balanced'; renderControls(); setDirty('استُعيدت الإعدادات الافتراضية'); }
  });
  $('#btnRun').addEventListener('click', () => animateRun());
}
const STAGES = [
  ['تقييم الأزواج', r => ar(r.meta.pairs, 'pair')],
  ['الحل الأمثل', r => `${ar(r.meta.eligible, 'pair')} مؤهلة`],
  ['حماية الجهات المانحة', r => (r.meta.benched ? `أُعيد توزيع ${r.meta.benched} مرشحاً` : 'لا تجاوزات')],
  ['الجسور التأهيلية', r => (S.P.allowBridge ? ar(r.stats.bridge, 'bridge') : 'معطّلة')],
  ['مقارنة الأسبقية', r => `${r.directStats.filled} مقابل ${r.greedyStats.filled}`],
];
function renderStages(state, upto) {
  $('#stages').innerHTML = STAGES.map(([name, f], i) => {
    const cls = state === 'done' || i < upto ? 'done' : i === upto ? 'doing' : '';
    return `<li class="${cls}"><b>${name}</b>${cls === 'done' && S.res ? `<em>${f(S.res)}</em>` : ''}</li>`; }).join('');
}
function renderRunNote() {
  const n = $('#runNote'); if (!n) return;
  if (S.dirty) { n.className = 'run-note warn'; n.textContent = `${S.dirtyWhy || 'تغيّرت الإعدادات'} — النتائج المعروضة لا تعكس ذلك بعد. شغّل التخصيص.`; }
  else if (S.res) { n.className = 'run-note'; const m = S.res.meta;
    n.textContent = `آخر تشغيل: ${m.ms.total} ملّي ثانية لمطابقة ${ar(D.needs.length, 'need')} مع ${ar(D.people.length, 'talent')}` + (m.fallback ? ' · اعتُمد حل الأسبقية لأنه تساوى مع الحل بعد معالجة السقوف أو فاقه.' : '.'); }
}
let running = false;
function animateRun() {
  if (running) return Promise.resolve(); running = true;
  const btn = $('#btnRun'); btn.disabled = true; btn.textContent = 'جارٍ التخصيص…';
  const gap = REDUCED ? 0 : 230;
  return new Promise(resolve => {
    renderStages('run', 0);
    setTimeout(() => {
      runSolve(); let i = 0;
      (function next() { i++; renderStages('run', i);
        if (i < STAGES.length) return setTimeout(next, gap);
        renderStages('done'); clearDirty(); btn.disabled = false; btn.textContent = 'أعد التخصيص'; running = false;
        renderLabResults(true); renderRunNote(); renderMoveNotice();
        const im = impact(); toast(`اكتمل التخصيص: ${im.direct + im.bridge} من ${ar(im.total, 'need')} تُسدّ من الداخل`); resolve();
      })();
    }, REDUCED ? 0 : 160);
  });
}
function renderKpis(animate) {
  const im = impact(), P = S.P, tot = im.direct + im.bridge, costParts = CGB.qar(im.cost).split(' ');
  $('#kpis').innerHTML = `
    <div class="kpi hi"><div class="l">احتياجات تُسدّ من الداخل</div><div class="v num"><span id="k1">${tot}</span><small>من ${im.total}</small></div>
      <div class="meter"><i style="width:${im.direct / im.total * 100}%"></i><u style="width:${im.bridge / im.total * 100}%"></u></div>
      <div class="s">${im.direct} مباشرة + ${im.bridge} بعد برنامج تأهيلي</div></div>
    <div class="kpi cr"><div class="l">احتياجات حرجة مسدودة</div><div class="v num"><span id="k2">${im.crit + im.critB}</span><small>من ${im.critTotal}</small></div>
      <div class="meter"><i style="width:${im.crit / im.critTotal * 100}%;background:var(--maroon)"></i><u style="width:${im.critB / im.critTotal * 100}%"></u></div>
      <div class="s">${im.crit} مباشرة${im.critB ? ` + ${im.critB} بعد تأهيل` : ''}</div></div>
    <div class="kpi"><div class="l">متوسط الملاءمة المهنية</div><div class="v num"><span id="k3">${Math.round(im.fitAvg * 100)}</span><small>%</small></div>
      <div class="meter"><i style="width:${im.fitAvg * 100}%"></i></div><div class="s">للتحركات المباشرة · الحد الأدنى ${pc(P.minFit)}</div></div>
    <div class="kpi"><div class="l">أيام شغور موفّرة</div><div class="v num"><span id="k4">${CGB.num(im.days)}</span><small>${unit(im.days, 'day')}</small></div>
      <div class="s">افتراض: ${ar(P.extDays, 'day')} للتوظيف الخارجي مقابل ${P.intDays} للتحرك الداخلي</div></div>
    <div class="kpi"><div class="l">تكلفة توظيف خارجي متجنَّبة</div><div class="v num"><span id="k5">${costParts[0]}</span><small>${costParts.slice(1).join(' ')}</small></div>
      <div class="s">افتراض: ${CGB.num(P.costPerHire)} ر.ق لكل تعيين خارجي</div></div>
    <div class="kpi"><div class="l">أثر التقطير: كفاءات قطرية أُعيد توظيفها</div><div class="v num"><span id="k6">${im.q}</span><small>${unit(im.q, 'talent')}</small></div>
      <div class="s">${im.moves ? pc(im.q / im.moves) : pc(0)} من التحركات، تشغل احتياجات كانت ستُطرح للتعاقد الخارجي</div></div>`;
  if (animate) { [['k1', tot], ['k2', im.crit + im.critB], ['k3', Math.round(im.fitAvg * 100)], ['k6', im.q]].forEach(([id, v]) => { const el = $('#' + id); el.dataset.v = 0; countUp(el, v); });
    const d = $('#k4'); d.dataset.v = 0; countUp(d, im.days); }
}
function renderCmp() {
  const o = S.res.directStats, g = S.res.greedyStats;
  const rows = [
    ['احتياجات مسدودة مباشرة', o.filled, g.filled, v => String(v), (a, b) => CGB.signed(a - b)],
    ['احتياجات حرجة مسدودة', o.crit, g.crit, v => String(v), (a, b) => CGB.signed(a - b)],
    ['متوسط الملاءمة', o.avgFit * 100, g.avgFit * 100, v => v.toFixed(1) + '%', (a, b) => CGB.signed(a - b, 1)],
    ['مجموع قيمة المطابقة', o.value, g.value, v => v.toFixed(1), (a, b) => (b ? CGB.signed((a / b - 1) * 100, 1) + '%' : '—')],
  ];
  $('#cmp').innerHTML = `<div class="panel-head"><h3>الحل الأمثل مقابل أسلوب الأسبقية</h3></div>
    <p class="hint">بالبيانات والشروط نفسها. الفرق ناتج عن طريقة التخصيص وحدها (المرحلة المباشرة، دون الجسور التأهيلية).</p>
    ${rows.map(([l, a, b, f, d]) => { const mx = Math.max(a, b) || 1, dv = a - b;
      return `<div class="cmp-row"><span class="lab-t">${l}</span><div class="bars track"><div class="b o" style="width:${a / mx * 100}%"><span class="num">${f(a)}</span></div><div class="b g" style="width:${b / mx * 100}%"><span class="num">${f(b)}</span></div></div><span class="d num ${Math.abs(dv) < 1e-9 ? 'zero' : ''}"><bdi>${d(a, b)}</bdi></span></div>`; }).join('')}
    <div class="cmp-key"><span><i class="sw" style="background:var(--sea)"></i>جسور: التخصيص الأمثل</span><span><i class="sw" style="background:var(--sand)"></i>الأسبقية: كل احتياج بترتيب وروده يأخذ أفضل المتاح</span></div>`;
}
function renderResid() {
  const taken = new Set(activeMoves().map(m => m.n)), byF = D.F.map(() => [0, 0, 0]); let tot = 0;
  D.needs.forEach(n => { if (!taken.has(n.i)) { byF[n.f][n.crit]++; tot++; } });
  const order = byF.map((v, f) => f).filter(f => byF[f][0] + byF[f][1] + byF[f][2] > 0).sort((a, b) => (byF[b][0] + byF[b][1] + byF[b][2]) - (byF[a][0] + byF[a][1] + byF[a][2]));
  const max = Math.max(1, ...order.map(f => byF[f][0] + byF[f][1] + byF[f][2]));
  $('#resid').innerHTML = `<div class="panel-head"><h3>ما يبقى للتوظيف الخارجي</h3></div>
    <div class="big-n num">${tot}<small>${unit(tot, 'need')} بلا كفاءة داخلية مناسبة</small></div>
    ${order.length ? order.map(f => { const v = byF[f], s = v[0] + v[1] + v[2];
      return `<div class="res-row"><span>${famShort(f)}</span><span class="stack" style="width:${Math.max(8, s / max * 100)}%"><i style="width:${v[2] / s * 100}%;background:var(--maroon)"></i><i style="width:${v[1] / s * 100}%;background:var(--coral)"></i><i style="width:${v[0] / s * 100}%;background:var(--sand)"></i></span><span class="n num">${s}</span></div>`; }).join('') : '<p class="hint">جميع الاحتياجات مسدودة داخلياً.</p>'}
    <div class="cmp-key"><span><i class="sw" style="background:var(--maroon)"></i>حرج</span><span><i class="sw" style="background:var(--coral)"></i>مرتفع</span><span><i class="sw" style="background:var(--sand)"></i>اعتيادي</span></div>
    <p class="hint" style="margin-top:8px">هذه القائمة هي خطة التوظيف الخارجي الفعلية: تخصصات لا يوجد فيها فائض قابل للتحريك.</p>`;
}
function renderLabResults(animate) { renderKpis(animate); renderCmp(); renderResid(); }
RENDER.lab = () => { renderStages(running ? 'run' : 'done', 0); renderRunNote(); if (!running) renderLabResults(false); };
