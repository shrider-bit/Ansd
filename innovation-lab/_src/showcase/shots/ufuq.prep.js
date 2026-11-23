module.exports = async p => { await p.locator('.tabs button').nth(1).click(); await p.waitForTimeout(500);
  await p.getByRole('button', { name: 'الحزمة المتوازنة' }).click(); await p.waitForTimeout(900); await p.evaluate(() => window.scrollTo(0, 215)); };
