/* Erzeugt statische WebP-Vorschaubilder der Demo-Seiten (assets/thumbs/).
 * Nach jeder Änderung an demo/*.html ausführen:  python3 -m http.server 8123 &  node tools/make-thumbs.js
 * Warum: Die Startseite lädt dadurch ~200 KB Bilder statt 7 komplette Seiten in iframes. */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const BASE = process.argv[2] || 'http://localhost:8123';
const OUT = path.join(__dirname, '..', 'assets', 'thumbs');
const IDS = ['klassisch', 'urban', 'persoenlich', 'regional', 'premium'];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mwthumbs-'));
(async () => {
  const b = await chromium.launch();
  async function shot(id, w, h, dsf, name) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf, reducedMotion: 'reduce' });
    const p = await ctx.newPage(); await p.goto(`${BASE}/demo/${id}.html`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    const png = path.join(tmp, name + '.png'); await p.screenshot({ path: png }); await ctx.close();
    execFileSync('python3', ['-c', `from PIL import Image;Image.open(${JSON.stringify(png)}).convert("RGB").save(${JSON.stringify(path.join(OUT, name + '.webp'))},"WEBP",quality=80,method=6)`]);
  }
  for (const id of IDS) await shot(id, 1280, 1100, 0.5, id);                  // Karten (640×550)
  await shot('persoenlich', 1280, 800, 0.9, 'hero-laptop');                    // Hero-Laptop
  await shot('klassisch', 390, 800, 1.5, 'hero-phone');                        // Hero-Smartphone
  await b.close();
  fs.readdirSync(OUT).forEach(f => console.log(f, fs.statSync(path.join(OUT, f)).size + ' B'));
})();
