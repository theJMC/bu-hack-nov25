const SPIKE_COLOUR = color(255, 204, 0);
const SPIKE_LENGTH = 20;
const SPIKE_HEIGHT = SPIKE_LENGTH / 4;

/**
 * Spikes are danger to the player
 * The amount of spikes will be randomised upon generation (2-5)
 */

class Spike {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.a = random(2, 6);
    this.length = SPIKE_LENGTH * this.a
  }
  draw() {
    // draw a set of triangles starting at x,y coordinates
    fill(SPIKE_COLOUR)
    noStroke();
    for (let a = 0; a < this.a; a++) {
        let offset = SPIKE_LENGTH * a
        triangle(this.x + offset, this.y, this.x + offset + SPIKE_LENGTH, this.y + SPIKE_HEIGHT, this.x + offset + (SPIKE_LENGTH * 2), this.y)
    }
  }
  move(speed) {
    this.x - speed
  }
  isOffScreen() {
    if (this.x + this.length <= 0) {
        // whole spike section will be off the screen
        return true
    }
  }
}