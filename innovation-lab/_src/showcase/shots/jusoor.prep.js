module.exports = async p => { await p.locator('.tab').nth(2).click(); await p.waitForTimeout(900); await p.evaluate(() => window.scrollTo(0, 60)); };
