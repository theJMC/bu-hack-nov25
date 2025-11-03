let PLAYERS = [];
const MAX_PLAYERS = 20;

/**
 * General player handeling
 */
function updateObstacles(speed) {
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