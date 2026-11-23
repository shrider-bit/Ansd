/* بيّنة — رسوم SVG صغيرة مكتوبة يدوياً. الألوان عبر أصناف CSS (f-* للتعبئة، s-* للحدّ). */
(() => {
  const n = CGB.num;
  const svg = (w, h, inner, label, cls = '') => `<svg class="ch ${cls}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">${inner}</svg>`;
  const C = BY.ch = {};

  // 1) عبء العمل: أعمدة السنوات (الأقدم يميناً) + إسقاط 2027 + خط طاقة الكادر الحالي بالمعدل المعياري
  C.workload = (q, a) => {
    if (!a.hasW) return `<div class="ch-empty">لم ترد بيانات عبء العمل من الجهة</div>`;
    const v = [...q.workload.volume, a.proj], cap = a.avail * a.std, max = Math.max(...v, cap) * 1.12, W = 232, H = 104, b = 30, gap = 26, x0 = W - 10;
    const y = t => 84 - t / max * 68; let s = '';
    v.forEach((t, i) => { const x = x0 - (i + 1) * b - i * gap;
      s += `<rect x="${x}" y="${y(t)}" width="${b}" height="${84 - y(t)}" class="${i === 3 ? 'f-hatch s-maroon' : 'f-slate'}" ${i === 3 ? 'stroke-width="1.2" stroke-dasharray="3 2"' : ''}/>`
        + `<text x="${x + b / 2}" y="${y(t) - 4}" text-anchor="middle" class="t-val">${n(Math.round(t))}</text>`
        + `<text x="${x + b / 2}" y="97" text-anchor="middle" class="t-ax${i === 3 ? ' t-em' : ''}">${2024 + i}</text>`; });
    s += `<line x1="6" x2="${W - 6}" y1="${y(cap)}" y2="${y(cap)}" class="s-ink" stroke-width="1" stroke-dasharray="1.5 3"/>`
      + `<line x1="6" x2="${W - 6}" y1="84" y2="84" class="s-rule" stroke-width="1"/>`;
    return svg(W, H, s, 'حجم العمل السنوي وإسقاط 2027 مقابل طاقة الكادر');
  };

  // 2) المقارنة المرجعية: شريط نقاط لإنتاجية الجهات المماثلة، الوسيط، وموضع الوحدة
  C.strip = (q, a) => {
    const pts = [...q.bench.peers, a.med, ...(a.own ? [a.own] : [])], lo = Math.min(...pts), hi = Math.max(...pts), pad = (hi - lo) * .12 || 1;
    const W = 232, H = 62, x = t => 14 + (t - (lo - pad)) / (hi - lo + 2 * pad) * (W - 28); let s = `<line x1="10" x2="${W - 10}" y1="34" y2="34" class="s-rule" stroke-width="1"/>`;
    q.bench.peers.forEach(p => { s += `<circle cx="${x(p)}" cy="34" r="4.2" class="f-sheet s-ink3" stroke-width="1.2"/>`; });
    s += `<line x1="${x(a.med)}" x2="${x(a.med)}" y1="18" y2="50" class="s-brass" stroke-width="2"/><text x="${x(a.med)}" y="12" text-anchor="middle" class="t-ax">${n(a.med, a.med < 100 ? 1 : 0)}</text>`;
    if (a.own) { const xo = x(a.own); s += `<path d="M${xo} 26l7 8-7 8-7-8z" class="f-maroon"/><text x="${xo}" y="58" text-anchor="middle" class="t-val t-em">${n(a.own, a.own < 100 ? 1 : 0)}</text>`; }
    return svg(W, H, s, 'إنتاجية الوحدة مقابل الجهات المماثلة');
  };

  // 3 و5) مربعات/دوائر عدّ: المستخدَم مملوء، المتاح غير المستخدَم مفرَّغ
  C.units = (total, used, round, half = 0) => {
    if (!total) return `<div class="ch-empty">${round ? 'لا مرشحين مناسبين حالياً' : 'لا شواغر معتمدة في المجموعة'}</div>`;
    const show = Math.min(total, 36), per = 12, sz = 14, g = 5, W = per * (sz + g), H = Math.ceil(show / per) * (sz + g) + 2; let s = '';
    for (let i = 0; i < show; i++) { const cx = W - (i % per + 1) * (sz + g) + g, cy = Math.floor(i / per) * (sz + g) + 1;
      const cls = i < used ? 'f-slate s-slate' : i < half ? 'f-slate-t s-slate' : 'f-sheet s-ink3';
      s += round ? `<circle cx="${cx + sz / 2}" cy="${cy + sz / 2}" r="${sz / 2 - .6}" class="${cls}" stroke-width="1.2"/>` : `<rect x="${cx}" y="${cy}" width="${sz}" height="${sz}" class="${cls}" stroke-width="1.2"/>`; }
    return svg(W, H, s, `${used} من ${total}`, 'ch-units') + (total > show ? `<span class="ch-more">+${n(total - show)}</span>` : '');
  };

  // 4) المغادرون: تقاعد 2027-2029 (سنة الخطة مُبرَزة ويُضاف إليها الترك المتوقع)
  C.departures = (q) => {
    const r = q.departures.ret, at = q.departures.attrExp, max = Math.max(r[0] + at, r[1], r[2], 1) * 1.25, W = 232, H = 96, b = 40, gap = 26, x0 = W - 20;
    const y = t => 76 - t / max * 60; let s = '';
    r.forEach((t, i) => { const x = x0 - (i + 1) * b - i * gap, top = i === 0 ? t + at : t;
      s += `<rect x="${x}" y="${y(t)}" width="${b}" height="${76 - y(t)}" class="${i === 0 ? 'f-slate' : 'f-ink4'}"/>`;
      if (i === 0 && at) s += `<rect x="${x}" y="${y(t + at)}" width="${b}" height="${y(t) - y(t + at)}" class="f-slate-t s-slate" stroke-width="1"/>`;
      s += `<text x="${x + b / 2}" y="${y(top) - 4}" text-anchor="middle" class="t-val${i === 0 ? ' t-em' : ''}">${n(top)}</text><text x="${x + b / 2}" y="90" text-anchor="middle" class="t-ax${i === 0 ? ' t-em' : ''}">${2027 + i}</text>`; });
    s += `<line x1="6" x2="${W - 6}" y1="76" y2="76" class="s-rule" stroke-width="1"/>`;
    return svg(W, H, s, 'المغادرون المتوقعون 2027 إلى 2029');
  };

  // 7) حلقة نسبة قابلية الأتمتة
  C.ring = (share, active) => { const r = 26, c = 2 * Math.PI * r;
    return svg(72, 72, `<circle cx="36" cy="36" r="${r}" fill="none" class="s-rule2" stroke-width="9"/><circle cx="36" cy="36" r="${r}" fill="none" class="${active ? 's-slate' : 's-ink4'}" stroke-width="9" stroke-dasharray="${c * share} ${c}" transform="rotate(-90 36 36)"/><text x="36" y="40" text-anchor="middle" class="t-big">${Math.round(share * 100)}%</text>`, 'نسبة العمل القابل للأتمتة', 'ch-ring'); };

  // 8) سجل الاستغلال: المعتمد مقابل المشغول في الدورتين السابقتين
  C.track = (t) => { const max = Math.max(...t.cycles.map(c => c.approved)) * 1.2, W = 232, H = 96, b = 26, y = v => 76 - v / max * 60; let s = '';
    t.cycles.forEach((c, i) => { const x = W - 34 - (i + 1) * 2 * b - i * 44;
      s += `<rect x="${x + b}" y="${y(c.approved)}" width="${b}" height="${76 - y(c.approved)}" class="f-sheet s-ink3" stroke-width="1.2"/><rect x="${x}" y="${y(c.filled)}" width="${b}" height="${76 - y(c.filled)}" class="f-brass"/>`
        + `<text x="${x + b * 1.5}" y="${y(c.approved) - 4}" text-anchor="middle" class="t-val">${n(c.approved)}</text><text x="${x + b / 2}" y="${y(c.filled) - 4}" text-anchor="middle" class="t-val t-em">${n(c.filled)}</text><text x="${x + b}" y="90" text-anchor="middle" class="t-ax">${c.year}</text>`; });
    s += `<line x1="6" x2="${W - 6}" y1="76" y2="76" class="s-rule" stroke-width="1"/>`;
    return svg(W, H, s, 'الوظائف المعتمدة والمشغولة في الدورتين السابقتين'); };

  // منحنى القيمة الحدّية للمحفظة مع خط القطع
  C.curve = (al, mode) => {
    const W = 760, H = 250, L = 46, Rr = 14, T = 16, B = 34, P = al.posts; if (!P.length) return '<div class="ch-empty">لا وظائف موصى بها</div>';
    const tot = mode === 'posts' ? P.length : al.totalCost, used = mode === 'posts' ? al.usedPosts : al.usedCost, ymax = P[0].density * 1.08;
    const x = v => (W - L) - v / tot * (W - L - Rr), y = v => T + (1 - v / ymax) * (H - T - B);   // RTL: zero on the right, like the ceiling slider
    let cum = 0, d = `M${x(0)} ${y(P[0].density)}`, area = `M${x(0)} ${y(0)}L${x(0)} ${y(P[0].density)}`;
    P.forEach((p, i) => { const step = mode === 'posts' ? 1 : p.cost, x1 = x(cum + step);
      d += `L${x1} ${y(p.density)}`; if (i + 1 < P.length) d += `L${x1} ${y(P[i + 1].density)}`;
      if (i < al.cut) { area += `L${x1} ${y(p.density)}`; if (i + 1 < al.cut) area += `L${x1} ${y(P[i + 1].density)}`; else area += `L${x1} ${y(0)}`; }
      cum += step; });
    let s = '';
    for (let i = 0; i <= 4; i++) { const v = ymax / 1.08 * i / 4; s += `<line x1="${Rr}" x2="${W - L}" y1="${y(v)}" y2="${y(v)}" class="s-rule2" stroke-width="1"/><text x="${W - L + 6}" y="${y(v) + 3}" text-anchor="start" class="t-ax">${n(v, 0)}</text>`; }
    for (let i = 0; i <= 5; i++) { const v = tot * i / 5; s += `<text x="${x(v)}" y="${H - 14}" text-anchor="middle" class="t-ax">${mode === 'posts' ? n(Math.round(v)) : n(v / 1e6, 0) + 'M'}</text>`; }
    if (al.cut > 0) s += `<path d="${area}Z" class="f-maroon-t"/>`;
    s += `<path d="${d}" fill="none" class="s-ink" stroke-width="1.6" stroke-linejoin="round"/>`;
    s += `<line x1="${x(used)}" x2="${x(used)}" y1="${T - 6}" y2="${H - B}" class="s-maroon" stroke-width="2" stroke-dasharray="5 3"/><circle cx="${x(used)}" cy="${y(al.cutDensity || 0)}" r="4.5" class="f-maroon"/>`;
    return svg(W, H, s, 'منحنى القيمة الحدّية وخط القطع', 'ch-wide');
  };

  // اتساق القرارات: ما أيّدته الأدلة (أفقي) مقابل ما اعتُمد (رأسي)
  C.scatter = (pts) => {
    const W = 420, H = 330, L = 44, Rr = 14, T = 14, B = 36, band = BY.RULES.consistencyBand;
    const x = v => L + Math.min(1.05, v) / 1.05 * (W - L - Rr), y = v => T + (1 - Math.min(1.05, v) / 1.05) * (H - T - B); let s = '';
    s += `<path d="M${x(0)} ${y(band)}L${x(1 - band)} ${y(1)}L${x(1)} ${y(1)}L${x(1)} ${y(1 - band)}L${x(band)} ${y(0)}L${x(0)} ${y(0)}Z" class="f-pine-t"/>`;
    for (let i = 0; i <= 4; i++) { const v = i / 4; s += `<line x1="${L}" x2="${W - Rr}" y1="${y(v)}" y2="${y(v)}" class="s-rule2" stroke-width="1"/><text x="${L - 6}" y="${y(v) + 3}" text-anchor="end" class="t-ax">${v * 100}%</text><text x="${x(v)}" y="${H - 16}" text-anchor="middle" class="t-ax">${v * 100}%</text>`; }
    s += `<line x1="${x(0)}" y1="${y(0)}" x2="${x(1)}" y2="${y(1)}" class="s-pine" stroke-width="1.2" stroke-dasharray="4 3"/>`;
    pts.forEach(p => { const cx = x(p.x), cy = y(p.y), cls = p.out ? 'f-maroon s-maroon' : 'f-sheet s-ink';
      const shape = p.grade === 'strong' ? `<circle cx="${cx}" cy="${cy}" r="5.5"` : p.grade === 'medium' ? `<rect x="${cx - 5}" y="${cy - 5}" width="10" height="10"` : `<path d="M${cx} ${cy - 6.5}l6 11h-12z"`;
      s += `<g class="pt ${p.out ? 'pt-out' : ''}" data-act="open" data-id="${p.id}" tabindex="0" role="button" aria-label="فتح الطلب">${p.out ? `<circle cx="${cx}" cy="${cy}" r="11" class="f-none s-maroon" stroke-width="1" stroke-dasharray="2 2"/>` : ''}${shape} class="${cls}" stroke-width="1.5"/></g>`; });
    return svg(W, H, s, 'اتساق القرارات', 'ch-scatter');
  };

  // مقياس قوة الأدلة: أربع شرائح
  C.meter = (a, withScore) => { const lv = { missing: 0, weak: 1, medium: 2, strong: 3 }[a.grade];
    return `<span class="meter g-${a.grade}" title="قوة الأدلة ${a.score} من 100"><i class="${lv >= 1 ? 'on' : ''}"></i><i class="${lv >= 2 ? 'on' : ''}"></i><i class="${lv >= 3 ? 'on' : ''}"></i><b>${BY.GRADES[a.grade]}</b>${withScore ? `<em>${a.score}</em>` : ''}</span>`; };

  // شريط «المطلوب ← الموصى به» في صف الطلب
  C.reqbar = (a, max) => { const w = Math.max(22, Math.sqrt(a.R / max) * 100);
    return `<span class="reqbar" style="--w:${w.toFixed(1)}%"><span class="rb-track"><i class="rb-new" style="width:${a.N / a.R * 100}%"></i><i class="rb-cov" style="width:${a.covered / a.R * 100}%"></i></span></span>`; };
})();
