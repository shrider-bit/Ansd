/* جسور — view 3: the bridge (arc) diagram, entity panel, corridors and the phone alternative. */
function bridgeMoves() { return activeMoves().filter(m => S.arcType === 'all' || (S.arcType === 'direct') === (m.kind === 1)); }
function flows() {
  const map = new Map();
  bridgeMoves().forEach(m => { const f = m.need.f; if (S.famFilter != null && S.famFilter !== f) return;
    const k = m.person.e + '|' + m.need.e + '|' + f; const o = map.get(k) || { from: m.person.e, to: m.need.e, f, n: 0 }; o.n++; map.set(k, o); });
  return [...map.values()];
}
function entityIO() {
  const io = D.E.map(() => ({ out: 0, in: 0 }));
  bridgeMoves().forEach(m => { if (S.famFilter != null && S.famFilter !== m.need.f) return; io[m.person.e].out++; io[m.need.e].in++; });
  return io;
}
function busiestEntity() { const io = entityIO(); let b = 0; io.forEach((x, e) => { if (x.in + x.out > io[b].in + io[b].out) b = e; }); return b; }

const ARC = { W: 1200, H: 506, base: 372, pad: 34 };
let nodeX = [];
function layoutNodes() {
  const groups = CGB.SECTORS.length, units = (D.NE - 1) + (groups - 1) * .9, step = (ARC.W - 2 * ARC.pad) / units; let u = 0; nodeX = [];
  CGB.SECTORS.forEach((sec, gi) => { D.E.forEach((e, ei) => { if (e.sector !== sec.id) return; nodeX[ei] = ARC.W - ARC.pad - u * step; u += 1; }); u += .9; });
}
function renderArcs(animate) {
  const svg = $('#arcs'), fl = flows().sort((a, b) => Math.abs(nodeX[b.from] - nodeX[b.to]) - Math.abs(nodeX[a.from] - nodeX[a.to])), io = entityIO();
  let defs = '', arcs = '';
  fl.forEach((a, i) => { const x1 = nodeX[a.from], x2 = nodeX[a.to], dx = Math.abs(x2 - x1), rx = dx / 2, ry = Math.min(ARC.base - 16, 22 + dx * .3);
    const L = Math.min(x1, x2), Rr = Math.max(x1, x2), col = famColor(a.f), w = Math.min(16, 1.4 + a.n * 1.5);
    defs += `<linearGradient id="g${i}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="0" x2="${x2}" y2="0"><stop offset="0" stop-color="${col}" stop-opacity=".16"/><stop offset=".55" stop-color="${col}" stop-opacity=".5"/><stop offset="1" stop-color="${col}" stop-opacity=".95"/></linearGradient>`;
    arcs += `<path class="arc" pathLength="1" d="M${L} ${ARC.base} A${rx} ${ry} 0 0 1 ${Rr} ${ARC.base}" stroke="url(#g${i})" stroke-width="${w.toFixed(1)}" data-from="${a.from}" data-to="${a.to}" data-f="${a.f}" data-n="${a.n}" style="animation-delay:${(i % 40) * 12}ms"/>`; });
  let nodes = '', secs = '';
  CGB.SECTORS.forEach(sec => { const xs = D.E.map((e, ei) => (e.sector === sec.id ? nodeX[ei] : null)).filter(v => v != null), a = Math.min(...xs) - 16, b = Math.max(...xs) + 16, y = ARC.base + 74;
    secs += `<path class="secb" d="M${a} ${y} A${(b - a) / 2} 13 0 0 0 ${b} ${y}"/><text class="secl" x="${(a + b) / 2}" y="${y + 36}">${sec.ar}</text>`; });
  D.E.forEach((e, ei) => { const x = nodeX[ei], t = io[ei].in + io[ei].out, r = 5 + Math.sqrt(t) * 1.35, letter = e.ar.match(/\((.)\)/)[1];
    nodes += `<g class="node${S.selEnt === ei ? ' sel' : ''}" data-e="${ei}" tabindex="0" role="button" aria-label="${esc(e.ar)}: صادر ${io[ei].out}، وارد ${io[ei].in}">
      <circle cx="${x}" cy="${ARC.base}" r="${Math.max(r, 15)}" fill="transparent"/><circle class="o" cx="${x}" cy="${ARC.base}" r="${r.toFixed(1)}"/>
      <text x="${x}" y="${ARC.base + 33}">${letter}</text><text class="c co" x="${x}" y="${ARC.base + 49}">${io[ei].out} ↑</text><text class="c ci" x="${x}" y="${ARC.base + 62}">${io[ei].in} ↓</text></g>`; });
  svg.innerHTML = `<defs>${defs}</defs><line class="base" x1="10" x2="${ARC.W - 10}" y1="${ARC.base}" y2="${ARC.base}"/>${arcs}${secs}${nodes}`;
  svg.classList.toggle('anim', !!animate && !REDUCED);
  if (animate && !REDUCED) setTimeout(() => svg.classList.remove('anim'), 1700);
  applyIso();
}
function applyIso(hoverE) {
  const svg = $('#arcs'), e = hoverE != null ? hoverE : S.selEnt;
  svg.classList.toggle('iso', e != null);
  $$('.arc', svg).forEach(p => p.classList.toggle('hot', e != null && (+p.dataset.from === e || +p.dataset.to === e)));
  const linked = new Set(); if (e != null) { linked.add(e); $$('.arc.hot', svg).forEach(p => { linked.add(+p.dataset.from); linked.add(+p.dataset.to); }); }
  $$('.node', svg).forEach(g => { g.classList.toggle('hot', linked.has(+g.dataset.e)); g.classList.toggle('sel', S.selEnt === +g.dataset.e); });
}
function renderLegend() {
  const cnt = D.F.map(() => 0); bridgeMoves().forEach(m => cnt[m.need.f]++);
  $('#legend').innerHTML = D.F.map((f, k) => `<button type="button" class="lg${cnt[k] ? '' : ' off'}" data-f="${k}" aria-pressed="${S.famFilter === k}" title="${esc(f.ar)}"><i style="background:${famColor(k)}"></i>${famShort(k)}<em class="num">${cnt[k]}</em></button>`).join('');
  $('#arcClear').hidden = S.famFilter == null && S.selEnt == null;
}
function coverageRows(e) {
  const A = activeMoves(), rows = [];
  D.F.forEach((f, k) => { const c = D.cellAt(e, k); if (!c.need) return;
    const out = A.filter(m => m.person.e === e && m.person.f === k).length, inn = A.filter(m => m.need.e === e && m.need.f === k).length;
    if (!out && !inn) return; rows.push({ k, before: c.filled / c.need, after: (c.filled - out + inn) / c.need, out, inn }); });
  return rows;
}
function renderEntPanel() {
  const el = $('#entPanel');
  if (S.selEnt == null) { el.innerHTML = '<h3>اختر جهة</h3><p class="hint">اضغط أي دائرة على الخط، أو أي جهة في القائمة، لعرض ما يصدر عنها وما يرد إليها وأثر التدوير في تغطيتها.</p>'; return; }
  const e = S.selEnt, E = ent(e), A = bridgeMoves(), outs = new Map(), ins = new Map(); let o = 0, i = 0;
  A.forEach(m => { if (m.person.e === e) { o++; outs.set(m.need.e, (outs.get(m.need.e) || 0) + 1); } if (m.need.e === e) { i++; ins.set(m.person.e, (ins.get(m.person.e) || 0) + 1); } });
  const li = map => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([x, n]) => `<div class="flow-li"><span>${esc(ent(x).ar)}</span><b class="num">${n}</b></div>`).join('') || '<p class="hint">لا يوجد</p>';
  const lo = .7, hi = 1.3, pos = v => Math.max(0, Math.min(100, (v - lo) / (hi - lo) * 100));
  const cov = coverageRows(e);
  el.innerHTML = `<p class="eyebrow">قطاع ${E.sectorAr} · ${ar(E.headcount, 'emp')}</p><h3>${esc(E.ar)}</h3>
    <div class="io"><div><div class="big-n num">${o}</div><span class="hint">صادر عنها (مانحة)</span></div><div><div class="big-n num" style="color:var(--sea-2)">${i}</div><span class="hint">وارد إليها (مستقبلة)</span></div></div>
    <h4>إلى أين تذهب كفاءاتها</h4>${li(outs)}
    <h4>من أين تأتيها الكفاءات</h4>${li(ins)}
    <h4>التغطية قبل التدوير وبعده</h4>
    ${cov.length ? cov.map(r => `<div class="cv"><span>${famShort(r.k)}</span><span class="t"><i style="width:${pos(r.before)}%"></i><u style="width:${pos(r.after)}%"></u><s style="inset-inline-start:${pos(1)}%"></s></span><span class="p num">${Math.round(r.before * 100)}% → ${Math.round(r.after * 100)}%</span></div>`).join('') : '<p class="hint">لا تغيير</p>'}
    <div class="cmp-key" style="margin-top:8px"><span><i class="sw" style="background:var(--sand)"></i>قبل</span><span><i class="sw" style="background:var(--sea-2)"></i>بعد</span><span>العلامة = ${PCT(100)} من الحاجة</span></div>
    <button class="btn sm" type="button" id="entMoves" style="margin-top:12px">عرض تحركات هذه الجهة</button>`;
  $('#entMoves').onclick = () => { Object.assign(S.mv, { ent: String(e), fam: 'all', status: 'all', type: 'all', crit: 'all', q: '', shown: 12 }); go('moves'); };
}
function renderCorridors() {
  const map = new Map();
  bridgeMoves().forEach(m => { if (S.famFilter != null && S.famFilter !== m.need.f) return; const k = m.person.e + '|' + m.need.e;
    const o = map.get(k) || { from: m.person.e, to: m.need.e, n: 0, f: {} }; o.n++; o.f[m.need.f] = (o.f[m.need.f] || 0) + 1; map.set(k, o); });
  const top = [...map.values()].sort((a, b) => b.n - a.n).slice(0, 12);
  $('#corr').innerHTML = top.map(c => `<button type="button" class="corr-row" data-from="${c.from}" data-to="${c.to}">
    <span class="path"><span>${esc(ent(c.from).ar)}</span>${arcIcon('#1F7A8C').replace('viewBox="0 0 34 18"', 'viewBox="0 0 34 18"')}<b>${esc(ent(c.to).ar)}</b></span><span class="cnt num">${c.n}</span>
    <span class="fd">${Object.entries(c.f).map(([f, n]) => `<i style="width:${n * 14}px;background:${famColor(+f)}" title="${esc(fam(+f).ar)}: ${n}"></i>`).join('')}</span></button>`).join('') || '<p class="hint">لا تحركات ضمن التصفية الحالية.</p>';
  // phone alternative to the arc diagram: entities as a stacked list
  const io = entityIO(), mx = Math.max(1, ...io.map(x => x.in + x.out));
  $('#entList').innerHTML = '<p class="hint" style="margin-bottom:8px">الجهات مرتبة بحجم التحركات. اضغط جهة لعرض جسورها.</p>' + io.map((x, e) => ({ x, e })).filter(o => o.x.in + o.x.out > 0).sort((a, b) => (b.x.in + b.x.out) - (a.x.in + a.x.out)).map(({ x, e }) =>
    `<button type="button" class="ent-btn" data-e="${e}" aria-pressed="${S.selEnt === e}"><span>${esc(ent(e).ar)}</span><span class="io2 num">${x.out} صادر · ${x.in} وارد</span>
     <span class="mini"><i style="width:${x.out / mx * 100}%"></i><u style="width:${x.in / mx * 100}%"></u></span></button>`).join('');
}
function selectEntity(e) { S.selEnt = e; applyIso(); renderEntPanel(); renderLegend(); $$('.ent-btn').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.e === e))); }
RENDER.bridges = () => { layoutNodes(); renderLegend(); renderArcs(true); renderEntPanel(); renderCorridors(); };
function initBridges() {
  const svg = $('#arcs'), tip = $('#tip');
  svg.addEventListener('click', ev => { const g = ev.target.closest('.node'); if (g) { selectEntity(S.selEnt === +g.dataset.e ? null : +g.dataset.e); return; }
    const a = ev.target.closest('.arc'); if (a) { selectEntity(+a.dataset.to); return; } selectEntity(null); });
  svg.addEventListener('keydown', ev => { const g = ev.target.closest('.node'); if (g && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); selectEntity(+g.dataset.e); } });
  svg.addEventListener('mousemove', ev => { const g = ev.target.closest('.node'), a = ev.target.closest('.arc'); let html = '';
    if (g) { const e = +g.dataset.e; applyIso(e); html = `<b>${esc(ent(e).ar)}</b><br>${g.querySelector('.co').textContent.replace(' ↑', '')} صادر · ${g.querySelector('.ci').textContent.replace(' ↓', '')} وارد`; }
    else if (a) { html = `${esc(ent(+a.dataset.from).ar)} ← <b>${esc(ent(+a.dataset.to).ar)}</b><br>${ar(+a.dataset.n, 'move')} · ${esc(fam(+a.dataset.f).ar)}`; $$('.arc', svg).forEach(p => p.classList.toggle('hot', p === a)); svg.classList.add('iso'); $$('.node', svg).forEach(n => n.classList.toggle('hot', +n.dataset.e === +a.dataset.from || +n.dataset.e === +a.dataset.to)); }
    else applyIso();
    if (html) { tip.innerHTML = html; tip.hidden = false; const w = tip.offsetWidth; tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, ev.clientX - w / 2)) + 'px'; tip.style.top = (ev.clientY - tip.offsetHeight - 14) + 'px'; } else tip.hidden = true; });
  svg.addEventListener('mouseleave', () => { tip.hidden = true; applyIso(); });
  $('#legend').addEventListener('click', ev => { const b = ev.target.closest('[data-f]'); if (!b) return; const f = +b.dataset.f; S.famFilter = S.famFilter === f ? null : f; renderLegend(); renderArcs(true); renderEntPanel(); renderCorridors(); });
  $('#arcType').addEventListener('click', ev => { const b = ev.target.closest('[data-t]'); if (!b) return; S.arcType = b.dataset.t; $$('#arcType button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); RENDER.bridges(); });
  $('#arcClear').addEventListener('click', () => { S.famFilter = null; S.selEnt = null; RENDER.bridges(); });
  $('#entList').addEventListener('click', ev => { const b = ev.target.closest('.ent-btn'); if (!b) return; selectEntity(+b.dataset.e); $('#entPanel').scrollIntoView({ block: 'start', behavior: REDUCED ? 'auto' : 'smooth' }); });
  $('#corr').addEventListener('click', ev => { const b = ev.target.closest('.corr-row'); if (!b) return;
    Object.assign(S.mv, { ent: b.dataset.to, q: ent(+b.dataset.from).ar, fam: 'all', status: 'all', type: 'all', crit: 'all', shown: 12 }); go('moves'); });
}
