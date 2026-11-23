// Smoke-check a built page: console errors, horizontal overflow, screenshots.
//   node _src/check.js <file.html> <out-dir> [--full]
// Writes <out-dir>/<name>-desktop.png and -mobile.png (viewport-size unless --full).
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [file, outDir = '.', flag] = process.argv.slice(2);
  const url = 'file://' + path.resolve(file);
  const name = path.basename(file, '.html');
  const browser = await chromium.launch();
  let bad = 0;
  for (const [label, vp] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
    const errs = [];
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('requestfailed', r => errs.push('requestfailed: ' + r.url().slice(0, 120)));
    page.on('request', r => { if (/^https?:/.test(r.url())) errs.push('EXTERNAL REQUEST: ' + r.url().slice(0, 120)); });
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    const m = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth, iw: window.innerWidth,
      dir: document.documentElement.dir, fonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family).filter((v, i, a) => a.indexOf(v) === i),
      wide: [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1); }).slice(0, 6).map(e => e.tagName + '.' + String(e.className).slice(0, 40)),
    }));
    const overflow = m.sw > m.iw + 1;
    if (overflow || errs.length) bad++;
    console.log(`[${label}] dir=${m.dir} scrollWidth=${m.sw}/${m.iw} ${overflow ? 'HORIZONTAL OVERFLOW' : 'ok'} fonts=${m.fonts.join('|')}`);
    if (overflow) console.log('   offenders (may include intentionally scrollable inner content):', m.wide.join(', '));
    errs.forEach(e => console.log('   ' + e));
    await page.screenshot({ path: path.join(outDir, `${name}-${label}.png`), fullPage: flag === '--full' });
    await page.close();
  }
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
