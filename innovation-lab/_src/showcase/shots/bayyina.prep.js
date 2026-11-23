module.exports = async p => { await p.locator('.tab').nth(1).click(); await p.waitForTimeout(600); await p.evaluate(() => window.scrollTo(0, 130)); };
