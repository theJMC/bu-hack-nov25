const PLAYER_WIDTH = 20;
const PLAYER_HEIGHT = 50;
const GRAVITY = 0.8;
const JUMP_FORCE = -15;

class Player {
  constructor(x, y, id) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    
    this.speedMod = 0;
    this.health = 2;

    this.velocityY = 0;
    this.isJumping = false;
    this.jumpNumber = 0;
    this.cannotMoveX = false;
    this.cannotSlow = 20;

    this.playerColour = color(random(255), random(255), random(255))
    this.statusColour = undefined
    this.statusTimer = 0;
  }

  draw() {
    // Draw the player as a rectangle
    // TODO - Update player shape
    noStroke();

    if (this.cannotSlow > 0) {
      // TODO update this effect to be clearer to the player
      stroke(5)
      this.cannotSlow--
    }

    fill(this.playerColour);
    rect(this.x, this.y, this.width, this.height);

    if (this.statusTimer > 0) {
      fill(this.statusColour);
      rect(this.x, this.y, this.width, this.height);
    }
    
    // decrease status timer if active
    if (this.statusTimer > 0) {
      this.statusTimer -= 1;
      if (this.statusTimer <= 0) {
        this.statusColour = undefined
      }
    }

    switch (this.id) {
      case 1:
        image(gernot, this.x - 5, this.y - 10, this.width + 10, this.width + 10);
        break;

      case 2:
        image(ben, this.x - 5, this.y - 10, this.width + 10, this.width + 10);
        break;

      case 3:
        image(emili, this.x - 5, this.y - 10, this.width + 10, this.width + 10);
        break;

      case 4:
        image(tim, this.x - 5, this.y - 10, this.width + 10, this.width + 10);
        break;

      default:
        break;
    }
  }

  jump() {
    if (this.jumpNumber < 2) {
      this.velocityY = JUMP_FORCE;
      this.jumpNumber ++
      this.isJumping = true;
      this.cannotMoveX = false;
    }
  }

  slide() {
    this.speedMod = -3;
  }

  move(speed) {
    if (!this.cannotMoveX) {
      this.x += speed - this.speedMod;
    } {
      this.x -= speed
      this.cannotMoveX = false
    }
    
    if (this.speedMod > 0) {
      this.speedMod -= 0.05;
    }
    if (this.speedMod < 0) {
      this.speedMod += 0.05;
    }

    this.velocityY += GRAVITY;
    this.y += this.velocityY;

    const groundY = height - this.height;
    if (this.y > groundY) {
      this.y = groundY;
      this.velocityY = 0;
      this.isJumping = false;
      this.jumpNumber = 0
    }
  }

  hurt() {
    this.health -= 1;
    this.statusColour = color(255, 0, 0); // red
    this.statusTimer = 30;

    if (this.health <= 0) {
      this.die();
    }
  }

  clamber() {
    this.cannotSlow = 20
    if (this.speedMod > 0) this.speedMod = 0
  }

  slow() {
    if (this.cannotSlow == 0) {
      this.speedMod = 2;
      this.statusColour = color(0, 255, 0); // green
      this.statusTimer = 60;
    }
  }

  die() {
    console.log(`Player ${this.id} has died`);
    // TODO - remove player
  }

  isOffScreen() {
    return this.x < 0
  }
}
