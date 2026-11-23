/* مِصفاة — step 3 «العلاج»: safe treatments with before/after preview, cluster canonical choice,
   confirm-only treatments, applied stack with exact undo, change log, and the human-review list. */
function choiceFor(key, i, cl) { const c = (App.choices[key] || {})[i]; return { on: c && c.on != null ? c.on : true, canon: c && c.canon != null ? c.canon : cl.canonical }; }
function buildOp(t) {
  const f = t.fix; const op = Object.assign({}, f, { id: 'op' + (App.opSeq + 1), rules: [...new Set(t.issues.map(i => i.rule))].join('، ') });
  if (f.kind === 'canon') { const map = {}; f.clusters.forEach((cl, i) => { const ch = choiceFor(f.key, i, cl); if (ch.on) cl.variants.forEach(v => map[v.value] = ch.canon); }); op.map = map; delete op.clusters; }
  return op;
}
function previewRows(ch, n = 4) { const seen = new Set(), out = []; for (const x of ch) { if (seen.has(x.before)) continue; seen.add(x.before); out.push(x); if (out.length >= n) break; } return out; }
const showVal = v => v === '' ? '<span class="na">∅ فارغة</span>' : cellHTML(v);

function tcard(t, ch) {
  const f = t.fix, rules = [...new Set(t.issues.map(i => i.rule))].join('، ');
  let inner;
  if (f.kind === 'canon') {
    const all = App.showAll[f.key], shown = all ? f.clusters : f.clusters.slice(0, 4);
    inner = `<ul class="clusters">${shown.map((cl, i) => { const c = choiceFor(f.key, i, cl);
      return `<li class="${c.on ? '' : 'off'}"><input type="checkbox" id="cl-${esc(f.key)}-${i}" data-chg="cl-on" data-key="${esc(f.key)}" data-i="${i}" ${c.on ? 'checked' : ''} aria-label="تضمين هذه القيمة في التوحيد">
        <div class="vars">${cl.variants.map(v => `<span class="var ${v.value === c.canon ? 'canon' : ''}"><span class="d">${cellHTML(v.value)}</span><b class="mono">${n0(v.count)}</b></span>`).join('')}</div>
        <label class="to">تُوحَّد إلى <select data-chg="cl-canon" data-key="${esc(f.key)}" data-i="${i}" aria-label="الصيغة المعتمدة">${cl.variants.map(v => `<option ${v.value === c.canon ? 'selected' : ''}>${esc(v.value)}</option>`).join('')}</select></label></li>`; }).join('')}</ul>
      ${f.clusters.length > 4 ? `<button class="btn sm ghost" data-act="cl-all" data-key="${esc(f.key)}">${all ? 'اعرض أقل' : `اعرض القيم الـ${f.clusters.length} كلها`}</button>` : ''}`;
  } else {
    inner = `<table class="prev"><thead><tr><th>العمود</th><th>قبل</th><th></th><th>بعد</th></tr></thead><tbody>${previewRows(ch).map(x => `<tr><td>${esc(App.headers[x.c])}</td><td class="d b">${showVal(x.before)}</td><td class="ar" aria-hidden="true">←</td><td class="d a">${showVal(x.after)}</td></tr>`).join('')}</tbody></table>`;
  }
  return `<article class="tcard" data-key="${esc(f.key)}"><div class="th"><div><h4>${esc(f.label)}</h4>
      <div class="sub"><b class="mono">${n0(ch.length)}</b> خلية ستتغيّر <span class="spec">القاعدة ${esc(rules)}</span></div></div>
      <button class="btn ${f.safe ? 'primary' : ''} sm" data-act="apply" data-key="${esc(f.key)}" ${ch.length ? '' : 'disabled'}>${f.safe ? 'طبّق' : 'أؤكّد وأطبّق'}</button></div>${inner}</article>`;
}

