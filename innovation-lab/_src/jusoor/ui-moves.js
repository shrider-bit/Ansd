/* جسور — view 4 (move cards, decisions) and view 5 (rotation plan, exports). */
const ST = { proposed: 'مقترح', approved: 'معتمد', locked: 'مثبّت', rejected: 'مرفوض' };
const WILL_AR = ['متحفّظ تجاه التنقل', 'منفتح على التنقل', 'راغب في التنقل'];
const skillName = s => D.SKILLS[s].ar;
function allMoves() { return S.moves.filter(m => m.status !== 'rejected').concat(S.rejected); }
function filteredMoves() {
  const f = S.mv, q = CGB.normAr(f.q);
  let L = allMoves().filter(m => {
    if (f.status !== 'all' && m.status !== f.status) return false;
    if (f.type !== 'all' && (f.type === 'direct') !== (m.kind === 1)) return false;
    if (f.crit !== 'all' && m.need.crit !== +f.crit) return false;
    if (f.fam !== 'all' && m.need.f !== +f.fam) return false;
    if (f.ent !== 'all' && m.need.e !== +f.ent && m.person.e !== +f.ent) return false;
    if (q) { const hay = CGB.normAr([m.person.code, m.need.code, m.need.unit, ent(m.person.e).ar, ent(m.need.e).ar, fam(m.need.f).ar, fam(m.person.f).ar, m.mech,
      ...m.need.must.map(skillName), ...m.need.nice.map(skillName)].join(' ')); if (!hay.includes(q)) return false; }
    return true; });
  const by = { crit: (a, b) => b.need.crit - a.need.crit || b.ev.fit - a.ev.fit, fit: (a, b) => b.ev.fit - a.ev.fit,
    ent: (a, b) => a.need.e - b.need.e || b.need.crit - a.need.crit, low: (a, b) => a.ev.fit - b.ev.fit };
  return L.sort(by[f.sort] || by.crit);
}
function moveCard(m) {
  const p = m.person, n = m.need, ev = m.ev, col = ev.fit >= .8 ? '#0F4C5C' : ev.fit >= S.P.minFit ? '#1F7A8C' : '#B8862B';
  const chips = ev.matched.map(x => `<span class="skl${x.must ? ' must' : ''}" title="${x.must ? 'مهارة أساسية · ' : ''}متوفرة">${esc(skillName(x.s))}</span>`).join('') +
    ev.missing.map(x => `<span class="skl miss${x.must ? ' must' : ''}" title="${x.must ? 'مهارة أساسية · ' : ''}${x.lvl ? 'بمستوى أساسي' : 'غير متوفرة'}">${esc(skillName(x.s))}</span>`).join('');
  const bar = (l, v) => `<div>${l} <b class="num">${Math.round(v * 100)}</b><i><u style="width:${v * 100}%"></u></i></div>`;
  const rej = m.status === 'rejected';
  return `<article class="mv ${m.status}" data-key="${m.key}">
    <div class="mv-top"><span class="pill crit${n.crit}">${D.CRIT[n.crit].ar}</span><span class="pill mech">${m.mech} · ${DUR(n)}</span>
      ${m.kind === 2 ? '<span class="pill bridge">جسر تأهيلي</span>' : ''}${m.status === 'approved' ? '<span class="pill ok">معتمد</span>' : m.status === 'locked' ? '<span class="pill lock">مثبّت</span>' : rej ? '<span class="pill rej">مرفوض</span>' : ''}
      <span class="sp"></span><div class="fit">${ringSVG(ev.fit, col)}<div><b class="num">${pc(ev.fit)}</b><span>ملاءمة</span></div></div></div>
    <div class="who"><b><bdi>${p.code}</bdi></b><span>${band(p.band).ar} · درجة ${p.grade}</span><span class="num">خبرة ${yearsAr(p.yrs)}</span><span>${p.q ? 'قطري' : 'غير قطري'}</span><span>${WILL_AR[p.will]}</span></div>
    <div class="route"><div class="end"><small>من</small><b>${esc(ent(p.e).ar)}</b><span>المجموعة ${esc(fam(p.f).ar)}</span></div>${arcIcon(famColor(n.f))}
      <div class="end"><small>إلى · <bdi>${n.code}</bdi></small><b>${esc(ent(n.e).ar)}</b><span>${esc(n.unit)}</span><span class="sub">${famShort(n.f)} · ${band(n.lo).ar}${n.hi > n.lo ? ' أو ' + band(n.hi).ar : ''}</span></div></div>
    <div class="skills" aria-label="مهارات الاحتياج">${chips}</div>
    <div class="brk">${bar('المهارات', ev.comps.skill)}${bar('الدرجة', ev.comps.grade)}${bar('القرب', ev.comps.adj)}${bar('الخبرة', ev.comps.exp)}</div>
    ${m.kind === 2 ? `<div class="bridge-note">برنامج تأهيلي مقترح: <b class="num">${ar(ev.weeks, 'week')}</b> لاستكمال: ${ev.missing.map(x => esc(skillName(x.s))).join('، ')}</div>` : ''}
    <div class="mv-act">${rej ? `<button class="btn sm" type="button" data-act="undo">تراجع عن الرفض</button>` : `
      <button class="btn sm yes" type="button" data-act="approved" aria-pressed="${m.status === 'approved'}">${m.status === 'approved' ? '✓ معتمد' : 'اعتماد'}</button>
      <button class="btn sm lk" type="button" data-act="locked" aria-pressed="${m.status === 'locked'}" title="يبقى هذا الزوج ثابتاً عند إعادة التخصيص دون اعتماده نهائياً">${m.status === 'locked' ? 'مثبّت' : 'تثبيت'}</button>
      <button class="btn sm no" type="button" data-act="rejected" title="يُمنع هذا الزوج ويُبحث عن بديل عند إعادة التخصيص">رفض</button>`}</div>
  </article>`;
}
function renderMoveTools() {
  const f = S.mv, opt = (v, l, cur) => `<option value="${v}"${String(cur) === String(v) ? ' selected' : ''}>${l}</option>`;
  $('#mvTools').innerHTML = `
    <input type="search" id="mv-q" placeholder="ابحث برمز، جهة، وحدة أو مهارة…" value="${esc(f.q)}" aria-label="بحث">
    <select id="mv-status" aria-label="الحالة">${opt('all', 'كل الحالات', f.status)}${Object.entries(ST).map(([k, l]) => opt(k, l, f.status)).join('')}</select>
    <select id="mv-type" aria-label="نوع التحرك">${opt('all', 'مباشر وتأهيلي', f.type)}${opt('direct', 'مباشر', f.type)}${opt('bridge', 'جسر تأهيلي', f.type)}</select>
    <select id="mv-crit" aria-label="الأهمية">${opt('all', 'كل درجات الأهمية', f.crit)}${[2, 1, 0].map(k => opt(k, D.CRIT[k].ar, f.crit)).join('')}</select>
    <select id="mv-fam" aria-label="المجموعة الوظيفية">${opt('all', 'كل المجموعات', f.fam)}${D.F.map((x, k) => opt(k, x.ar, f.fam)).join('')}</select>
    <select id="mv-ent" aria-label="الجهة">${opt('all', 'كل الجهات', f.ent)}${D.E.map((x, k) => opt(k, x.ar, f.ent)).join('')}</select>
    <select id="mv-sort" aria-label="الترتيب">${opt('crit', 'الترتيب: الأهمية ثم الملاءمة', f.sort)}${opt('fit', 'الترتيب: الأعلى ملاءمة', f.sort)}${opt('low', 'الترتيب: الأدنى ملاءمة', f.sort)}${opt('ent', 'الترتيب: الجهة المستقبلة', f.sort)}</select>`;
}
function renderMoveNotice() {
  const el = $('#mvNotice'); if (!el) return;
  el.hidden = !S.dirty;
  if (S.dirty) { el.innerHTML = `<span>${S.dirtyWhy || 'تغيّرت القرارات'} — أعد التخصيص للبحث عن بدائل والبناء على قراراتك.</span><button class="btn sm coral" type="button" id="mvRerun">أعد التخصيص الآن</button>`;
    $('#mvRerun').onclick = () => { go('lab'); animateRun(); }; }
}
function renderCards() {
  const L = filteredMoves(), A = allMoves(), c = k => A.filter(m => m.status === k).length;
  $('#mvCount').innerHTML = `<span>يُعرض <b class="num">${Math.min(S.mv.shown, L.length)}</b> من <b class="num">${L.length}</b></span>
    <span class="pill ok">معتمد ${c('approved')}</span><span class="pill lock">مثبّت ${c('locked')}</span><span class="pill">مقترح ${c('proposed')}</span><span class="pill rej" style="text-decoration:none">مرفوض ${c('rejected')}</span>
    <span class="sp"></span><button class="btn sm" type="button" id="bulkOk">اعتماد ما ملاءمته ${PCT(80)} فأعلى</button><button class="btn sm ghost" type="button" id="bulkReset">مسح كل القرارات</button>`;
  $('#cards').innerHTML = L.length ? L.slice(0, S.mv.shown).map(moveCard).join('') : '<div class="empty">لا تحركات مطابقة للتصفية الحالية. غيّر عوامل التصفية أو امسح البحث.</div>';
  $('#mvMore').hidden = L.length <= S.mv.shown;
  $('#mvMore').textContent = `عرض المزيد (${Math.max(0, L.length - S.mv.shown)} متبقٍ)`;
  $('#bulkOk').onclick = () => { let k = 0; filteredMoves().forEach(m => { if (m.status === 'proposed' && m.kind === 1 && m.ev.fit >= .8) { m.status = 'approved'; S.dec.set(m.key, 'approved'); k++; } });
    renderCards(); toast(k ? `اعتُمد ${ar(k, 'move')} بملاءمة ${PCT(80)} فأعلى` : `لا مقترحات مباشرة بملاءمة ${PCT(80)} فأعلى ضمن التصفية`); };
  $('#bulkReset').onclick = () => { const hadRej = S.rejected.length; S.dec.clear(); S.rejected = []; S.moves.forEach(m => { m.status = 'proposed'; }); if (hadRej) setDirty('أُلغيت قرارات الرفض'); renderCards(); toast('مُسحت جميع القرارات'); };
}
function renderProgrammes() {
  const bm = activeMoves().filter(m => m.kind === 2), sk = new Map(); let weeks = 0;
  bm.forEach(m => { weeks += m.ev.weeks; m.ev.missing.forEach(x => { const o = sk.get(x.s) || { n: 0, must: 0 }; o.n++; if (x.must) o.must++; sk.set(x.s, o); }); });
  const rows = [...sk.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 12);
  $('#programmes').innerHTML = `<div class="panel-head"><h3>برامج التأهيل اللازمة لتفعيل الجسور</h3><span class="hint">${ar(bm.length, 'move')} بعد تأهيل · متوسط البرنامج ${bm.length ? (weeks / bm.length).toFixed(1) : 0} أسبوعاً</span></div>
    ${rows.length ? `<div class="prog">${rows.map(([s, o]) => `<div class="prog-row"><span>${esc(skillName(s))}</span><b class="num">${ar(o.n, 'trainee')}</b><em>${D.SKILLS[s].domainAr}${o.must ? ` · أساسية في ${ar(o.must, 'need')}` : ''}</em></div>`).join('')}</div>` : '<p class="hint">لا جسور تأهيلية في الحل الحالي.</p>'}`;
}
RENDER.moves = () => { renderMoveTools(); renderMoveNotice(); renderCards(); renderProgrammes(); };
function decide(key, act) {
  const m = allMoves().find(x => x.key === key); if (!m) return;
  if (act === 'undo') { S.dec.delete(key); S.rejected = S.rejected.filter(x => x.key !== key); const live = S.moves.find(x => x.key === key);
    if (live) { live.status = 'proposed'; toast('أُلغي الرفض وعاد التحرك مقترحاً'); }
    else { setDirty('أُلغي رفض تحرك'); toast('أُلغي الرفض — أعد التخصيص ليدخل الزوج في الحساب'); } }
  else if (act === 'rejected') { m.status = 'rejected'; S.dec.set(key, 'rejected'); if (!S.rejected.includes(m)) S.rejected.push(m); setDirty('رُفض تحرك');
    toast('رُفض التحرك — أعد التخصيص للبحث عن بديل'); }
  else if (m.status === act) { m.status = 'proposed'; S.dec.delete(key); }
  else { m.status = act; S.dec.set(key, act); toast(act === 'approved' ? `اعتُمد التحرك إلى ${ent(m.need.e).ar}` : 'ثُبّت التحرك: لن يتغير عند إعادة التخصيص'); }
  renderCards(); renderProgrammes();
}
function initMoves() {
  const tools = $('#mvTools');
  tools.addEventListener('input', ev => { const t = ev.target; if (t.id === 'mv-q') { S.mv.q = t.value; S.mv.shown = 12; renderCards(); } });
  tools.addEventListener('change', ev => { const t = ev.target; if (t.tagName === 'SELECT') { S.mv[t.id.slice(3)] = t.value; S.mv.shown = 12; renderCards(); } });
  $('#cards').addEventListener('click', ev => { const b = ev.target.closest('[data-act]'); if (!b) return; decide(b.closest('.mv').dataset.key, b.dataset.act); });
  $('#mvMore').addEventListener('click', () => { S.mv.shown += 12; renderCards(); });
}

