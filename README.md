# Horror-Charades – Die Filmliste

Alle 12 Horrorfilme aus dem Pantomime-Spiel von Inde Navarrette und Michael Johnston bei
[Hot Ones Versus](https://www.youtube.com/watch?v=mlwD5SdMM7I&t=1050s) (ab Minute 17:30).

Für jeden Film: Story, Besetzung, Fortsetzungen, Trailer, die Stelle im Video und wo man ihn
streamen kann (Peacock, weitere Dienste in den USA und in Deutschland).

## Aufbau

- `index.html` – die Seite
- `css/style.css` – Gestaltung
- `js/data.js` – alle Filmdaten (Texte, Cast, Fortsetzungen, Streaming)
- `js/app.js` – Filmkapitel, Filter, „Gesehen“-Liste, Trailer-Fenster
- `js/shelf3d.js` – 3D-Videothekenregal im Kopf (Three.js)
- `assets/` – Filmplakate, Szenenbilder und kurze Clips aus dem Video

Kein Build nötig, reines HTML/CSS/JS.

## Online stellen mit GitHub Pages

1. Im Repo auf **Settings → Pages** gehen.
2. Bei **Source** „Deploy from a branch“ wählen, Branch **main**, Ordner **/ (root)**, speichern.
3. Nach ein bis zwei Minuten ist die Seite unter `https://vrtomsky.github.io/Horror-Filmliste/` online.

## Lokal ansehen

```bash
python -m http.server 5611
```

Dann `http://localhost:5611` öffnen.

## Hinweise

Streaming-Stand: 11. Oktober 2026 (Quelle: JustWatch). Kataloge ändern sich laufend.
Inoffizielle Fanseite. Plakate und Szenenbilder über JustWatch/TMDB, Videoausschnitte aus
Hot Ones Versus von First We Feast. Alle Rechte bei den jeweiligen Inhabern.
