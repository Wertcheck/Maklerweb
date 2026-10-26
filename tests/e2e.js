/* E2E-Test (Playwright). Start: python3 -m http.server 8123  →  node tests/e2e.js [baseUrl]
 * Schreibt Screenshots nach qa/. */
const { chromium } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8123';
const QA = path.join(__dirname, '..', 'qa');
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', e => errs.push(String(e)));
  p.on('requestfailed', r => errs.push('requestfailed ' + r.url()));

  await p.goto(BASE + '/index.html'); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${QA}/01-hero-desktop.png` });
  ok(await p.locator('.tpl').count() === 5, '5 Vorlagen angezeigt');
  ok((await p.locator('.hero [data-price=base]').textContent()).includes('799'), 'Preis 799 € im Hero');

  // Vorlagen-Demos strukturell unterschiedlich
  const sigs = new Set();
  for (const id of ['klassisch', 'urban', 'persoenlich', 'regional', 'premium']) {
    const d = await ctx.newPage(); await d.goto(`${BASE}/demo/${id}.html`); await d.waitForTimeout(400);
    sigs.add(await d.evaluate(() => document.querySelector('main').innerHTML.length + '|' + document.querySelectorAll('section').length + '|' + getComputedStyle(document.body).backgroundColor));
    await d.screenshot({ path: `${QA}/demo-${id}-desktop.png`, fullPage: true });
    await d.setViewportSize({ width: 390, height: 800 }); await d.waitForTimeout(200);
    await d.screenshot({ path: `${QA}/demo-${id}-mobile.png`, fullPage: true });
    const over = await d.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(over <= 0, `Demo ${id}: kein horizontaler Überlauf mobil (${over})`);
    await d.close();
  }
  ok(sigs.size === 5, 'Alle 5 Demos strukturell verschieden');

  // Ohne Vorlage: Fehlermeldung
  await p.click('#add-base');
  ok(await p.locator('.toast--error').count() > 0, 'Fehlermeldung ohne Vorlage');

  // Vorschau
  await p.locator('[data-preview=urban]').click();
  ok(await p.locator('dialog.preview[open]').count() === 1, 'Vorschau-Dialog öffnet');
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${QA}/02-preview-desktop.png` });
  await p.click('.preview .seg button:has-text("Mobil")'); await p.waitForTimeout(300);
  await p.screenshot({ path: `${QA}/03-preview-mobile.png` });
  const src = await p.locator('.preview__frame').getAttribute('src');
  ok(src.includes('urban'), 'Vorschau lädt richtige Demo');
  await p.keyboard.press('Escape');
  ok(await p.locator('dialog.preview[open]').count() === 0, 'Vorschau per Esc schließbar');

  // Auswahl + Warenkorb
  await p.locator('[data-choose=premium]').click();
  ok(await p.locator('.tpl.is-selected').count() === 1, 'Vorlage markiert');
  await p.click('#add-base');
  await p.waitForSelector('dialog.drawer[open]');
  ok((await p.locator('.drawer .totals__big').textContent()).replace(/\s/g, '').includes('799€'), 'Grundpreis 799 € im Warenkorb');
  await p.keyboard.press('Escape');
  for (const id of ['logo', 'texte', 'unterseite']) await p.locator(`[data-addon=${id}]`).click();
  await p.locator('[data-addon=logo]').dblclick(); // zweimal toggeln -> entfernt/hinzugefügt, nie doppelt
  const n = await p.locator('[data-cart-count]').first().textContent();
  ok(['4', '5'].includes(n.trim()), 'Zähler plausibel (' + n + ')');
  ok((await p.locator('[data-cart-count]').first().textContent()).trim() === '4', 'Keine doppelten Positionen (4 Positionen)');
  ok(await p.locator('[data-addon=logo]').getAttribute('aria-pressed') === 'true', 'Hinzugefügt-Zustand');
  await p.locator('[data-addon=support]').click();
  await p.click('[data-cart-open]'); await p.waitForSelector('dialog.drawer[open]');
  const tot = (await p.locator('.drawer .totals').textContent()).replace(/\s/g, '');
  ok(tot.includes('1.196€') && tot.includes('29€/Monat'), 'Summe 1.196 € + 29 €/Monat getrennt: ' + tot);
  await p.screenshot({ path: `${QA}/04-cart-drawer.png` });
  await p.keyboard.press('Escape');
  await p.locator('[data-addon=support]').click(); // Support wieder entfernen

  // Kasse, Warenkorb bleibt erhalten
  await p.goto(BASE + '/bestellung.html'); await p.waitForTimeout(300);
  ok((await p.locator('[data-cart-count]').first().textContent()).trim() === '4', 'Warenkorb bleibt bei Navigation erhalten');
  ok(await p.locator('input[name=tpl][value=premium]').isChecked(), 'Vorlage in Kasse vorausgewählt');
  await p.screenshot({ path: `${QA}/05-checkout-step1.png` });
  await p.click('text=Weiter zur Prüfung'); await p.waitForSelector('#s2h');
  await p.screenshot({ path: `${QA}/06-checkout-review.png` });
  await p.click('text=Weiter zu den Kundendaten'); await p.waitForSelector('#s3h');
  await p.click('#submit-btn'); await p.waitForSelector('.error-summary');
  const ec = await p.locator('.error-summary li').count();
  ok(ec >= 8, `Validierung zeigt Fehler (${ec})`);
  await p.screenshot({ path: `${QA}/07-checkout-validation.png` });
  await p.fill('#f-company', 'Muster Immobilien GmbH'); await p.fill('#f-contact', 'Max Muster');
  await p.fill('#f-email', 'kaputt'); await p.fill('#f-street', 'Musterweg 1'); await p.fill('#f-zip', '12'); await p.fill('#f-city', 'Musterstadt');
  await p.check('#f-c-agb'); await p.check('#f-c-privacy'); await p.check('#f-c-withdrawal');
  await p.click('#submit-btn');
  ok((await p.locator('.error-summary li').allTextContents()).join().includes('gültige E-Mail'), 'E-Mail-Validierung');
  await p.fill('#f-email', 'max@example.com'); await p.fill('#f-zip', '12345');
  await p.click('#submit-btn'); await p.waitForSelector('#s4h');
  const t4 = await p.locator('#stage').textContent();
  ok(t4.includes('NICHT') && t4.includes('nichts bezahlt'), 'Ohne Backend: ehrlicher Hinweis, keine Zahlung vorgetäuscht');
  ok(!/erfolgreich bezahlt/i.test(t4), 'Kein "bezahlt"-Erfolg');
  await p.screenshot({ path: `${QA}/08-checkout-done-nobackend.png`, fullPage: true });

  // Mit simuliertem Backend (Netzwerk-Mock) – testet nur die Client-Anbindung
  await p.goto(BASE + '/bestellung.html');
  await p.evaluate(() => { window.MW_CONFIG.orderEndpoint = 'https://api.invalid/orders'; });
  let posted = null;
  await p.route('https://api.invalid/orders', r => { posted = JSON.parse(r.request().postData()); r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ orderNumber: 'MW-TEST-1', status: 'received' }) }); });
  await p.click('text=Weiter zur Prüfung'); await p.click('text=Weiter zu den Kundendaten');
  await p.fill('#f-company', 'Muster'); await p.fill('#f-contact', 'M'); await p.fill('#f-email', 'a@b.de'); await p.fill('#f-street', 'S 1'); await p.fill('#f-zip', '12345'); await p.fill('#f-city', 'X');
  await p.check('#f-c-agb'); await p.check('#f-c-privacy'); await p.check('#f-c-withdrawal');
  await p.click('#submit-btn'); await p.waitForSelector('#s4h');
  ok(posted && posted.template === 'premium' && posted.items.length === 3, 'Payload enthält Konfiguration (Server rechnet Preis selbst)');
  ok((await p.locator('#stage').textContent()).includes('MW-TEST-1') && !(await p.locator('#stage').textContent()).includes('Bezahlt'), 'Bestellnummer vom Server, Zahlung unbestätigt');
  ok((await p.locator('[data-cart-count]').first().textContent()).trim() === '0', 'Warenkorb nach Übermittlung geleert');

  // Mobil
  const m = await ctx.newPage(); await m.setViewportSize({ width: 390, height: 800 });
  await m.goto(BASE + '/index.html'); await m.waitForTimeout(1000);
  ok((await m.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, 'Startseite mobil: kein horizontaler Überlauf');
  await m.screenshot({ path: `${QA}/09-home-mobile.png` });
  await m.click('#menu-toggle'); ok(await m.locator('#site-nav.is-open').count() === 1, 'Mobiles Menü öffnet');
  await m.screenshot({ path: `${QA}/10-menu-mobile.png` });
  await m.click('#site-nav a[href="#faq"]'); await m.waitForTimeout(500);
  await m.locator('#tpl-track').scrollIntoViewIfNeeded();
  await m.screenshot({ path: `${QA}/11-faq-mobile.png` });
  await m.goto(BASE + '/index.html#designvorlagen'); await m.waitForTimeout(800);
  await m.screenshot({ path: `${QA}/12-templates-mobile.png` });
  await m.goto(BASE + '/bestellung.html'); await m.waitForTimeout(300);
  ok((await m.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, 'Kasse mobil: kein Überlauf');
  await m.screenshot({ path: `${QA}/13-checkout-mobile.png`, fullPage: true });

  // Rechtsseiten erreichbar
  for (const pg of ['impressum', 'datenschutz', 'agb', 'widerruf']) { const r = await p.goto(`${BASE}/${pg}.html`); ok(r.status() === 200, pg + ' erreichbar'); }

  ok(errs.filter(e => !/api\.invalid/.test(e)).length === 0, 'Keine Konsolenfehler: ' + JSON.stringify(errs));
  await b.close();
  console.log(fails ? `\n${fails} FEHLER` : '\nAlle Prüfungen bestanden'); process.exit(fails ? 1 : 0);
})();
