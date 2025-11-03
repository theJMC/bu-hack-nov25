/**
 * This is the base of all obsicles
 * Although they will all act differantly upon collision they will all share some properties
 * To render and move across the screen
 */
class Obstacle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  move(speed) {
    this.x -= speed;
  }

  collidesWith(player, width, height) {
    return (
      player.x < this.x + width &&
      player.x + player.width > this.x &&
      player.y < this.y + height &&
      player.y + player.height > this.y
    );
  }

  isOffScreen(length) {
    return this.x + length <= 0;
  }
}
