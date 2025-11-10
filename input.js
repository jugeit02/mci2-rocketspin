import {
  state,
  joystickContainer,
  joystickPad,
  boostButton,
} from "./globals.js";

function getTouchById(touches, id) {
  return Array.from(touches).find((t) => t.identifier === id);
}

export function addControlEventListeners({ startGame, startIfAllowed }) {
  const starter =
    typeof startIfAllowed === "function" ? startIfAllowed : startGame;
  boostButton.addEventListener("touchstart", (e) =>
    handleBoostStart(e, starter)
  );
  boostButton.addEventListener("touchend", handleBoostEnd);
  boostButton.addEventListener("mousedown", (e) =>
    handleBoostStart(e, starter)
  );
  boostButton.addEventListener("mouseup", handleBoostEnd);

  joystickContainer.addEventListener("touchstart", handleJoystickStart);
  joystickContainer.addEventListener("touchend", () =>
    setJoystickActiveClass(false)
  );

  joystickContainer.addEventListener("mousedown", handleJoystickStartMouse);
  document.addEventListener("mousemove", handleJoystickMoveMouse);
  document.addEventListener("mouseup", handleJoystickEndMouse);

  const canvas = document.getElementById("gameCanvas");
  canvas.addEventListener("touchstart", handleCanvasTouchStart);
  canvas.addEventListener("touchend", handleCanvasTouchEnd);
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener("mousedown", handleCanvasMouseDown);
  canvas.addEventListener("mouseup", handleCanvasMouseUp);
}

function setBoostActiveClass(active) {
  try {
    if (active) document.body.classList.add("boost-active");
    else document.body.classList.remove("boost-active");
  } catch (e) {}
}

function setJoystickActiveClass(active) {
  try {
    if (active) document.body.classList.add("joystick-active");
    else document.body.classList.remove("joystick-active");
  } catch (e) {}
}

export function handleBoostStart(e, starter) {
  e.preventDefault();
  boostButton.classList.add("pressed");
  if (!state.running) {
    try {
      starter();
    } catch (err) {}
    if (state.running) {
      state.input.isBoosting = true;
      return;
    }
    return;
  }
  state.input.isBoosting = true;
  setBoostActiveClass(true);
  updateSlowMotion();
}

export function handleBoostEnd(e) {
  e.preventDefault();
  boostButton.classList.remove("pressed");
  state.input.isBoosting = false;
  setBoostActiveClass(false);
  updateSlowMotion();
}

export function handleJoystickStart(e) {
  e.preventDefault();
  if (state.input.joystickTouchID !== null) return;

  const touch = e.changedTouches[0];
  state.input.joystickTouchID = touch.identifier;

  const rect = joystickContainer.getBoundingClientRect();
  state.input.joystickCenter = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };

  document.addEventListener("touchmove", handleJoystickMove);
  document.addEventListener("touchend", handleJoystickEnd);
  document.addEventListener("touchcancel", handleJoystickEnd);
  updateSlowMotion();
  setJoystickActiveClass(true);
}

export function handleJoystickMove(e) {
  if (state.input.joystickTouchID === null || !state.running) return;

  const touch = getTouchById(e.touches, state.input.joystickTouchID);
  if (!touch) return;

  const dx = touch.clientX - state.input.joystickCenter.x;
  const dy = touch.clientY - state.input.joystickCenter.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  let angle = Math.atan2(dy, dx);
  let magnitude = Math.min(distance, 30);
  const padX = Math.cos(angle) * magnitude;
  const padY = Math.sin(angle) * magnitude;
  joystickPad.style.transform = `translate(${padX}px, ${padY}px)`;
  state.input.joystickAngle = angle;
}

export function handleJoystickEnd(e) {
  if (state.input.joystickTouchID === null) return;

  const isJoystickFingerReleased = Array.from(e.changedTouches).some(
    (t) => t.identifier === state.input.joystickTouchID
  );
  if (isJoystickFingerReleased) {
    state.input.joystickTouchID = null;
    joystickPad.style.transform = "translate(0, 0)";
    document.removeEventListener("touchmove", handleJoystickMove);
    document.removeEventListener("touchend", handleJoystickEnd);
    document.removeEventListener("touchcancel", handleJoystickEnd);
    updateSlowMotion();
    setJoystickActiveClass(false);
  }
}

let isJoystickBeingDragged = false;
export function handleJoystickStartMouse(e) {
  e.preventDefault();
  if (e.button !== 0) return;
  isJoystickBeingDragged = true;
  const rect = joystickContainer.getBoundingClientRect();
  state.input.joystickCenter = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
  setJoystickActiveClass(true);
}

export function handleJoystickMoveMouse(e) {
  if (!isJoystickBeingDragged || !state.running) return;
  const dx = e.clientX - state.input.joystickCenter.x;
  const dy = e.clientY - state.input.joystickCenter.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  let angle = Math.atan2(dy, dx);
  let magnitude = Math.min(distance, 30);
  const padX = Math.cos(angle) * magnitude;
  const padY = Math.sin(angle) * magnitude;
  joystickPad.style.transform = `translate(${padX}px, ${padY}px)`;
  state.input.joystickAngle = angle;
}

export function handleJoystickEndMouse(e) {
  if (!isJoystickBeingDragged) return;
  isJoystickBeingDragged = false;
  joystickPad.style.transform = "translate(0, 0)";
  setJoystickActiveClass(false);
}

export function handleCanvasTouchStart(e) {
  Array.from(e.changedTouches).forEach((touch) => {
    const target = touch.target;
    if (target !== boostButton && target.parentNode !== joystickContainer) {
      state.input.canvasTouchIDs.push(touch.identifier);
    }
  });
  updateSlowMotion();
}

export function handleCanvasTouchEnd(e) {
  const endedTouchIDs = Array.from(e.changedTouches).map((t) => t.identifier);
  state.input.canvasTouchIDs = state.input.canvasTouchIDs.filter(
    (id) => !endedTouchIDs.includes(id)
  );
  updateSlowMotion();
}

export function handleCanvasMouseDown(e) {
  if (e.button === 2) {
    e.preventDefault();
    state.slowMotionActive = true;
  }
}

export function handleCanvasMouseUp(e) {
  if (e.button === 2) {
    state.slowMotionActive = false;
  }
}

function updateSlowMotion() {
  const canvasTouches = state.input.canvasTouchIDs
    ? state.input.canvasTouchIDs.length
    : 0;
  const joystickActive = state.input.joystickTouchID !== null;
  const boostActive = !!state.input.isBoosting;

  if (canvasTouches >= 2) {
    state.slowMotionActive = true;
  } else if (canvasTouches >= 1 && (joystickActive || boostActive)) {
    state.slowMotionActive = true;
  } else {
    state.slowMotionActive = false;
  }
}
