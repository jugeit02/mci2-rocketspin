import { Vector } from "../vector.js";
import { canvas, state, getPlayer, ctx } from "../globals.js";

export class Asteroid {
  constructor(radius, position, velocity) {
    this.position =
      position ||
      new Vector(Math.random() * canvas.width, Math.random() * canvas.height);

    // Stelle sicher, dass der Asteroid nicht zu nah am Spieler startet
    const player = getPlayer();
    if (player) {
      while (this.position.copy().subtract(player.position.copy()).magnitude() < 200) {
        this.position = new Vector(Math.random() * canvas.width, Math.random() * canvas.height);
      }
    }

    this.velocity =
      velocity || new Vector((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5);
    this.size = radius;
    this.angle = Math.random() * Math.PI * 2;
    this.spin = (Math.random() - 0.5) * 0.005;
    this.complexity = Math.floor(4 + Math.random() * 4);
    this.vertices = this.generateVertices();
    this.color = "#999999";
  }

  generateVertices() {
    const vertices = [];
    for (let i = 0; i < this.complexity; i++) {
      const angle = ((Math.PI * 2) / this.complexity) * i;
      const r = this.size * (0.8 + Math.random() * 0.4);
      vertices.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }
    return vertices;
  }

  update() {
    const effectiveVelocity = this.velocity.copy().multiply(state.deltaTime / 16);
    this.position.add(effectiveVelocity);
    this.angle += this.spin * state.deltaTime;

    if (this.position.x < -this.size) this.position.x = canvas.width + this.size;
    if (this.position.x > canvas.width + this.size) this.position.x = -this.size;
    if (this.position.y < -this.size) this.position.y = canvas.height + this.size;
    if (this.position.y > canvas.height + this.size) this.position.y = -this.size;
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
