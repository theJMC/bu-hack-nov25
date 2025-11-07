let screenSpeed = 0;
let SHOW_TEST_PLAYER = false
let font;
let ben;
let emili;
let gernot;
let tim;

function preload() {
  font = loadFont('/assets/ZCOOLKuaiLe-Regular.ttf');
  ben = loadImage('/assets/lecturers/ben.png');
  emili = loadImage('/assets/lecturers/emili.png');
  gernot = loadImage('/assets/lecturers/gernot.png');
  tim = loadImage('/assets/lecturers/tim.png');
}

function setup() {
  let canvas = createCanvas(min(800, windowWidth - 25), 600);
  canvas.parent('game-container');
  textAlign(CENTER, CENTER);
  textFont(font);
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
    screenSpeed = min(screenSpeed + 0.0025, 10);
  } else {
    fill('#ff6600');
    text('all players have died', width/2,height/2);
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

    case "p":
      addPlayer(1)
      break;

    default:
      break;
  }
});


