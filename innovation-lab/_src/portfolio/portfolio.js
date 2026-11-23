(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const short = i => i.ar.split(' — ')[0];
  const PROFILES = [
    { id: 'committee', ar: 'رأي اللجنة', w: CRITERIA.map(c => c.w) },
    { id: 'strategy', ar: 'الاستراتيجية أولاً', w: [10, 30, 10, 20, 5, 5, 5, 15] },
    { id: 'feasible', ar: 'الجدوى أولاً', w: [5, 10, 20, 5, 20, 30, 0, 10] },
    { id: 'impact', ar: 'الأثر التشغيلي أولاً', w: [5, 10, 25, 5, 30, 15, 0, 10] },
    { id: 'bold', ar: 'الجرأة أولاً', w: [30, 15, 5, 10, 5, 5, 20, 10] },
  ];
  let weights = CRITERIA.map(c => c.w);
  let showAll = false;

  const score = (idea, w) => { const t = w.reduce((a, b) => a + b, 0) || 1; return idea.s.reduce((a, v, k) => a + v * w[k], 0) / t; };
  const ranked = w => IDEAS.map(i => ({ i, sc: score(i, w) })).sort((a, b) => b.sc - a.sc || a.i.id.localeCompare(b.i.id));

  /* ---- weights panel ---- */
  $('#profiles').innerHTML = PROFILES.map(p => `<button type="button" class="pill" data-p="${p.id}" aria-pressed="${p.id === 'committee'}">${p.ar}</button>`).join('');
  $('#sliders').innerHTML = CRITERIA.map((c, k) => `
    <div class="slider">
      <label for="w-${c.id}">${c.ar}</label><output id="o-${c.id}" for="w-${c.id}">${c.w}</output>
      <input type="range" id="w-${c.id}" min="0" max="30" step="1" value="${c.w}" data-k="${k}" aria-describedby="h-${c.id}">
      <span class="hint" id="h-${c.id}">${c.hint}</span>
    </div>`).join('');
  $('#sliders').addEventListener('input', e => {
    const k = +e.target.dataset.k; weights[k] = +e.target.value; $('#o-' + CRITERIA[k].id).textContent = e.target.value;
    document.querySelectorAll('.pill[data-p]').forEach(b => b.setAttribute('aria-pressed', 'false'));
    update();
  });
  $('#profiles').addEventListener('click', e => {
    const b = e.target.closest('.pill'); if (!b) return;
    const p = PROFILES.find(x => x.id === b.dataset.p); weights = p.w.slice();
    CRITERIA.forEach((c, k) => { $('#w-' + c.id).value = weights[k]; $('#o-' + c.id).textContent = weights[k]; });
    document.querySelectorAll('.pill[data-p]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    update();
  });

  /* ---- ranking ---- */
  function renderRank(r) {
    const list = showAll ? r : r.slice(0, 16);
    $('#rank').innerHTML = list.map((x, n) => {
      const cls = n < 3 ? 'top' : (x.i.status === 'bonus' ? 'bonus' : '');
      return `<li class="${cls}" data-id="${x.i.id}" tabindex="0" role="link" aria-label="${esc(short(x.i))}، المرتبة ${n + 1}، التقييم ${x.sc.toFixed(1)}">
        <span class="pos">${n + 1}</span>
        <span><span class="name">${esc(x.i.ar)}</span><span class="track"><span class="fill" style="width:${(x.sc * 10).toFixed(1)}%"></span></span></span>
        <span class="sc">${x.sc.toFixed(1)}</span></li>`;
    }).join('');
    $('#rank-more').textContent = showAll ? 'عرض الأولى فقط' : 'عرض الترتيب كاملاً';
    const t = weights.reduce((a, b) => a + b, 0);
    $('#wsum').textContent = t ? 'تُحوَّل الأوزان تلقائياً إلى نسب من مجموعها (' + t + ').' : 'كل الأوزان صفر؛ ارفع وزناً واحداً على الأقل.';
  }
  $('#rank-more').addEventListener('click', () => { showAll = !showAll; renderRank(ranked(weights)); });
  const goIdea = id => { const el = document.getElementById('idea-' + id); if (!el) { resetFilters(); renderGrid(); return goIdea(id); } el.open = true; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.querySelector('summary').focus({ preventScroll: true }); };
  $('#rank').addEventListener('click', e => { const li = e.target.closest('li'); if (li) goIdea(li.dataset.id); });
  $('#rank').addEventListener('keydown', e => { if (e.key === 'Enter') { const li = e.target.closest('li'); if (li) goIdea(li.dataset.id); } });

  /* ---- robustness: how often is each idea in the top three across random weightings? ---- */
  function robustness() {
    let a = 20261123; const rnd = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const N = 2000, hits = Object.fromEntries(IDEAS.map(i => [i.id, 0]));
    for (let n = 0; n < N; n++) {
      const w = CRITERIA.map(() => -Math.log(1 - rnd()));           // uniform on the simplex after normalisation
      ranked(w).slice(0, 3).forEach(x => hits[x.i.id]++);
    }
    const rows = IDEAS.map(i => ({ i, p: hits[i.id] / N })).sort((x, y) => y.p - x.p).filter(x => x.p >= 0.02).slice(0, 7);
    $('#robust-bars').innerHTML = rows.map(x => `<li><span class="name">${esc(short(x.i))}</span><span class="pc">${Math.round(x.p * 100)}%</span><span class="track"><span class="fill" style="width:${(x.p * 100).toFixed(1)}%"></span></span></li>`).join('');
    const sel = IDEAS.filter(i => i.status === 'selected').map(i => ({ i, p: hits[i.id] / N })).sort((x, y) => y.p - x.p);
    const others = rows.filter(x => x.i.status !== 'selected');
    $('#robust-text').innerHTML = 'مهما تبدّلت الأوزان، ظهرت ' + sel.map(x => `«${esc(short(x.i))}» في <b class="num">${Math.round(x.p * 100)}%</b>`).join('، و')
      + ' من التوليفات ضمن الثلاث الأولى.' + (others.length ? ` أقرب المنافسين «${esc(short(others[0].i))}» بنسبة <b class="num">${Math.round(others[0].p * 100)}%</b>.` : '');
  }

  /* ---- ideas grid ---- */
  const state = { cat: '', status: '', sort: 'score', q: '' };
  const AV = { 'متاحة': 'a1', 'جزئية': 'a2', 'تتطلب جمعاً': 'a3' };
  const norm = s => String(s).replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').toLowerCase();
  $('#cat-chips').innerHTML = `<button type="button" class="pill" data-c="" aria-pressed="true">كل المجالات <span class="num">${IDEAS.length}</span></button>`
    + Object.entries(CATS).map(([k, v]) => `<button type="button" class="pill" data-c="${k}" aria-pressed="false">${v} <span class="num">${IDEAS.filter(i => i.cat === k).length}</span></button>`).join('');
  $('#cat-chips').addEventListener('click', e => { const b = e.target.closest('.pill'); if (!b) return; state.cat = b.dataset.c;
    document.querySelectorAll('#cat-chips .pill').forEach(x => x.setAttribute('aria-pressed', String(x === b))); renderGrid(); });
  $('#q').addEventListener('input', e => { state.q = e.target.value; renderGrid(); });
  $('#f-status').addEventListener('change', e => { state.status = e.target.value; renderGrid(); });
  $('#f-sort').addEventListener('change', e => { state.sort = e.target.value; renderGrid(); });
  function resetFilters() { state.cat = ''; state.status = ''; state.q = ''; $('#q').value = ''; $('#f-status').value = '';
    document.querySelectorAll('#cat-chips .pill').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.c === ''))); }
  let allOpen = false;
  $('#toggle-all').addEventListener('click', () => { allOpen = !allOpen; document.querySelectorAll('.idea').forEach(d => d.open = allOpen); $('#toggle-all').textContent = allOpen ? 'طيّ الكل' : 'فتح الكل'; });

  function renderGrid() {
    const r = ranked(weights); const pos = Object.fromEntries(r.map((x, n) => [x.i.id, n + 1])); const sc = Object.fromEntries(r.map(x => [x.i.id, x.sc]));
    const openIds = new Set([...document.querySelectorAll('.idea[open]')].map(d => d.id));
    const q = norm(state.q.trim());
    let list = IDEAS.filter(i => (!state.cat || i.cat === state.cat)
      && (!state.status || (state.status === 'built' ? (i.status === 'selected' || i.status === 'bonus') : i.status === state.status))
      && (!q || norm([i.ar, i.en, i.problem, i.users, i.innovation, i.value, i.expand].join(' ')).includes(q)));
    const key = state.sort; const ci = CRITERIA.findIndex(c => c.id === key);
    list.sort((a, b) => key === 'score' ? pos[a.id] - pos[b.id] : (b.s[ci] - a.s[ci] || pos[a.id] - pos[b.id]));
    $('#count').textContent = list.length === IDEAS.length ? `تُعرض الأفكار كلها (${IDEAS.length}).` : `تُعرض ${list.length} من ${IDEAS.length} فكرة.`;
    $('#grid').innerHTML = list.length ? list.map(i => {
      const st = STATUS[i.status]; const cls = i.status === 'selected' ? 'is-sel' : i.status === 'bonus' ? 'is-bonus' : '';
      return `<details class="idea ${cls}" id="idea-${i.id}" ${openIds.has('idea-' + i.id) || allOpen ? 'open' : ''}>
        <summary>
          <span class="pos" title="المرتبة بحسب الأوزان الحالية">${pos[i.id]}</span>
          <span><h3>${esc(i.ar)}</h3><span class="en">${esc(i.en)}</span></span>
          <span class="score">${sc[i.id].toFixed(1)}<small> /10</small></span>
          <span class="meta"><span class="chip">${CATS[i.cat]}</span><span class="chip ${st.cls}">${st.ar}</span></span>
          <span class="teaser">${esc(i.problem)}</span>
        </summary>
        <div class="body">
          <dl>
            <div><dt>المشكلة الواقعية</dt><dd>${esc(i.problem)}</dd></div>
            <div><dt>من يستخدمه</dt><dd>${esc(i.users)}</dd></div>
            <div><dt>وجه الابتكار</dt><dd>${esc(i.innovation)}</dd></div>
            <div><dt>القيمة العملية</dt><dd>${esc(i.value)}</dd></div>
            <div><dt>توافر البيانات اليوم</dt><dd><span class="avail ${AV[i.data.level]}">${i.data.level}.</span> ${esc(i.data.note)}</dd></div>
            <div><dt>آفاق التوسّع</dt><dd>${esc(i.expand)}</dd></div>
          </dl>
          <div class="bars">
            <h4>درجات اللجنة (من 10)</h4>
            ${CRITERIA.map((c, k) => `<div class="bar"><span>${c.ar}</span><b>${i.s[k]}</b><i style="--v:${i.s[k] * 10}%"></i></div>`).join('')}
            <p class="note"><b>ملاحظة اللجنة</b>${esc(i.note)}</p>
            ${i.link ? `<a class="btn small-btn open-link" href="${i.link}">افتح النموذج <span class="arr" aria-hidden="true">←</span></a>` : ''}
          </div>
        </div>
      </details>`;
    }).join('') : '<p class="lead">لا توجد فكرة تطابق التصفية الحالية. امسح البحث أو اختر «كل المجالات».</p>';
  }

  function update() { renderRank(ranked(weights)); renderGrid(); }
  $('#st-ideas').textContent = IDEAS.length;
  $('#merged-list').innerHTML = IDEAS.filter(i => i.status === 'merged').map(i => `<li><b>${esc(short(i))}</b> — ${esc(i.note)}</li>`).join('');
  update(); robustness();
})();
