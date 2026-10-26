# MAKLERWEB

Shop-Website, über die Immobilienmakler eine Makler-Website zum Festpreis (799 €) mit fünf Designvorlagen und optionalen Zusatzleistungen bestellen.

**Technik:** statisches HTML/CSS/JavaScript ohne Build-Schritt (passend zu GitHub Pages), keine externen Abhängigkeiten, keine externen Schriften.

## Lokal starten / testen
```
python3 -m http.server 8123          # http://localhost:8123
node --test tests/pricing.test.js    # Preislogik
node tests/e2e.js                    # E2E (Playwright), schreibt Screenshots nach qa/
```

## Struktur
| Pfad | Inhalt |
|---|---|
| `index.html`, `js/landing.js` | Landingpage (Hero, Vorlagen-Karussell, Vorschau-Dialog, Preis, Zusatzleistungen, Ablauf, FAQ) |
| `js/catalog.js` | **Einzige Quelle für Preise, Vorlagen, Leistungen** (Browser + Node) |
| `js/cart.js`, `js/ui.js` | Warenkorb (localStorage), Drawer, Header |
| `bestellung.html`, `js/checkout.js` | Bestellablauf (Konfigurieren → Prüfen → Kundendaten → Abschluss) |
| `demo/*.html` | Fünf eigenständige Demo-Websites der Vorlagen (fiktive Inhalte) |
| `js/config.js` | Betreiber-Konfiguration (Endpoint, E-Mail, Modus) |
| `*.html` (Impressum, Datenschutz, AGB, Widerruf) | **Platzhalter** – siehe `docs/OPEN_ITEMS.md` |
| `tools/generate-images.py` | Erzeugt die Platzhalter-Illustrationen (keine Fotos!) |
| `docs/BACKEND.md`, `docs/OPEN_ITEMS.md` | Backend-/Zahlungsarchitektur, offene Punkte vor Livegang |

## Was aktiv ist – und was nicht
- Aktiv: Vorlagenauswahl, Vorschau, Warenkorb, Preisberechnung, Formularvalidierung, Bestellübermittlung **sobald** `orderEndpoint` konfiguriert ist.
- **Nicht aktiv:** Zahlung, Datei-Upload, serverseitige Speicherung. Ohne Backend erzeugt die Kasse nur eine *vorbereitete Anfrage* (E-Mail/Download) und weist ausdrücklich darauf hin, dass nichts übermittelt oder bezahlt wurde.
