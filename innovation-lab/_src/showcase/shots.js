// Capture real screenshots of the built prototypes and store them as base64 data URIs
// for the showcase page.   node _src/showcase/shots.js   (run from innovation-lab/)
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const root = path.resolve(__dirname, '..', '..'); const pages = require('../pages.json');
(async () => {
  const b = await chromium.launch();
  for (const n of ['ufuq', 'jusoor', 'bayyina', 'misfat']) {
    const f = path.join(root, pages[n]); if (!fs.existsSync(f)) { console.log('missing', n); continue; }
    const c = await b.newContext({ viewport: { width: 1180, height: 738 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const p = await c.newPage(); await p.goto('file://' + f); await p.waitForTimeout(1500);
    const hook = path.join(__dirname, 'shots', n + '.prep.js');           // optional per-page preparation
    if (fs.existsSync(hook)) { await require(hook)(p); await p.waitForTimeout(700); }
    const buf = await p.screenshot({ type: 'jpeg', quality: 72 });
    fs.writeFileSync(path.join(__dirname, 'shots', n + '.b64'), 'data:image/jpeg;base64,' + buf.toString('base64'));
    console.log(n, Math.round(buf.length / 1024) + ' KB'); await c.close();
  }
  await b.close();
})();
