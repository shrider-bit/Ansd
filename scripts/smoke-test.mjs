// End-to-end smoke test: starts the real server, then drives real browsers.
//  1. Practice mode: menu -> character -> round -> walk -> open a door.
//  2. Online: player A creates a room, player B joins with the code, they
//     play a round over WebSockets, Granny catches the survivor, roles swap,
//     and player B reloads mid-game and rejoins.
// Usage: npm run build && npm run e2e

import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const PORT = 8090;
const BASE = `http://localhost:${PORT}/?debug=1`;
const OUT = process.env.E2E_OUT ?? 'test-results';
mkdirSync(OUT, { recursive: true });

let failures = 0;
function check(cond, label) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`);
  if (!cond) failures++;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(page, fn, arg, timeout = 20000) {
  await page.waitForFunction(fn, arg, { timeout, polling: 100 });
}
const state = (page) => page.evaluate(() => window.__granny.state());

/** Walks the local player along points at ~3 m/s using legal small steps. */
async function walk(page, points) {
  await page.evaluate(async (pts) => {
    const g = window.__granny;
    for (const [x, z] of pts) {
      for (;;) {
        const s = g.state();
        const dx = x - s.x, dz = z - s.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.05) break;
        const step = Math.min(d, 0.12);
        g.teleport(s.x + (dx / d) * step, s.z + (dz / d) * step, Math.atan2(-dx, -dz));
        await new Promise((r) => setTimeout(r, 40));
      }
    }
  }, points);
}
const send = (page, msg) => page.evaluate((m) => window.__granny.session().send(m), msg);

const server = spawn(process.execPath, ['dist-server/server.mjs'], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((resolve) => server.stdout.once('data', resolve));

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const errors = [];
async function newPage(name) {
  // Small window + low graphics: CI machines render WebGL in software (no GPU).
  const ctx = await browser.newContext({ viewport: { width: 640, height: 360 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    if (!localStorage.getItem('grannys-house-settings-v1')) {
      localStorage.setItem('grannys-house-settings-v1', JSON.stringify({ quality: 'low' }));
    }
  });
  page.on('pageerror', (e) => errors.push(`[${name}] ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${name}] console: ${m.text()}`); });
  return page;
}

try {
  // ---------------- Practice ----------------
  const p = await newPage('practice');
  await p.goto(BASE);
  await waitFor(p, () => document.getElementById('screen-main')?.classList.contains('active'));
  await p.screenshot({ path: `${OUT}/01-main-menu.png` });
  check(true, 'main menu loads (Three.js + Rapier initialised)');
  await p.click('[data-action="play"]');
  await p.click('.char-card[data-character="miral"]');
  await waitFor(p, () => window.__granny.state().phase === 'countdown');
  check((await state(p)).role === 'survivor', 'practice: player is the survivor');
  await waitFor(p, () => window.__granny.state().phase === 'playing', null, 10000);
  check(true, 'practice: round starts after countdown');
  const before = await state(p);
  await p.keyboard.down('KeyW');
  await sleep(1500);
  await p.keyboard.up('KeyW');
  const after = await state(p);
  const moved = Math.hypot(after.x - before.x, after.z - before.z);
  check(moved > 0.5, `practice: keyboard movement works (moved ${moved.toFixed(2)} m)`);
  // Walk to the bedroom door and open it with E.
  await walk(p, [[-6.5, -3.0]]);
  await p.evaluate(() => window.__granny.teleport(-6.5, -3.0, Math.PI));
  await sleep(800);
  const prompt = (await state(p)).prompt;
  check(prompt === 'Open door', `practice: interaction prompt shows ("${prompt}")`);
  await p.keyboard.press('KeyE');
  await waitFor(p, () => window.__granny.state().doors.bedroom.open === true, null, 5000);
  check(true, 'practice: E opens the bedroom door (server-confirmed)');
  await sleep(800);
  await p.screenshot({ path: `${OUT}/02-practice-door.png` });
  // The computer Granny should be moving around.
  const b1 = (await state(p)).bot;
  let b2 = b1;
  for (let i = 0; i < 20 && Math.hypot(b2.x - b1.x, b2.z - b1.z) <= 0.5; i++) {
    await sleep(500);
    b2 = (await state(p)).bot;
  }
  check(Math.hypot(b2.x - b1.x, b2.z - b1.z) > 0.5, `practice: computer Granny moves (mode=${b2.mode})`);
  const st = await state(p);
  console.log(`      practice FPS (headless SOFTWARE rendering, not representative): ${st.fps.toFixed(1)}, draw calls ${st.drawCalls}, triangles ${st.triangles}`);
  // Hide in the bedroom wardrobe.
  await walk(p, [[-6.5, -4.5], [-4.35, -6.6]]);
  await p.evaluate(() => window.__granny.teleport(-4.35, -6.6, -Math.PI / 2));
  await sleep(800);
  const hp = (await state(p)).prompt;
  check(/Hide/.test(hp ?? ''), `practice: hiding prompt shows ("${hp}")`);
  await p.evaluate(() => window.__granny.interact());
  await waitFor(p, () => window.__granny.state().hidden === 'wardrobe_bedroom', null, 5000);
  check(true, 'practice: survivor can hide in the wardrobe');
  await sleep(500);
  await p.screenshot({ path: `${OUT}/03-hiding.png` });
  await p.close();

  // ---------------- Online multiplayer ----------------
  const a = await newPage('A');
  const b = await newPage('B');
  await a.goto(BASE);
  await waitFor(a, () => document.getElementById('screen-main')?.classList.contains('active'));
  await a.click('[data-action="create"]');
  await a.click('.char-card[data-character="miral"]');
  await waitFor(a, () => /^[A-Z0-9]{5}$/.test(document.getElementById('lobby-code').textContent));
  const code = await a.textContent('#lobby-code');
  check(true, `online: room created with code ${code}`);
  await b.goto(BASE);
  await waitFor(b, () => document.getElementById('screen-main')?.classList.contains('active'));
  await b.click('[data-action="join"]');
  await b.fill('#join-code', code);
  await b.click('[data-action="join-go"]');
  await waitFor(a, () => !document.getElementById('lobby-start').disabled);
  const names = await a.$$eval('.lobby-player .name', (els) => els.map((e) => e.textContent));
  check(names.includes('Miral') && names.includes('Ahmed'), `online: both players in lobby (${names.join(', ')})`);
  await a.screenshot({ path: `${OUT}/04-lobby.png` });
  await a.click('#lobby-start');
  await waitFor(a, () => window.__granny.state().phase === 'countdown');
  await waitFor(b, () => window.__granny.state().phase === 'countdown');
  const ra = (await state(a)).role, rb = (await state(b)).role;
  check(ra !== rb, `online: opposite roles assigned (A=${ra}, B=${rb})`);
  await waitFor(a, () => window.__granny.state().phase === 'playing', null, 10000);
  await waitFor(b, () => window.__granny.state().phase === 'playing', null, 10000);
  const [sur, gra] = ra === 'survivor' ? [a, b] : [b, a];

  // Survivor walks into the hallway; Granny should see the movement.
  await walk(sur, [[-6.5, -3.0]]);
  await send(sur, { t: 'interact', kind: 'door', id: 'bedroom' });
  await waitFor(gra, () => window.__granny.state().doors.bedroom.open, null, 5000);
  check(true, 'online: door opened by survivor is synchronised to Granny');
  await walk(sur, [[-6.5, -1.0], [3.0, -1.0]]);
  await sleep(400);
  const gView = (await state(gra)).remotes[0];
  const sPos = await state(sur);
  check(Math.hypot(gView.x - sPos.x, gView.z - sPos.z) < 0.8, `online: Granny sees survivor at (${gView.x.toFixed(1)}, ${gView.z.toFixed(1)})`);
  // A cheating teleport is rejected by the server and corrected.
  await gra.evaluate(() => window.__granny.teleport(-8, 6, 0));
  await sleep(600);
  const gAfter = await state(gra);
  check(Math.hypot(gAfter.x + 8, gAfter.z - 6) > 1, 'online: server rejects teleport cheat and corrects Granny');
  // Granny walks out of the kitchen and catches the survivor.
  await walk(gra, [[6.5, -3.0]]);
  await send(gra, { t: 'interact', kind: 'door', id: 'kitchen' });
  await sleep(600);
  await gra.screenshot({ path: `${OUT}/05-granny-view.png` });
  await walk(gra, [[6.5, -1.0], [4.0, -1.0]]);
  await waitFor(sur, () => document.getElementById('screen-end').classList.contains('active'), null, 10000);
  const endText = await sur.textContent('#end-title');
  check(/CAUGHT/.test(endText), `online: Granny catches the survivor ("${endText}")`);
  await sleep(400);
  await sur.screenshot({ path: `${OUT}/06-caught.png` });
  const gEnd = await gra.textContent('#end-title');
  check(/YOU CAUGHT/.test(gEnd), `online: Granny sees the win ("${gEnd}")`);

  // Next round: roles swap automatically.
  await waitFor(a, () => window.__granny.state().phase === 'countdown', null, 20000);
  const ra2 = (await state(a)).role, rb2 = (await state(b)).role;
  check(ra2 !== ra && rb2 !== rb, `online: roles swapped for round 2 (A=${ra2}, B=${rb2})`);

  // Reconnection: B reloads the page mid-round and gets its seat back.
  await b.reload();
  await waitFor(b, () => window.__granny && ['countdown', 'playing'].includes(window.__granny.state().phase), null, 20000);
  check((await state(b)).role === rb2, 'online: player B reloads and rejoins the same round with the same role');
  await waitFor(a, () => window.__granny.state().phase === 'playing', null, 15000);
  await sleep(1000);
  await b.screenshot({ path: `${OUT}/07-after-rejoin.png` });
  const fa = await state(a);
  console.log(`      online FPS (headless software rendering): A=${fa.fps.toFixed(1)}`);
} catch (err) {
  console.error(err);
  failures++;
} finally {
  for (const e of errors) console.log(`ERROR ${e}`);
  check(errors.length === 0, `no page errors (${errors.length})`);
  await browser.close();
  server.kill();
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
