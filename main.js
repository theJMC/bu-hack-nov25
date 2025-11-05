let screenSpeed = 1;

function setup() {
  createCanvas(min(800, windowWidth - 25), 600);
  startGeneration();
}

function draw() {
  background(0);
  updateObstacles(screenSpeed);
  updatePlayers(screenSpeed)
  screenSpeed = min(screenSpeed + 0.01, 5);
}
