// Die globale Variable für die App-ID, falls Firebase in der Umgebung verwendet wird
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

// ****************************
// SPIELKONSTANTEN & VARIABLEN
// ****************************

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const messageBox = document.getElementById("messageBox");

// NEUE UI-ELEMENTE
const joystickContainer = document.getElementById("joystick-container");
const joystickPad = document.getElementById("joystick-pad");
const boostButton = document.getElementById("boost-button");

// Physikalische Konstanten
const THRUST = 0.05;
const ROTATION_SPEED = 0.0005; // Deutlich reduziert, da es durch Joystick gesteuert wird
const FRICTION = 0.995;
const MAX_VELOCITY = 5;
const SLOW_MOTION_FACTOR = 0.3; // 30% Geschwindigkeit
const JOYSTICK_RADIUS = 30; // Maximaler Abstand für den Joystick-Pad

// Zustandsvariablen
let state = {
  running: false,
  score: 0,
  lastTime: 0,
  deltaTime: 0,
  slowMotionActive: false,
  input: {
    isBoosting: false,
    // Für Touch: Array von IDs, die NICHT von UI-Elementen verbraucht werden (für Slow Motion)
    canvasTouchIDs: [],
    joystickTouchID: null, // ID des Fingers, der den Joystick bedient
    joystickStartPos: null,
    joystickCenter: null,
    joystickAngle: 0, // Der aktuelle Winkel des Joysticks
  },
};

// ****************************
// HILFSKLASSEN (Vector bleibt unverändert)
// ****************************

/**
 * Klasse für 2D-Vektoren (Position, Geschwindigkeit, Beschleunigung)
 */
class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  add(other) {
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  subtract(other) {
    this.x -= other.x;
    this.y -= other.y;
    return this;
  }

  multiply(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  setMagnitude(m) {
    const factor = m / this.magnitude();
    this.x *= factor;
    this.y *= factor;
    return this;
  }

  limit(max) {
    if (this.magnitude() > max) {
      this.setMagnitude(max);
    }
    return this;
  }

  copy() {
    return new Vector(this.x, this.y);
  }
}

// ****************************
// SPIELOBJEKTE (Rocket, Asteroid, Particle, Star bleiben unverändert, außer dem Import)
// ****************************

let player;
let asteroids = [];
let particles = [];
let stars = [];

// [Rocket, Asteroid, Particle, Star Klassen-Definitionen bleiben unverändert]
// Um Platz zu sparen, lasse ich die vollständigen Klassendefinitionen hier weg,
// aber im finalen game.js MÜSSEN sie enthalten sein.

class Rocket {
  /* ... */
  constructor() {
    this.position = new Vector(canvas.width / 2, canvas.height / 2);
    this.velocity = new Vector(0, 0);
    this.angle = -Math.PI / 2; // Zeigt nach oben
    this.size = 15;
    this.hitRadius = this.size * 0.9;
    this.color = "#FF5722"; // Rot für die Rakete
  }

  update() {
    // Anwendung der Trägheit
    this.velocity.multiply(FRICTION ** (state.deltaTime / 16));

    // NEU: Rotation basierend auf Joystick-Winkel
    if (state.input.joystickTouchID !== null) {
      // Die Rakete dreht sich direkt zum Joystick-Winkel
      // Wir verwenden eine einfache Annäherung, um es nicht zu abrupt zu machen
      const targetAngle = state.input.joystickAngle;
      let angleDiff = targetAngle - this.angle;

      // Winkel auf [-PI, PI] normalisieren
      if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

      // Langsame Rotation (Konstante ist im Kopf neu definiert)
      this.angle += angleDiff * 0.1 * (state.deltaTime / 16);
    }

    // Anwendung des Boosts
    if (state.input.isBoosting && state.running) {
      const boostForce = new Vector(
        Math.cos(this.angle) * THRUST,
        Math.sin(this.angle) * THRUST
      );
      this.velocity.add(boostForce.multiply(state.deltaTime));

      // Partikel erzeugen (Flamme)
      const particleOffset = new Vector(
        -Math.cos(this.angle) * this.size,
        -Math.sin(this.angle) * this.size
      );
      for (let i = 0; i < 2; i++) {
        particles.push(
          new Particle(
            this.position.x + particleOffset.x,
            this.position.y + particleOffset.y,
            this.angle + Math.PI + (Math.random() - 0.5) * 0.5,
            "#FFA500", // Orange
            1 + Math.random() * 2,
            10 + Math.random() * 5
          )
        );
      }
    }

    // Geschwindigkeitsbegrenzung
    this.velocity.limit(
      MAX_VELOCITY * (state.slowMotionActive ? SLOW_MOTION_FACTOR : 1)
    );

    // Position aktualisieren
    const effectiveVelocity = this.velocity
      .copy()
      .multiply(state.deltaTime / 16);
    this.position.add(effectiveVelocity);

    // Randbehandlung (Wrap-around für den Weltraum)
    this.wrapAround();
  }

