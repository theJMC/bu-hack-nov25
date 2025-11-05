let PLAYERS = [];
const MAX_PLAYERS = 4;

/**
 * General player handeling
 */
function updatePlayers(speed) {
  for (let i = PLAYERS.length - 1; i >= 0; i--) {
    const p = PLAYERS[i];
    p.move(speed);
    p.draw();

    if (p.isOffScreen() || p.health == 0) {
      PLAYERS.splice(i, 1);
      p.die();
    }

    for (const o of OBSTACLES) {
      o.collidesWith(p)
    }
  }
}

/**
 * Finds and returns a player by their unique ID
 * @param {string|number} id - The player's unique identifier
 * @returns {Player|false} - The player instance or false if not found
 */
function getPlayer(id) {
  return PLAYERS.find(p => p.id === id) || false;
}

/**
 * Handle incoming player actions from the gyroscope
 * @param {guid} id 
 */
function jumpPlayer(id) {
  const player = getPlayer(id);
  if (!player) return;
  player.jump()
}
function slidePlayer(id) {
  const player = getPlayer(id);
  if (!player) return;
}
function clamberPlayer(id) {
  const player = getPlayer(id);
  if (!player) return;
}

// TODO - death handeling

// TODO - collisions with ledges (falling of a ledge ect ect)

/**
 * This will be used to remove a player upon a death event
 * @param {guid} id 
 */
function killPlayer(id) {
  const index = PLAYERS.findIndex(p => p.id === id);

  // If found, remove and handle death logic
  if (index !== -1) {
    const player = PLAYERS[index];
    player.die();
    PLAYERS.splice(index, 1);
  } else {
    console.warn(`Player with ID ${id} not found.`);
  }
}


/**
 * This will add a player to the game, the ID should be sent from the gesture controller
 * As it will be used for additional operations (eg jumps) through the program
 * @param {guid} id 
 */
function addPlayer(id) {
    if (PLAYERS.length > MAX_PLAYERS) {
        return false
    }

    //const player = new Player(0, 0, id);
    const player = new Player(width * 0.3, height - PLAYER_HEIGHT, id);
    PLAYERS.push(player);
}

/**
 * This is for testing - there should be no test players in real runs
 */
function renderTestPlayer() {
    addPlayer(1)
}