let VINE_COLOUR;
const VINE_HEIGHT = 100;
const VINE_LENGTH = 50;

/**
 * Vines are able to spawn on ceilings.
 * The player will be able to walk/jump into them,
 * and they will slow the player's movement.
 */
class Vine extends Obstacle {
  constructor(x, y) {
    super(x, y);

    this._initialized = false;
    this.length = VINE_LENGTH;
    this.height = VINE_HEIGHT;
  }

  init() {
    VINE_COLOUR = VINE_COLOUR || color(50, 180, 70, 180);
    this.fillColor = color(50, 180, 70, 180);
    this.strokeColor = color(30, 120, 40, 180);
    this._initialized = true;
  }


  draw() {
    if (!this._initialized) this.init();

    noStroke();
    fill(this.fillColor);
    //rect(this.x, this.y, this.length, this.height);
    image(vine, this.x, this.y, this.length, this.height);
  }

  collidesWith(player) {
    if (super.collidesWith(player, this.length, this.height)) {
      player.slow()
    }
  }

  isOffScreen() {
    return super.isOffScreen(this.length);
  }
}