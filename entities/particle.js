import { Vector } from "../vector.js";
import { state, ctx } from "../globals.js";

export class Particle {
  constructor(x, y, angle, color, speed, lifetime, size) {
    this.position = new Vector(x, y);
    this.velocity = new Vector(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
    this.color = color;
    this.lifetime = lifetime;
    this.age = 0;
    this.size = typeof size === "number" ? size : 2;
  }

  update() {
    const effectiveVelocity = this.velocity
      .copy()
      .multiply(state.deltaTime / 16);
    this.position.add(effectiveVelocity);
    this.age += state.deltaTime;
    this.velocity.multiply(0.98);
  }

  draw() {
    const alpha = Math.max(0, 1 - this.age / this.lifetime);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  isDead() {
    return this.age >= this.lifetime;
  }
}
