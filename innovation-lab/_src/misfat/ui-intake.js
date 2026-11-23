/* مِصفاة — step 1 «الاستقبال»: paste from Excel, CSV/TSV file, synthetic sample; column mapping; rule settings. */
R.intake = () => {
  const v = $('#v-intake');
  if (!v.dataset.built) {
    v.dataset.built = '1';
    v.innerHTML = `
    <div class="vhead"><div><span class="spec">01 / الاستقبال</span><h2 id="h-intake">أحضر بياناتك، أو جرّب بالعيّنة</h2>
      <p>ثلاث طرق للدخول. في جميعها تبقى البيانات على هذا الجهاز: لا رفع، ولا خادم، ولا حفظ بعد إغلاق الصفحة.</p></div></div>
    <div class="intake">
      <div class="panel incard" id="card-paste">
        <header><h3>الصق من Excel</h3><span class="spec">CTRL+V</span></header>
        <div class="body">
          <p>حدّد الخلايا في Excel مع صف العناوين، انسخها، ثم الصقها هنا.</p>
          <textarea id="paste" rows="4" spellcheck="false" aria-label="منطقة اللصق من Excel" placeholder="الصق هنا (Ctrl+V)…&#10;رقم الموظف	تاريخ الميلاد	الجنسية	…"></textarea>
          <button class="btn" data-act="paste-run" id="btn-paste">حلّل الملصق</button>
        </div>
      </div>
      <div class="panel incard" id="card-file">
        <header><h3>ملف CSV أو TSV</h3><span class="spec ltr">.CSV .TSV .TXT</span></header>
        <div class="body">
          <label class="drop" id="drop" for="file"><b>اسحب الملف إلى هنا أو اختره</b><span>يُكتشف الفاصل (فاصلة، فاصلة منقوطة، جدولة) والترميز (UTF-8 أو Windows-1256) تلقائياً.</span></label>
          <input type="file" id="file" accept=".csv,.tsv,.txt,text/csv,text/plain" data-chg="file">
          <p class="fine">ملفات ‎.xlsx‎ غير مدعومة في هذا النموذج. الطريق الأقصر: افتح الملف في Excel، انسخ الخلايا، والصقها في الخانة المجاورة.</p>
        </div>
      </div>
      <div class="panel incard" id="card-sample">
        <header><h3>العيّنة التجريبية</h3><span class="spec">SYNTHETIC</span></header>
        <div class="body">
          <p>1,200 سجل افتراضي لست جهات بأسماء محايدة، زُرعت فيها عمداً عيوب واقعية من كل نوع: تكرار، تواريخ هجرية وأرقام Excel، صيغ متعددة للجنسية، رواتب شاذة.</p>
          <p class="fine">لا تمثّل أي جهة أو موظف حقيقي.</p>
          <button class="btn" data-act="sample" id="btn-sample">حمّل العيّنة من جديد</button>
        </div>
      </div>
    </div>
    <div class="panel" id="map-panel"></div>
    <details class="panel settings" id="settings"><summary><h3>إعدادات القواعد</h3><span class="hint">سن التقاعد، سلّم الدرجات، تنسيق التاريخ المعتمد، تاريخ المرجع</span></summary><div class="body" id="settings-body"></div></details>
    <div class="next"><span>المطابقة صحيحة؟</span><button class="btn primary lg" data-act="go" data-view="diag">إلى التشخيص <span aria-hidden="true">←</span></button></div>`;
    const ta = $('#paste');
    ta.addEventListener('paste', e => { const text = (e.clipboardData || window.clipboardData).getData('text'); if (text && /\n/.test(text.trim())) { e.preventDefault(); runPaste(text); } });
    const drop = $('#drop');
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', e => { const f = e.dataTransfer && e.dataTransfer.files[0]; if (f) readFile(f); });
  }
  renderMapping(); renderSettings();
};

