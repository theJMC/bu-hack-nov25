let screenSpeed = 3;

function setup() {
  createCanvas(800, 600);
  startGeneration();
}

function draw() {
  background(0);
  updateObstacles(floor(screenSpeed));
  updatePlayers(floor(screenSpeed))
  screenSpeed = min(screenSpeed + 0.01, 10);
}
