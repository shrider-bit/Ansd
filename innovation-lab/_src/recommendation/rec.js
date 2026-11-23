(function () {
  const $ = s => document.querySelector(s);
  $('#today').textContent = CGB.bothDates(new Date());
  $('#print').addEventListener('click', () => window.print());
  const HOURS_PER_FTE = 1600;
  function calc() {
    const v = id => Math.max(0, parseFloat($('#' + id).value) || 0);
    const req = v('c-req'), hrs = v('c-hrs'), red = v('c-red') / 100, posts = v('c-posts'), cost = v('c-cost'), shift = v('c-shift') / 100;
    $('#o-red').textContent = Math.round(red * 100) + '%'; $('#o-shift').textContent = (shift * 100).toFixed(1).replace('.0', '') + '%';
    const hours = req * hrs * red, redirected = Math.round(posts * shift), money = redirected * cost;
    $('#r-hours').textContent = CGB.num(Math.round(hours));
    $('#r-fte').textContent = 'ما يعادل ' + CGB.num(hours / HOURS_PER_FTE, 1) + ' موظف بدوام كامل';
    $('#r-posts').textContent = CGB.num(redirected); $('#r-of').textContent = CGB.num(posts);
    $('#r-money').textContent = CGB.qar(money);
    $('#r-10').textContent = redirected ? 'نحو ' + CGB.qar(money * 10) + ' على عشر سنوات إذا استمر شغل هذه الوظائف (دون خصم زمني)' : 'ارفع النسبة لرؤية الأثر';
  }
  $('#calc').addEventListener('input', calc); $('#calc').addEventListener('submit', e => e.preventDefault()); calc();
})();
