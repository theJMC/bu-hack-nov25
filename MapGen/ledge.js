const LEDGE_COLOUR = color(255, 204, 0);
const LEDGE_HEIGHT = 20;

/**
 * Ledges are solid platforms the player will be able to walk/jump onto
 */

class Ledge {
  constructor(x, y, length) {
    this.x = x
    this.y = y
    this.length = length
  }
  draw() {
    // draw a rectangle at x,y coordinates
    fill(LEDGE_COLOUR)
    noStroke();
    rect(this.x, this.y, this.x + this.length, this.y + LEDGE_HEIGHT)
  }
  move(speed) {
    this.x - speed
  }
  isOffScreen() {
    if (this.x + this.length <= 0) {
        // whole ledge will be off the screen
        return true
    }
  }
}