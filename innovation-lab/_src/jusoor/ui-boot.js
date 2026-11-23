/* جسور — boot. Opens in a working state: the allocation has already been run with the default policy. */
(function boot() {
  runSolve();
  initOverlays(); initMap(); initLab(); initBridges(); initMoves();
  $('#mData').textContent = `${CGB.num(D.people.length)} ملف كفاءة مجهول الهوية (رمز، جهة، مجموعة، درجة، خبرة، 5–7 مهارات من سجل يضم ${D.NS} مهارة) و${CGB.num(D.needs.length)} احتياجاً مفتوحاً (مهارات أساسية ومرجّحة، أهمية، مدة).`;
  $$('.tab').forEach(t => t.addEventListener('click', () => go(t.dataset.view)));
  document.addEventListener('click', ev => { const b = ev.target.closest('[data-go]'); if (b) go(b.dataset.go); });
  $('#btnMethod').addEventListener('click', openDrawer);
  $('#btnTour').addEventListener('click', tourStart);
  $('#heroTour').addEventListener('click', tourStart);
  renderStages('done'); renderRunNote();
  const h = (location.hash || '').slice(1);
  go(['map', 'lab', 'bridges', 'moves', 'plan'].includes(h) ? h : 'map', { keepScroll: true });
  window.addEventListener('hashchange', () => { const v = location.hash.slice(1); if (RENDER[v] && v !== S.view) go(v); });
})();
