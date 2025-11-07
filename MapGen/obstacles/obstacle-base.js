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

  collidesWith(player, width, height, x = this.x, y = this.y) {
    return (
      player.x < x + width &&
      player.x + player.width > x &&
      player.y < y + height &&
      player.y + player.height > y
    );
  }

  isOffScreen(length) {
    return this.x + length <= 0;
  }
}
