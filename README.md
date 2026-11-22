# Duft-Butler

Persönliche Parfüm-App als PWA: Sammlung, Tagesvorschlag nach Wetter (Open-Meteo), Trage-Tagebuch mit Statistik, Blind-Buy-Check, Wunschliste, JSON-Backup.

- Keine Abhängigkeiten, kein Build-Schritt – einfach die Dateien hosten (z. B. GitHub Pages).
- Alle Daten bleiben lokal im Browser (`localStorage`). Backups über ⚙ → Exportieren.
- Nach Änderungen an den Dateien in `sw.js` die `CACHE`-Version erhöhen (z. B. `duft-butler-v2`), damit installierte Apps das Update laden.

Wetterdaten: [Open-Meteo.com](https://open-meteo.com/) (CC BY 4.0).
