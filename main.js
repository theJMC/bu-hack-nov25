let screenSpeed = 1;
let SHOW_TEST_PLAYER = true

function setup() {
  createCanvas(min(800, windowWidth - 25), 600);
  textAlign(CENTER, CENTER);
  textSize(32);

  // Game code
  startGeneration();

  if (SHOW_TEST_PLAYER) {
    addPlayer(1)
  }
}

function draw() {
  clear()
  if (PLAYERS.length != 0) {
    background(0);
    updateObstacles(screenSpeed);
    updatePlayers(screenSpeed)
    screenSpeed = min(screenSpeed + 0.01, 7);
  } else {
    text('All Players have died', width/2,height/2);
  }
}

/**
 * TEST PLAYER FUNCTIONALITIES
 */
document.addEventListener("keydown", (event) => {
  switch (event.key.toLowerCase()) {
    case "arrowup":
    case "w":
    case " ":
      jumpPlayer(1);
      break;

    case "arrowdown":
    case "s":
      slidePlayer(1);
      break;

    case "v":
      clamberPlayer(1);
      break;

    default:
      break;
  }
});


