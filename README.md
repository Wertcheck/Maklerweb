# MAKLERWEB

Shop-Website, über die Immobilienmakler eine Makler-Website zum Festpreis (799 €) mit fünf Designvorlagen und optionalen Zusatzleistungen bestellen.

**Technik:** statisches HTML/CSS/JavaScript ohne Build-Schritt (passend zu GitHub Pages), keine externen Abhängigkeiten, keine externen Schriften.

## Lokal starten / testen
```
python3 -m http.server 8123          # http://localhost:8123
node --test tests/pricing.test.js    # Preislogik
node tests/e2e.js                    # E2E (Playwright), schreibt Screenshots nach qa/
npm i && node tests/a11y-perf.js     # axe-core (WCAG AA) auf allen Seiten, mobil + Desktop, plus Ladezeit
node tools/make-thumbs.js            # Vorschaubilder (assets/thumbs) nach Änderung an demo/*.html neu erzeugen
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
| `css/fonts.css`, `assets/fonts/` | Self-hosted Schriften (Fraunces, Instrument Sans, Cormorant Garamond; OFL, siehe `assets/fonts/LICENSE.md`) |
| `assets/thumbs/` | Statische WebP-Vorschaubilder der Demos (generiert, ~150 KB gesamt) |
| `tools/generate-images.py` | Erzeugt die Platzhalter-Illustrationen (keine Fotos!) |
| `docs/BACKEND.md`, `docs/OPEN_ITEMS.md` | Backend-/Zahlungsarchitektur, offene Punkte vor Livegang |

## Was aktiv ist – und was nicht
- Aktiv: Vorlagenauswahl, Vorschau, Warenkorb, Preisberechnung, Formularvalidierung, Bestellübermittlung **sobald** `orderEndpoint` konfiguriert ist.
- **Nicht aktiv:** Zahlung, Datei-Upload, serverseitige Speicherung. Ohne Backend erzeugt die Kasse nur eine *vorbereitete Anfrage* (E-Mail/Download) und weist ausdrücklich darauf hin, dass nichts übermittelt oder bezahlt wurde.

## Gestaltungsprinzipien (nach „The $10K Checklist“)
1. **Haltung:** redaktioneller Stil – Serifen-Display mit kursiven Akzentwörtern, nummerierte Sektionen, feine Linien; jede Demo-Vorlage mit eigenem Layout *und* eigenem Schriftcharakter.
2. **Typografie:** Fraunces + Instrument Sans (kein Inter/Roboto), Hierarchie über Größe und Gewicht.
3. **Farbsystem:** Navy, Gold, Creme (+ abgeleitete Tinte/Linie); Rot nur für Fehlerzustände.
4. **Hierarchie:** große Abstände, zweispaltige Sektionsköpfe, ein primärer CTA pro Bereich.
5. **Bildsprache:** einheitlich gezeichnete Illustrationen (generiert, `tools/generate-images.py`) – vor Livegang durch lizenzierte Fotos ersetzen; Vorschaubilder zeigen die echten Demos.
6. **Bewegung:** zurückhaltend (Hover-Lift, Linien-Animationen, Zahl-Tween im Warenkorb, weiches FAQ-Öffnen); vollständig deaktiviert bei `prefers-reduced-motion`.
7. **Mobil:** eigene Lösungen statt Schrumpfen – Festpreis-Leiste mit kontextabhängiger Aktion, Vollbild-Menü, einklappbare Kassen-Zusammenfassung, kompakte Leistungskarten, Vorschau im Vollbild.
8. **Unsichtbare Qualität:** mobil gedrosselt Load ≈ 0,5 s / ≈ 240 KB, axe-core ohne Befunde, Tastaturbedienung, semantisches HTML, Canonical/Open-Graph/JSON-LD (Preis wird per Test gegen `catalog.js` geprüft).
