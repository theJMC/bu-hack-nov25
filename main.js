let screenSpeed = 1;
let SHOW_TEST_PLAYER = true

function setup() {
  createCanvas(min(800, windowWidth - 25), 600);
  startGeneration();

  if (SHOW_TEST_PLAYER) {
    renderTestPlayer()
  }
}

function draw() {
  clear()
  background(0);
  updateObstacles(screenSpeed);
  updatePlayers(screenSpeed)
  screenSpeed = min(screenSpeed + 0.01, 5);
}

