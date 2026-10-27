const test = require('node:test'), assert = require('node:assert');
const C = require('../js/catalog.js');

test('Grundpreis 799 € unabhängig von der Vorlage', () => {
  C.catalog.templates.forEach(t => {
    const s = C.priceCart({ base: true, template: t.id, addons: {} });
    assert.strictEqual(s.oneTimeTotal, 799); assert.strictEqual(s.monthlyTotal, 0); assert.ok(s.valid);
  });
});
test('Beispielrechnung 1.196 €', () => {
  const s = C.priceCart({ base: true, template: 'klassisch', addons: { logo: 1, texte: 1, unterseite: 1 } });
  assert.strictEqual(s.oneTimeTotal, 1196);
});
test('Support ist wiederkehrend und getrennt', () => {
  const s = C.priceCart({ base: true, template: 'urban', addons: { support: 1 } });
  assert.strictEqual(s.oneTimeTotal, 799); assert.strictEqual(s.monthlyTotal, 29);
});
test('Manipulierte Eingaben werden normalisiert', () => {
  const s = C.priceCart({ base: true, template: 'x', addons: { logo: 99, evil: 5, unterseite: 99, texte: -1 } });
  assert.strictEqual(s.cart.template, null); assert.ok(!s.valid);
  assert.strictEqual(s.cart.addons.logo, 1); assert.strictEqual(s.cart.addons.unterseite, 10);
  assert.ok(!('evil' in s.cart.addons)); assert.ok(!('texte' in s.cart.addons));
});
test('Ohne Grundprodukt ungültig', () => { assert.ok(!C.priceCart({ base: false, template: 'urban', addons: {} }).valid); });
test('Cent-genau bei Mengen', () => {
  assert.strictEqual(C.priceCart({ base: true, template: 'premium', addons: { unterseite: 3 } }).oneTimeTotal, 799 + 147);
});
