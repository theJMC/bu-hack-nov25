let OBSTACLES = [];
const MAX_OBSTACLES = 7;
const TYPES = ["ledge", "spike", "vine"];

/**
 * Helper to create a new obstacle object
 */
function createObstacle(type, x, y) {
  switch (type) {
    case "ledge":
      return new Ledge(x, y);
    case "spike":
      return new Spike(x, y);
    case "vine":
      return new Vine(x, y);
  }
}

/**
 * At the start of the game, platforms will be generated across the screen
 * starting a little away from the player
 */
function startGeneration() {
  OBSTACLES = [];

  for (let i = 0; i < MAX_OBSTACLES; i++) {
    const x = random(width / 2, width * 1.5); // spread across the screen
    const type = TYPES[int(random(TYPES.length))];

    let y;
    switch (type) {
      case "ledge":
      case "spike":
        y = random(height / 2, height - 50); // closer to the ground
        break;
      case "vine":
        y = random(0, height / 3); // hanging from ceiling
        break;
    }

    OBSTACLES.push(createObstacle(type, x, y));
  }
}

/**
 * Obstacles are generated as the old objects fall off the screen
 * These will start at the end of the screen (X-Axis)
 */
function generateNew() {
  const type = TYPES[int(random(TYPES.length))];
  let y;
  switch (type) {
    case "ledge":
    case "spike":
      y = random(height / 2, height - 50);
      break;
    case "vine":
      y = random(0, height / 3);
      break;
  }

  const x = width
  OBSTACLES.push(createObstacle(type, x, y));
}

/**
 * Remove any obstacles that have fallen off the screen and generate new ones in their place
 * The new obstacles will be random
 */
function updateObstacles(speed) {
  for (let i = OBSTACLES.length - 1; i >= 0; i--) {
    const o = OBSTACLES[i];
    o.move(speed);
    o.draw();

    if (o.isOffScreen()) {
      OBSTACLES.splice(i, 1);
      generateNew();
    }
  }
}