  wrapAround() {
    if (this.position.x < 0) this.position.x = canvas.width;
    if (this.position.x > canvas.width) this.position.x = 0;
    if (this.position.y < 0) this.position.y = canvas.height;
    if (this.position.y > canvas.height) this.position.y = 0;
  }

  draw() {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.angle);

    // Raketenkörper (Dreieck)
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.size, 0); // Spitze
    ctx.lineTo(-this.size, -this.size * 0.6); // Linker Flügel
    ctx.lineTo(-this.size * 0.5, 0); // Mitte (Basis der Flamme)
    ctx.lineTo(-this.size, this.size * 0.6); // Rechter Flügel
    ctx.closePath();
    ctx.fill();

    // Fenster/Cockpit
    ctx.fillStyle = "#00FFC0";
    ctx.beginPath();
    ctx.arc(this.size * 0.3, 0, this.size * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  checkCollision(asteroid) {
    const dx = this.position.x - asteroid.position.x;
    const dy = this.position.y - asteroid.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    // Kollision, wenn die Distanz kleiner ist als die Summe der Radien
    return distance < this.hitRadius + asteroid.size * 0.9;
  }
}

class Asteroid {
  constructor(radius, position, velocity) {
    this.position =
      position ||
      new Vector(Math.random() * canvas.width, Math.random() * canvas.height);
    // Stelle sicher, dass der Asteroid nicht zu nah am Spieler startet
    while (
      player &&
      this.position.subtract(player.position.copy()).magnitude() < 200
    ) {
      this.position = new Vector(
        Math.random() * canvas.width,
        Math.random() * canvas.height
      );
    }
    this.velocity =
      velocity ||
      new Vector((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5);
    this.size = radius;
    this.angle = Math.random() * Math.PI * 2;
    this.spin = (Math.random() - 0.5) * 0.005;
    this.complexity = Math.floor(4 + Math.random() * 4); // Anzahl der Kanten
    this.vertices = this.generateVertices();
    this.color = "#999999"; // Grau
  }

  generateVertices() {
    const vertices = [];
    for (let i = 0; i < this.complexity; i++) {
      const angle = ((Math.PI * 2) / this.complexity) * i;
      // Radius mit einer kleinen zufälligen Abweichung
      const r = this.size * (0.8 + Math.random() * 0.4);
      vertices.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      });
    }
    return vertices;
  }

  update() {
    const effectiveVelocity = this.velocity
      .copy()
      .multiply(state.deltaTime / 16);
    this.position.add(effectiveVelocity);
    this.angle += this.spin * state.deltaTime;

    // Randbehandlung (Wrap-around)
    if (this.position.x < -this.size)
      this.position.x = canvas.width + this.size;
    if (this.position.x > canvas.width + this.size)
      this.position.x = -this.size;
    if (this.position.y < -this.size)
      this.position.y = canvas.height + this.size;
    if (this.position.y > canvas.height + this.size)
      this.position.y = -this.size;
  }

  draw() {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.angle);

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
    for (let i = 1; i < this.vertices.length; i++) {
      ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }
}

class Particle {
  constructor(x, y, angle, color, speed, lifetime) {
    this.position = new Vector(x, y);
    this.velocity = new Vector(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
    this.color = color;
    this.lifetime = lifetime;
    this.age = 0;
    this.size = 2;
  }

  update() {
    const effectiveVelocity = this.velocity
      .copy()
      .multiply(state.deltaTime / 16);
    this.position.add(effectiveVelocity);
    this.age += state.deltaTime;
    // Partikel verlangsamen
    this.velocity.multiply(0.98);
  }

  draw() {
    const alpha = Math.max(0, 1 - this.age / this.lifetime);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1; // Alpha zurücksetzen
  }

  isDead() {
    return this.age >= this.lifetime;
  }
}

class Star {
  constructor() {
    this.position = new Vector(
      Math.random() * canvas.width,
      Math.random() * canvas.height
    );
    this.size = Math.random() * 1.5;
    this.color = `rgba(255, 255, 255, ${0.5 + Math.random() * 0.5})`;
    this.blinkSpeed = 0.005 + Math.random() * 0.01;
  }

