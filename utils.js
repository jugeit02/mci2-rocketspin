import { canvas, ctx, scoreElement, messageBox, state, particles, asteroids, stars, setPlayer, getPlayer, joystickPad } from "./globals.js";
import { getPlayerName, setPlayerName, getHighscores, addHighscore } from "./globals.js";
import { Vector } from "./vector.js";
import { Rocket } from "./entities/rocket.js";
import { Asteroid } from "./entities/asteroid.js";
import { Particle } from "./entities/particle.js";
import { Star } from "./entities/star.js";
import { addControlEventListeners } from "./input.js";

let asteroidSpawnTimer = 0;
const ASTEROID_SPAWN_INTERVAL = 1500;

export function initGame() {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  for (let i = 0; i < 100; i++) {
    stars.push(new Star());
  }
  // Ensure input listeners are registered
  addControlEventListeners({ startGame });

  // If player has no saved name, prompt for it first
  const existingName = getPlayerName();
  if (!existingName) {
    promptForName();
  } else {
    showStartScreen();
  }

  // Start game on any pointer (click/touch) when on start screen and name exists
  function globalStartHandler(e) {
    if (!state.running && getPlayerName()) {
      // start the game regardless of where user tapped
      startGame();
    }
  }
  // use pointerdown to catch mouse/touch/stylus
  document.addEventListener("pointerdown", globalStartHandler);
}

export function startGame() {
  state.running = true;
  state.score = 0;
  state.lastTime = performance.now();
  state.input.canvasTouchIDs = [];
  state.input.joystickTouchID = null;
  state.input.isBoosting = false;
  state.slowMotionActive = false;

  const player = new Rocket();
  setPlayer(player);
  particles.length = 0;
  asteroids.length = 0;
  spawnAsteroid(30);
  spawnAsteroid(40);

  scoreElement.textContent = state.score;
  messageBox.style.display = "none";

  // Joystick Pad zurücksetzen
  if (joystickPad) joystickPad.style.transform = "translate(0, 0)";

  requestAnimationFrame(gameLoop);
}

export function showStartScreen(isGameOver = false) {
  state.running = false;
  messageBox.style.display = "flex";
  const title = document.getElementById("messageTitle");
  const text = document.getElementById("messageText");
  title.textContent = isGameOver ? "Game Over" : "Rocket Spin";

  // Show highscores
  const highs = getHighscores();
  const highHtml = highs.length
    ? `<h3>Highscores</h3><ol>${highs
        .map((h) => `<li>${h.name}: ${h.score}</li>`)
        .join("")}</ol>`
    : "<p class=\"muted\">Noch keine Highscores</p>";

  if (isGameOver) {
    // add player score to highs
    const playerName = getPlayerName() || "---";
    addHighscore(playerName, state.score);
    text.innerHTML = `Dein Punktestand: <b>${state.score.toFixed(0)}</b><br><small>Tippe irgendwo, um neu zu starten</small><div class=\"highscores\">${highHtml}</div>`;
  } else {
    text.innerHTML = `Tippe irgendwo, um zu starten.<br>Steuere mit Joystick und Boost-Button.<div class=\"highscores\">${highHtml}</div>`;
  }

  if (joystickPad) joystickPad.style.transform = "translate(0, 0)";
}

// Prompt user for name (simple inline form inside messageBox)
export function promptForName() {
  messageBox.style.display = "flex";
  const title = document.getElementById("messageTitle");
  const text = document.getElementById("messageText");
  title.textContent = "Willkommen";
  text.innerHTML = `<p>Bitte gib deinen Namen ein, um Highscores zu speichern:</p>
    <input id=\"playerNameInput\" type=\"text\" maxlength=\"20\" placeholder=\"Name\" />
    <div style=\"margin-top:8px;\"><button id=\"playerNameOk\">OK</button></div>`;

  const input = document.getElementById("playerNameInput");
  const ok = document.getElementById("playerNameOk");

  function acceptName() {
    const v = input.value.trim();
    if (v.length === 0) return input.focus();
    setPlayerName(v);
    messageBox.style.display = "none";
    showStartScreen();
  }

  ok.addEventListener("click", acceptName);
  input.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") acceptName();
  });
  input.focus();
}

function gameLoop(currentTime) {
  if (!state.running) {
    drawBackground();
    const player = null; // player draw only if exists (handled below)
    // draw existing particles/stars
    if (typeof window !== "undefined") {
      // draw stars and particles
      stars.forEach((s) => s.draw());
    }
    if (getPlayer()) getPlayer().draw();
    updateParticles();
    drawParticles();
    requestAnimationFrame(gameLoop);
    return;
  }

  state.deltaTime = currentTime - state.lastTime;
  state.lastTime = currentTime;

  const timeFactor = state.slowMotionActive ? 0.3 : 1;
  state.deltaTime *= timeFactor;

  // Update
  const player = getPlayer();
  if (player) player.update();
  asteroids.forEach((a) => a.update());
  updateParticles();
  checkCollisions();
  handleAsteroidSpawning(state.deltaTime);

  state.score += state.deltaTime / 100;
  scoreElement.textContent = state.score.toFixed(0);

  // Draw
  drawBackground();
  drawAsteroids();
  if (player) player.draw();
  drawParticles();

  requestAnimationFrame(gameLoop);
}

function handleAsteroidSpawning(deltaTime) {
  asteroidSpawnTimer += deltaTime;
  if (asteroidSpawnTimer >= ASTEROID_SPAWN_INTERVAL) {
    const currentInterval = Math.max(500, ASTEROID_SPAWN_INTERVAL - state.score * 5);
    if (asteroidSpawnTimer >= currentInterval) {
      spawnRandomAsteroid();
      asteroidSpawnTimer = 0;
    }
  }
}

export function spawnAsteroid(radius) {
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
  const minSize = 20;
  const maxSize = 50;
  const size = minSize + Math.random() * (maxSize - minSize);
  spawnAsteroid(size);
}

export function updateParticles() {
  particles.forEach((p) => p.update());
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].isDead()) particles.splice(i, 1);
  }
}

function checkCollisions() {
  const player = getPlayer();
  if (!player) return;
  for (let i = 0; i < asteroids.length; i++) {
    if (player.checkCollision(asteroids[i])) {
      explodeRocket();
      showStartScreen(true);
      return;
    }
  }
}

function explodeRocket() {
  const player = getPlayer();
  if (!player) return;
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
  const newPlayer = new Rocket();
  newPlayer.position.x = -1000;
  setPlayer(newPlayer);
}

export function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

export function drawBackground() {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  stars.forEach((s) => s.draw());

  if (state.slowMotionActive && state.running) {
    ctx.fillStyle = "rgba(0, 255, 192, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

export function drawAsteroids() {
  asteroids.forEach((a) => a.draw());
}

export function drawParticles() {
  particles.forEach((p) => p.draw());
}