async function runPaste(text) {
  if (!text || !text.trim()) return toast('الخانة فارغة. انسخ الخلايا من Excel ثم الصقها.', true);
  const t = MF.toTable(text);
  if (await loadTable(t, { src: 'user', name: 'بيانات ملصقة من الحافظة', enc: 'لصق مباشر', delim: MF.delimName(t.delim) })) {
    $('#paste').value = ''; toast(`قُرئ ${n0(t.rows.length)} سجلاً و${t.headers.length} عموداً من الحافظة. راجع مطابقة الأعمدة.`);
    $('#map-panel').scrollIntoView({ block: 'nearest' });
  }
}
ACT['paste-run'] = () => runPaste($('#paste').value);
ACT.sample = async () => { await loadSample(); toast('حُمّلت العيّنة التجريبية الافتراضية وأُعيد تشخيصها.'); };
CHG.file = el => { if (el.files[0]) readFile(el.files[0]); el.value = ''; };
async function readFile(file) {
  if (/\.(xlsx|xlsm|xls|xlsb)$/i.test(file.name)) return toast('ملفات Excel الثنائية غير مدعومة هنا. افتح الملف، انسخ الخلايا، والصقها في خانة «الصق من Excel».', true);
  if (file.size > 80 * 1024 * 1024) return toast('الملف أكبر من 80 ميغابايت؛ قسّمه أو الصق جزءاً منه.', true);
  try {
    const buf = await file.arrayBuffer(); const head = new Uint8Array(buf.slice(0, 4));
    if (head[0] === 0x50 && head[1] === 0x4B) return toast('هذا ملف مضغوط (غالباً xlsx) وليس نصاً. انسخ الخلايا من Excel والصقها.', true);
    const d = MF.decode(buf), t = MF.toTable(d.text);
    if (await loadTable(t, { src: 'user', name: file.name, enc: d.encoding, delim: MF.delimName(t.delim) })) { toast(`قُرئ «${file.name}»: ${n0(t.rows.length)} سجلاً، الترميز ${d.encoding}.`); $('#map-panel').scrollIntoView({ block: 'nearest' }); }
  } catch (e) { toast('تعذّرت قراءة الملف: ' + e.message, true); }
}

function confText(f) {
  if (App.map[f.id] == null) return ['—', 0, 'none'];
  const c = App.conf[f.id] || 0, how = App.how[f.id];
  if (how === 'manual') return ['اختيارك', 1, 'ok'];
  if (how === 'values') return ['استدلال من القيم', c, 'warn'];
  return [c >= 0.99 ? 'العنوان مطابق' : 'العنوان مشابه', c, c >= 0.8 ? 'ok' : 'warn'];
}
function renderMapping() {
  const used = new Set(Object.values(App.map));
  const un = App.headers.map((h, i) => ({ h, i })).filter(x => !used.has(x.i));
  const low = MF.FIELDS.filter(f => App.map[f.id] != null && confText(f)[2] === 'warn').length;
  const missing = MF.FIELDS.filter(f => App.map[f.id] == null);
  $('#map-panel').innerHTML = `<header><h3>مطابقة الأعمدة</h3><span class="hint">تعرّفنا على ${mappedCount()} من ${MF.FIELDS.length} حقلاً معيارياً${low ? `، ${low} منها تستحق نظرة` : ''}. صحّح أي مطابقة من القائمة.</span></header>
    <div class="scroll"><table class="maptable"><thead><tr><th>الحقل المعياري</th><th>العمود في بياناتك</th><th>الثقة</th><th>أمثلة من القيم</th></tr></thead><tbody>
    ${MF.FIELDS.map(f => { const c = App.map[f.id], [txt, cf, k] = confText(f), p = c != null ? App.profiles[c] : null;
      return `<tr class="${c == null ? 'unm' : ''}"><th scope="row">${f.ar}</th>
        <td><select id="map-${f.id}" data-chg="map" data-field="${f.id}" aria-label="العمود المقابل لحقل ${f.ar}"><option value="">— غير موجود —</option>${App.headers.map((h, i) => `<option value="${i}" ${c === i ? 'selected' : ''}>${esc(h)}</option>`).join('')}</select></td>
        <td class="conf"><div class="gauge"><i class="${k === 'warn' ? 'warn' : ''}" style="width:${Math.round(cf * 100)}%"></i></div><span class="${k}">${txt}</span></td>
        <td class="d ex">${p ? p.examples.map(x => `<span>${esc(x)}</span>`).join('') : '<span class="na">لن تُفحص قواعد هذا الحقل</span>'}</td></tr>`; }).join('')}
    </tbody></table></div>
    <div class="body mapfoot">${un.length ? `<div><b>أعمدة غير مطابَقة تبقى كما هي دون أي تغيير:</b> ${un.map(x => `<span class="chip">${esc(x.h)}</span>`).join(' ')}</div>` : ''}
      ${missing.length ? `<div class="fine">حقول غير موجودة في ملفك (${missing.map(f => f.ar).join('، ')}): تُتخطّى قواعدها ولا تؤثر في الدرجة.</div>` : ''}</div>`;
}
CHG.map = async el => {
  const f = el.dataset.field, v = el.value === '' ? null : +el.value;
  if (v == null) { delete App.map[f]; delete App.conf[f]; delete App.how[f]; }
  else { for (const k in App.map) if (App.map[k] === v && k !== f) { delete App.map[k]; delete App.conf[k]; delete App.how[k]; toast(`العمود «${App.headers[v]}» نُقل من «${MF.field(k).ar}» إلى «${MF.field(f).ar}».`); }
    App.map[f] = v; App.conf[f] = 1; App.how[f] = 'manual'; }
  App.safe = defaultSafe(); await recompute({ baseline: true });
};

