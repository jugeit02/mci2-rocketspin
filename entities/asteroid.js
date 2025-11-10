import { Vector } from "../vector.js";
import { canvas, state, getPlayer, ctx } from "../globals.js";

export class Asteroid {
  constructor(radius, position, velocity) {
    this.position =
      position ||
      new Vector(Math.random() * canvas.width, Math.random() * canvas.height);

    const player = getPlayer();
    if (player) {
      while (
        this.position.copy().subtract(player.position.copy()).magnitude() < 200
      ) {
        this.position = new Vector(
          Math.random() * canvas.width,
          Math.random() * canvas.height
        );
      }
    }

    this.velocity =
      velocity ||
      new Vector((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5);
    this.velocity.multiply(0.6);
    this.size = radius;
    this.angle = Math.random() * Math.PI * 2;
    this.spin = (Math.random() - 0.5) * 0.001;
    this.complexity = Math.floor(4 + Math.random() * 4);
    this.vertices = this.generateVertices();
    this.color = "#999999";
    const light = 165 + Math.floor(Math.random() * 36);
    const dark = 110 + Math.floor(Math.random() * 30);
    this._lightColor = `rgb(${light}, ${light}, ${light - 10})`;
    this._darkColor = `rgb(${dark}, ${dark - 6}, ${dark - 30})`;
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
    const effectiveVelocity = this.velocity
      .copy()
      .multiply(state.deltaTime / 16);
    this.position.add(effectiveVelocity);
    this.angle += this.spin * state.deltaTime;

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

    const grad = ctx.createRadialGradient(
      0,
      0,
      this.size * 0.2,
      0,
      0,
      this.size * 1.2
    );
    grad.addColorStop(0, this._lightColor || "#bdbdbd");
    grad.addColorStop(1, this._darkColor || "#6a6a6a");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
    for (let i = 1; i < this.vertices.length; i++) {
      ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = this.color;
    ctx.lineWidth = Math.max(1, this.size * 0.04);
    ctx.stroke();

    const craterCount = Math.max(0, Math.floor(this.size / 24));
    for (let c = 0; c < craterCount; c++) {
      const ca = Math.random() * Math.PI * 2;
      const cr = (Math.random() * 0.35 + 0.12) * this.size;
      const cx = Math.cos(ca) * (Math.random() * 0.45) * this.size;
      const cy = Math.sin(ca) * (Math.random() * 0.45) * this.size;
      ctx.beginPath();
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      ctx.arc(cx, cy, cr * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.arc(cx - cr * 0.12, cy - cr * 0.08, cr * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
