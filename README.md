🚀 Rocket Spin

Ein 2D-Weltraum-Touchspiel, bei dem du eine Rakete durch ein Asteroidenfeld steuerst.
Entwickelt mit HTML, CSS und JavaScript (Canvas).

🚀 Rocket Spin spielen

Du kannst Rocket Spin direkt online spielen oder lokal testen.

🌐 Online

- [Hier klicken, um das Spiel zu starten](https://jugeit02.github.io/mci2-rocketspin/)
- Oder scanne den QR-Code:

![QR Code](qr-code.png)

💻 Lokal testen
Wenn du das Spiel lokal ausprobieren willst, geht das mit Python:

1. ZIP-Datei entpacken. Navigiere im Terminal oder in der Kommandozeile in den entpackten Projektordner (mci2-rocketspin).

2. Lokalen Server starten mit: python -m http.server 8000

3. Im Browser öffnen: http://localhost:8000

🎯 Spielkonzept

Rocket Spin ist ein Einzelspieler-Touchspiel im 2D-Weltraum.
Ziel ist es, eine frei steuerbare Rakete so lange wie möglich durch ein Feld von Hindernissen (Asteroiden) zu navigieren und dabei Punkte zu sammeln.
Das Spiel setzt auf realistische Trägheit und flüssige Steuerung, wodurch präzise Manöver erforderlich sind.

🌌 Kernmerkmale

Endloser Überlebensmodus – weiche Asteroiden aus und sammle Punkte durch Flugzeit.

Physikbasiertes Flugverhalten – Trägheit und Beschleunigung erzeugen ein realistisches Steuergefühl.

Visuelle Effekte – Partikeleffekte beim Boost und ein sich bewegender Sternenhintergrund.

🎮 Interaktion & Steuerung

Das Spiel ist vollständig für Touch-Eingaben konzipiert und nutzt drei Hauptgesten:

| Aktion              | Geste                             | Beschreibung                                                                                |
| ------------------- | --------------------------------- | ------------------------------------------------------------------------------------------- |
| **Rotation**        | Ein-Finger-Wischen (links/rechts) | Ändert den Winkel der Rakete und somit ihre Flugrichtung.                                   |
| **Boost / Antrieb** | Ein-Finger-Tippen oder Halten     | Beschleunigt die Rakete in Blickrichtung. Beim Loslassen gleitet sie durch Trägheit weiter. |
| **Slow Motion**     | Zwei-Finger-Geste                 | Reduziert die Spielgeschwindigkeit auf ca. 50 % für präzise Steuerung.                      |

🧠 Technologie-Stack

Das Projekt wurde ausschließlich mit Vanilla Web-Technologien entwickelt — ohne Frameworks oder externe Libraries:

HTML5: Struktur und Canvas-Element

CSS3: Styling der UI-Elemente (z. B. Punktestand, Overlays)

JavaScript (ES6+): Spiellogik, Physik, Eingabe und Rendering
