# mci2-rocketspin

Rocket Spin ist ein Touch-optimiertes 2D-Überlebensspiel im Weltraum, entwickelt mit HTML Canvas. Navigiere deine Rakete durch ein Asteroidenfeld und nutze Trägheit, Boost und ein Joystick-ähnliches Steuerungselement.

Wichtigste Änderungen/Features:

- Modularer Code: Spiel-Logik ist in mehrere ES-Module aufgeteilt (`main.js`, `utils.js`, `input.js`, `globals.js`, `vector.js`, `entities/*`).
- Highscore & Name: Beim ersten Besuch wirst du nach einem Namen gefragt. Highscores werden lokal im Browser (localStorage) gespeichert.
- Start mit Tippen: Tippe irgendwo auf die Seite, um das Spiel zu starten (auch bei Game Over zum Neustarten).
- Verbesserte Start-/Game-Over-Anzeige: Highscore-Liste wird angezeigt und das Interface ist visueller verbessert.

Controls
- Boost: Drücke den BOOST-Button (rechter Bereich). Beim ersten Tipp startet das Spiel.
- Rotation: Verwende das linke Joystick-Element (ziehen mit Finger/Maus). Auf Desktop funktioniert das per Mausklick und Ziehen.
- Slow Motion: Halte zwei Finger auf dem Canvas (oder rechte Maustaste auf Desktop) für Zeitlupen-Modus.

Lokales Testen

1. Öffne ein Terminal in diesem Ordner:

```powershell
Set-Location 'e:\Hochschule Esslingen\mci-2\mci2-rocketspin'
python -m http.server 8000
```

2. Öffne im Browser: http://localhost:8000

Hinweis: ES-Module werden von Browsern nicht über `file://` geladen — benutze daher einen lokalen Server wie oben.

Fehlerbehebung
- Wenn nichts passiert, öffne die Browser-Konsole (F12) und poste die ersten Fehlermeldungen hier.

Entwicklung
- Die Haupt-Logik startet in `main.js` → `initGame()`.
- Dom-Elemente und Shared-State sind in `globals.js`.

Viel Spaß beim Testen!
