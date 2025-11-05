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

    if (p.isOffScreen()) {
      PLAYERS.splice(i, 1);
      p.die();
    }
  }
}

// TODO - incoming player actions from the gyroscope

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
    PLAYERS.splice(index, 1);
    player.die();
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

    const player = new Player(0, 0, id);
    PLAYERS.push(player);
}

/**
 * This is for testing - there should be no test players in real runs
 */
function renderTestPlayer() {
    addPlayer(1)
}