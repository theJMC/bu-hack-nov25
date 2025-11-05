let screenSpeed = 1;

function setup() {
  var canvas = createCanvas(800, 600);
  canvas.parent('game-container');

  startGeneration();
}

function draw() {
  background(0);
  updateObstacles(floor(screenSpeed));
  updatePlayers(floor(screenSpeed))
  screenSpeed = min(screenSpeed + 0.01, 10);
}
