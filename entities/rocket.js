import { Vector } from "../vector.js";
import { ctx, canvas, state, particles, THRUST, FRICTION, MAX_VELOCITY, SLOW_MOTION_FACTOR } from "../globals.js";
import { Particle } from "./particle.js";

export class Rocket {
  constructor() {
    this.position = new Vector(canvas.width / 2, canvas.height / 2);
    this.velocity = new Vector(0, 0);
    this.angle = -Math.PI / 2; // Zeigt nach oben
    this.size = 15;
    this.hitRadius = this.size * 0.9;
    this.color = "#FF5722";
  }

  update() {
    // Trägheit
    this.velocity.multiply(FRICTION ** (state.deltaTime / 16));

    // Rotation basierend auf Joystick
    if (state.input.joystickTouchID !== null) {
      const targetAngle = state.input.joystickAngle;
      let angleDiff = targetAngle - this.angle;
      if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      this.angle += angleDiff * 0.1 * (state.deltaTime / 16);
    }

    // Boost
    if (state.input.isBoosting && state.running) {
      const boostForce = new Vector(Math.cos(this.angle) * THRUST, Math.sin(this.angle) * THRUST);
      this.velocity.add(boostForce.multiply(state.deltaTime));

      const particleOffset = new Vector(-Math.cos(this.angle) * this.size, -Math.sin(this.angle) * this.size);
      for (let i = 0; i < 2; i++) {
        particles.push(
          new Particle(
            this.position.x + particleOffset.x,
            this.position.y + particleOffset.y,
            this.angle + Math.PI + (Math.random() - 0.5) * 0.5,
            "#FFA500",
            1 + Math.random() * 2,
            10 + Math.random() * 5
          )
        );
      }
    }

    // Geschwindigkeitsbegrenzung
    this.velocity.limit(MAX_VELOCITY * (state.slowMotionActive ? SLOW_MOTION_FACTOR : 1));

    const effectiveVelocity = this.velocity.copy().multiply(state.deltaTime / 16);
    this.position.add(effectiveVelocity);

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

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.size, 0);
    ctx.lineTo(-this.size, -this.size * 0.6);
    ctx.lineTo(-this.size * 0.5, 0);
    ctx.lineTo(-this.size, this.size * 0.6);
    ctx.closePath();
    ctx.fill();

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
    return distance < this.hitRadius + asteroid.size * 0.9;
  }
}
