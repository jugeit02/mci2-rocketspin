import {
  canvas,
  ctx,
  scoreElement,
  messageBox,
  overlayBackdrop,
  state,
  particles,
  asteroids,
  stars,
  setPlayer,
  getPlayer,
  joystickPad,
} from "./globals.js";
import {
  getPlayerName,
  setPlayerName,
  getHighscores,
  addHighscore,
} from "./globals.js";
import { Vector } from "./vector.js";
import { Rocket } from "./entities/rocket.js";
import { Asteroid } from "./entities/asteroid.js";
import { Particle } from "./entities/particle.js";
import { Star } from "./entities/star.js";
import { addControlEventListeners } from "./input.js";

let asteroidSpawnTimer = 0;
const ASTEROID_SPAWN_INTERVAL = 1500;
let restartBlockedUntil = 0;

function startRestartTimer() {
  const timerEl = document.getElementById("restartTimer");
  if (!timerEl) return;

  const updateTimer = () => {
    const remaining = Math.max(0, restartBlockedUntil - performance.now());
    const seconds = (remaining / 1000).toFixed(1);
    timerEl.textContent = seconds > 0 ? seconds : "Ready!";
    timerEl.style.opacity = seconds > 0 ? "0.6" : "1";

    if (remaining > 0) {
      requestAnimationFrame(updateTimer);
    }
  };

  updateTimer();
}

export function initGame() {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  for (let i = 0; i < 100; i++) {
    stars.push(new Star());
  }
  addControlEventListeners({ startGame });

  const existingName = getPlayerName();
  if (!existingName) {
    promptForName();
  } else {
    showStartScreen();
  }

  function globalStartHandler(e) {
    if (!state.running && getPlayerName()) {
      if (performance.now() >= restartBlockedUntil) {
        startGame();
      }
    }
  }
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

  let initialSize1 = 30;
  let initialSize2 = 40;
  if (window.innerWidth < 768) {
    initialSize1 = 18;
    initialSize2 = 25;
  }

  spawnAsteroid(initialSize1);
  spawnAsteroid(initialSize2);

  scoreElement.textContent = state.score;
  hideOverlay();

  if (joystickPad) joystickPad.style.transform = "translate(0, 0)";

  requestAnimationFrame(gameLoop);
}

function showOverlay(
  title = "Rocket Spin",
  message = "Tap to Start",
  subtitle = ""
) {
  messageBox.style.display = "block";
  overlayBackdrop.style.display = "block";
  document.getElementById("messageTitle").textContent = title;
  document.getElementById("messageText").textContent = message;
  document.getElementById("messageSubtitle").innerHTML = subtitle;
}

function hideOverlay() {
  messageBox.style.display = "none";
  overlayBackdrop.style.display = "none";
}

export function showStartScreen(isGameOver = false) {
  state.running = false;

  if (isGameOver) {
    const playerName = getPlayerName() || "---";
    addHighscore(playerName, state.score);
    restartBlockedUntil = performance.now() + 2000;
    startRestartTimer();
  }

  const highs = getHighscores();
  const bestScore = highs.length > 0 ? highs[0] : null;
  const bestScoreText = bestScore
    ? `Best: <strong>${bestScore.name}</strong> - ${bestScore.score}`
    : "No highscore yet";

  const controlsText = `
    <div style="font-size: 0.85rem; line-height: 1.6; margin-top: 12px;">
      <strong>Controls:</strong><br>
      🕹️ Joystick: rotate<br>
      🔥 Boost: accelerate<br>
      ⏱️ Slow Motion: 2 fingers
    </div>
  `;

  if (isGameOver) {
    showOverlay(
      "Rocket Spin",
      "Game Over",
      `<div style="margin-bottom: 12px;">Score: <strong>${state.score.toFixed(
        0
      )}</strong></div>
       <div style="font-size: 0.9rem; padding: 8px 0; border-top: 1px solid #ddd; padding-top: 8px;">
         ${bestScoreText}
       </div>
       ${controlsText}
       <div style="margin-top: 12px; font-size: 0.85rem; color: #5b6b7a;">Tap anywhere to restart</div>`
    );
  } else {
    showOverlay(
      "Rocket Spin",
      "Tap to Start",
      `<div style="font-size: 0.9rem; padding-bottom: 8px; border-bottom: 1px solid #ddd;">
         ${bestScoreText}
       </div>
       ${controlsText}`
    );
  }

  if (joystickPad) joystickPad.style.transform = "translate(0, 0)";
}

export function promptForName() {
  showOverlay(
    "Welcome",
    "Enter your name",
    `<div style="margin-top: 12px;">
       <input id="playerNameInput" type="text" maxlength="20" placeholder="Name" 
              style="padding: 8px 12px; border-radius: 8px; border: 1px solid #ccc; font-size: 1rem; width: 80%; max-width: 200px;" />
       <div style="margin-top: 12px;">
         <button id="playerNameOk" 
                 style="padding: 8px 20px; background: #d94a1f; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.95rem;">OK</button>
       </div>
     </div>`
  );

  const input = document.getElementById("playerNameInput");
  const ok = document.getElementById("playerNameOk");

  function acceptName() {
    const v = input.value.trim();
    if (v.length === 0) return input.focus();
    setPlayerName(v);
    hideOverlay();
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
    stars.forEach((s) => s.draw());
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

  const player = getPlayer();
  if (player) player.update();
  asteroids.forEach((a) => a.update());
  updateParticles();
  checkCollisions();
  handleAsteroidSpawning(state.deltaTime);

  state.score += state.deltaTime / 100;
  scoreElement.textContent = state.score.toFixed(0);

  drawBackground();
  drawAsteroids();
  if (player) player.draw();
  drawParticles();

  requestAnimationFrame(gameLoop);
}

function handleAsteroidSpawning(deltaTime) {
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
  let minSize = 20;
  let maxSize = 50;

  if (window.innerWidth < 768) {
    minSize = 12;
    maxSize = 32;
  }

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
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#030417");
  g.addColorStop(0.45, "#07102a");
  g.addColorStop(1, "#000014");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const nx = canvas.width * 0.25;
  const ny = canvas.height * 0.2;
  const nr = Math.max(canvas.width, canvas.height) * 0.6;
  const neb = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
  neb.addColorStop(0, "rgba(8,18,48,0.45)");
  neb.addColorStop(0.25, "rgba(18,8,48,0.18)");
  neb.addColorStop(0.6, "rgba(0,0,0,0)");
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = neb;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-over";

  stars.forEach((s) => s.draw());

  const vign = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    Math.max(canvas.width, canvas.height) * 0.2,
    canvas.width / 2,
    canvas.height / 2,
    Math.max(canvas.width, canvas.height) * 0.8
  );
  vign.addColorStop(0, "rgba(0,0,0,0)");
  vign.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = vign;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (state.slowMotionActive && state.running) {
    ctx.fillStyle = "rgba(0, 180, 150, 0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

export function drawAsteroids() {
  asteroids.forEach((a) => a.draw());
}

export function drawParticles() {
  particles.forEach((p) => p.draw());
}
