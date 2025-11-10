import { Vector } from "../vector.js";
import {
  ctx,
  canvas,
  state,
  particles,
  THRUST,
  FRICTION,
  MAX_VELOCITY,
  SLOW_MOTION_FACTOR,
} from "../globals.js";
import { Particle } from "./particle.js";

export class Rocket {
  constructor() {
    this.position = new Vector(canvas.width / 2, canvas.height / 2);
    this.velocity = new Vector(0, 0);
    this.angle = -Math.PI / 2;
    this.size = 15;
    this.hitRadius = this.size * 0.9;
    this.color = "#FF5722";
    this._idleEmitAccumulator = -40;
  }

  update() {
    this.velocity.multiply(FRICTION ** (state.deltaTime / 16));

    if (state.input.joystickTouchID !== null) {
      const targetAngle = state.input.joystickAngle;
      let angleDiff = targetAngle - this.angle;
      if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      this.angle += angleDiff * 0.1 * (state.deltaTime / 16);
    }

    if (state.input.isBoosting && state.running) {
      const boostForce = new Vector(
        Math.cos(this.angle) * THRUST,
        Math.sin(this.angle) * THRUST
      );
      this.velocity.add(boostForce.multiply(state.deltaTime));

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
            "#FFA500",
            1 + Math.random() * 2,
            10 + Math.random() * 5,
            1 + Math.random() * 1.5
          )
        );
      }
    }

    this._idleEmitAccumulator += state.deltaTime;
    const idleInterval = state.slowMotionActive ? 120 : 80;
    if (this._idleEmitAccumulator >= idleInterval && state.running) {
      this._idleEmitAccumulator -= idleInterval;
      const particleOffset = new Vector(
        -Math.cos(this.angle) * this.size * 0.9,
        -Math.sin(this.angle) * this.size * 0.9
      );
      particles.push(
        new Particle(
          this.position.x + particleOffset.x + (Math.random() - 0.5) * 4,
          this.position.y + particleOffset.y + (Math.random() - 0.5) * 4,
          this.angle + Math.PI + (Math.random() - 0.5) * 0.6,
          "#00FFC0",
          0.4 + Math.random() * 0.8,
          140 + Math.random() * 120,
          1 + Math.random() * 1.2
        )
      );
    }

    this.velocity.limit(
      MAX_VELOCITY * (state.slowMotionActive ? SLOW_MOTION_FACTOR : 1)
    );

    const effectiveVelocity = this.velocity
      .copy()
      .multiply(state.deltaTime / 16);
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

    // Idle/normal engine glow (always visible)
    ctx.fillStyle = "#00FFC0";
    ctx.beginPath();
    ctx.arc(this.size * 0.3, 0, this.size * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Boost fire (only when boosting)
    if (state.input.isBoosting && state.running) {
      ctx.fillStyle = "#FFA500";
      ctx.beginPath();
      ctx.arc(-this.size * 0.85, 0, this.size * 0.18, 0, Math.PI * 2);
      ctx.fill();
      // Glow effect
      ctx.strokeStyle = "rgba(255, 165, 0, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  checkCollision(asteroid) {
    const dx = this.position.x - asteroid.position.x;
    const dy = this.position.y - asteroid.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.hitRadius + asteroid.size * 0.9;
  }
}
