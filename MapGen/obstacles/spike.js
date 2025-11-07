let SPIKE_COLOUR;
const SPIKE_LENGTH = 20;
const SPIKE_HEIGHT = SPIKE_LENGTH / 1.5;

/**
 * Spikes are danger to the player
 * The amount of spikes will be randomised upon generation (1–4)
 */
class Spike extends Obstacle {
  constructor(x, y) {
    super(x, y);

    this._initialized = false;
    this.count = 0;
    this.length = 0;
    this.height = SPIKE_HEIGHT;
  }

  init() {
    SPIKE_COLOUR = SPIKE_COLOUR || color(255, 204, 0);
    this.fillColor = color(200, 40, 40);
    this.strokeColor = color(120, 20, 20);

    this.count = int(random(1, 4));
    this.length = this.count * SPIKE_LENGTH * 2;
    this._initialized = true;
  }

  draw() {
    if (!this._initialized) this.init();

    noStroke();
    fill(this.fillColor);
    for (let i = 0; i < this.count; i++) {
      const offset = SPIKE_LENGTH * i * 2;
      triangle(
        this.x + offset,
        this.y,
        this.x + offset + SPIKE_LENGTH,
        this.y - SPIKE_HEIGHT,
        this.x + offset + (SPIKE_LENGTH * 2),
        this.y
      );
      image(spike, this.x + offset, this.y - SPIKE_HEIGHT, SPIKE_LENGTH * 2, SPIKE_HEIGHT);
    }
  }

  collidesWith(player) {
    const hitboxY = this.y - this.height;
    const hitboxHeight = this.height * 1.3;

    if (super.collidesWith(player, this.length, hitboxHeight, this.x, hitboxY)) {
      player.hurt();
    }
  }

  isOffScreen() {
    return super.isOffScreen(this.length);
  }
}
