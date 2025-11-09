import { Vector } from "../vector.js";
import { ctx } from "../globals.js";

export class Star {
  constructor() {
    this.position = new Vector(Math.random() * window.innerWidth, Math.random() * window.innerHeight);
    this.size = Math.random() * 1.5;
    this.color = `rgba(255, 255, 255, ${0.5 + Math.random() * 0.5})`;
    this.blinkSpeed = 0.005 + Math.random() * 0.01;
  }

  draw() {
    const alpha = Math.sin(Date.now() * this.blinkSpeed) * 0.5 + 0.5;
    ctx.fillStyle = this.color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