function renderSettings() {
  const S = App.settings, num = (id, label, val, min, max) => `<label>${label}<input type="number" id="set-${id}" value="${val}" min="${min}" max="${max}" inputmode="numeric"></label>`;
  $('#settings-body').innerHTML = `<div class="setgrid">
      ${num('retAge', 'سن التقاعد', S.retAge, 40, 80)}${num('minAge', 'أدنى سن للتوظيف', S.minAge, 14, 30)}
      ${num('gradeMin', 'أدنى درجة في السلّم', S.gradeMin, 0, 50)}${num('gradeMax', 'أعلى درجة في السلّم', S.gradeMax, 1, 60)}
      ${num('mgrGrade', 'بداية الدرجات الإدارية', S.mgrGrade, 1, 60)}
      <label>تنسيق التاريخ المعتمد<select id="set-dateFmt"><option value="dmy" ${S.dateFmt === 'dmy' ? 'selected' : ''}>DD/MM/YYYY</option><option value="ymd" ${S.dateFmt === 'ymd' ? 'selected' : ''}>YYYY-MM-DD</option></select></label>
      <label>تاريخ المرجع لحساب الأعمار<input type="date" id="set-ref" value="${S.ref.y}-${MF.pad2(S.ref.m)}-${MF.pad2(S.ref.d)}"></label>
    </div>
    <div class="setfoot"><button class="btn" data-act="settings-apply">طبّق الإعدادات وأعد التشخيص</button><button class="btn ghost" data-act="settings-reset">استعادة القيم الافتراضية</button>
      <span class="fine">الافتراضي: التقاعد عند 60 سنة، سلّم من 1 إلى 18، والتاريخ بصيغة يوم/شهر/سنة.</span></div>`;
}
ACT['settings-apply'] = async () => {
  const g = id => parseInt($('#set-' + id).value, 10), S = App.settings, ref = $('#set-ref').value.split('-').map(Number);
  const nx = { retAge: g('retAge'), minAge: g('minAge'), gradeMin: g('gradeMin'), gradeMax: g('gradeMax'), mgrGrade: g('mgrGrade') };
  if (Object.values(nx).some(isNaN) || nx.gradeMin >= nx.gradeMax || nx.minAge >= nx.retAge || ref.length !== 3 || ref.some(isNaN)) return toast('قيم غير صالحة: تأكد أن أدنى درجة أقل من أعلاها وأن أدنى سن أقل من سن التقاعد.', true);
  Object.assign(S, nx, { dateFmt: $('#set-dateFmt').value, ref: { y: ref[0], m: ref[1], d: ref[2] } });
  await recompute({ baseline: true }); toast('طُبّقت الإعدادات وأُعيد التشخيص.');
};
ACT['settings-reset'] = async () => { App.settings = MF.defaultSettings(); await recompute({ baseline: true }); toast('استُعيدت الإعدادات الافتراضية.'); };
