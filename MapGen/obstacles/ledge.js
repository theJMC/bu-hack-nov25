const LEDGE_COLOUR = color(255, 204, 0);
const LEDGE_HEIGHT = 20;

/**
 * Ledges are solid platforms the player will be able to walk/jump onto
 */
class Ledge extends Obstacle {
  constructor(x, y) {
    super(x, y);
    this.length = random(100, 300);
    this.height = LEDGE_HEIGHT;
  }

  draw() {
    fill(LEDGE_COLOUR);
    noStroke();
    rect(this.x, this.y, this.x + this.length, this.y + this.height);
  }

  collidesWith(player) {
    if (super.collidesWith(player, this.length, this.height)) {
      //player.y = this.y - player.height;
      return true;
    }

    return false;
  }

  isOffScreen() {
    return super.isOffScreen(this.length);
  }
}
