/* Warenkorb-Zustand (localStorage, seitenübergreifend synchron). Preise kommen ausschließlich aus catalog.js. */
(function () {
  'use strict';
  var KEY = 'mw_cart_v1';
  var C = window.MW_CATALOG;
  var listeners = [];
  var memory = null; // Fallback, falls localStorage nicht verfügbar ist

  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      return C.normalizeCart(raw ? JSON.parse(raw) : null);
    } catch (e) { return C.normalizeCart(memory); }
  }
  function save(cart) {
    cart = C.normalizeCart(cart);
    memory = cart;
    try { window.localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { /* privater Modus o. Ä. */ }
    emit();
    return cart;
  }
  function emit() { var s = priced(); listeners.forEach(function (fn) { try { fn(s); } catch (e) { console.error(e); } }); }
  function priced() { return C.priceCart(load()); }

  window.addEventListener('storage', function (e) { if (e.key === KEY) emit(); });

  window.MW_CART = {
    state: priced,
    onChange: function (fn) { listeners.push(fn); fn(priced()); },
    setTemplate: function (id) {
      var c = load();
      c.template = C.findTemplate(id) ? id : null;
      return save(c);
    },
    addBase: function () {
      var c = load();
      if (!c.template) return { ok: false, error: 'Bitte wählen Sie zuerst eine Designvorlage.' };
      c.base = true; save(c);
      return { ok: true };
    },
    removeBase: function () { var c = load(); c.base = false; return save(c); },
    hasAddon: function (id) { return !!load().addons[id]; },
    /* Idempotent: erneutes Hinzufügen erzeugt nie eine zweite Position. */
    toggleAddon: function (id) {
      var a = C.findAddon(id); if (!a) return { ok: false, error: 'Unbekannte Zusatzleistung.' };
      var c = load();
      if (c.addons[id]) delete c.addons[id]; else c.addons[id] = 1;
      save(c);
      return { ok: true, added: !!load().addons[id] };
    },
    setQty: function (id, qty) {
      var a = C.findAddon(id); if (!a) return { ok: false, error: 'Unbekannte Zusatzleistung.' };
      var q = Math.floor(Number(qty));
      if (!isFinite(q) || q < 1) return { ok: false, error: 'Bitte geben Sie eine Menge von mindestens 1 an.' };
      if (q > a.maxQty) return { ok: false, error: 'Maximal ' + a.maxQty + ' × „' + a.name + '“ pro Bestellung möglich.' };
      var c = load(); c.addons[id] = q; save(c);
      return { ok: true };
    },
    removeLine: function (id) {
      if (id === C.catalog.base.id) return this.removeBase();
      var c = load(); delete c.addons[id]; return save(c);
    },
    clear: function () { return save(null); }
  };
})();
