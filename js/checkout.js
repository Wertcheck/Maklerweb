/* Bestellablauf: Konfigurieren → Prüfen → Kundendaten → Abschluss.
 * Preise stammen ausschließlich aus catalog.js; das Backend MUSS sie erneut berechnen (docs/BACKEND.md). */
(function () {
  'use strict';
  var C = window.MW_CATALOG, CART = window.MW_CART, UI = window.MW_UI, CFG = window.MW_CONFIG || {};
  var h = UI.h, euro = C.formatEuro, cat = C.catalog;
  var stage = document.getElementById('stage'), summary = document.getElementById('summary'), stepper = document.getElementById('stepper');
  var step = 1;
  var customer = {};        // nur im Arbeitsspeicher, nie in localStorage
  var consent = { agb: false, privacy: false, withdrawal: false };
  var result = null;
  var submitting = false;

  /* ---------- Zusammenfassung (Seitenleiste) ---------- */
  function renderSummary(s) {
    summary.textContent = '';
    if (!s.lines.length) { summary.appendChild(h('p', { class: 'muted', text: 'Noch nichts im Warenkorb.' })); return; }
    var t = s.cart.template && C.findTemplate(s.cart.template);
    var ul = h('ul', { class: 'sum-lines' });
    s.lines.forEach(function (l) {
      var label = l.name + (l.qty > 1 ? ' × ' + l.qty : '') + (l.base && t ? ' (' + t.name + ')' : '');
      ul.appendChild(h('li', {}, [h('span', { text: label }), h('strong', { text: euro(l.total) + (l.type === 'monthly' ? ' / Monat' : '') })]));
    });
    summary.appendChild(ul);
    summary.appendChild(h('div', { class: 'sum-box' }, [
      h('div', { class: 'small muted', text: 'Einmaliger Gesamtpreis' }),
      h('div', { class: 'totals__big', style: 'font-size:28px;font-weight:700;color:var(--navy)', text: euro(s.oneTimeTotal) }),
      s.monthlyTotal > 0 ? h('div', { class: 'small', style: 'margin-top:8px', text: 'Zusätzlich wiederkehrend: ' + euro(s.monthlyTotal) + ' pro Monat' }) : null
    ]));
    summary.appendChild(h('p', { class: 'muted small', text: UI.taxText() }));
  }

  function setStepper() {
    Array.prototype.forEach.call(stepper.children, function (li, i) {
      li.className = i + 1 < step ? 'done' : '';
      if (i + 1 === step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
  }
  function go(n, focus) {
    step = n; render(); setStepper();
    if (focus !== false) { stage.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }

  /* ---------- Schritt 1: Konfigurieren ---------- */
  function step1() {
    var s = CART.state();
    var p = h('section', { class: 'panel', 'aria-labelledby': 's1h' });
    p.appendChild(h('h2', { id: 's1h', text: 'Vorlage und Leistungen' }));
    p.appendChild(h('p', { class: 'muted', text: 'Die Makler-Website kostet ' + euro(cat.base.price) + ' einmalig – bei jeder Vorlage.' }));
    var fs = h('fieldset', { style: 'border:0;padding:0;margin:0 0 22px' }, [h('legend', { class: 'small', style: 'font-weight:700;margin-bottom:8px', text: 'Designvorlage' })]);
    var grid = h('div', { class: 'tpl-pick' });
    cat.templates.forEach(function (t) {
      var inp = h('input', { type: 'radio', name: 'tpl', value: t.id });
      if (s.cart.template === t.id) inp.checked = true;
      inp.addEventListener('change', function () { CART.setTemplate(t.id); clearErr(); });
      grid.appendChild(h('label', {}, [inp, h('span', {}, [t.name, h('small', { text: t.audience }), h('a', { href: UI.pathTo('index.html#designvorlagen'), class: 'small', text: 'Vorschau auf der Startseite', target: '_blank', rel: 'noopener' })])]));
    });
    fs.appendChild(grid); p.appendChild(fs);
    p.appendChild(h('div', { id: 's1err', role: 'alert' }));

    var fa = h('fieldset', { style: 'border:0;padding:0;margin:0' }, [h('legend', { class: 'small', style: 'font-weight:700;margin-bottom:8px', text: 'Optionale Zusatzleistungen' })]);
    var list = h('div', { class: 'opts' });
    cat.addons.forEach(function (a) {
      var id = 'opt-' + a.id;
      var cb = h('input', { type: 'checkbox', id: id });
      cb.checked = !!s.cart.addons[a.id];
      cb.addEventListener('change', function () { CART.toggleAddon(a.id); render(true); });
      var main = h('div', { class: 'opt__main' }, [h('label', { for: id, style: 'font-weight:600;cursor:pointer', text: a.name }), h('small', { text: a.short })]);
      if (a.maxQty > 1 && s.cart.addons[a.id]) {
        var q = h('input', { type: 'number', class: 'qty', min: '1', max: String(a.maxQty), value: String(s.cart.addons[a.id]), 'aria-label': 'Anzahl ' + a.name });
        q.addEventListener('change', function () { var r = CART.setQty(a.id, q.value); if (!r.ok) UI.toast(r.error, 'error'); render(true); });
        main.appendChild(h('label', { class: 'small' }, ['Anzahl: ', q]));
      }
      list.appendChild(h('div', { class: 'opt' }, [cb, main, h('strong', { class: 'p', text: (a.priceFrom ? 'ab ' : '') + euro(a.price) + (a.type === 'monthly' ? ' / Monat' : '') })]));
    });
    fa.appendChild(list); p.appendChild(fa);
    p.appendChild(h('div', { class: 'nav-row' }, [h('span'), h('button', { type: 'button', class: 'btn btn--primary', text: 'Weiter zur Prüfung →', onclick: function () {
      var st = CART.state();
      if (!st.cart.template) { showErr('Bitte wählen Sie eine Designvorlage, um fortzufahren.'); return; }
      CART.addBase(); go(2);
    } })]));
    return p;
  }
  function showErr(m) { var e = document.getElementById('s1err'); if (e) { e.textContent = ''; e.appendChild(h('p', { class: 'notice notice--err', text: m })); } }
  function clearErr() { var e = document.getElementById('s1err'); if (e) e.textContent = ''; }

  /* ---------- Schritt 2: Prüfen ---------- */
  function step2() {
    var s = CART.state();
    var p = h('section', { class: 'panel', 'aria-labelledby': 's2h' });
    p.appendChild(h('h2', { id: 's2h', text: 'Bestellung prüfen' }));
    if (!s.valid) {
      s.problems.forEach(function (m) { p.appendChild(h('p', { class: 'notice notice--warn', text: m })); });
      p.appendChild(h('button', { type: 'button', class: 'btn btn--primary', text: '← Zurück zur Konfiguration', onclick: function () { go(1); } }));
      return p;
    }
    var t = C.findTemplate(s.cart.template);
    p.appendChild(h('p', {}, [h('strong', { text: 'Gewählte Vorlage: ' }), t.name + ' ', h('button', { type: 'button', class: 'link-btn', text: 'ändern', onclick: function () { go(1); } })]));
    p.appendChild(h('div', { class: 'lists' }, [
      h('div', {}, [h('strong', { text: 'Im Festpreis enthalten' }), h('ul', {}, cat.base.includes.map(function (x) { return h('li', { text: x }); }))]),
      h('div', {}, [h('strong', { text: 'Nicht enthalten' }), h('ul', {}, cat.base.excludes.map(function (x) { return h('li', { text: x }); }))])
    ]));
    var ul = h('ul', { class: 'sum-lines' });
    s.lines.forEach(function (l) {
      ul.appendChild(h('li', {}, [h('span', { text: l.name + (l.qty > 1 ? ' × ' + l.qty + ' (je ' + euro(l.unit) + ')' : '') + (l.type === 'monthly' ? ' – monatlich wiederkehrend' : ' – einmalig') }), h('strong', { text: euro(l.total) })]));
    });
    p.appendChild(ul);
    p.appendChild(h('div', { class: 'sum-box' }, [
      h('div', {}, [h('strong', { text: 'Einmaliger Gesamtpreis: ' + euro(s.oneTimeTotal) })]),
      s.monthlyTotal > 0 ? h('div', { text: 'Wiederkehrend: ' + euro(s.monthlyTotal) + ' pro Monat (separat vom einmaligen Preis; das Abo wird nur bei aktiver Auswahl gebucht)' }) : h('div', { class: 'small muted', text: 'Kein monatliches Abo gewählt.' })
    ]));
    p.appendChild(h('p', { class: 'muted small', text: UI.taxText() }));
    p.appendChild(h('div', { class: 'nav-row' }, [
      h('button', { type: 'button', class: 'btn btn--ghost', text: '← Zurück', onclick: function () { go(1); } }),
      h('button', { type: 'button', class: 'btn btn--primary', text: 'Weiter zu den Kundendaten →', onclick: function () { go(3); } })
    ]));
    return p;
  }

  /* ---------- Schritt 3: Kundendaten ---------- */
  var FIELDS = [
    { k: 'company', label: 'Firmenname bzw. Name', req: true, auto: 'organization' },
    { k: 'contact', label: 'Ansprechpartner', req: true, auto: 'name' },
    { k: 'email', label: 'E-Mail-Adresse', req: true, type: 'email', auto: 'email' },
    { k: 'phone', label: 'Telefon (optional)', type: 'tel', auto: 'tel', hint: 'Für Rückfragen zur Umsetzung.' },
    { k: 'street', label: 'Straße und Hausnummer', req: true, auto: 'street-address' },
    { k: 'zip', label: 'PLZ', req: true, auto: 'postal-code', pattern: /^\d{5}$/, msg: 'Bitte eine 5-stellige PLZ angeben.', half: true },
    { k: 'city', label: 'Ort', req: true, auto: 'address-level2', half: true }
  ];
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function validate(form) {
    var errs = [];
    FIELDS.forEach(function (f) {
      var v = (customer[f.k] || '').trim();
      if (f.req && !v) errs.push({ k: f.k, m: f.label + ' ist ein Pflichtfeld.' });
      else if (v && f.type === 'email' && !EMAIL.test(v)) errs.push({ k: f.k, m: 'Bitte eine gültige E-Mail-Adresse angeben.' });
      else if (v && f.pattern && !f.pattern.test(v)) errs.push({ k: f.k, m: f.msg });
      else if (v.length > 200) errs.push({ k: f.k, m: f.label + ' ist zu lang (max. 200 Zeichen).' });
    });
    if ((customer.notes || '').length > 2000) errs.push({ k: 'notes', m: 'Die Hinweise sind zu lang (max. 2000 Zeichen).' });
    if (!consent.agb) errs.push({ k: 'c-agb', m: 'Bitte bestätigen Sie die AGB.' });
    if (!consent.privacy) errs.push({ k: 'c-privacy', m: 'Bitte bestätigen Sie die Kenntnisnahme der Datenschutzerklärung.' });
    if (!consent.withdrawal) errs.push({ k: 'c-withdrawal', m: 'Bitte bestätigen Sie die Widerrufsbelehrung.' });
    return errs;
  }

  function step3(errs) {
    errs = errs || [];
    var s = CART.state();
    var live = CFG.checkoutMode === 'live';
    var p = h('section', { class: 'panel', 'aria-labelledby': 's3h' });
    p.appendChild(h('h2', { id: 's3h', text: 'Kundendaten' }));
    if (!live) p.appendChild(h('p', { class: 'notice notice--warn', text: 'Hinweis: Aktuell ist keine Online-Zahlung angebunden. Sie senden eine unverbindliche Bestellanfrage; es erfolgt keine Zahlung und kein Vertragsschluss durch diesen Klick.' }));
    var form = h('form', { novalidate: 'novalidate', id: 'order-form' });
    if (errs.length) {
      var sum = h('div', { class: 'error-summary', role: 'alert', tabindex: '-1', id: 'err-sum' }, [h('h3', { text: 'Bitte korrigieren Sie folgende Angaben:' }),
        h('ul', {}, errs.map(function (e) { return h('li', {}, [h('a', { href: '#f-' + e.k, text: e.m })]); }))]);
      form.appendChild(sum);
    }
    var errOf = function (k) { return errs.filter(function (e) { return e.k === k; })[0]; };
    var row = null;
    FIELDS.forEach(function (f) {
      var e = errOf(f.k), id = 'f-' + f.k;
      var inp = h('input', { id: id, name: f.k, type: f.type || 'text', autocomplete: f.auto, maxlength: '200', value: customer[f.k] || '' });
      if (f.req) { inp.setAttribute('required', ''); inp.setAttribute('aria-required', 'true'); }
      if (f.k === 'zip') { inp.setAttribute('inputmode', 'numeric'); }
      var desc = [];
      if (f.hint) desc.push(id + '-h');
      if (e) { inp.setAttribute('aria-invalid', 'true'); desc.push(id + '-e'); }
      if (desc.length) inp.setAttribute('aria-describedby', desc.join(' '));
      inp.addEventListener('input', function () { customer[f.k] = inp.value; });
      var fld = h('div', { class: 'field' }, [h('label', { for: id, text: f.label + (f.req ? ' *' : '') }), inp,
        f.hint ? h('span', { class: 'hint', id: id + '-h', text: f.hint }) : null, e ? h('span', { class: 'err', id: id + '-e', text: e.m }) : null]);
      if (f.half) { if (!row) { row = h('div', { class: 'grid2' }); form.appendChild(row); } row.appendChild(fld); } else form.appendChild(fld);
    });
    var ta = h('textarea', { id: 'f-notes', name: 'notes', rows: '4', maxlength: '2000' }); ta.value = customer.notes || '';
    ta.addEventListener('input', function () { customer.notes = ta.value; });
    form.appendChild(h('div', { class: 'field' }, [h('label', { for: 'f-notes', text: 'Hinweise zum Projekt (optional)' }), ta]));

    function chk(key, id, children) {
      var e = errOf(id);
      var c = h('input', { type: 'checkbox', id: 'f-' + id }); c.checked = consent[key];
      if (e) { c.setAttribute('aria-invalid', 'true'); c.setAttribute('aria-describedby', id + '-e'); }
      c.addEventListener('change', function () { consent[key] = c.checked; });
      return h('div', { style: 'margin-bottom:10px' }, [h('div', { class: 'check' }, [c, h('label', { for: 'f-' + id }, children)]), e ? h('span', { class: 'err', id: id + '-e', style: 'color:var(--err);font-weight:600;font-size:13px', text: e.m }) : null]);
    }
    var L = CFG.legal || {};
    var lnk = function (href, t) { return h('a', { href: href, target: '_blank', rel: 'noopener', text: t }); };
    form.appendChild(chk('agb', 'c-agb', ['Ich habe die ', lnk(L.agb, 'AGB'), ' gelesen und akzeptiere sie. *']));
    form.appendChild(chk('privacy', 'c-privacy', ['Ich habe die ', lnk(L.datenschutz, 'Datenschutzerklärung'), ' zur Kenntnis genommen. *']));
    form.appendChild(chk('withdrawal', 'c-withdrawal', ['Ich habe die ', lnk(L.widerruf, 'Widerrufsbelehrung'), ' zur Kenntnis genommen. *']));
    form.appendChild(h('p', { class: 'muted small', text: 'Mit * markierte Felder sind Pflichtfelder. Dateien (Logo, Bilder) laden Sie nicht hier hoch – dazu erhalten Sie nach Ihrer Bestellung Informationen.' }));

    var label = live ? 'Zahlungspflichtig bestellen' : 'Unverbindliche Bestellanfrage senden';
    var submit = h('button', { type: 'submit', class: 'btn btn--gold', id: 'submit-btn' });
    submit.textContent = label;
    if (submitting) { submit.disabled = true; submit.textContent = ''; submit.appendChild(h('span', { class: 'spinner', 'aria-hidden': 'true' })); submit.appendChild(document.createTextNode(' Wird gesendet …')); }
    form.appendChild(h('div', { class: 'nav-row' }, [h('button', { type: 'button', class: 'btn btn--ghost', text: '← Zurück', onclick: function () { go(2); } }), submit]));
    form.appendChild(h('div', { id: 'submit-err', role: 'alert' }));
    form.addEventListener('submit', function (ev) { ev.preventDefault(); onSubmit(); });
    p.appendChild(form);
    if (!s.valid) p.insertBefore(h('p', { class: 'notice notice--warn', text: s.problems[0] }), form);
    if (errs.length) setTimeout(function () { var e = document.getElementById('err-sum'); if (e) e.focus(); }, 0);
    return p;
  }

  /* ---------- Absenden ---------- */
  function orderNumber() {
    var d = new Date(), pad = function (n) { return String(n).padStart(2, '0'); };
    var a = new Uint8Array(4); (window.crypto || {}).getRandomValues ? window.crypto.getRandomValues(a) : a.forEach(function (_, i) { a[i] = Math.floor(Math.random() * 256); });
    var rnd = Array.prototype.map.call(a, function (b) { return b.toString(16).padStart(2, '0'); }).join('').toUpperCase();
    return 'MW-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + rnd;
  }
  function buildPayload(s) {
    return {
      template: s.cart.template,
      items: Object.keys(s.cart.addons).map(function (id) { return { id: id, qty: s.cart.addons[id] }; }),
      customer: {
        company: customer.company.trim(), contact: customer.contact.trim(), email: customer.email.trim(), phone: (customer.phone || '').trim(),
        street: customer.street.trim(), zip: customer.zip.trim(), city: customer.city.trim(), notes: (customer.notes || '').trim()
      },
      consent: { agb: true, privacy: true, withdrawal: true, at: new Date().toISOString() },
      clientTotals: { oneTime: s.oneTimeTotal, monthly: s.monthlyTotal } // nur zur Plausibilisierung – maßgeblich ist die Serverberechnung
    };
  }
  function onSubmit() {
    if (submitting) return;
    var errs = validate();
    var s = CART.state();
    if (!s.valid) { UI.toast(s.problems[0], 'error'); go(1); return; }
    if (errs.length) { render(errs); return; }
    var payload = buildPayload(s);
    if (!CFG.orderEndpoint) {
      result = { sent: false, orderNumber: orderNumber(), status: 'Anfrage vorbereitet – noch nicht übermittelt, nicht bezahlt', payload: payload, snapshot: s };
      go(4); return;
    }
    submitting = true; render();
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 20000);
    fetch(CFG.orderEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctl && ctl.signal })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || ('Serverfehler (' + r.status + ')')); return j; }); })
      .then(function (j) {
        if (!j.orderNumber) throw new Error('Ungültige Antwort des Servers.');
        if (j.paymentUrl && /^https:\/\//.test(j.paymentUrl)) { window.location.href = j.paymentUrl; return; }
        result = { sent: true, orderNumber: String(j.orderNumber), status: j.status === 'paid' ? 'Bezahlt' : 'Bestellung übermittelt – Zahlung noch nicht bestätigt', payload: payload, snapshot: s };
        CART.clear(); submitting = false; go(4);
      })
      .catch(function (e) {
        submitting = false; render();
        var msg = e.name === 'AbortError' ? 'Zeitüberschreitung. Bitte versuchen Sie es erneut.' : (e.message || 'Unbekannter Fehler');
        var box = document.getElementById('submit-err');
        if (box) box.appendChild(h('p', { class: 'notice notice--err', text: 'Ihre Bestellung konnte nicht übermittelt werden: ' + msg + ' Ihre Eingaben sind erhalten geblieben. Es wurde keine Zahlung ausgelöst.' }));
      }).then(function () { clearTimeout(timer); });
  }

  /* ---------- Schritt 4: Abschluss ---------- */
  function lines(snap, r) {
    var t = C.findTemplate(snap.cart.template), out = [];
    out.push('Bestellreferenz: ' + r.orderNumber, 'Status: ' + r.status, '', 'Vorlage: ' + t.name);
    snap.lines.forEach(function (l) { out.push('- ' + l.name + (l.qty > 1 ? ' x ' + l.qty : '') + ': ' + euro(l.total) + (l.type === 'monthly' ? ' / Monat' : ' einmalig')); });
    out.push('Einmalig gesamt: ' + euro(snap.oneTimeTotal), 'Monatlich: ' + euro(snap.monthlyTotal), '', UI.taxText(), '');
    var c = r.payload.customer;
    out.push(c.company, c.contact, c.street, c.zip + ' ' + c.city, c.email, c.phone, '', 'Hinweise: ' + c.notes);
    return out.join('\n');
  }
  function step4() {
    var r = result;
    if (!r) return step1();
    var p = h('section', { class: 'panel', 'aria-labelledby': 's4h' });
    p.appendChild(h('h2', { id: 's4h', text: r.sent ? 'Vielen Dank für Ihre Bestellung' : 'Ihre Bestellanfrage ist vorbereitet' }));
    p.appendChild(h('p', {}, ['Referenz: ', h('span', { class: 'order-no', text: r.orderNumber })]));
    p.appendChild(h('p', {}, [h('span', { class: 'status', text: r.status })]));
    if (!r.sent) {
      p.appendChild(h('p', { class: 'notice notice--warn', text: 'Wichtig: Ihre Anfrage wurde noch NICHT an MAKLERWEB übermittelt und es wurde nichts bezahlt. Senden Sie sie jetzt per E-Mail oder laden Sie die Zusammenfassung herunter.' }));
      var acts = h('div', { style: 'display:flex;gap:10px;flex-wrap:wrap;margin:10px 0 18px' });
      var text = lines(r.snapshot, r);
      if (CFG.orderEmail) acts.appendChild(h('a', { class: 'btn btn--primary', text: 'Per E-Mail senden', href: 'mailto:' + CFG.orderEmail + '?subject=' + encodeURIComponent('Bestellanfrage ' + r.orderNumber) + '&body=' + encodeURIComponent(text) }));
      else p.appendChild(h('p', { class: 'notice notice--err', text: 'Es ist noch keine Empfänger-Adresse bzw. kein Bestell-Backend konfiguriert (offene Betreiber-Konfiguration). Bitte laden Sie die Zusammenfassung herunter.' }));
      acts.appendChild(h('button', { type: 'button', class: 'btn btn--ghost', text: 'Zusammenfassung herunterladen', onclick: function () {
        var blob = new Blob([text], { type: 'text/plain;charset=utf-8' }), a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = r.orderNumber + '.txt'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      } }));
      p.appendChild(acts);
    }
    p.appendChild(h('h3', { text: 'Nächster Schritt: Inhalte bereitstellen', style: 'font-size:22px;margin:18px 0 8px' }));
    p.appendChild(h('p', { text: 'Für die Umsetzung benötigen wir – soweit nicht über Zusatzleistungen gebucht:' }));
    var snap = r.snapshot, a = snap.cart.addons;
    var items = [
      [!a.logo, 'Logo (Datei), alternativ Zusatzleistung „Logo-Erstellung“'],
      ['Maklerporträt', 'Foto in guter Qualität'],
      ['Immobilien- und Unternehmensbilder', 'nur mit Nutzungsrechten'],
      [!a.texte, 'Texte (Über uns, Leistungen …), alternativ „Texterstellung“'],
      ['Kontaktdaten', 'Telefon, E-Mail, Adresse, Öffnungszeiten']
    ];
    p.appendChild(h('ul', {}, items.map(function (it) { return h('li', { text: typeof it[0] === 'string' ? it[0] + ' – ' + it[1] : it[1] }); }).filter(function (_, i) { return items[i][0] !== false; })));
    p.appendChild(h('p', { class: 'notice notice--warn', text: 'Ein Datei-Upload ist in dieser Website derzeit nicht aktiv (es gibt noch kein sicheres Backend). Nach Ihrer Bestellung erhalten Sie von uns einen Übermittlungsweg für Ihre Dateien.' }));
    p.appendChild(h('div', { class: 'nav-row' }, [h('a', { class: 'btn btn--ghost', href: 'index.html', text: 'Zur Startseite' }), h('span')]));
    return p;
  }

  function render(errs) {
    var s = CART.state();
    var keep = errs === true && document.activeElement ? document.activeElement.id : null;
    if (Array.isArray(errs) === false) errs = undefined;
    stage.textContent = '';
    stage.appendChild(step === 1 ? step1() : step === 2 ? step2() : step === 3 ? step3(errs) : step4());
    setStepper();
    document.querySelector('.summary').hidden = step === 4 && !!result;
    if (keep) { var el = document.getElementById(keep); if (el) el.focus(); }
    void s;
  }

  CART.onChange(function (s) { renderSummary(s); });
  render();
})();
