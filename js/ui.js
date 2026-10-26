/* Gemeinsame UI-Bausteine: Header-Zähler, mobiles Menü, Warenkorb-Drawer, Toasts, Steuerhinweis. */
(function () {
  'use strict';
  var C = window.MW_CATALOG, CART = window.MW_CART;
  var euro = C.formatEuro;

  function h(tag, attrs, children) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'class') n.className = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }

  function taxText() {
    switch (C.catalog.operator.taxMode) {
      case 'inkl': return 'Alle Preise inkl. gesetzlicher Umsatzsteuer.';
      case 'zzgl': return 'Alle Preise zzgl. gesetzlicher Umsatzsteuer.';
      case 'kleinunternehmer': return 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.';
      default: return 'Umsatzsteuerangabe: wird vom Betreiber vor Veröffentlichung festgelegt (offene Konfiguration).';
    }
  }

  /* ---------- Toast ---------- */
  var live;
  function toast(msg, kind) {
    if (!live) {
      live = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
      document.body.appendChild(live);
    }
    var t = h('div', { class: 'toast' + (kind === 'error' ? ' toast--error' : ''), text: msg });
    live.appendChild(t);
    setTimeout(function () { t.remove(); }, kind === 'error' ? 6000 : 3500);
  }

  /* ---------- Warenkorb-Drawer ---------- */
  var dlg, body, lastFocus;
  function buildDrawer() {
    dlg = h('dialog', { class: 'drawer', id: 'cart-drawer', 'aria-labelledby': 'cart-title' });
    var head = h('div', { class: 'drawer__head' }, [
      h('h2', { id: 'cart-title', text: 'Ihr Warenkorb' }),
      h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Warenkorb schließen', text: '✕', onclick: closeCart })
    ]);
    body = h('div', { class: 'drawer__body' });
    dlg.appendChild(head); dlg.appendChild(body);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) closeCart(); });
    dlg.addEventListener('close', function () { if (lastFocus && lastFocus.focus) lastFocus.focus(); });
    document.body.appendChild(dlg);
  }
  function openCart() {
    if (!dlg) buildDrawer();
    lastFocus = document.activeElement;
    renderDrawer(CART.state());
    if (!dlg.open) dlg.showModal();
  }
  function closeCart() { if (dlg && dlg.open) dlg.close(); }

  function renderDrawer(s) {
    if (!dlg) return;
    body.textContent = '';
    if (!s.lines.length) {
      body.appendChild(h('p', { class: 'muted', text: 'Ihr Warenkorb ist leer.' }));
      body.appendChild(h('a', { class: 'btn btn--primary', href: pathTo('index.html#designvorlagen'), text: 'Designvorlage wählen', onclick: closeCart }));
      return;
    }
    var tpl = s.cart.template && C.findTemplate(s.cart.template);
    var ul = h('ul', { class: 'cart-lines' });
    s.lines.forEach(function (l) {
      var li = h('li', { class: 'cart-line' });
      var main = h('div', { class: 'cart-line__main' });
      main.appendChild(h('strong', { text: l.name }));
      if (l.base) main.appendChild(h('span', { class: 'muted small', text: tpl ? 'Vorlage: ' + tpl.name : 'Keine Vorlage gewählt' }));
      else main.appendChild(h('span', { class: 'muted small', text: l.type === 'monthly' ? 'wiederkehrend, monatlich' : 'einmalig' }));
      if (l.maxQty > 1) {
        var inp = h('input', { type: 'number', min: '1', max: String(l.maxQty), value: String(l.qty), class: 'qty', 'aria-label': 'Menge ' + l.name });
        inp.addEventListener('change', function () {
          var r = CART.setQty(l.id, inp.value);
          if (!r.ok) { toast(r.error, 'error'); renderDrawer(CART.state()); }
        });
        main.appendChild(h('label', { class: 'small' }, ['Menge: ', inp]));
      }
      var price = h('div', { class: 'cart-line__price' }, [
        h('span', { text: euro(l.total) + (l.type === 'monthly' ? ' / Monat' : '') }),
        h('button', { type: 'button', class: 'link-btn', text: 'Entfernen', 'aria-label': l.name + ' entfernen', onclick: function () { CART.removeLine(l.id); } })
      ]);
      li.appendChild(main); li.appendChild(price); ul.appendChild(li);
    });
    body.appendChild(ul);
    body.appendChild(totalsBlock(s));
    s.problems.forEach(function (p) { body.appendChild(h('p', { class: 'notice notice--warn', text: p })); });
    var actions = h('div', { class: 'drawer__actions' });
    if (!s.cart.base) {
      actions.appendChild(h('button', { type: 'button', class: 'btn btn--primary', text: 'Makler-Website hinzufügen', onclick: function () {
        var r = CART.addBase();
        if (!r.ok) { toast(r.error, 'error'); closeCart(); location.href = pathTo('index.html#designvorlagen'); }
      } }));
    } else {
      actions.appendChild(h('a', { class: 'btn btn--primary', href: pathTo('bestellung.html'), text: 'Zur Kasse' }));
    }
    body.appendChild(actions);
  }

  function totalsBlock(s) {
    var d = h('dl', { class: 'totals' });
    d.appendChild(h('dt', { text: 'Einmaliger Gesamtpreis' }));
    var big = h('dd', { class: 'totals__big', text: euro(s.oneTimeTotal) });
    tween(big, s.oneTimeTotal);
    d.appendChild(big);
    if (s.monthlyTotal > 0) {
      d.appendChild(h('dt', { text: 'Wiederkehrend (monatlich)' }));
      d.appendChild(h('dd', { text: euro(s.monthlyTotal) + ' / Monat' }));
    }
    var wrap = h('div', {}, [d, h('p', { class: 'muted small', text: taxText(), 'data-tax-note': '' })]);
    return wrap;
  }

  function pathTo(p) { return (document.body.getAttribute('data-root') || '') + p; }

  /* ---------- Header ---------- */
  function initHeader() {
    document.querySelectorAll('[data-cart-open]').forEach(function (b) { b.addEventListener('click', openCart); });
    var menuBtn = document.getElementById('menu-toggle'), nav = document.getElementById('site-nav');
    if (menuBtn && nav) {
      menuBtn.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
      });
      nav.addEventListener('click', function (e) {
        if (e.target.closest('a')) { nav.classList.remove('is-open'); menuBtn.setAttribute('aria-expanded', 'false'); }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav.classList.contains('is-open')) { nav.classList.remove('is-open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.focus(); }
      });
    }
    document.querySelectorAll('[data-tax-note]').forEach(function (n) { n.textContent = taxText(); });
    var hd = document.querySelector('.site-header');
    if (hd) { var on = function () { hd.classList.toggle('is-scrolled', window.scrollY > 8); }; on(); window.addEventListener('scroll', on, { passive: true }); }
  }

  /* Zahl weich hochzählen (respektiert prefers-reduced-motion) */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lastTotal = null;
  function tween(el, to) {
    var from = lastTotal === null ? to : lastTotal; lastTotal = to;
    if (reduce || from === to || !window.requestAnimationFrame) { el.textContent = euro(to); return; }
    var t0 = null;
    function f(t) { t0 = t0 || t; var k = Math.min(1, (t - t0) / 450), e = 1 - Math.pow(1 - k, 3); el.textContent = euro(Math.round(from + (to - from) * e)); if (k < 1) requestAnimationFrame(f); else el.textContent = euro(to); }
    requestAnimationFrame(f);
  }
  var lastCount = null;
  CART.onChange(function (s) {
    document.querySelectorAll('[data-cart-count]').forEach(function (n) {
      if (lastCount !== null && lastCount !== s.itemCount && !reduce) { n.classList.remove('bump'); void n.offsetWidth; n.classList.add('bump'); }
      n.textContent = String(s.itemCount);
      var btn = n.closest('button'); if (btn) btn.setAttribute('aria-label', s.itemCount + ' Positionen im Warenkorb – Warenkorb öffnen');
    });
    lastCount = s.itemCount;
    renderDrawer(s);
  });

  document.addEventListener('DOMContentLoaded', initHeader);

  window.MW_UI = { h: h, toast: toast, openCart: openCart, closeCart: closeCart, taxText: taxText, euro: euro, pathTo: pathTo };
})();
