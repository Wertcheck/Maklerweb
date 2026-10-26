# Offene Punkte vor Veröffentlichung

- [ ] **Umsatzsteuer-Darstellung** festlegen: `operator.taxMode` in `js/catalog.js` (`inkl` | `zzgl` | `kleinunternehmer`). Bis dahin zeigt die Seite einen sichtbaren Platzhalterhinweis.
- [ ] **Impressum, Datenschutz, AGB, Widerruf**: gelb markierte Platzhalter ausfüllen, rechtlich prüfen (inkl. Widerrufsausnahmen, Abo-Bedingungen, Button-Beschriftung, Hosting-Hinweis GitHub Pages, Upload-Datenschutz).
- [ ] **Bestell-Backend + Zahlung** (siehe `docs/BACKEND.md`); `orderEndpoint`/`orderEmail`/`checkoutMode` in `js/config.js`.
- [ ] **Upload** (sicherer Speicher) umsetzen.
- [ ] Preise/Leistungsumfang bestätigen (`js/catalog.js`): Beispielpreise, Anzahl Logo-Entwürfe (2), Support-Umfang (2 kleine Änderungen/Monat), Lieferzeit `deliveryTimeText`/`expressTimeText` (nur eintragen, wenn realistisch).
- [ ] FAQ-Regelungen bestätigen (Vorlagenwechsel bis Umsetzungsbeginn; Hosting/Domain-Konditionen).
- [ ] Platzhalter-Illustrationen (`assets/img`) durch lizenzierte Fotos ersetzen.
- [ ] Open-Graph-URL (`index.html`) an die echte Domain anpassen (aktuell Annahme `wertcheck.github.io/Maklerweb`).
- [ ] Cookie-Banner nur nötig, wenn Tracking/Drittdienste ergänzt werden (aktuell nur technisch notwendiges localStorage).
