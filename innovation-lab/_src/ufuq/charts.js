/* أُفُق — الرسوم (hand-written SVG / Canvas). Time runs right → left: 2026 on the right, 2040 on the left. */
const UFC = (() => {
  'use strict';
  const E = UFE, NY = E.NY, NA = E.NA;
  const ltr = s => '⁦' + s + '⁩';                     // isolate numbers so signs/units keep their order in RTL
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // physical anchor → SVG text-anchor under direction: rtl
  const ANCH = { right: 'start', left: 'end', mid: 'middle' };
  const txt = (x, y, s, a = 'mid', cls = '') => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${ANCH[a]}" class="${cls}">${esc(s)}</text>`;

  function niceTicks(lo, hi, n = 4) {
    const span = (hi - lo) || 1, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw) || 10 * mag;
    const out = []; for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-6; v += step) out.push(+v.toFixed(10));
    return out;
  }

  /* ---------- horizon chart ----------
     cfg: { lines:[{v, cls, band:{lo,hi}, area}], fmt, year, onYear, bench:{v,label}, zero, minSpan } */
  function horizon(host, cfg) {
    host._cfg = cfg;
    const W = Math.max(280, host.clientWidth), small = W < 620, H = small ? 250 : 330;
    const pr = small ? 44 : 56, pl = small ? 52 : 70, pt = 30, pb = 30;
    const iw = W - pr - pl, ih = H - pt - pb, step = iw / (NY - 1);
    const X = i => W - pr - i * step;
    let lo = Infinity, hi = -Infinity;
    for (const l of cfg.lines) {
      for (let i = 0; i < NY; i++) { lo = Math.min(lo, l.v[i], l.band ? l.band.lo[i] : Infinity); hi = Math.max(hi, l.v[i], l.band ? l.band.hi[i] : -Infinity); }
    }
    if (cfg.bench) { lo = Math.min(lo, cfg.bench.v); hi = Math.max(hi, cfg.bench.v); }
    if (cfg.zero) lo = Math.min(lo, 0);
    const span = Math.max(hi - lo, cfg.minSpan || 0, Math.abs(hi) * .02 || 1); const mid = (hi + lo) / 2;
    lo = cfg.zero && lo === 0 ? 0 : mid - span * .58; hi = mid + span * .58; if (cfg.zero && lo < 0 && mid - span / 2 >= 0) lo = 0;
    const Y = v => pt + ih - (v - lo) / (hi - lo) * ih;
    const path = v => Array.from(v, (d, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(d).toFixed(1)).join('');
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(cfg.label || '')}">
      <defs>
        <linearGradient id="hzArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2B46B" stop-opacity=".22"/><stop offset="1" stop-color="#F2B46B" stop-opacity="0"/></linearGradient>
        <linearGradient id="hzAreaB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86BCCB" stop-opacity=".16"/><stop offset="1" stop-color="#86BCCB" stop-opacity="0"/></linearGradient>
        <filter id="hzGlow" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>`;
    for (const t of niceTicks(lo, hi, small ? 3 : 4)) {
      const y = Y(t); if (y < pt - 2 || y > pt + ih + 2) continue;
      s += `<line class="hz-grid" x1="${pl}" x2="${W - pr}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/>` + txt(W - pr + 8, y + 4, ltr(cfg.fmt(t)), 'right', 'hz-tick');
    }
    for (let i = 0; i < NY; i++) {
      const every = small ? 2 : 1; if (i % every && i !== NY - 1) continue; if (small && i === NY - 2) continue;
      s += txt(X(i), H - 9, ltr(String(E.Y0 + i)), 'mid', 'hz-year' + (i === cfg.year ? ' on' : ''));
    }
    if (cfg.bench) {
      const y = Y(cfg.bench.v);
      s += `<line class="hz-bench" x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}"/>` + txt(W - pr - 6, y - 6, cfg.bench.label, 'right', 'hz-benchl');
    }
    // bands, then areas, then lines (scenario last so it sits on top)
    for (const l of cfg.lines) if (l.band) {
      let d = ''; for (let i = 0; i < NY; i++) d += (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(l.band.hi[i]).toFixed(1);
      for (let i = NY - 1; i >= 0; i--) d += 'L' + X(i).toFixed(1) + ' ' + Y(l.band.lo[i]).toFixed(1);
      s += `<path class="hz-band ${l.cls}" d="${d}Z"/>`;
    }
    for (const l of cfg.lines) if (l.area) s += `<path class="hz-area" fill="url(#${l.cls === 'scn' ? 'hzArea' : 'hzAreaB'})" d="${path(l.v)}L${X(NY - 1).toFixed(1)} ${pt + ih}L${X(0).toFixed(1)} ${pt + ih}Z"/>`;
    for (const l of cfg.lines) s += `<path class="hz-line ${l.cls}" d="${path(l.v)}"${l.cls === 'scn' ? ' filter="url(#hzGlow)"' : ''}/>`;
    // end-of-horizon labels (left edge), pushed apart so they never collide
    const ends = cfg.lines.filter(l => !l.noEnd).map(l => ({ l, y: Y(l.v[NY - 1]) })).sort((a, b) => a.y - b.y);
    for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 15) ends[k].y = ends[k - 1].y + 15;
    for (const e of ends) {
      s += `<circle class="hz-end ${e.l.cls}" cx="${X(NY - 1).toFixed(1)}" cy="${Y(e.l.v[NY - 1]).toFixed(1)}" r="3.4"/>` + txt(X(NY - 1) - 9, e.y + 4, ltr(cfg.fmt(e.l.v[NY - 1])), 'left', 'hz-endl ' + e.l.cls);
    }
    // scrubber
    const sx = X(cfg.year);
    s += `<g class="hz-scrub"><line x1="${sx}" x2="${sx}" y1="${pt - 8}" y2="${pt + ih}"/><path d="M${sx - 6} ${pt - 16}h12v7l-6 6-6-6z"/>`;
    for (const l of cfg.lines) s += `<circle class="${l.cls}" cx="${sx}" cy="${Y(l.v[cfg.year]).toFixed(1)}" r="4.2"/>`;
    s += '</g></svg>';
    host.innerHTML = s;
    if (!host._bound) {
      host._bound = true;
      const at = ev => {
        const c = host._cfg, r = host.getBoundingClientRect(), w = Math.max(280, host.clientWidth), sm = w < 620;
        const p_r = sm ? 44 : 56, p_l = sm ? 52 : 70, st = (w - p_r - p_l) / (NY - 1);
        const i = Math.max(0, Math.min(NY - 1, Math.round((w - p_r - (ev.clientX - r.left)) / st)));
        if (i !== c.year && c.onYear) c.onYear(i);
      };
      let drag = false;
      host.addEventListener('pointerdown', ev => { drag = true; try { host.setPointerCapture(ev.pointerId); } catch (e) {} at(ev); });
      host.addEventListener('pointermove', ev => { if (drag) at(ev); });
      ['pointerup', 'pointercancel'].forEach(n => host.addEventListener(n, () => { drag = false; }));
    }
  }

  /* ---------- age pyramid (persistent DOM so bars morph between years) ----------
     cfg: { q, n, q0, n0, retAge, key }  — Qataris on the right, non-Qataris on the left, oldest at the top */
  function pyramid(host, cfg) {
    const W = Math.max(260, host.clientWidth), rowH = 6, top = 26, gut = 30;
    const H = top + NA * rowH + 8, cx = W / 2, half = (W - gut) / 2 - 6;
    const sig = W + '|' + cfg.key;
    let max = 0; for (let a = 0; a < NA; a++) max = Math.max(max, cfg.q0[a], cfg.n0[a], cfg.q[a], cfg.n[a]);
    if (host._sig !== sig || !host._max || max > host._max || max < host._max * .55) {
      host._sig = sig; host._max = max * 1.12;
      const yA = a => top + (NA - 1 - a) * rowH;
      let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="الهرم العمري">`;
      s += txt(W - 4, 13, 'قطريون', 'right', 'py-h q') + txt(4, 13, 'غير قطريين', 'left', 'py-h n');
      for (let a = 0; a < NA; a++) {
        const age = E.A0 + a;
        if (age % 5 === 0) s += txt(cx, yA(a) + rowH - .5, ltr(String(age)), 'mid', 'py-age');
        s += `<rect class="py-q" data-a="${a}" x="${cx + gut / 2}" y="${yA(a) + .6}" width="${half}" height="${rowH - 1.2}"/>`;
        s += `<rect class="py-n" data-a="${a}" x="${cx - gut / 2 - half}" y="${yA(a) + .6}" width="${half}" height="${rowH - 1.2}"/>`;
      }
      // ghost outline of the base year
      let dq = '', dn = '';
      for (let a = 0; a < NA; a++) {
        const wq = cfg.q0[a] / host._max * half, wn = cfg.n0[a] / host._max * half, y0 = yA(a) + rowH, y1 = yA(a);
        dq += `${a ? 'L' : 'M'}${(cx + gut / 2 + wq).toFixed(1)} ${y0}L${(cx + gut / 2 + wq).toFixed(1)} ${y1}`;
        dn += `${a ? 'L' : 'M'}${(cx - gut / 2 - wn).toFixed(1)} ${y0}L${(cx - gut / 2 - wn).toFixed(1)} ${y1}`;
      }
      s += `<path class="py-ghost" d="${dq}"/><path class="py-ghost" d="${dn}"/>`;
      s += `<g class="py-ret"><line x1="4" x2="${W - 4}" y1="0" y2="0"/><text x="${W - 4}" y="-4" text-anchor="start"></text></g></svg>`;
      host.innerHTML = s;
      host._q = host.querySelectorAll('.py-q'); host._n = host.querySelectorAll('.py-n'); host._ret = host.querySelector('.py-ret');
      host._yA = yA;
    }
    const m = host._max;
    for (let a = 0; a < NA; a++) {
      host._q[a].style.transform = `scaleX(${Math.min(1, cfg.q[a] / m).toFixed(4)})`;
      host._n[a].style.transform = `scaleX(${Math.min(1, cfg.n[a] / m).toFixed(4)})`;
    }
    const ry = host._yA(cfg.retAge - E.A0) + rowH;
    host._ret.style.transform = `translateY(${ry}px)`;
    host._ret.querySelector('text').textContent = 'سن التقاعد ' + ltr(String(cfg.retAge));
  }

  /* ---------- family × year heatmap (HTML grid) ----------
     cfg: { rows:[{i, label, v[NY]}], year, fam, onCell(i, t) } — v = gap ÷ demand (positive = shortage) */
  function heatColor(v) {
    const a = Math.min(1, Math.abs(v) / .10);
    return v >= 0 ? `rgba(226, 84, 120, ${(.08 + a * .78).toFixed(3)})` : `rgba(134, 188, 203, ${(.08 + a * .7).toFixed(3)})`;
  }
  function heatmap(host, cfg) {
    host._cfg = cfg;
    let s = '<div class="hm" role="grid" aria-label="العجز والفائض حسب المجموعة الوظيفية والسنة"><div class="hm-row hm-head"><span></span>';
    for (let t = 0; t < NY; t++) s += `<span class="hm-y${t === cfg.year ? ' on' : ''}" data-t="${t}">${t % 2 === 0 ? ltr(String(E.Y0 + t).slice(2)) : ''}</span>`;
    s += '</div>';
    for (const r of cfg.rows) {
      s += `<div class="hm-row${r.i === cfg.fam ? ' sel' : ''}" role="row"><button type="button" class="hm-lab" data-f="${r.i}" title="تصفية الرسوم على هذه المجموعة">${esc(r.label)}</button>`;
      for (let t = 0; t < NY; t++) {
        const v = r.v[t];
        s += `<span class="hm-c${t === cfg.year ? ' on' : ''}" role="gridcell" data-f="${r.i}" data-t="${t}" style="background:${heatColor(v)}"><b>${ltr((v * 100).toFixed(Math.abs(v) < .0995 ? 1 : 0))}</b></span>`;
      }
      s += '</div>';
    }
    s += `</div><div class="hm-legend"><span>فائض</span><i style="background:linear-gradient(to left, rgba(134,188,203,.78), rgba(134,188,203,.08), rgba(226,84,120,.08), rgba(226,84,120,.86))"></i><span>عجز</span><em>النسبة من الطلب (%) · اضغط على مجموعة لتصفية الرسوم، أو على خلية للانتقال إلى سنتها</em></div>`;
    host.innerHTML = s;
    if (!host._bound) {
      host._bound = true;
      host.addEventListener('click', ev => {
        const el = ev.target.closest('[data-f],[data-t]'); if (!el) return;
        const c = host._cfg; c.onCell(el.dataset.f != null ? +el.dataset.f : null, el.dataset.t != null ? +el.dataset.t : null, el.classList.contains('hm-lab'));
      });
    }
  }

  /* ---------- readiness gauge: a rising arc ---------- */
  function gauge(score, base) {
    const r = 74, cx = 90, cy = 88, P = a => [cx + r * Math.cos(Math.PI * (1 - a)), cy - r * Math.sin(Math.PI * (1 - a))];
    // RTL: the arc fills from the right (0) to the left (100)
    const pos = v => { const a = 1 - v / 100; return P(a); };
    const [sx, sy] = pos(0), [ex, ey] = pos(Math.max(.5, Math.min(100, score))), [bx, by] = pos(base);
    const big = 0;
    return `<svg viewBox="0 0 180 104" width="180" height="104" role="img" aria-label="مؤشر الجاهزية ${score.toFixed(0)} من 100">
      <defs><linearGradient id="ggA" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#B8254F"/><stop offset="1" stop-color="#F2B46B"/></linearGradient></defs>
      <path d="M${cx + r} ${cy}A${r} ${r} 0 0 0 ${cx - r} ${cy}" class="gg-track"/>
      <path d="M${sx.toFixed(1)} ${sy.toFixed(1)}A${r} ${r} 0 ${big} 0 ${ex.toFixed(1)} ${ey.toFixed(1)}" class="gg-val" stroke="url(#ggA)"/>
      <circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="5" class="gg-sun"/>
      <line x1="${(cx + (bx - cx) * .86).toFixed(1)}" y1="${(cy + (by - cy) * .86).toFixed(1)}" x2="${(cx + (bx - cx) * 1.13).toFixed(1)}" y2="${(cy + (by - cy) * 1.13).toFixed(1)}" class="gg-base"/>
      <line x1="8" x2="172" y1="${cy + .5}" y2="${cy + .5}" class="gg-hz"/>
    </svg>`;
  }

  /* ---------- sparkline ---------- */
  function spark(v, w = 96, h = 24, cls = '') {
    let lo = Math.min(...v, 0), hi = Math.max(...v, 0); if (hi - lo < 1e-9) hi = lo + 1;
    const X = i => w - 2 - i * (w - 4) / (v.length - 1), Y = d => h - 2 - (d - lo) / (hi - lo) * (h - 4);
    const d = Array.from(v, (x, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(x).toFixed(1)).join('');
    return `<svg class="spark ${cls}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><line x1="2" x2="${w - 2}" y1="${Y(0).toFixed(1)}" y2="${Y(0).toFixed(1)}"/><path d="${d}"/><circle cx="${X(v.length - 1).toFixed(1)}" cy="${Y(v[v.length - 1]).toFixed(1)}" r="2.2"/></svg>`;
  }

  /* ---------- inverse-search map (canvas): every dot is one policy bundle that was simulated ----------
     x = Qatarisation in the target year (right → left), y = wage-bill growth */
  function scatter(canvas, S, chosen) {
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.max(260, canvas.clientWidth), H = Math.max(240, canvas.clientHeight);
    if (canvas.width !== W * dpr) { canvas.width = W * dpr; canvas.height = H * dpr; }
    const g = canvas.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const tg = S.tg, pts = S.pts, pr = 46, pl = 14, pt = 14, pb = 34;
    let x0 = Math.min(tg.q - .04, .36), x1 = Math.max(tg.q + .04, .64), y0 = 0, y1 = Math.max(tg.cagr + .006, .022);
    for (const p of pts) { x0 = Math.min(x0, p.m.qAt); x1 = Math.max(x1, p.m.qAt); y1 = Math.max(y1, p.m.cagr); y0 = Math.min(y0, p.m.cagr); }
    x0 -= .01; x1 += .01; y1 += .001; y0 -= .001;
    const X = v => W - pr - (v - x0) / (x1 - x0) * (W - pr - pl), Y = v => pt + (1 - (v - y0) / (y1 - y0)) * (H - pt - pb);
    g.font = '300 11px Alexandria, "Segoe UI", Tahoma, sans-serif'; g.textBaseline = 'middle';
    // feasible window (meets Qatarisation and cost targets)
    g.fillStyle = 'rgba(242,180,107,.07)'; g.fillRect(pl, Y(tg.cagr), X(tg.q) - pl, H - pb - Y(tg.cagr));
    g.strokeStyle = 'rgba(243,236,228,.10)'; g.lineWidth = 1; g.fillStyle = '#9A8C92';
    for (const t of niceTicks(x0, x1, 5)) { g.beginPath(); g.moveTo(X(t), pt); g.lineTo(X(t), H - pb); g.stroke(); g.textAlign = 'center'; g.fillText((t * 100).toFixed(0) + '%', X(t), H - pb + 12); }
    for (const t of niceTicks(y0, y1, 4)) { g.beginPath(); g.moveTo(pl, Y(t)); g.lineTo(W - pr, Y(t)); g.stroke(); g.textAlign = 'left'; g.fillText((t * 100).toFixed(1) + '%', W - pr + 6, Y(t)); }
    g.setLineDash([5, 4]); g.strokeStyle = 'rgba(242,180,107,.75)';
    g.beginPath(); g.moveTo(X(tg.q), pt); g.lineTo(X(tg.q), H - pb); g.moveTo(pl, Y(tg.cagr)); g.lineTo(W - pr, Y(tg.cagr)); g.stroke(); g.setLineDash([]);
    for (const p of pts) {
      const x = X(p.m.qAt), y = Y(p.m.cagr);
      if (p.feasible) { g.fillStyle = 'rgba(242,180,107,.9)'; g.beginPath(); g.arc(x, y, 2.6, 0, 6.3); g.fill(); }
      else { g.fillStyle = (p.v.q === 0 && p.v.cagr === 0) ? 'rgba(226,84,120,.55)' : 'rgba(207,195,190,.22)'; g.beginPath(); g.arc(x, y, 1.6, 0, 6.3); g.fill(); }
    }
    const cur = pts[0];
    if (cur) { g.strokeStyle = '#86BCCB'; g.lineWidth = 2; g.beginPath(); g.arc(X(cur.m.qAt), Y(cur.m.cagr), 6, 0, 6.3); g.stroke(); }
    (chosen || []).forEach((b, i) => {
      const x = X(b.p.m.qAt), y = Y(b.p.m.cagr);
      g.strokeStyle = '#F3ECE4'; g.lineWidth = 1.6; g.beginPath(); g.arc(x, y, 8, 0, 6.3); g.stroke();
      g.fillStyle = '#F2B46B'; g.beginPath(); g.arc(x, y, 4, 0, 6.3); g.fill();
      g.fillStyle = '#F3ECE4'; g.font = '600 12px Alexandria, "Segoe UI", Tahoma, sans-serif'; g.textAlign = 'center'; g.fillText(String(i + 1), x, y - 17);
      g.font = '300 11px Alexandria, "Segoe UI", Tahoma, sans-serif';
    });
  }

  return { horizon, pyramid, heatmap, heatColor, gauge, spark, scatter, ltr, esc, niceTicks };
})();
