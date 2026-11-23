/* مِصفاة — step 2 «التشخيص»: score panel, issue list, and the data table with highlighted cells. */
const fixChip = is => is.fix ? (is.fix.safe ? '<span class="chip safe">معالجة آمنة</span>' : '<span class="chip conf">تحتاج تأكيدك</span>') : '<span class="chip rev">مراجعة بشرية</span>';
function scorePanel(sc, base) {
  return `<div class="overall"><div><span class="cap">الدرجة الكلية</span><div class="big"><span class="mono">${s1(sc.overall)}</span><small class="mono">/ 100</small></div></div>
      <span class="band ${sc.band.k}">${sc.band.ar}</span></div>
    <div class="gauge"><i class="${sc.band.k === 'ok' ? '' : sc.band.k}" style="width:${sc.overall}%"></i>${base && Math.abs(base.overall - sc.overall) > 0.05 ? `<u style="inset-inline-start:${base.overall}%" title="قبل المعالجة: ${s1(base.overall)}"></u>` : ''}</div>
    <ul class="dims">${MF.DIMS.map(d => { const x = sc.dims[d.id], k = bandK(x.score), b = base && base.dims[d.id];
      return `<li><button data-act="dim" data-dim="${d.id}" class="${App.dimFilter === d.id ? 'on' : ''}" ${x.assessed ? '' : 'disabled'} title="اعرض ملاحظات هذا البُعد">
        <span class="dn"><b>${d.ar}</b><small>${d.q}</small></span>
        <span class="dv mono">${x.assessed ? s1(x.score) : '—'}</span>
        <span class="gauge"><i class="${k === 'ok' ? '' : k}" style="width:${x.assessed ? x.score : 0}%"></i>${b && x.assessed && Math.abs(b.score - x.score) > 0.05 ? `<u style="inset-inline-start:${b.score}%"></u>` : ''}</span>
        <span class="da">${x.assessed ? (x.bad ? `<span class="mono">${n0(x.bad)}</span> سجلاً عليه ملاحظة` : 'لا ملاحظات') : 'غير مقيَّم: لا حقول مطابَقة تخصّه'}</span></button></li>`; }).join('')}</ul>
    <details class="formula"><summary>كيف تُحسب الدرجة؟</summary>
      <p><b>درجة البُعد</b> = السجلات الخالية من ملاحظات هذا البُعد ÷ إجمالي السجلات × 100.</p>
      <p><b>الدرجة الكلية</b> = متوسط موزون للأبعاد المقيَّمة: ${MF.DIMS.map(d => `${d.ar} <span class="mono">${Math.round(d.w * 100)}%</span>`).join('، ')}.</p>
      <p>التصنيف: 95 فأعلى ممتاز، 85–95 جيد، 70–85 مقبول، دون 70 يحتاج معالجة. ${base ? 'الخط العمودي الأسود يدلّ على الدرجة قبل المعالجة.' : ''}</p></details>`;
}
function filteredIssues() { return App.ctx.issues.filter(i => (App.sevFilter === 'all' || i.sev === App.sevFilter) && (App.dimFilter === 'all' || i.dim === App.dimFilter)); }

