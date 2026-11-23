/* مِصفاة — step 5 «أمان النشر»: cross-tab small-cell check, suppression, category merging. */
function safeDims() { return MF.derivedDims(App.map, App.settings).concat(MF.disclosureDims(App.headers, App.map)); }
function defaultSafe() {
  const m = App.map, c = f => m[f] != null ? 'c' + m[f] : '';
  return { d: [c('entity') || c('nat') || 'c0', m.grade != null ? 'gradeband' : (c('nat') || ''), ''], k: 5, mode: 'show', merge: -1 };
}
function safeCompute() {
  const S = App.safe, all = safeDims(), dims = S.d.map(id => all.find(x => x.id === id)).filter(Boolean);
  if (!dims.length) dims.push(all[0]);
  let merge = null, bm = null;
  if (S.merge >= 0 && dims[S.merge]) { bm = MF.bestMerge(App.rows, dims, S.merge, S.k); if (bm.m > 0) merge = { dimIndex: S.merge, set: bm.set }; }
  const tab = MF.crossTab(App.rows, dims, merge), as = MF.assess(tab, S.k), sup = S.mode === 'show' ? null : MF.suppress(tab, S.k, S.mode === 'comp');
  let lone = 0;                                        // hidden cells that total − rest would reveal
  if (sup && S.mode === 'prim') { sup.mask.forEach(row => { if (row.filter(Boolean).length === 1) lone++; }); if (!tab.oneD) tab.colKeys.forEach((_, c) => { let h = 0; sup.mask.forEach(row => h += row[c] ? 1 : 0); if (h === 1) lone++; }); }
  return { dims, tab, as, sup, bm, merge, lone };
}
R.safe = () => {
  const S = App.safe, all = safeDims(), X = safeCompute(), { tab, as, sup, bm, dims } = X;
  const derived = all.filter(d => !/^c\d+$/.test(d.id)), cols = all.filter(d => /^c\d+$/.test(d.id));
  const sel = (i, opt) => `<label>${['جمِّع حسب', 'ثم حسب', 'ثم حسب'][i]}<select id="safe-d${i}" data-chg="safe-d" data-i="${i}">${opt ? '<option value="">— بدون —</option>' : ''}
    ${derived.length ? `<optgroup label="فئات مشتقة">${derived.map(d => `<option value="${d.id}" ${S.d[i] === d.id ? 'selected' : ''}>${esc(d.label)}</option>`).join('')}</optgroup>` : ''}
    <optgroup label="أعمدة البيانات">${cols.map(d => `<option value="${d.id}" ${S.d[i] === d.id ? 'selected' : ''}>${esc(d.label)}</option>`).join('')}</optgroup></select></label>`;
  const modes = [['show', 'اعرض المخاطر'], ['prim', 'احجب الخلايا الصغيرة'], ['comp', 'حجب + حجب تكميلي']];
  let vk, vt, vd;
  if (as.unsafe === 0) { vk = 'ok'; vt = 'آمن للنشر'; vd = `لا خلية يقلّ عددها عن ${S.k}.`; }
  else if (S.mode === 'comp') { vk = 'ok'; vt = 'آمن بعد الحجب'; vd = `حُجبت ${sup.primary} خلية صغيرة و${sup.comp} خلية تكميلية${sup.rowSup.concat(sup.colSup).some(Boolean) ? ' وبعض المجاميع' : ''}.`; }
  else if (S.mode === 'prim') { vk = X.lone ? 'warn' : 'ok'; vt = X.lone ? 'حجب غير كافٍ' : 'آمن بعد الحجب'; vd = X.lone ? `${X.lone} صفاً أو عموداً فيه خلية محجوبة واحدة يمكن استرجاعها بطرح الباقي من المجموع. فعّل الحجب التكميلي.` : `حُجبت ${sup.primary} خلية، ولا يمكن استرجاع أي منها من المجاميع.`; }
  else { vk = 'bad'; vt = 'غير آمن للنشر'; vd = `${as.unsafe} خلية تكشف ${n0(as.people)} شخصاً.`; }
  const MAXR = 40, MAXC = 14, rk = tab.rowKeys.slice(0, MAXR), ck = tab.colKeys.slice(0, MAXC), cut = tab.rowKeys.length > MAXR || tab.colKeys.length > MAXC;
  const cell = (n, r, c) => { const m = sup ? sup.mask[r][c] : 0; if (m) return `<td class="mono sup${m}" title="${m === 1 ? 'محجوبة: أقل من ' + S.k : 'حجب تكميلي يمنع استنتاج خلية مجاورة'}">&lt;${S.k}</td>`; return `<td class="mono ${n > 0 && n < S.k ? 'risk' : n === 0 ? 'zero' : ''}">${n0(n)}</td>`; };
  $('#v-safe').innerHTML = `
  <div class="vhead"><div><span class="spec">05 / أمان النشر</span><h2>هل يكشف جدولك عن فرد بعينه؟</h2>
    <p>خلية فيها شخص واحد ليست إحصاءً، بل معلومة عن ذلك الشخص يعرفها كل من يعرف جهته ودرجته. القاعدة المتّبعة في النشر الإحصائي: لا تُنشر خلية يقلّ عددها عن حدٍّ أدنى k.</p></div>
    <div class="acts"><button class="btn primary" data-act="exp-safe" id="btn-exp-safe">صدّر الجدول</button></div></div>
  <div class="panel" id="safe-ctl"><div class="body safectl">
    ${sel(0, false)}${sel(1, true)}${sel(2, true)}
    <label>الحد الأدنى k<input type="number" id="safe-k" min="2" max="50" value="${S.k}" data-chg="safe-k" inputmode="numeric"></label>
    <div class="seg" role="group" aria-label="طريقة المعالجة"><span>المعالجة</span><div>${modes.map(m => `<button class="${S.mode === m[0] ? 'on' : ''}" data-act="safe-mode" data-mode="${m[0]}" aria-pressed="${S.mode === m[0]}">${m[1]}</button>`).join('')}</div></div>
    <label>دمج الفئات الصغيرة<select id="safe-merge" data-chg="safe-merge"><option value="-1">لا دمج</option>${dims.map((d, i) => `<option value="${i}" ${S.merge === i ? 'selected' : ''}>في «${esc(d.label)}»</option>`).join('')}</select></label>
  </div></div>
  <div class="sstrip" id="safe-stats">
    <div><span class="cap">خلايا غير فارغة</span><b class="mono">${n0(as.cells)}</b></div>
    <div class="${as.unsafe ? 'bad' : 'ok'}"><span class="cap">خلايا دون ${S.k}</span><b class="mono" id="safe-unsafe">${n0(as.unsafe)}</b></div>
    <div class="${as.people ? 'bad' : 'ok'}"><span class="cap">أشخاص يمكن تمييزهم</span><b class="mono" id="safe-people">${n0(as.people)}</b></div>
    <div class="verd ${vk}"><span class="cap">الحكم</span><b id="safe-verdict">${vt}</b><p>${vd}</p></div>
  </div>
  ${bm ? `<div class="note">${bm.m > 0 ? `دُمجت أصغر ${bm.m} فئة في «${esc(dims[S.merge].label)}» ضمن «أخرى (مدمجة)»: ${[...bm.set].slice(0, 6).map(x => `«${esc(x)}»`).join('، ')}${bm.set.size > 6 ? '…' : ''}. ${bm.unsafe ? `بقيت ${bm.unsafe} خلية صغيرة؛ أضف الحجب لمعالجتها.` : 'لم تبقَ أي خلية دون الحد.'}` : 'الدمج في هذا الحقل لا يقلّل المخاطر؛ جرّب حقلاً آخر أو استخدم الحجب.'}</div>` : ''}
  <div class="panel" id="safe-table"><header><h3>${esc(tab.rowLabel)}${tab.colLabel ? ' × ' + esc(tab.colLabel) : ''}</h3>
      <div class="legend"><span><i class="risk"></i>أقل من ${S.k}</span><span><i class="sup1"></i>محجوبة</span><span><i class="sup2"></i>حجب تكميلي</span></div></header>
    <div class="scroll"><table class="xtab"><thead><tr><th>${esc(tab.rowLabel)}</th>${ck.map(k => `<th>${esc(k)}</th>`).join('')}${tab.oneD ? '' : '<th class="tot">المجموع</th>'}</tr></thead>
      <tbody>${rk.map((k, r) => `<tr><th scope="row">${esc(k)}</th>${ck.map((_, c) => cell(tab.counts[r][c], r, c)).join('')}${tab.oneD ? '' : `<td class="mono tot">${sup && sup.rowSup[r] ? '&lt;' + S.k : n0(tab.rowTot[r])}</td>`}</tr>`).join('')}</tbody>
      <tfoot><tr><th scope="row">المجموع</th>${tab.oneD ? `<td class="mono tot">${n0(tab.total)}</td>` : ck.map((_, c) => `<td class="mono tot">${sup && sup.colSup[c] ? '&lt;' + S.k : n0(tab.colTot[c])}</td>`).join('') + `<td class="mono tot">${n0(tab.total)}</td>`}</tr></tfoot></table></div>
    ${cut ? `<div class="body"><div class="note">الجدول كبير (${n0(tab.rowKeys.length)} صفاً × ${n0(tab.colKeys.length)} عموداً)؛ يُعرض أوله هنا، والإحصاءات والتصدير يشملانه كاملاً. حقل بهذا العدد من القيم لا يصلح غالباً للنشر.</div></div>` : ''}
    <div class="body fine">الحجب التكميلي هنا تقريبي: يضمن ألّا يبقى صف أو عمود بخلية محجوبة واحدة. راجع الجدول قبل النشر الرسمي، خصوصاً إن نُشرت جداول أخرى تتقاطع معه.</div></div>`;
};
CHG['safe-d'] = el => { const i = +el.dataset.i; App.safe.d[i] = el.value; if (i > 0 && el.value && App.safe.d.indexOf(el.value) !== i) { App.safe.d[i] = ''; toast('هذا الحقل مختار بالفعل.', true); } App.safe.merge = -1; keepScroll(R.safe); };
CHG['safe-k'] = el => { const k = parseInt(el.value, 10); if (isNaN(k) || k < 2 || k > 50) { toast('الحد الأدنى k بين 2 و50.', true); el.value = App.safe.k; return; } App.safe.k = k; keepScroll(R.safe); };
CHG['safe-merge'] = el => { App.safe.merge = +el.value; keepScroll(R.safe); };
ACT['safe-mode'] = el => { App.safe.mode = el.dataset.mode; keepScroll(R.safe); };
ACT['exp-safe'] = () => { const X = safeCompute(), S = App.safe, t = MF.safeTable(X.tab, X.sup, S.k);
  const state = X.as.unsafe === 0 ? 'لا خلايا دون الحد.' : S.mode === 'show' ? `تنبيه: الجدول يحتوي ${X.as.unsafe} خلية دون ${S.k} ولم تُحجب.` : `الخلايا المحجوبة تظهر بالرمز <${S.k}.`;
  exportTable('الجدول المعدّ للنشر', slug() + '-table.csv', t, state); };
