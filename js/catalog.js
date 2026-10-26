/*
 * MAKLERWEB – zentrale Produkt- und Preiskonfiguration (einzige Quelle für Preise).
 *
 * Läuft im Browser (window.MW_CATALOG) und in Node (require) – dadurch kann ein
 * späteres Backend dieselbe Datei für die serverseitige Preisvalidierung nutzen.
 * Alle Preise sind in Cent-genauen Euro-Beträgen konfigurierbar.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MW_CATALOG = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var catalog = {
    currency: 'EUR',

    /* Offene Betreiber-Konfiguration: bitte vor Livegang festlegen. */
    operator: {
      // 'inkl' | 'zzgl' | 'kleinunternehmer' | null (= noch nicht festgelegt)
      taxMode: null,
      deliveryTimeText: null, // z. B. '5–10 Werktage' – nur eintragen, wenn organisatorisch realistisch
      expressTimeText: null   // z. B. '3 Werktage'
    },

    base: {
      id: 'website',
      name: 'Makler-Website',
      price: 799,
      includes: [
        'Auswahl aus allen Designvorlagen',
        'Anpassung an Ihr Logo, Ihre Farben und Kontaktdaten',
        'Startseite + bis zu 3 Unterseiten (z. B. Über uns, Leistungen, Kontakt)',
        'Mobiloptimiertes Design für alle Geräte',
        'Kontaktformular bzw. passende Kontaktfunktion sowie Telefon- und E-Mail-Verlinkung',
        'Einbindung Ihrer bereitgestellten Texte und Bilder',
        'Technische Einrichtung und Veröffentlichung im vereinbarten Umfang',
        'Ein Korrekturdurchgang'
      ],
      excludes: [
        'Hosting und Domain (Kosten nach Erstellung: siehe FAQ)',
        'Rechtliche Prüfung Ihrer Inhalte (Impressum, Datenschutz, Widerruf etc.)',
        'Dauerhafte Wartung (nur über das optionale Support-Abo)',
        'Logo, Texte und Fotos, sofern nicht separat gebucht'
      ]
    },

    templates: [
      { id: 'klassisch',   name: 'Klassisch & Elegant',      audience: 'Etablierte Makler und kleinere Maklerbüros',
        description: 'Ruhiges, seriöses Layout mit großem Immobilienmotiv in Creme und Beige.',
        demo: 'demo/klassisch.html' },
      { id: 'urban',       name: 'Urban & Modern',           audience: 'Urbane Wohn- und Kapitalanlageobjekte',
        description: 'Dunkles Navy, markante Überschriften und ein modernes Rasterlayout.',
        demo: 'demo/urban.html' },
      { id: 'persoenlich', name: 'Persönlich & Vertrauensvoll', audience: 'Selbstständige Makler mit persönlicher Beratung',
        description: 'Großes Maklerporträt, warme Farben und klare Kontaktwege.',
        demo: 'demo/persoenlich.html' },
      { id: 'regional',    name: 'Regional & Nahbar',        audience: 'Regional tätige Makler mit lokaler Marktkenntnis',
        description: 'Helle, natürliche Farben und der Fokus auf Ihre Region.',
        demo: 'demo/regional.html' },
      { id: 'premium',     name: 'Premium & Architektur',    audience: 'Hochwertige Wohnimmobilien und Architektur',
        description: 'Großflächige Bildwelt, minimalistisch und mit viel Weißraum.',
        demo: 'demo/premium.html' }
    ],

    /*
     * type: 'once' (einmalig) | 'monthly' (wiederkehrend)
     * maxQty > 1  => Menge wählbar
     */
    addons: [
      { id: 'logo', name: 'Logo-Erstellung', price: 149, type: 'once', maxQty: 1, icon: 'logo',
        short: 'Professionelles Logo für Ihren Markenauftritt.',
        details: ['Entwicklung eines professionellen Logos', 'Abstimmung auf die gewählte Website', 'Zwei Designentwürfe zur Auswahl'],
        config: { drafts: 2 } },
      { id: 'texte', name: 'Texterstellung', price: 199, type: 'once', maxQty: 1, icon: 'text',
        short: 'Individuelle Website-Texte auf Basis Ihrer Angaben.',
        details: ['Texte auf Basis Ihrer bereitgestellten Informationen', 'Überarbeitung für eine klare Ansprache', 'Strukturierung der Inhalte für die Website'] },
      { id: 'unterseite', name: 'Zusätzliche Unterseite', price: 49, type: 'once', maxQty: 10, icon: 'page',
        short: 'z. B. Team, Referenzen, Region oder Ratgeber – pro Unterseite.',
        details: ['Preis pro Unterseite', 'Beispiele: Team, Leistungen, Referenzen, Region, Ratgeber'] },
      { id: 'objekte', name: 'Erweiterte Objektpräsentation', price: 199, type: 'once', maxQty: 1, icon: 'building',
        short: 'Erweiterte Darstellung Ihrer Immobilienangebote.',
        details: ['Erweiterte Darstellung von Immobilienangeboten', 'Keine Schnittstelle zu Immobilienportalen oder Maklersoftware enthalten', 'Umfang der Objektfunktionen wird vor Beauftragung abgestimmt'] },
      { id: 'express', name: 'Express-Erstellung', price: 149, type: 'once', maxQty: 1, icon: 'rocket',
        short: 'Bevorzugte Bearbeitung mit kürzerer Umsetzungsfrist.',
        details: ['Bevorzugte Bearbeitung', 'Kürzere Umsetzungsfrist – der konkrete Termin wird in der Auftragsbestätigung genannt'] },
      { id: 'support', name: 'Monatlicher Support', price: 29, priceFrom: true, type: 'monthly', maxQty: 1, icon: 'headset',
        short: 'Updates, Sicherheit und technischer Support.',
        details: [
          'Technische Unterstützung und Hilfe bei Fragen zur Website',
          'Bis zu 2 kleine vereinbarte Inhaltsänderungen pro Monat',
          'Technische Aktualisierungen, soweit im vereinbarten Hosting- und Wartungsmodell möglich',
          'Keine unbegrenzten Änderungen; größere Änderungen werden separat angeboten'
        ],
        config: { smallChangesPerMonth: 2 } }
    ]
  };

  function findAddon(id) {
    for (var i = 0; i < catalog.addons.length; i++) if (catalog.addons[i].id === id) return catalog.addons[i];
    return null;
  }
  function findTemplate(id) {
    for (var i = 0; i < catalog.templates.length; i++) if (catalog.templates[i].id === id) return catalog.templates[i];
    return null;
  }

  /**
   * Normalisiert einen (potenziell manipulierten) Warenkorb auf gültige Werte.
   * cart = { base: boolean, template: string|null, addons: { [id]: qty } }
   */
  function normalizeCart(cart) {
    var out = { base: false, template: null, addons: {} };
    if (!cart || typeof cart !== 'object') return out;
    out.base = cart.base === true;
    if (typeof cart.template === 'string' && findTemplate(cart.template)) out.template = cart.template;
    var src = cart.addons && typeof cart.addons === 'object' ? cart.addons : {};
    Object.keys(src).forEach(function (id) {
      var a = findAddon(id);
      var q = Math.floor(Number(src[id]));
      if (!a || !isFinite(q) || q < 1) return;
      out.addons[id] = Math.min(q, a.maxQty);
    });
    return out;
  }

  /** Berechnet alle Positionen und Summen aus der Konfiguration (Cent-genau). */
  function priceCart(cart) {
    var c = normalizeCart(cart);
    var lines = [];
    var once = 0, monthly = 0;
    if (c.base) {
      lines.push({ id: catalog.base.id, name: catalog.base.name, type: 'once', qty: 1, unit: catalog.base.price, total: catalog.base.price, base: true });
      once += catalog.base.price * 100;
    }
    catalog.addons.forEach(function (a) {
      var q = c.addons[a.id];
      if (!q) return;
      var total = a.price * q;
      lines.push({ id: a.id, name: a.name, type: a.type, qty: q, unit: a.price, total: total, maxQty: a.maxQty });
      if (a.type === 'monthly') monthly += total * 100; else once += total * 100;
    });
    var problems = [];
    if (!c.base) problems.push('Die Makler-Website (Grundprodukt) ist noch nicht im Warenkorb.');
    if (c.base && !c.template) problems.push('Bitte wählen Sie eine Designvorlage.');
    return {
      cart: c, lines: lines,
      oneTimeTotal: once / 100, monthlyTotal: monthly / 100,
      itemCount: lines.length, problems: problems,
      valid: problems.length === 0
    };
  }

  var fmt = null;
  function formatEuro(n, withCents) {
    if (typeof Intl !== 'undefined') {
      fmt = fmt || {};
      var key = withCents ? 'c' : 'n';
      fmt[key] = fmt[key] || new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: withCents ? 2 : 0, maximumFractionDigits: 2
      });
      return fmt[key].format(n) + ' €';
    }
    return n + ' €';
  }

  return {
    catalog: catalog, findAddon: findAddon, findTemplate: findTemplate,
    normalizeCart: normalizeCart, priceCart: priceCart, formatEuro: formatEuro
  };
});