R.diag = () => {
  const c = App.ctx, all = c.issues, list = filteredIssues();
  const cnt = k => all.filter(i => i.sev === k).length;
  const fchip = (grp, val, label) => `<button class="fchip ${App[grp] === val ? 'on' : ''}" data-act="filter" data-grp="${grp}" data-val="${val}">${label}</button>`;
  $('#v-diag').innerHTML = `
  <div class="vhead"><div><span class="spec">02 / التشخيص</span><h2>ما حالة هذه البيانات؟</h2>
    <p>${n0(all.length)} ملاحظة على ${n0(App.rows.length)} سجلاً. كل ملاحظة مربوطة بالقاعدة التي أنتجتها وبالخلايا التي تخصّها.</p></div>
    <div class="acts"><button class="btn ghost" data-act="exp-issues">تصدير سجل الملاحظات</button><button class="btn primary" data-act="go" data-view="treat">إلى العلاج <span aria-hidden="true">←</span></button></div></div>
  <div class="cols-2">
    <div class="panel scorep" id="scorep"><div class="body">${scorePanel(c.score, App.ops.length ? App.score0 : null)}</div></div>
    <div class="panel" id="issuesp"><header><h3>الملاحظات</h3>
        <div class="filters">${fchip('sevFilter', 'all', `الكل <span class="mono">${all.length}</span>`)}${fchip('sevFilter', 'high', `<span class="sev high">حرجة</span> <span class="mono">${cnt('high')}</span>`)}${fchip('sevFilter', 'med', `<span class="sev med">متوسطة</span> <span class="mono">${cnt('med')}</span>`)}${fchip('sevFilter', 'low', `<span class="sev low">بسيطة</span> <span class="mono">${cnt('low')}</span>`)}
        ${App.dimFilter !== 'all' ? `<button class="fchip on" data-act="dim" data-dim="${App.dimFilter}">البُعد: ${dimAr(App.dimFilter)} ×</button>` : ''}</div></header>
      ${c.notes.length ? `<div class="body"><div class="note">${c.notes.map(esc).join(' ')}</div></div>` : ''}
      <ul class="isslist" id="isslist">${list.length ? list.map(is => issueRow(is)).join('') : `<li class="empty">${all.length ? 'لا ملاحظات ضمن هذا الفرز.' : 'لا ملاحظات: البيانات اجتازت كل القواعد المفعّلة.'}</li>`}</ul>
    </div>
  </div>
  <div class="panel" id="tablep"></div>`;
  renderTable();
};
function issueRow(is) {
  const open = App.openIssue === is.id, sel = App.issueFilter === is.id;
  return `<li class="iss ${open ? 'open' : ''} ${sel ? 'sel' : ''}">
    <button class="row" data-act="iss-toggle" data-id="${esc(is.id)}" aria-expanded="${open}">
      <span class="sev ${is.sev}">${MF.SEV[is.sev]}</span><span class="ttl">${esc(is.title)}</span>
      <span class="tags"><span class="chip">${dimAr(is.dim)}</span>${fixChip(is)}</span><span class="cnt"><b class="mono">${n0(is.n)}</b> سجلاً</span></button>
    ${open ? `<div class="more"><p>${esc(is.explain)}</p><div class="spec">القاعدة ${esc(is.rule)} · ${n0(is.cells.length)} خلية</div>
      <div class="acts"><button class="btn sm" data-act="iss-show" data-id="${esc(is.id)}">${sel ? 'السجلات معروضة في الجدول أدناه' : `اعرض السجلات الـ${n0(is.n)} في الجدول`}</button>
      ${is.fix ? `<button class="btn sm ghost" data-act="go" data-view="treat">إلى معالجتها</button>` : ''}</div></div>` : ''}</li>`;
}
ACT.filter = el => { App[el.dataset.grp] = el.dataset.val; R.diag(); };
ACT.dim = el => { App.dimFilter = App.dimFilter === el.dataset.dim ? 'all' : el.dataset.dim; R.diag(); };
ACT['iss-toggle'] = el => { App.openIssue = App.openIssue === el.dataset.id ? null : el.dataset.id; const y = window.scrollY; R.diag(); window.scrollTo(0, y); };
ACT['iss-show'] = el => { App.issueFilter = el.dataset.id; App.page = 0; R.diag(); $('#tablep').scrollIntoView({ block: 'start', behavior: 'auto' }); };
ACT['iss-clear'] = () => { App.issueFilter = null; App.page = 0; renderTable(); const l = $('#isslist'); if (l) l.innerHTML = filteredIssues().map(issueRow).join(''); };
ACT['exp-issues'] = () => exportTable('سجل الملاحظات', slug() + '-issues.csv', MF.issuesTable(App.ctx.issues, App.headers, App.rows, App.map.emp_id), 'كل خلية عليها ملاحظة، مع القاعدة والخطورة ونوع المعالجة.');

