/* مِصفاة — step 4 «الجواز»: the one-page printable data-quality passport, laid out as a lab report. */
function barcode(fp) { let out = '', dark = true; for (const h of fp + fp.split('').reverse().join('')) { const n = parseInt(h, 16); for (const w of [1 + (n & 3), 1 + (n >> 2)]) { out += `<i style="width:${w}px;background:${dark ? '#152024' : 'transparent'}"></i>`; dark = !dark; } } return out; }
function verdict(c) {
  const high = c.issues.filter(i => i.sev === 'high'), n = high.reduce((a, i) => a + i.n, 0);
  if (high.length) return { k: 'warn', t: 'تُستخدم بتحفّظ', d: `${high.length} ملاحظة حرجة قائمة تمسّ ${n0(n)} سجلاً؛ تُستثنى هذه السجلات أو تُصحَّح من المصدر قبل اعتماد أي رقم.` };
  if (c.score.overall >= 95) return { k: 'ok', t: 'جاهزة للتقارير', d: 'لا ملاحظات حرجة، والدرجة الكلية 95 فأعلى.' };
  return { k: 'ok', t: 'مقبولة مع المراجعة', d: 'لا ملاحظات حرجة؛ تُراجَع الملاحظات المتوسطة قبل النشر.' };
}
R.pass = () => {
  const c = App.ctx, sc = c.score, s0 = App.score0, v = verdict(c), pend = treatmentsNow().filter(t => t.fix.safe).length;
  const open = c.issues.slice(0, 7), more = c.issues.length - open.length, S = App.settings;
  const dimRow = d => { const a = s0.dims[d.id], b = sc.dims[d.id], k = bandK(b.score);
    return `<tr><th scope="row">${d.ar}</th><td class="mono">${a.assessed ? s1(a.score) : '—'}</td><td class="mono now">${b.assessed ? s1(b.score) : '—'}</td>
      <td class="g"><div class="gauge"><i class="${k === 'ok' ? '' : k}" style="width:${b.assessed ? b.score : 0}%"></i>${a.assessed && Math.abs(a.score - b.score) > 0.05 ? `<u style="inset-inline-start:${a.score}%"></u>` : ''}</div></td>
      <td class="mono">${b.assessed ? n0(b.bad) : '—'}</td></tr>`; };
  $('#v-pass').innerHTML = `
  <div class="vhead"><div><span class="spec">04 / الجواز</span><h2>وثيقة تسافر مع البيانات</h2>
    <p>صفحة واحدة تُرفق بأي ملف أو تقرير: ما الذي فُحص، ما الذي عولج، وما الذي بقي. بصمة الملف تربط الجواز بهذه النسخة من البيانات تحديداً.</p></div>
    <div class="acts"><button class="btn primary" data-act="print" id="btn-print">اطبع الجواز</button><button class="btn" data-act="exp-clean" id="btn-clean">البيانات بعد المعالجة</button><button class="btn ghost" data-act="exp-issues">سجل الملاحظات</button><button class="btn ghost" data-act="exp-log" ${App.log.length ? '' : 'disabled'}>سجل التغييرات</button></div></div>
  ${pend ? `<div class="note warn">ما زالت ${pend} معالجة آمنة غير مطبّقة. الجواز يصف البيانات بحالتها الراهنة؛ <a href="#" data-act="go" data-view="treat">طبّقها أولاً</a> إن أردت جوازاً للنسخة المنظّفة.</div>` : ''}
  <div class="passwrap"><article class="passport" id="passport">
    <header class="phead"><div><span class="spec">MISFAT · DATA QUALITY PASSPORT</span><h2>جواز جودة البيانات</h2><p>صادر عن «مِصفاة»، عيادة بيانات القوى العاملة · نموذج أولي</p></div>
      <div class="pid"><div class="barcode" aria-hidden="true">${barcode(App.fp)}</div><span class="mono ltr">MSF-${esc(App.fp)}</span><span>${esc(CGB.bothDates())}</span></div></header>
    ${App.src === 'sample' ? '<div class="ribbon">عيّنة تجريبية افتراضية · ليست بيانات حقيقية</div>' : ''}
    <dl class="pspec"><div><dt>الملف</dt><dd>${esc(App.name)}</dd></div><div><dt>السجلات</dt><dd class="mono">${n0(App.rows.length)}</dd></div>
      <div><dt>الأعمدة</dt><dd class="mono">${App.headers.length}</dd></div><div><dt>الحقول المفحوصة</dt><dd><span class="mono">${mappedCount()}</span> من ${MF.FIELDS.length}</dd></div>
      <div><dt>تاريخ المرجع</dt><dd class="mono">${MF.fmtDate(S.ref, 'dmy')}</dd></div><div><dt>سن التقاعد · السلّم</dt><dd class="mono">${S.retAge} · ${S.gradeMin}–${S.gradeMax}</dd></div></dl>
    <section class="pscore"><div class="pbig"><span class="cap">درجة الجودة الكلية</span><div><b class="mono">${s1(sc.overall)}</b><small class="mono">/ 100</small></div><span class="band ${sc.band.k}">${sc.band.ar}</span>
        ${App.ops.length ? `<span class="was">قبل المعالجة <b class="mono">${s1(s0.overall)}</b></span>` : '<span class="was">لم تُطبَّق معالجات</span>'}</div>
      <table class="pdims"><thead><tr><th>البُعد</th><th>قبل</th><th>بعد</th><th class="g"></th><th>سجلات بملاحظة</th></tr></thead><tbody>${MF.DIMS.map(dimRow).join('')}</tbody></table></section>
    <section class="ptwo"><div><h3>المعالجات المطبّقة</h3>
        ${App.ops.length ? `<ol>${App.ops.map(o => `<li><span>${esc(o.label)}</span><b class="mono">${n0(App.counts[o.id] || 0)}</b></li>`).join('')}</ol><p class="sum">المجموع: <b class="mono">${n0(App.log.length)}</b> خلية تغيّرت، ولم يُحذف أو يُضف أي سجل.</p>` : '<p class="sum">لم تُطبَّق أي معالجة. البيانات كما وردت.</p>'}</div>
      <div><h3>ملاحظات قائمة</h3>
        ${open.length ? `<ul>${open.map(i => `<li><span class="sev ${i.sev}"></span><span>${esc(i.title)}</span><b class="mono">${n0(i.n)}</b></li>`).join('')}</ul>${more > 0 ? `<p class="sum">و${more} ملاحظة أخرى في سجل الملاحظات المرفق.</p>` : ''}` : '<p class="sum">لا ملاحظات قائمة.</p>'}</div></section>
    <footer class="pfoot"><div class="verdict ${v.k}"><span class="cap">الحكم</span><b>${v.t}</b><p>${v.d}</p></div>
      <div class="stmt"><p><b>إقرار المعالجة المحلية:</b> جرى الفحص والمعالجة كاملَين داخل متصفح المستخدم، ولم تُرسَل أي بيانات إلى أي خادم. القواعد المستخدمة قواعد تحقّق وإحصاءات وصفية، وليست نماذج ذكاء اصطناعي.</p>
        <div class="sign"><span>أعدّه: ............................</span><span>راجعه: ............................</span></div></div></footer>
  </article></div>`;
};
ACT.print = () => { toast('إن لم تُفتح نافذة الطباعة، افتح الملف مباشرة في المتصفح ثم اضغط Ctrl+P.'); setTimeout(() => { try { window.print(); } catch (e) { /* viewer may block printing */ } }, 60); };
