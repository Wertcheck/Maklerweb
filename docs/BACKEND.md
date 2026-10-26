# Backend- und Zahlungsanbindung (noch nicht vorhanden)

Ein statisches GitHub-Pages-Frontend kann weder Bestellungen sicher speichern, Dateien dauerhaft ablegen noch Zahlungen bestätigen. Dafür ist ein Backend nötig; das Frontend ist darauf vorbereitet.

## Vertrag: `POST {orderEndpoint}` (JSON)
Request (siehe `buildPayload` in `js/checkout.js`):
```json
{ "template": "premium", "items": [{"id":"logo","qty":1}],
  "customer": {"company":"","contact":"","email":"","phone":"","street":"","zip":"","city":"","notes":""},
  "consent": {"agb":true,"privacy":true,"withdrawal":true,"at":"ISO-8601"},
  "clientTotals": {"oneTime":1196,"monthly":0} }
```
Antwort `200`: `{ "orderNumber": "…", "status": "received" | "paid", "paymentUrl": "https://…" (optional) }`; Fehler: `4xx/5xx` mit `{ "error": "…" }`.

## Pflichten des Servers
1. **Preis neu berechnen** mit `js/catalog.js` (`require('./catalog.js').priceCart({base:true,template,addons})`) – `clientTotals` nur zur Plausibilisierung, nie vertrauen.
2. Eingaben validieren/begrenzen (Längen, E-Mail, PLZ), CORS auf die eigene Domain beschränken, Rate-Limit/Bot-Schutz.
3. **Eindeutige Bestellnummer serverseitig** vergeben (die Client-Referenz im Anfragemodus ist nur eine Hilfe).
4. Bestellstatus führen: `received` → `payment_pending` → `paid` | `failed` | `cancelled`. „Bezahlt“ nur nach signiertem Webhook des Zahlungsanbieters.
5. **Zahlung:** Einmalzahlung und Support-Abo getrennt behandeln (z. B. Stripe Checkout `mode=payment` + `mode=subscription` oder Mollie/PayPal – nur wenn Abos unterstützt werden). Geheimschlüssel ausschließlich serverseitig. Danach `checkoutMode: 'live'` setzen und Button-Text/Rechtstexte (Button-Lösung, § 312j BGB) prüfen.
6. Bestätigungs-E-Mail, Abbruch-/Fehlerseiten (Rücksprung-URLs) umsetzen.

## Upload (Inhalte nach der Bestellung)
Empfohlen: separater Schritt nach Bestellung über signierte, zeitlich begrenzte Upload-URLs (z. B. S3-kompatibler Speicher, privater Bucket). Whitelist PNG/JPG/SVG/PDF/DOCX, z. B. max. 10 MB je Datei, Virenscan, Zugriff nur für Betreiber, Löschfristen in der Datenschutzerklärung. Bis dahin ist **kein Upload im Frontend** vorhanden (bewusst keine Attrappe).