/* ---------- data table (paginated; marks from the per-cell index) ---------- */
const PAGE = 20;
function cellHTML(v) {
  if (v === '' || v == null) return '';
  const m = String(v).match(/^(\s*)([\s\S]*?)(\s*)$/); const ws = x => x ? `<span class="ws">${x.replace(/[^ ]/g, ' ')}</span>` : '';
  return ws(m[1]) + esc(m[2]).replace(/ {2,}/g, x => `<span class="ws">${x}</span>`) + ws(m[3]);
}
function renderTable() {
  const c = App.ctx, is = App.issueFilter ? c.issues.find(i => i.id === App.issueFilter) : null;
  const total = is ? is.rows.length : App.rows.length, pages = Math.max(1, Math.ceil(total / PAGE));
  App.page = Math.min(App.page, pages - 1);
  const idx = []; for (let k = App.page * PAGE; k < Math.min(total, (App.page + 1) * PAGE); k++) idx.push(is ? is.rows[k] : k);
  const hit = new Set(); if (is) for (const [r, cc] of is.cells) hit.add(r * 4096 + cc);
  const fieldOf = {}; for (const f in App.map) fieldOf[App.map[f]] = MF.field(f).ar;
  const head = `<tr><th class="rn" title="رقم الصف كما يظهر في Excel (الصف 1 للعناوين)">صف</th>${App.headers.map((h, i) => `<th>${esc(h)}<small class="${fieldOf[i] ? '' : 'un'}">${fieldOf[i] || 'غير مطابَق'}</small></th>`).join('')}</tr>`;
  const body = idx.map(r => `<tr><td class="rn d">${r + 2}</td>${App.rows[r].map((v, cc) => { const key = r * 4096 + cc, m = c.marks.get(key);
    const tip = m ? c.cellIss.get(key).map(k => c.issues[k].title).join(' · ') : '';
    return `<td class="d${m ? ' m-' + m : ''}${hit.has(key) ? ' hit' : ''}${v === '' ? ' blank' : ''}"${tip ? ` title="${esc(tip)}"` : ''}>${cellHTML(v)}</td>`; }).join('')}</tr>`).join('');
  $('#tablep').innerHTML = `<header><h3>السجلات</h3>
      <div class="tfilter">${is ? `<span class="chip sel"><span class="sev ${is.sev}"></span>${esc(is.title)} · <span class="mono">${n0(is.n)}</span></span><button class="btn sm ghost" data-act="iss-clear">اعرض كل السجلات</button>` : '<span class="hint">اختر ملاحظة لعرض سجلاتها فقط. الخلايا الملوّنة عليها ملاحظة؛ مرّر المؤشر لمعرفتها.</span>'}</div></header>
    <div class="scroll"><table class="data"><thead>${head}</thead><tbody>${body || `<tr><td colspan="${App.headers.length + 1}" class="empty">لا سجلات.</td></tr>`}</tbody></table></div>
    <div class="body tfoot"><div class="legend"><span><i class="m-high"></i>حرجة</span><span><i class="m-med"></i>متوسطة</span><span><i class="m-low"></i>بسيطة</span><span><i class="ws"></i>مسافة زائدة</span><span><b>∅</b> فارغة</span></div>
      <div class="pager"><button class="btn sm ghost" data-act="page" data-d="-1" ${App.page === 0 ? 'disabled' : ''}>السابق</button><span class="mono">${App.page + 1} / ${n0(pages)}</span><button class="btn sm ghost" data-act="page" data-d="1" ${App.page >= pages - 1 ? 'disabled' : ''}>التالي</button><span>${n0(total)} سجلاً</span></div></div>`;
}
ACT.page = el => { App.page += +el.dataset.d; renderTable(); };
