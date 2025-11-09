// Zentrale globale Referenzen, Konstanten und Zustand
export const canvas = document.getElementById("gameCanvas");
export const ctx = canvas.getContext("2d");
export const scoreElement = document.getElementById("score");
export const messageBox = document.getElementById("messageBox");

export const joystickContainer = document.getElementById("joystick-container");
export const joystickPad = document.getElementById("joystick-pad");
export const boostButton = document.getElementById("boost-button");

// Physikalische Konstanten
export const THRUST = 0.05;
export const ROTATION_SPEED = 0.0005;
export const FRICTION = 0.995;
export const MAX_VELOCITY = 5;
export const SLOW_MOTION_FACTOR = 0.3;
export const JOYSTICK_RADIUS = 30;

// Spielzustand (als Objekt, damit Importe Live-Bindings nutzen können)
export const state = {
  running: false,
  score: 0,
  lastTime: 0,
  deltaTime: 0,
  slowMotionActive: false,
  input: {
    isBoosting: false,
    canvasTouchIDs: [],
    joystickTouchID: null,
    joystickStartPos: null,
    joystickCenter: null,
    joystickAngle: 0,
  },
};

// Sammel-Arrays für Entities
export const particles = [];
export const asteroids = [];
export const stars = [];

// Spielerobjekt (wird von main/utils gesetzt)
export let player = null;

export function setPlayer(p) {
  player = p;
}

export function getPlayer() {
  return player;
}

// --- Player name & Highscore (localStorage) ---
const NAME_KEY = "rocketspin_playerName";
const HIGHSCORES_KEY = "rocketspin_highscores";

export function getPlayerName() {
  try {
    return localStorage.getItem(NAME_KEY);
  } catch (e) {
    return null;
  }
}

export function setPlayerName(name) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch (e) {
    // ignore
  }
}

export function getHighscores() {
  try {
    const raw = localStorage.getItem(HIGHSCORES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function addHighscore(name, score) {
  try {
    const list = getHighscores();
    list.push({ name: name || "---", score: Math.round(score) });
    // sort desc
    list.sort((a, b) => b.score - a.score);
    // keep top 10
    const trimmed = list.slice(0, 10);
    localStorage.setItem(HIGHSCORES_KEY, JSON.stringify(trimmed));
    return trimmed;
  } catch (e) {
    return [];
  }
}
