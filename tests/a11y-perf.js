/* Barrierefreiheit (axe-core, WCAG 2.1 AA) + Ladeperformance. Start: python3 -m http.server 8123 → node tests/a11y-perf.js */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.argv[2] || 'http://localhost:8123';
const axeSrc = fs.readFileSync(path.join(__dirname, '..', 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');
let fails = 0;
(async () => {
  const b = await chromium.launch();
  const pages = ['index.html', 'bestellung.html', 'impressum.html', 'datenschutz.html', 'agb.html', 'widerruf.html',
    'demo/klassisch.html', 'demo/urban.html', 'demo/persoenlich.html', 'demo/regional.html', 'demo/premium.html'];
  for (const vp of [{ width: 1280, height: 900 }, { width: 390, height: 800 }]) {
    const ctx = await b.newContext({ viewport: vp, reducedMotion: 'reduce' });
    for (const pg of pages) {
      const p = await ctx.newPage(); await p.goto(`${BASE}/${pg}`); await p.waitForTimeout(500);
      if (pg === 'index.html') { await p.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true)); }
      await p.addScriptTag({ content: axeSrc });
      const r = await p.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] }));
      const v = r.violations.filter(x => !['region', 'landmark-one-main', 'page-has-heading-one'].includes(x.id) || !pg.startsWith('demo'));
      console.log(`${v.length ? 'FAIL' : 'PASS'} axe ${vp.width}px ${pg}` + v.map(x => `\n   - ${x.id} (${x.impact}): ${x.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`).join(''));
      fails += v.length; await p.close();
    }
    await ctx.close();
  }
  // Performance (Desktop, gedrosselt wie schnelles 4G)
  const ctx = await b.newContext({ viewport: { width: 390, height: 800 } });
  const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
  await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 60, downloadThroughput: 1.6e6 / 8 * 5, uploadThroughput: 750e3 / 8 });
  let bytes = 0; const reqs = []; p.on('response', async r => { const l = +(r.headers()['content-length'] || 0); bytes += l; reqs.push(r.url()); });
  await p.goto(BASE + '/index.html', { waitUntil: 'load' });
  const m = await p.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; const lcp = new Promise(res => new PerformanceObserver(l => res(l.getEntries().pop().startTime)).observe({ type: 'largest-contentful-paint', buffered: true })); return Promise.race([lcp, new Promise(r => setTimeout(() => r(-1), 1500))]).then(l => ({ dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), lcp: Math.round(l) })); });
  console.log(`PERF (mobil, gedrosselt): DOMContentLoaded ${m.dcl} ms · load ${m.load} ms · LCP ${m.lcp} ms · ${reqs.length} Requests · ~${Math.round(bytes / 1024)} KB`);
  if (m.load > 2000) { console.log('FAIL Ladezeit > 2 s'); fails++; }
  await b.close(); console.log(fails ? `\n${fails} Probleme` : '\nAlles in Ordnung'); process.exit(fails ? 1 : 0);
})();
