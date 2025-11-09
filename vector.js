export class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  add(other) {
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  subtract(other) {
    this.x -= other.x;
    this.y -= other.y;
    return this;
  }

  multiply(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  setMagnitude(m) {
    const factor = m / this.magnitude();
    this.x *= factor;
    this.y *= factor;
    return this;
  }

  limit(max) {
    if (this.magnitude() > max) {
      this.setMagnitude(max);
    }
    return this;
  }

  copy() {
    return new Vector(this.x, this.y);
  }
}
