/*
 * Betreiber-Konfiguration (keine Geheimnisse hier ablegen – diese Datei ist öffentlich!).
 * Siehe docs/BACKEND.md für die Backend-/Zahlungsanbindung.
 */
window.MW_CONFIG = {
  /*
   * URL des Bestell-Backends (POST, JSON). Solange null, wird die Bestellung NICHT
   * übermittelt, sondern nur als Anfrage vorbereitet (E-Mail/Datei-Download).
   */
  orderEndpoint: null,

  /* E-Mail-Adresse für Bestellanfragen (mailto-Fallback). null = Fallback deaktiviert. */
  orderEmail: null,

  /*
   * 'request' = unverbindliche Bestellanfrage, keine Zahlung (Standard ohne Zahlungsanbieter)
   * 'live'    = zahlungspflichtige Bestellung; nur aktivieren, wenn Backend + Zahlungsanbieter laufen.
   */
  checkoutMode: 'request',

  /* Pfade zu den Rechtstexten */
  legal: { impressum: 'impressum.html', datenschutz: 'datenschutz.html', agb: 'agb.html', widerruf: 'widerruf.html' }
};
