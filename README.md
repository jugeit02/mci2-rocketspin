Rocket Spin

Ein 2D-Weltraum-Touchspiel, bei dem du eine Rakete durch ein Asteroidenfeld steuerst. Entwickelt mit HTML, CSS und JavaScript Canvas.

Spielkonzept

Rocket Spin ist ein Einzelspieler-Touchspiel im 2D-Weltraum. Das Ziel ist es, eine frei steuerbare Rakete so lange wie möglich durch ein Feld von Hindernissen (Asteroiden) zu navigieren und dabei Punkte zu sammeln. Das Spiel legt Wert auf eine realistische Trägheit und Bewegung.

Kernmerkmale:

Endloses Überleben: Weiche Hindernissen aus und sammle Punkte durch Flugzeit.

Physik-basiert: Die Rakete bewegt sich mit realistischer Trägheit.

Visuelle Effekte: Einfache, aber dynamische Umsetzung mit Partikeleffekten für den Boost und einen Sternenhintergrund.

Interaktion & Steuerung

Das Spiel ist vollständig für Touch-Eingaben optimiert und basiert auf drei Hauptgesten:

Rotation (Ein-Finger-Wischen):

Lege einen Finger auf den Bildschirm und wische horizontal (links/rechts).

Dies ändert den Winkel der Rakete und bestimmt die Richtung des nächsten Boosts.

Boost / Antrieb (Ein-Finger-Tippen/Halten):

Tippe oder halte mit einem Finger auf den Bildschirm.

Solange der Finger den Bildschirm berührt, beschleunigt die Rakete in ihre aktuelle Blickrichtung.

Beim Loslassen gleitet die Rakete durch ihre Trägheit weiter.

Slow Motion (Zwei-Finger-Geste):

Lege zwei Finger gleichzeitig auf den Bildschirm.

Dies reduziert die Spielgeschwindigkeit (z. B. auf 50 %).

Die Steuerung (Rotation und Boost) bleibt währenddessen aktiv, um präzise Manöver in schwierigen Situationen zu ermöglichen.

Technologie-Stack

Dieses Projekt wird ausschließlich mit "Vanilla" Web-Technologien entwickelt:

HTML5: Für die Grundstruktur der Seite.

CSS3: Für das Styling der UI-Elemente (z. B. Punktestand).

JavaScript (ES6+): Für die gesamte Spiellogik.

HTML5 Canvas: Für das Rendern der Spielwelt (Rakete, Asteroiden, Partikel).