R.treat = () => {
  const c = App.ctx, tr = treatmentsNow(), withCh = tr.map(t => ({ t, ch: MF.opChanges(App.rows, buildOp(t)) }));
  const safe = withCh.filter(x => x.t.fix.safe), conf = withCh.filter(x => !x.t.fix.safe), review = c.issues.filter(i => i.review);
  const safeCells = safe.reduce((a, x) => a + x.ch.length, 0), s0 = App.score0.overall, sN = c.score.overall, d = sN - s0;
  const pages = Math.max(1, Math.ceil(App.log.length / 10)); App.logPage = Math.min(App.logPage, pages - 1);
  $('#v-treat').innerHTML = `
  <div class="vhead"><div><span class="spec">03 / العلاج</span><h2>عالِج ما يُعالَج آلياً، ووثّق الباقي</h2>
    <p>المعالجات الآمنة توحّد شكل الكتابة ولا تغيّر معنى أي قيمة. ما يحتاج حكماً بشرياً (تكرار، أعمار مستحيلة، رواتب شاذة) لا يُمسّ أبداً؛ يُوثَّق ويُصدَّر للمراجعة.</p></div>
    <div class="acts"><button class="btn primary" data-act="go" data-view="pass">إلى الجواز <span aria-hidden="true">←</span></button></div></div>
  <div class="panel jump" id="jump">
    <div class="jnums"><div><span class="cap">قبل المعالجة</span><b class="mono">${s1(s0)}</b><span class="band ${MF.band(s0).k}">${MF.band(s0).ar}</span></div>
      <span class="jarrow" aria-hidden="true">←</span>
      <div class="now"><span class="cap">الآن</span><b class="mono" id="jump-now" data-v="${App.lastJump == null ? sN : App.lastJump}">${s1(App.lastJump == null ? sN : App.lastJump)}</b><span class="band ${c.score.band.k}">${c.score.band.ar}</span></div>
      <div class="delta ${d > 0.05 ? 'up' : ''}"><b class="mono ltr">${d > 0.05 ? '+' + s1(d) : '0.0'}</b><span>نقطة</span></div></div>
    <div class="jcta">${safe.length ? `<button class="btn primary lg" data-act="apply-safe" id="btn-apply-safe">طبّق كل المعالجات الآمنة <span class="k">${safe.length}</span></button>
        <p>ستتغيّر <b class="mono">${n0(safeCells)}</b> خلية في ${n0(new Set(safe.flatMap(x => x.ch.map(y => y.r))).size)} سجلاً. لا يُحذف أي سجل، وكل تغيير يُدوَّن ويمكن التراجع عنه.</p>`
      : `<div class="done"><b>لا معالجات آمنة متبقية.</b><p>${App.ops.length ? `طُبّقت ${App.ops.length} معالجة غيّرت ${n0(App.log.length)} خلية.` : 'البيانات لا تحتاج توحيداً شكلياً.'} ${review.length ? `بقيت ${review.length} ملاحظة تحتاج مراجعة بشرية.` : ''}</p></div>`}</div>
  </div>
  <div class="cols-2r">
    <div class="stack">
      <div class="panel" id="p-safe"><header><h3>معالجات آمنة</h3><span class="hint">توحيد شكلي لا يغيّر المعنى؛ عاين الأثر ثم طبّق كل واحدة بمفردها أو كلها معاً</span></header>
        <div class="tlist">${safe.length ? safe.map(x => tcard(x.t, x.ch)).join('') : '<div class="empty">لا شيء هنا. كل ما يمكن توحيده بأمان وُحِّد.</div>'}</div></div>
      <div class="panel" id="p-conf"><header><h3>معالجات تحتاج تأكيدك</h3><span class="hint">صحيحة في الغالب، لكن الخطأ فيها ممكن؛ لا تدخل ضمن «طبّق الكل»</span></header>
        <div class="tlist">${conf.length ? conf.map(x => tcard(x.t, x.ch)).join('') : '<div class="empty">لا معالجات بانتظار التأكيد.</div>'}</div></div>
    </div>
    <div class="stack">
      <div class="panel" id="p-applied"><header><h3>المعالجات المطبّقة</h3>${App.ops.length ? '<button class="btn sm ghost" data-act="undo-all">تراجع عن الكل</button>' : ''}</header>
        ${App.ops.length ? `<ol class="applied">${App.ops.map(o => `<li><div><b>${esc(o.label)}</b><span><span class="mono">${n0(App.counts[o.id] || 0)}</span> خلية</span></div><button class="btn sm ghost" data-act="undo" data-id="${o.id}">تراجع</button></li>`).join('')}</ol>` : '<div class="empty">لم تُطبَّق أي معالجة بعد. البيانات الأصلية محفوظة كما هي.</div>'}</div>
      <div class="panel" id="p-review"><header><h3>تتطلب مراجعة بشرية</h3><span class="hint">لا تُعالَج آلياً</span></header>
        ${review.length ? `<ul class="review">${review.map(i => `<li><span class="sev ${i.sev}"></span><span>${esc(i.title)}</span><b class="mono">${n0(i.n)}</b></li>`).join('')}</ul>
        <div class="body"><button class="btn sm" data-act="exp-review">صدّر قائمة المراجعة</button></div>` : '<div class="empty">لا ملاحظات تحتاج مراجعة بشرية.</div>'}</div>
    </div>
  </div>
  <div class="panel" id="p-log"><header><h3>سجل التغييرات</h3><div class="tfilter"><span class="hint"><span class="mono">${n0(App.log.length)}</span> تغييراً موثّقاً: الصف، العمود، القيمة قبل وبعد، والمعالجة</span>${App.log.length ? '<button class="btn sm ghost" data-act="exp-log">تصدير السجل</button>' : ''}</div></header>
    ${App.log.length ? `<div class="scroll"><table class="logt"><thead><tr><th>صف Excel</th><th>العمود</th><th>قبل</th><th>بعد</th><th>المعالجة</th></tr></thead><tbody>
      ${App.log.slice(App.logPage * 10, App.logPage * 10 + 10).map(l => `<tr><td class="d">${l.r + 2}</td><td>${esc(App.headers[l.c])}</td><td class="d b">${showVal(l.before)}</td><td class="d a">${showVal(l.after)}</td><td>${esc(l.label)}</td></tr>`).join('')}</tbody></table></div>
      <div class="body tfoot"><span></span><div class="pager"><button class="btn sm ghost" data-act="logpage" data-d="-1" ${App.logPage === 0 ? 'disabled' : ''}>السابق</button><span class="mono">${App.logPage + 1} / ${n0(pages)}</span><button class="btn sm ghost" data-act="logpage" data-d="1" ${App.logPage >= pages - 1 ? 'disabled' : ''}>التالي</button></div></div>`
      : '<div class="empty">يظهر هنا كل تغيير فور تطبيق أي معالجة.</div>'}</div>`;
  animateNum($('#jump-now'), +s1(sN)); App.lastJump = +s1(sN);
};

