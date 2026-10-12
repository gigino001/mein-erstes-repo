-- Shop wird vorerst ausgeblendet (Nav-Link + Sitemap entfernt, siehe Code),
-- da noch keine echten Produkte eingepflegt sind. Zusätzlich hier alle
-- bisherigen Demo-/Beispielprodukte deaktivieren, damit die Seite /shop auch
-- bei direktem Aufruf nur "Hier gibt es bald Produkte" zeigt, statt mit
-- echter Stripe-Zahlung bestellbar zu sein.

UPDATE "Product" SET "active" = false;
