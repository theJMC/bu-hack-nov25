const VINE_COLOUR = color(255, 204, 0);
const VINE_HEIGHT = 100;
const VINE_LENGTH = 150;

/**
 * Vines are able to spawn on ceilings
 * The player will be able to walk/jump into them
 * And they will slow the players movement
 */
class Vine extends Obstacle {
  constructor(x, y) {
    super(x, y);
  }

  draw() {
    // draw a rectangle at x,y coordinates
    fill(VINE_COLOUR)
    noStroke();
    rect(this.x, this.y, this.x + VINE_LENGTH, this.y + VINE_HEIGHT)
  }

  collidesWith(player) {
    if (super.collidesWith(player, this.length, this.height)) {
      // player.speed is lowered
      return true;
    }
  }

  isOffScreen() {
    return super.isOffScreen(VINE_LENGTH);
  }
}
