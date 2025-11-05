let LEDGE_COLOUR;
const LEDGE_HEIGHT = 20;

/**
 * Ledges are solid platforms the player will be able to walk/jump onto
 */
class Ledge extends Obstacle {
  constructor(x, y) {
    super(x, y);

    this._initialized = false;

    this.length = 0;
    this.height = LEDGE_HEIGHT;
  }

  init() {
    LEDGE_COLOUR = LEDGE_COLOUR || color(255, 204, 0);
    this.fillColor = color(150, 100, 50);
    this.strokeColor = color(100, 60, 30);
    this.length = random(100, 300);
    this._initialized = true;
  }

  draw() {
    if (!this._initialized) this.init();

    noStroke();
    fill(this.fillColor);
    rect(this.x, this.y, this.length, this.height);
  }

  collidesWith(player) {
    if (super.collidesWith(player, this.length, this.height)) {
      return true;
    }
    return false;
  }

  isOffScreen() {
    return super.isOffScreen(this.length);
  }
}
