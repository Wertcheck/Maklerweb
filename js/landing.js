/* Landingpage: Preise, Vorlagen-Karussell, Vorschau-Dialog, Zusatzleistungen, FAQ. */
(function () {
  'use strict';
  var C = window.MW_CATALOG, CART = window.MW_CART, UI = window.MW_UI, h = UI.h, euro = C.formatEuro;
  var cat = C.catalog;
  var $ = function (s, r) { return (r || document).querySelector(s); };

  /* ---------- Preise aus der zentralen Konfiguration ---------- */
  function priceText(key) {
    if (key === 'base') return euro(cat.base.price);
    var a = C.findAddon(key);
    if (!a) return '';
    return (a.priceFrom ? 'ab ' : '') + euro(a.price) + (a.type === 'monthly' ? ' / Monat' : '');
  }
  function fillPrices(root) {
    (root || document).querySelectorAll('[data-price]').forEach(function (n) { n.textContent = priceText(n.getAttribute('data-price')); });
  }

  /* ---------- Grundprodukt ---------- */
  function renderBase() {
    var inc = $('#includes'), exc = $('#excludes');
    cat.base.includes.forEach(function (t) { inc.appendChild(h('li', { text: t })); });
    cat.base.excludes.forEach(function (t) { exc.appendChild(h('li', { text: t })); });
    $('#add-base').addEventListener('click', function () {
      var r = CART.addBase();
      if (!r.ok) {
        UI.toast(r.error, 'error');
        $('#designvorlagen').scrollIntoView({ behavior: 'smooth' });
        return;
      }
      UI.toast('Die Makler-Website wurde in den Warenkorb gelegt.');
      UI.openCart();
    });
  }

  /* ---------- Vorlagen ---------- */
  var track = $('#tpl-track');
  function renderTemplates() {
    cat.templates.forEach(function (t) {
      var card = h('article', { class: 'tpl', 'data-tpl': t.id, 'aria-labelledby': 'tpl-n-' + t.id });
      var thumb = h('div', { class: 'tpl__img' }, [
        h('img', { src: 'assets/thumbs/' + t.id + '.webp', alt: 'Vorschaubild der Vorlage ' + t.name, width: '640', height: '550', loading: 'lazy', decoding: 'async' })
      ]);
      card.appendChild(thumb);
      card.appendChild(h('h3', { id: 'tpl-n-' + t.id, text: t.name }));
      card.appendChild(h('p', { class: 'tpl__aud', text: 'Für: ' + t.audience }));
      card.appendChild(h('p', { class: 'tpl__desc', text: t.description }));
      card.appendChild(h('div', { class: 'tpl__btns' }, [
        h('button', { type: 'button', class: 'btn btn--ghost btn--sm', text: 'Vorschau ansehen', 'data-preview': t.id }),
        h('button', { type: 'button', class: 'btn btn--primary btn--sm', 'data-choose': t.id, 'aria-pressed': 'false', text: 'Diese Vorlage wählen' })
      ]));
      track.appendChild(card);
    });
    track.addEventListener('click', function (e) {
      var p = e.target.closest('[data-preview]'), c = e.target.closest('[data-choose]');
      if (p) openPreview(p.getAttribute('data-preview'), p);
      if (c) choose(c.getAttribute('data-choose'));
    });
    initCarousel();
  }
  function choose(id) {
    CART.setTemplate(id);
    UI.toast('Vorlage „' + C.findTemplate(id).name + '“ ausgewählt. Der Preis bleibt gleich.');
  }
  function markSelected(s) {
    var sel = s.cart.template;
    track.querySelectorAll('.tpl').forEach(function (card) {
      var on = card.getAttribute('data-tpl') === sel;
      card.classList.toggle('is-selected', on);
      var b = card.querySelector('[data-choose]');
      b.setAttribute('aria-pressed', String(on));
      b.textContent = on ? 'Ausgewählt ✓' : 'Diese Vorlage wählen';
    });
    var out = $('#chosen-tpl'), t = sel && C.findTemplate(sel);
    out.textContent = t ? 'Gewählte Vorlage: ' + t.name : 'Noch keine Vorlage gewählt – bitte oben auswählen.';
  }

  function initCarousel() {
    var prev = $('#tpl-prev'), next = $('#tpl-next'), dots = $('#tpl-dots');
    var cards = track.querySelectorAll('.tpl');
    function step() { return cards[0].getBoundingClientRect().width + 20; }
    function pageCount() { return Math.max(1, Math.round((track.scrollWidth - track.clientWidth) / step()) + 1); }
    function buildDots() {
      dots.textContent = '';
      for (var i = 0; i < pageCount(); i++) (function (i) {
        dots.appendChild(h('button', { type: 'button', 'aria-label': 'Zu Vorlage ' + (i + 1), onclick: function () { track.scrollTo({ left: i * step() }); } }));
      })(i);
      update();
    }
    function update() {
      var i = Math.round(track.scrollLeft / step());
      dots.querySelectorAll('button').forEach(function (b, k) { b.setAttribute('aria-current', String(k === i)); });
      prev.disabled = track.scrollLeft < 4;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    }
    prev.addEventListener('click', function () { track.scrollBy({ left: -step() }); });
    next.addEventListener('click', function () { track.scrollBy({ left: step() }); });
    track.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { track.scrollBy({ left: step() }); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { track.scrollBy({ left: -step() }); e.preventDefault(); }
    });
    window.addEventListener('resize', buildDots);
    buildDots();
  }

  /* ---------- Vorschau-Dialog ---------- */
  var pv, pvFrame, pvStage, pvTitle, pvChoose, pvLast, pvId;
  function buildPreview() {
    pv = h('dialog', { class: 'preview', 'aria-labelledby': 'pv-title' });
    pvTitle = h('h2', { id: 'pv-title' });
    var dBtn = h('button', { type: 'button', 'aria-pressed': 'true', text: 'Desktop' });
    var mBtn = h('button', { type: 'button', 'aria-pressed': 'false', text: 'Mobil' });
    function mode(m) { pvStage.classList.toggle('is-mobile', m); dBtn.setAttribute('aria-pressed', String(!m)); mBtn.setAttribute('aria-pressed', String(m)); }
    dBtn.onclick = function () { mode(false); }; mBtn.onclick = function () { mode(true); };
    pvChoose = h('button', { type: 'button', class: 'btn btn--primary btn--sm', text: 'Diese Vorlage wählen', onclick: function () { choose(pvId); pv.close(); } });
    var close = h('button', { type: 'button', class: 'btn btn--ghost btn--sm', text: 'Schließen ✕', 'aria-label': 'Vorschau schließen', onclick: function () { pv.close(); } });
    pvFrame = h('iframe', { class: 'preview__frame', title: 'Demo-Vorschau der Designvorlage' });
    pvStage = h('div', { class: 'preview__stage' }, [pvFrame]);
    pv.appendChild(h('div', { class: 'preview__bar' }, [pvTitle, h('div', { class: 'seg', role: 'group', 'aria-label': 'Ansicht' }, [dBtn, mBtn]), pvChoose, close]));
    pv.appendChild(pvStage);
    pv.addEventListener('close', function () { pvFrame.src = 'about:blank'; if (pvLast && pvLast.focus) pvLast.focus(); });
    pv.addEventListener('click', function (e) { if (e.target === pv) pv.close(); });
    document.body.appendChild(pv);
    pv._mode = mode;
  }
  function openPreview(id, trigger) {
    var t = C.findTemplate(id); if (!t) return;
    if (!pv) buildPreview();
    pvLast = trigger; pvId = id;
    pv._mode(false);
    pvTitle.textContent = 'Vorschau: ' + t.name;
    pvFrame.src = t.demo;
    pvChoose.textContent = CART.state().cart.template === id ? 'Ausgewählt ✓' : 'Diese Vorlage wählen';
    pv.showModal();
  }

  /* ---------- Zusatzleistungen ---------- */
  var ICONS = {
    logo: '<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.3 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/>',
    text: '<path d="M5 4h14M5 9h14M5 14h9M5 19h6"/>',
    page: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M12 11v6M9 14h6"/>',
    building: '<path d="M4 21V8l8-5 8 5v13zM9 21v-6h6v6M9 11h2M13 11h2"/>',
    rocket: '<path d="M14 4c4 0 6 2 6 6l-6 6-6-6zM8 10l-4 1 3 3M14 16l-1 4-3-3M15 9h.01"/>',
    headset: '<path d="M4 14v-2a8 8 0 0116 0v2M4 14h3v5H4zM17 14h3v5h-3zM17 19c0 1.5-2 2-5 2"/>'
  };
  function renderAddons() {
    var wrap = $('#addons');
    cat.addons.forEach(function (a) {
      var ico = h('div', { class: 'addon__ico', 'aria-hidden': 'true' });
      ico.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[a.icon] || '') + '</svg>';
      var ul = h('ul', {}, a.details.map(function (d) { return h('li', { text: d }); }));
      var det = h('details', {}, [h('summary', { text: 'Leistungen anzeigen' }), ul]);
      if (window.matchMedia('(min-width:960px)').matches) det.open = true;
      var price = h('div', { class: 'addon__price' }, [
        (a.priceFrom ? 'ab ' : '') + euro(a.price) + ' ',
        h('small', { text: a.type === 'monthly' ? 'pro Monat, wiederkehrend' : (a.maxQty > 1 ? 'einmalig pro Stück' : 'einmalig') })
      ]);
      var btn = h('button', { type: 'button', class: 'btn btn--gold btn--sm', 'data-addon': a.id, 'aria-pressed': 'false', 'aria-label': a.name + ' hinzufügen', text: 'Hinzufügen +' });
      var card = h('article', { class: 'addon', 'data-addon-card': a.id }, [ico, h('h3', { text: a.name }), h('p', { text: a.short }), det, price, btn]);
      wrap.appendChild(card);
    });
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('[data-addon]'); if (!b) return;
      var r = CART.toggleAddon(b.getAttribute('data-addon'));
      if (!r.ok) UI.toast(r.error, 'error');
    });
  }
  function markAddons(s) {
    document.querySelectorAll('[data-addon]').forEach(function (b) {
      var id = b.getAttribute('data-addon'), on = !!s.cart.addons[id], a = C.findAddon(id);
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', a.name + (on ? ' entfernen' : ' hinzufügen'));
      b.textContent = on ? 'Hinzugefügt ✓' : 'Hinzufügen +';
      b.closest('.addon').classList.toggle('is-added', on);
    });
  }

  /* ---------- FAQ (Antworten nutzen die zentrale Konfiguration) ---------- */
  function renderFaq() {
    var p = function (k) { return priceText(k); };
    var op = cat.operator;
    var duration = op.deliveryTimeText
      ? 'Die Umsetzung dauert in der Regel ' + op.deliveryTimeText + ' ab Eingang aller Inhalte.'
      : 'Die Dauer hängt vor allem davon ab, wann Ihre Inhalte (Logo, Bilder, Texte) vollständig vorliegen. Den konkreten Zeitrahmen nennen wir Ihnen in der Auftragsbestätigung.';
    var expressInfo = ' Mit „Express-Erstellung“ (' + p('express') + ') wird Ihr Projekt bevorzugt bearbeitet' + (op.expressTimeText ? ' (Umsetzungsfrist: ' + op.expressTimeText + ')' : '; die konkrete Frist wird in der Auftragsbestätigung genannt') + '.';
    var items = [
      ['Was ist im Festpreis enthalten?', '<p>Für ' + p('base') + ' einmalig erhalten Sie ein komplettes Website-Erstellungspaket – nicht nur eine Vorlage:</p><ul>' + cat.base.includes.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul><p>Nicht enthalten sind: ' + cat.base.excludes.join('; ') + '.</p>'],
      ['Kann ich meine Designvorlage später ändern?', '<p>Bis zum Beginn der Umsetzung können Sie die Vorlage ändern; der Preis bleibt bei jeder Vorlage gleich. Ein Wechsel nach Umsetzungsbeginn ist nicht Teil des Korrekturdurchgangs und wird bei Bedarf separat angeboten.</p>'],
      ['Was passiert, wenn ich noch kein Logo habe?', '<p>Dann können Sie die „Logo-Erstellung“ (' + p('logo') + ' einmalig) hinzubuchen. Sie erhalten ' + (C.findAddon('logo').config.drafts) + ' Entwürfe zur Auswahl.</p>'],
      ['Kann ich Texte schreiben lassen?', '<p>Ja, mit der Zusatzleistung „Texterstellung“ (' + p('texte') + ' einmalig). Die Texte entstehen auf Basis der Informationen, die Sie uns bereitstellen. Wir erfinden keine Unternehmensangaben.</p>'],
      ['Welche Bilder muss ich bereitstellen?', '<p>Typischerweise Ihr Logo, ein Maklerporträt, Unternehmensbilder und Fotos Ihrer Immobilien. Sie müssen die Nutzungsrechte an den Bildern besitzen. Fehlende Inhalte können Sie teilweise über Zusatzleistungen abdecken.</p>'],
      ['Wie lange dauert die Erstellung?', '<p>' + duration + expressInfo + '</p>'],
      ['Ist Hosting enthalten?', '<p>Nein. Hosting und Domain sind nicht im Festpreis enthalten. Wir richten Ihre Website technisch ein und veröffentlichen sie im vereinbarten Umfang. Konditionen für Hosting und Domain werden vor Veröffentlichung gesondert mitgeteilt.</p>'],
      ['Was kostet die Website nach der Erstellung?', '<p>Der Festpreis von ' + p('base') + ' ist einmalig. Laufende Kosten können für Domain und Hosting entstehen (nicht im Festpreis enthalten). Der monatliche Support ist optional (' + p('support') + ').</p>'],
      ['Ist der monatliche Support verpflichtend?', '<p>Nein. Der Support ist ein separates, wiederkehrendes Angebot und wird nie automatisch ausgewählt. Er umfasst technische Unterstützung und bis zu ' + C.findAddon('support').config.smallChangesPerMonth + ' kleine Inhaltsänderungen pro Monat – keine unbegrenzten Änderungen.</p>'],
      ['Kann ich die Website später erweitern?', '<p>Ja. Zusätzliche Unterseiten kosten ' + p('unterseite') + ' pro Unterseite; weitere Funktionen stimmen wir individuell mit Ihnen ab.</p>'],
      ['Wie funktioniert die Bestellung?', '<p>Sie wählen eine Vorlage, fügen optional Zusatzleistungen hinzu, prüfen Ihre Bestellung und geben Ihre Kundendaten an. Anschließend teilen wir Ihnen mit, wie Sie Logo, Bilder und Texte bereitstellen. Eine Zahlung findet erst statt, wenn die Zahlungsabwicklung für Ihre Bestellung bestätigt wird.</p>']
    ];
    var wrap = $('#faq-list');
    items.forEach(function (it) {
      var d = h('details', {}, [h('summary', { text: it[0] })]);
      var ans = h('div', { class: 'ans' }); ans.innerHTML = it[1]; d.appendChild(ans);
      wrap.appendChild(d);
    });
  }

  /* Dezente Bewegung: Zierlinie über den Sektionsüberschriften wird beim Einblenden gezeichnet */
  function initReveal() {
    var heads = document.querySelectorAll('.section__head');
    if (!('IntersectionObserver' in window)) { heads.forEach(function (n) { n.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .4 });
    heads.forEach(function (n) { io.observe(n); });
  }

  /* Mobil: Festpreis-Leiste mit kontextabhängiger Aktion (erscheint nach dem Hero) */
  var mbarState = null;
  function initMobileBar() {
    var bar = $('#mbar'), btn = $('#mbar-btn'), hero = $('.hero');
    if (!bar || !hero) return;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { bar.classList.toggle('is-on', !es[0].isIntersecting); }, { threshold: 0 }).observe(hero);
    btn.addEventListener('click', function () {
      var s = CART.state();
      if (!s.cart.template) { $('#designvorlagen').scrollIntoView({ behavior: 'smooth' }); return; }
      if (!s.cart.base) { CART.addBase(); UI.toast('Die Makler-Website wurde in den Warenkorb gelegt.'); return; }
      location.href = 'bestellung.html';
    });
    CART.onChange(function (s) { btn.textContent = !s.cart.template ? 'Vorlage wählen' : !s.cart.base ? 'In den Warenkorb' : 'Zur Kasse'; });
  }

  fillPrices(); renderBase(); renderTemplates(); renderAddons(); renderFaq(); initReveal(); initMobileBar();
  CART.onChange(function (s) { markSelected(s); markAddons(s); });
})();