CHG['cl-on'] = el => { const k = el.dataset.key, i = el.dataset.i; (App.choices[k] || (App.choices[k] = {}))[i] = Object.assign({}, App.choices[k][i], { on: el.checked }); keepScroll(R.treat); };
CHG['cl-canon'] = el => { const k = el.dataset.key, i = el.dataset.i; (App.choices[k] || (App.choices[k] = {}))[i] = Object.assign({}, App.choices[k][i], { canon: el.value }); keepScroll(R.treat); };
ACT['cl-all'] = el => { App.showAll[el.dataset.key] = !App.showAll[el.dataset.key]; keepScroll(R.treat); };
function keepScroll(fn) { const y = window.scrollY; fn(); window.scrollTo(0, y); }
ACT.logpage = el => { App.logPage += +el.dataset.d; keepScroll(R.treat); };

ACT.apply = async el => {
  const t = treatmentsNow().find(x => x.fix.key === el.dataset.key); if (!t) return;
  const op = buildOp(t), n = MF.opChanges(App.rows, op).length; if (!n) return toast('لا خلايا مختارة لهذه المعالجة.', true);
  App.opSeq++; App.ops.push(op); delete App.choices[t.fix.key]; const before = App.ctx.score.overall, y = window.scrollY;
  await recompute(); window.scrollTo(0, y);
  toast(`طُبّقت «${op.label}»: ${n0(n)} خلية. الدرجة ${s1(before)} ← ${s1(App.ctx.score.overall)}.`);
};
ACT['apply-safe'] = async () => {
  const before = App.ctx.score.overall, ops0 = App.ops.length, cells0 = App.log.length;
  for (let pass = 0; pass < 3; pass++) {            // a second pass catches what the first one uncovered
    const safe = treatmentsNow().filter(t => t.fix.safe); let added = 0;
    for (const t of safe) { const op = buildOp(t); if (!MF.opChanges(App.rows, op).length) continue; App.opSeq++; App.ops.push(op); delete App.choices[t.fix.key]; added++; }
    if (!added) break; await recompute();
  }
  $('#jump').scrollIntoView({ block: 'center', behavior: 'auto' });
  toast(`طُبّقت ${App.ops.length - ops0} معالجة آمنة غيّرت ${n0(App.log.length - cells0)} خلية. الدرجة ${s1(before)} ← ${s1(App.ctx.score.overall)}.`);
};
ACT.undo = async el => { const op = App.ops.find(o => o.id === el.dataset.id); App.ops = App.ops.filter(o => o.id !== el.dataset.id); const y = window.scrollY; await recompute(); window.scrollTo(0, y); toast(`تم التراجع عن «${op.label}» وأُعيدت قيمها الأصلية.`); };
ACT['undo-all'] = async () => { App.ops = []; await recompute(); toast('تم التراجع عن كل المعالجات. البيانات كما وردت تماماً.'); };
ACT['exp-log'] = () => exportTable('سجل التغييرات', slug() + '-changes.csv', MF.logTable(App.log, App.headers, App.rows, App.map.emp_id), 'كل خلية تغيّرت: القيمة قبل وبعد والمعالجة التي غيّرتها.');
ACT['exp-review'] = () => exportTable('قائمة المراجعة البشرية', slug() + '-review.csv', MF.issuesTable(App.ctx.issues.filter(i => i.review), App.headers, App.rows, App.map.emp_id), 'ملاحظات لا تُعالَج آلياً وتحتاج قراراً من صاحب البيانات.');
ACT['exp-clean'] = () => openExport({ title: 'البيانات بعد المعالجة', filename: slug() + '-clean.csv', text: MF.toCSV(App.headers, App.rows),
  note: `${n0(App.rows.length)} سجلاً و${App.headers.length} عموداً بالترتيب الأصلي. ${App.ops.length ? `طُبّقت ${App.ops.length} معالجة غيّرت ${n0(App.log.length)} خلية.` : 'لم تُطبَّق أي معالجة؛ الملف مطابق للأصل.'} ملف CSV بترميز UTF-8 مع علامة BOM ليفتحه Excel بالعربية مباشرة.` });