/* ===== 5 · plan ===== */
function planMoves() { return activeMoves().filter(m => S.planAll || m.status === 'approved').sort((a, b) => a.need.e - b.need.e || b.need.crit - a.need.crit || b.ev.fit - a.ev.fit); }
function residualNeeds() { const t = new Set(activeMoves().map(m => m.n)); return D.needs.filter(n => !t.has(n.i)); }
function renderPlan() {
  const L = planMoves(), R = residualNeeds(), ap = activeMoves().filter(m => m.status === 'approved').length, now = new Date();
  const mech = { 'نقل': 0, 'ندب': 0, 'إعارة': 0 }; L.forEach(m => mech[m.mech]++);
  const q = Math.floor(now.getMonth() / 3), QN = ['الأول', 'الثاني', 'الثالث', 'الرابع'];
  $('#planBar').innerHTML = `<div class="seg" role="group" aria-label="نطاق الخطة"><button type="button" data-plan="1" aria-pressed="${S.planAll}">المعتمدة والمقترحة</button><button type="button" data-plan="0" aria-pressed="${!S.planAll}">المعتمدة فقط (${ap})</button></div>
    <span class="hint">تُطبع ورقة القرار وحدها دون بقية الصفحة.</span><span class="sp"></span>
    <button class="btn" type="button" id="xMoves">تصدير التحركات CSV</button><button class="btn" type="button" id="xResid">تصدير الاحتياجات المتبقية CSV</button><button class="btn primary" type="button" id="doPrint">طباعة ورقة القرار</button>`;
  const byF = D.F.map(() => [0, 0, 0]); R.forEach(n => byF[n.f][n.crit]++);
  $('#planDoc').innerHTML = `
    <div class="doc-head"><div><p class="eyebrow">جسور · منصة التدوير الذكي للكفاءات الحكومية</p><h3>خطة التدوير المقترحة — دورة الربع ${QN[q]} ${now.getFullYear()}</h3>
      <p>ورقة قرار: التحركات بين الجهات والاحتياجات المتبقية للتوظيف الخارجي</p></div>
      <div class="doc-meta"><div>التاريخ: <bdi>${CGB.bothDates(now)}</bdi></div><div>النطاق: ${S.planAll ? 'المعتمدة والمقترحة' : 'المعتمدة فقط'}</div><div><b>بيانات تجريبية افتراضية — ليست قراراً رسمياً</b></div></div></div>
    <div class="doc-sum"><div><b class="num">${L.length}</b><span>${unit(L.length, 'move')} في الخطة</span></div><div><b class="num">${ap}</b><span>معتمد حتى الآن</span></div>
      <div><b class="num">${mech['نقل']}</b><span>نقل</span></div><div><b class="num">${mech['ندب']}</b><span>ندب</span></div><div><b class="num">${mech['إعارة']}</b><span>إعارة</span></div>
      <div><b class="num">${L.filter(m => m.kind === 2).length}</b><span>بعد برنامج تأهيلي</span></div><div><b class="num">${R.length}</b><span>${unit(R.length, 'need')} للتوظيف الخارجي</span></div></div>
    <h4>أولاً: التحركات</h4>
    ${L.length ? `<div class="doc-scroll"><table class="doc"><thead><tr><th class="c">م</th><th>رمز الكفاءة</th><th>من (الجهة المانحة)</th><th>إلى (الجهة المستقبلة)</th><th>الوحدة</th><th>المجموعة</th><th>الأهمية</th><th>الآلية</th><th class="c">الملاءمة</th><th>النوع</th><th>الحالة</th></tr></thead><tbody>
      ${L.map((m, i) => `<tr><td class="c num">${i + 1}</td><td><bdi>${m.person.code}</bdi></td><td>${esc(ent(m.person.e).ar)}</td><td>${esc(ent(m.need.e).ar)}</td><td>${esc(m.need.unit)}</td><td>${famShort(m.need.f)}</td><td>${D.CRIT[m.need.crit].ar}</td><td>${m.mech}${m.need.months ? ` (${ar(m.need.months, 'month')})` : ''}</td><td class="c num">${pc(m.ev.fit)}</td><td>${m.kind === 2 ? `تأهيلي (${ar(m.ev.weeks, 'week')})` : 'مباشر'}</td><td>${ST[m.status]}</td></tr>`).join('')}
      </tbody></table></div>` : `<div class="empty">لا تحركات معتمدة بعد. اعتمد المقترحات من «قائمة التحركات»، أو اعرض المعتمدة والمقترحة معاً.<br><button class="btn sm" type="button" id="planGo" style="margin-top:10px">إلى قائمة التحركات</button></div>`}
    <h4>ثانياً: الاحتياجات المتبقية للتوظيف الخارجي (${R.length})</h4>
    <div class="scroll-x"><table class="doc small"><thead><tr><th>المجموعة الوظيفية</th><th class="c">حرج</th><th class="c">مرتفع</th><th class="c">اعتيادي</th><th class="c">المجموع</th></tr></thead><tbody>
      ${D.F.map((f, k) => ({ f, k, v: byF[k] })).filter(x => x.v[0] + x.v[1] + x.v[2]).sort((a, b) => (b.v[0] + b.v[1] + b.v[2]) - (a.v[0] + a.v[1] + a.v[2])).map(x => `<tr><td>${esc(x.f.ar)}</td><td class="c num">${x.v[2]}</td><td class="c num">${x.v[1]}</td><td class="c num">${x.v[0]}</td><td class="c num"><b>${x.v[0] + x.v[1] + x.v[2]}</b></td></tr>`).join('') || '<tr><td colspan="5">لا احتياجات متبقية.</td></tr>'}
    </tbody></table></div>
    <h4>ثالثاً: شروط التنفيذ</h4>
    <p class="hint" style="color:var(--ink)">لا يُنفَّذ أي تحرك إلا بعد موافقة الموظف والجهة المانحة والجهة المستقبلة، واستيفاء الشروط النظامية للنقل والندب والإعارة. التحركات التأهيلية تبدأ بعد إتمام البرنامج المحدد.</p>
    <div class="signs"><div>موافقة الجهة المانحة</div><div>موافقة الجهة المستقبلة</div><div>اعتماد إدارة تخطيط القوى العاملة</div></div>
    <p class="doc-note">أُعدّت هذه الورقة آلياً بخوارزمية التخصيص الأمثل وقواعد معلنة. الأوزان: ${Object.entries(S.P.w).map(([k, v]) => `${WLAB[k]} ${v}`).join(' · ')}. الحد الأدنى للملاءمة ${pc(S.P.minFit)}. جميع الأرقام والجهات والرموز تجريبية افتراضية.</p>`;
  $$('[data-plan]').forEach(b => { b.onclick = () => { S.planAll = b.dataset.plan === '1'; renderPlan(); }; });
  const pg = $('#planGo'); if (pg) pg.onclick = () => go('moves');
  $('#doPrint').onclick = () => { window.print(); };
  $('#xMoves').onclick = () => { const rows = [['رمز الكفاءة', 'الجهة المانحة', 'المجموعة الحالية', 'الفئة', 'الدرجة', 'الجنسية', 'رمز الاحتياج', 'الجهة المستقبلة', 'الوحدة', 'المجموعة المطلوبة', 'الأهمية', 'الآلية', 'المدة بالأشهر', 'نوع التحرك', 'الملاءمة %', 'أسابيع التأهيل', 'المهارات المطلوب استكمالها', 'الحالة']]
      .concat(L.map(m => [m.person.code, ent(m.person.e).ar, fam(m.person.f).ar, band(m.person.band).ar, m.person.grade, m.person.q ? 'قطري' : 'غير قطري', m.need.code, ent(m.need.e).ar, m.need.unit, fam(m.need.f).ar, D.CRIT[m.need.crit].ar, m.mech, m.need.months || '', m.kind === 2 ? 'جسر تأهيلي' : 'مباشر', Math.round(m.ev.fit * 100), m.kind === 2 ? m.ev.weeks : 0, m.kind === 2 ? m.ev.missing.map(x => skillName(x.s)).join(' | ') : '', ST[m.status]]));
    openExport({ title: `تصدير التحركات (${L.length})`, hint: 'ملف CSV بترميز UTF-8 يفتح مباشرة في Excel. بيانات تجريبية افتراضية.', text: csv(rows), filename: 'jusoor-rotation-moves.csv' }); };
  $('#xResid').onclick = () => { const rows = [['رمز الاحتياج', 'الجهة', 'الوحدة', 'المجموعة الوظيفية', 'الفئة المطلوبة', 'الأهمية', 'طبيعة الاحتياج', 'المهارات الأساسية', 'المهارات المرجّحة']]
      .concat(R.map(n => [n.code, ent(n.e).ar, n.unit, fam(n.f).ar, band(n.lo).ar + (n.hi > n.lo ? ' – ' + band(n.hi).ar : ''), D.CRIT[n.crit].ar, DUR(n), n.must.map(skillName).join(' | '), n.nice.map(skillName).join(' | ')]));
    openExport({ title: `تصدير الاحتياجات المتبقية (${R.length})`, hint: 'قائمة ما يُطرح للتوظيف الخارجي بعد استنفاد الحلول الداخلية. بيانات تجريبية افتراضية.', text: csv(rows), filename: 'jusoor-external-hiring-needs.csv' }); };
}
RENDER.plan = renderPlan;
