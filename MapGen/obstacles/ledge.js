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
    if (!super.collidesWith(player, this.length, this.height)) return false;

    const px = player.x, py = player.y, pw = player.width, ph = player.height;
    const lx = this.x, ly = this.y, lw = this.length, lh = this.height;

    const overlapX = Math.min(px + pw, lx + lw) - Math.max(px, lx);
    const overlapY = Math.min(py + ph, ly + lh) - Math.max(py, ly);

    if (overlapX < overlapY) {
      // Horizontal collision
      if (px < lx) player.cannotMoveX = true
    } else {
      // Vertical collision — check if player is falling onto the ledge
      const threshold = 10; // how far the player can penetrate before snapping
      if (player.y + player.height > ly - threshold && player.y + player.height <= ly + lh) {
        player.y = ly - player.height; // snap player on top
        player.velocityY = 0;
        player.isJumping = false;
        player.jumpNumber = 0;
      }
    }

    return true;
  }

  isOffScreen() {
    return super.isOffScreen(this.length);
  }
}