  draw() {
    // Simuliert leichtes Blinken
    const alpha = Math.sin(Date.now() * this.blinkSpeed) * 0.5 + 0.5;
    ctx.fillStyle = this.color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// ****************************
// GAME LOGIC FUNKTIONEN (Unverändert)
// ****************************

function initGame() {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  for (let i = 0; i < 100; i++) {
    stars.push(new Star());
  }
  showStartScreen();

  // Füge Touch/Maus Events für die NEUEN UI-Elemente hinzu
  addControlEventListeners();

  // Füge NUR Touch-Events für Slow Motion auf dem Canvas hinzu
  canvas.addEventListener("touchstart", handleCanvasTouchStart);
  canvas.addEventListener("touchend", handleCanvasTouchEnd);

  // Maus-Events (für Desktop-Slow-Motion: Rechtsklick/Zwei-Finger-Emulation)
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener("mousedown", handleCanvasMouseDown);
  canvas.addEventListener("mouseup", handleCanvasMouseUp);
}

function startGame() {
  /* ... */
  state.running = true;
  state.score = 0;
  state.lastTime = performance.now();
  state.input.canvasTouchIDs = [];
  state.input.joystickTouchID = null;
  state.input.isBoosting = false;
  state.slowMotionActive = false;

  player = new Rocket();
  asteroids = [];
  particles = [];
  spawnAsteroid(30);
  spawnAsteroid(40);

  scoreElement.textContent = state.score;
  messageBox.style.display = "none";

  // Joystick Pad zurücksetzen
  joystickPad.style.transform = "translate(0, 0)";

  requestAnimationFrame(gameLoop);
}

function showStartScreen(isGameOver = false) {
  /* ... */
  state.running = false;
  messageBox.style.display = "flex";
  document.getElementById("messageTitle").textContent = isGameOver
    ? "Game Over"
    : "Rocket Spin";
  document.getElementById("messageText").innerHTML = isGameOver
    ? `Dein Punktestand: <b>${state.score.toFixed(0)}</b>`
    : `Tippen zum Starten.<br>Steuere mit Joystick und Boost-Button.`;

  // Setze Joystick zurück
  joystickPad.style.transform = "translate(0, 0)";
}

function gameLoop(currentTime) {
  /* ... */
  if (!state.running) {
    drawBackground();
    if (player) player.draw();
    updateParticles();
    drawParticles();
    requestAnimationFrame(gameLoop);
    return;
  }

  state.deltaTime = currentTime - state.lastTime;
  state.lastTime = currentTime;

  const timeFactor = state.slowMotionActive ? SLOW_MOTION_FACTOR : 1;
  state.deltaTime *= timeFactor;

  // 1. UPDATE LOGIK
  player.update();
  asteroids.forEach((a) => a.update());
  updateParticles();
  checkCollisions();
  handleAsteroidSpawning(state.deltaTime);

  state.score += state.deltaTime / 100;
  scoreElement.textContent = state.score.toFixed(0);

  // 2. ZEICHNEN LOGIK
  drawBackground();
  drawAsteroids();
  player.draw();
  drawParticles();

  requestAnimationFrame(gameLoop);
}

let asteroidSpawnTimer = 0;
const ASTEROID_SPAWN_INTERVAL = 1500;

function handleAsteroidSpawning(deltaTime) {
  /* ... */
  asteroidSpawnTimer += deltaTime;
  if (asteroidSpawnTimer >= ASTEROID_SPAWN_INTERVAL) {
    const currentInterval = Math.max(
      500,
      ASTEROID_SPAWN_INTERVAL - state.score * 5
    );
    if (asteroidSpawnTimer >= currentInterval) {
      spawnRandomAsteroid();
      asteroidSpawnTimer = 0;
    }
  }
}

function spawnAsteroid(radius) {
  /* ... */
  const isHorizontal = Math.random() > 0.5;
  let x, y, vx, vy;

  if (isHorizontal) {
    y = Math.random() * canvas.height;
    x = Math.random() < 0.5 ? -radius : canvas.width + radius;
  } else {
    x = Math.random() * canvas.width;
    y = Math.random() < 0.5 ? -radius : canvas.height + radius;
  }

  const targetX = canvas.width / 2;
  const targetY = canvas.height / 2;
  vx = ((targetX - x) / 500) * (0.5 + Math.random() * 0.5);
  vy = ((targetY - y) / 500) * (0.5 + Math.random() * 0.5);

  vx += (Math.random() - 0.5) * 0.3;
  vy += (Math.random() - 0.5) * 0.3;

  asteroids.push(new Asteroid(radius, new Vector(x, y), new Vector(vx, vy)));
}

function spawnRandomAsteroid() {
  /* ... */
  const minSize = 20;
  const maxSize = 50;
  const size = minSize + Math.random() * (maxSize - minSize);
  spawnAsteroid(size);
}

function updateParticles() {
  /* ... */
  particles.forEach((p) => p.update());
  particles = particles.filter((p) => !p.isDead());
}

function checkCollisions() {
  /* ... */
  for (let i = 0; i < asteroids.length; i++) {
    if (player.checkCollision(asteroids[i])) {
      explodeRocket();
      showStartScreen(true);
      return;
    }
  }
}

function explodeRocket() {
  /* ... */
  for (let i = 0; i < 50; i++) {
    particles.push(
      new Particle(
        player.position.x,
        player.position.y,
        Math.random() * Math.PI * 2,
        Math.random() > 0.5 ? "#FF5722" : "#FFA500",
        2 + Math.random() * 5,
        500 + Math.random() * 500
      )
    );
  }
  player = new Rocket();
  player.position.x = -1000;
}

function resizeCanvas() {
  /* ... */
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function drawBackground() {
  /* ... */
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  stars.forEach((s) => s.draw());

  if (state.slowMotionActive && state.running) {
    ctx.fillStyle = "rgba(0, 255, 192, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawAsteroids() {
  /* ... */
  asteroids.forEach((a) => a.draw());
}

function drawParticles() {
  /* ... */
  particles.forEach((p) => p.draw());
}

// ****************************
// INPUT HANDLING (NEU MIT UI-ELEMENTEN)
// ****************************

function updateSlowMotion(touches) {
  // Die Slow Motion wird durch 2 oder mehr Finger auf dem CANVAS (nicht UI) aktiviert
  state.slowMotionActive = touches.length >= 2;
}

// 1. BOOST BUTTON HANDLER
function handleBoostStart(e) {
  e.preventDefault();
  if (!state.running) {
    startGame();
    return;
  }
  state.input.isBoosting = true;
}

function handleBoostEnd(e) {
  e.preventDefault();
  state.input.isBoosting = false;
}

// 2. JOYSTICK HANDLER
function getTouchById(touches, id) {
  return Array.from(touches).find((t) => t.identifier === id);
}

function handleJoystickStart(e) {
  e.preventDefault();
  if (state.input.joystickTouchID !== null) return; // Nur ein Finger pro Joystick

  const touch = e.changedTouches[0];
  state.input.joystickTouchID = touch.identifier;

  // Center des Joystick-Containers berechnen
  const rect = joystickContainer.getBoundingClientRect();
  state.input.joystickCenter = new Vector(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2
  );

  // Starte Listener auf dem gesamten Dokument, um den Finger auch außerhalb zu verfolgen
  document.addEventListener("touchmove", handleJoystickMove);
  document.addEventListener("touchend", handleJoystickEnd);
  document.addEventListener("touchcancel", handleJoystickEnd);
}

function handleJoystickMove(e) {
  if (state.input.joystickTouchID === null || !state.running) return;

  const touch = getTouchById(e.touches, state.input.joystickTouchID);
  if (!touch) return;

  const dx = touch.clientX - state.input.joystickCenter.x;
  const dy = touch.clientY - state.input.joystickCenter.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  let angle = Math.atan2(dy, dx);
  let magnitude = Math.min(distance, JOYSTICK_RADIUS);

  // Joystick Pad visuell bewegen
  const padX = Math.cos(angle) * magnitude;
  const padY = Math.sin(angle) * magnitude;
  joystickPad.style.transform = `translate(${padX}px, ${padY}px)`;

  // Raketenwinkel aktualisieren
  state.input.joystickAngle = angle;
}

function handleJoystickEnd(e) {
  if (state.input.joystickTouchID === null) return;

  // Prüfen, ob der Finger, der den Joystick bedient, losgelassen wurde
  const isJoystickFingerReleased = Array.from(e.changedTouches).some(
    (t) => t.identifier === state.input.joystickTouchID
  );

  if (isJoystickFingerReleased) {
    state.input.joystickTouchID = null;

    // Joystick Pad zurücksetzen
    joystickPad.style.transform = "translate(0, 0)";

    // Listener entfernen
    document.removeEventListener("touchmove", handleJoystickMove);
    document.removeEventListener("touchend", handleJoystickEnd);
    document.removeEventListener("touchcancel", handleJoystickEnd);
  }
}

// 3. SLOW MOTION HANDLER (Canvas-weit)
// Hier bleiben die Touch-Events am Canvas, um die Zwei-Finger-Geste zu erkennen.
function handleCanvasTouchStart(e) {
  // Füge nur Touch IDs hinzu, die nicht den Boost-Button oder den Joystick berühren
  Array.from(e.changedTouches).forEach((touch) => {
    const target = touch.target;
    if (target !== boostButton && target.parentNode !== joystickContainer) {
      state.input.canvasTouchIDs.push(touch.identifier);
    }
  });

  updateSlowMotion(e.touches);
}

function handleCanvasTouchEnd(e) {
  // Entferne die beendeten Touch IDs aus der Slow Motion Liste
  const endedTouchIDs = Array.from(e.changedTouches).map((t) => t.identifier);
  state.input.canvasTouchIDs = state.input.canvasTouchIDs.filter(
    (id) => !endedTouchIDs.includes(id)
  );

  // Die Funktion `e.touches` enthält alle noch aktiven Touches
  updateSlowMotion(e.touches);
}

// 4. DESKTOP/MAUS EMULATION für Boost/Slow Motion
function handleCanvasMouseDown(e) {
  if (e.button === 2) {
    // Rechtsklick für Slow Motion
    e.preventDefault();
    state.slowMotionActive = true;
  }
  // Boost/Rotation läuft nur über die Buttons/Joystick, nicht über das Canvas
}

function handleCanvasMouseUp(e) {
  if (e.button === 2) {
    // Rechtsklick Ende
    state.slowMotionActive = false;
  }
}

// 5. Zuweisung aller Listener
function addControlEventListeners() {
  // Boost Button
  boostButton.addEventListener("touchstart", handleBoostStart);
  boostButton.addEventListener("touchend", handleBoostEnd);
  boostButton.addEventListener("mousedown", handleBoostStart);
  boostButton.addEventListener("mouseup", handleBoostEnd);

  // Joystick
  joystickContainer.addEventListener("touchstart", handleJoystickStart);
  // Das Bewegen und Beenden wird auf dem Dokument gehandhabt (siehe handleJoystickStart)

  // Desktop Maus-Emulation für Rotation (Joystick)
  joystickContainer.addEventListener("mousedown", handleJoystickStartMouse);

  // Füge globale Maus-Listener für den Desktop-Joystick hinzu, da wir `e.touches` nicht haben
  document.addEventListener("mousemove", handleJoystickMoveMouse);
  document.addEventListener("mouseup", handleJoystickEndMouse);
}

// Maus-Emulation für Joystick (Desktop)
let isJoystickBeingDragged = false;
function handleJoystickStartMouse(e) {
  e.preventDefault();
  if (e.button !== 0) return; // Nur Linksklick

  isJoystickBeingDragged = true;

  const rect = joystickContainer.getBoundingClientRect();
  state.input.joystickCenter = new Vector(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2
  );
}

function handleJoystickMoveMouse(e) {
  if (!isJoystickBeingDragged || !state.running) return;

  const dx = e.clientX - state.input.joystickCenter.x;
  const dy = e.clientY - state.input.joystickCenter.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  let angle = Math.atan2(dy, dx);
  let magnitude = Math.min(distance, JOYSTICK_RADIUS);

  // Joystick Pad visuell bewegen
  const padX = Math.cos(angle) * magnitude;
  const padY = Math.sin(angle) * magnitude;
  joystickPad.style.transform = `translate(${padX}px, ${padY}px)`;

  // Raketenwinkel aktualisieren
  state.input.joystickAngle = angle;
}

function handleJoystickEndMouse(e) {
  if (!isJoystickBeingDragged) return;

  isJoystickBeingDragged = false;
  joystickPad.style.transform = "translate(0, 0)";
}

// ****************************
// START DES SPIELS
// ****************************

window.onload = initGame;
