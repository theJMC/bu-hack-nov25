const SPIKE_COLOUR = color(255, 204, 0);
const SPIKE_LENGTH = 20;
const SPIKE_HEIGHT = SPIKE_LENGTH / 4;

/**
 * Spikes are danger to the player
 * The amount of spikes will be randomised upon generation (2-5)
 */
class Spike extends Obstacle {
  constructor(x, y) {
    super(x, y);
    this.a = int(random(2, 6));
    this.length = SPIKE_LENGTH * this.a;
    this.height = SPIKE_HEIGHT;
  }

  draw() {
    fill(SPIKE_COLOUR);
    noStroke();
    // draw a set of triangles starting at x,y coordinates
    for (let i = 0; i < this.a; i++) {
      let offset = SPIKE_LENGTH * i;
      triangle(
        this.x + offset,
        this.y,
        this.x + offset + SPIKE_LENGTH,
        this.y - SPIKE_HEIGHT,
        this.x + offset + (SPIKE_LENGTH * 2),
        this.y
      );
    }
  }

  collidesWith(player) {
    if (super.collidesWith(player, this.length, this.height)) {
      //player.health -= 1;
      return true;
    }

    return false;
  }

  isOffScreen() {
    return super.isOffScreen(this.length);
  }
}
