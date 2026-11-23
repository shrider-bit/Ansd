/* مِصفاة — «جولة العرض»: a six-step guided demo on the synthetic sample, then boot. */
const TOUR = [
  { view: 'intake', sel: '.intake', title: 'ثلاث طرق للدخول، ولا شيء يغادر الجهاز',
    text: 'الصق خلايا Excel، أو اسحب ملف CSV، أو جرّب بالعيّنة. الصفحة ملف واحد لا يتصل بالشبكة، فتصلح لبيانات الموظفين الفعلية. تتعرّف مِصفاة على الأعمدة من عناوينها العربية والإنجليزية ومن قيمها.' },
  { view: 'diag', sel: '#v-diag .cols-2', title: 'تشخيص في ثوانٍ بدل أيام',
    text: () => `العيّنة حصلت على ${s1(App.ctx.score.overall)} من 100. كل بُعد يجيب عن سؤال واحد، وكل ملاحظة مربوطة بقاعدة معلنة: ${App.ctx.issues.filter(i => i.sev === 'high').length} حرجة و${App.ctx.issues.filter(i => i.sev !== 'high').length} أخرى.` },
  { view: 'diag', sel: '#tablep', title: 'من الملاحظة إلى الخلية',
    before: () => { const is = App.ctx.issues.find(i => i.id === 'U1') || App.ctx.issues[0]; if (is) { App.issueFilter = is.id; App.openIssue = is.id; App.page = 0; R.diag(); } },
    text: 'اخترنا «رقم موظف مكرر». الجدول يعرض السجلات المعنية فقط والخلية محاطة بإطار. الألوان تدلّ على الخطورة، والمسافات الزائدة تظهر مخطّطة.' },
  { view: 'treat', sel: '#jump', title: 'القفزة: معالجة آمنة بنقرة',
    before: async () => { if (treatmentsNow().some(t => t.fix.safe)) await ACT['apply-safe'](); },
    text: () => `طبّقنا للتوّ ${App.ops.length} معالجة آمنة غيّرت ${n0(App.log.length)} خلية، فارتفعت الدرجة من ${s1(App.score0.overall)} إلى ${s1(App.ctx.score.overall)}. لم يُحذف سجل، وكل تغيير مدوّن ويمكن التراجع عنه. التكرار والأعمار المستحيلة لم تُمسّ: تلك قرارات بشرية.` },
  { view: 'pass', sel: '#passport', title: 'جواز يسافر مع البيانات',
    text: 'صفحة واحدة تُطبع وتُرفق بالتقرير: الدرجة قبل وبعد، ما عولج، وما بقي. بصمة الملف تربط الجواز بهذه النسخة من البيانات.' },
  { view: 'safe', sel: '#safe-stats', title: 'قبل النشر: هل يكشف الجدول عن أحد؟',
    before: () => { App.safe = defaultSafe(); R.safe(); },
    text: () => { const X = safeCompute(); return `في جدول «الجهة × فئة الدرجة» ${X.as.unsafe} خلية يقلّ عددها عن ${App.safe.k}، تكشف ${n0(X.as.people)} شخصاً. جرّب «حجب + حجب تكميلي» أو «دمج الفئات الصغيرة» وشاهد الحكم يتغيّر.`; } },
];
let tourI = -1;
function placeSpot() {
  const st = TOUR[tourI]; if (!st) return; const el = $(st.sel), spot = $('#tour .spot'); if (!el || !spot) return;
  const r = el.getBoundingClientRect(), pad = 6;
  Object.assign(spot.style, { top: (r.top - pad) + 'px', left: (r.left - pad) + 'px', width: (r.width + pad * 2) + 'px', height: (r.height + pad * 2) + 'px' });
}
async function tourShow(i) {
  tourI = i; const st = TOUR[i];
  if (App.view !== st.view) go(st.view, false);
  if (st.before) await st.before();
  const el = $(st.sel), t = $('#tour'); t.hidden = false;
  t.innerHTML = `<div class="spot"></div><div class="tcardw" role="dialog" aria-label="جولة العرض"><div class="tc">
    <div class="tch"><span class="spec">جولة العرض · <span class="mono ltr">${i + 1} / ${TOUR.length}</span></span><button class="x" data-act="tour-end" aria-label="إنهاء الجولة">×</button></div>
    <h3>${st.title}</h3><p>${esc(typeof st.text === 'function' ? st.text() : st.text)}</p>
    <div class="tcf"><div class="dots">${TOUR.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
      <div><button class="btn sm ghost" data-act="tour-prev" ${i === 0 ? 'disabled' : ''}>السابق</button> <button class="btn sm primary" data-act="tour-next" id="tour-next">${i === TOUR.length - 1 ? 'أنهِ الجولة' : 'التالي'}</button></div></div></div></div>`;
  if (el) { const r = el.getBoundingClientRect(), vh = window.innerHeight, room = vh - 230;
    const y = window.scrollY + r.top - (r.height < room ? Math.max(70, (room - r.height) / 2) : 70); window.scrollTo({ top: Math.max(0, y), behavior: 'auto' }); }
  placeSpot(); $('#tour-next').focus({ preventScroll: true });
}
ACT.tour = async el => {
  if (App.src === 'user' && !(el && el.dataset.ok)) {            // never replace the user's data without saying so
    const t = $('#tour'); t.hidden = false;
    t.innerHTML = `<div class="tcardw solo" role="dialog" aria-label="جولة العرض"><div class="tc"><div class="tch"><span class="spec">جولة العرض</span><button class="x" data-act="tour-end" aria-label="إلغاء">×</button></div>
      <h3>الجولة تعمل على العيّنة الافتراضية</h3><p>ستُستبدل البيانات المحمّلة حالياً بالعيّنة التجريبية. بياناتك لم تُحفظ في أي مكان؛ أعد لصقها أو تحميلها بعد الجولة.</p>
      <div class="tcf"><span></span><div><button class="btn sm ghost" data-act="tour-end">إلغاء</button> <button class="btn sm primary" data-act="tour" data-ok="1" id="tour-ok">ابدأ الجولة بالعيّنة</button></div></div></div></div>`;
    return;
  }
  if (App.src !== 'sample' || App.ops.length) await loadSample();
  App.issueFilter = null; App.openIssue = null; App.sevFilter = 'all'; App.dimFilter = 'all';
  tourShow(0);
};
ACT['tour-next'] = () => tourI >= TOUR.length - 1 ? ACT['tour-end']() : tourShow(tourI + 1);
ACT['tour-prev'] = () => tourI > 0 && tourShow(tourI - 1);
ACT['tour-end'] = () => { $('#tour').hidden = true; $('#tour').innerHTML = ''; tourI = -1; };
window.addEventListener('scroll', () => { if (tourI >= 0) placeSpot(); }, { passive: true });
window.addEventListener('resize', () => { if (tourI >= 0) placeSpot(); });

/* ---------- boot: open with the synthetic sample already diagnosed ---------- */
loadSample().then(() => go('intake', false));
