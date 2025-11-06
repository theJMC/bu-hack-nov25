let screenSpeed = 0;
let SHOW_TEST_PLAYER = true
let font;
let ben;
let emili;
let gernot;
let tim;

function preload() {
  font = loadFont('/assets/ZCOOLKuaiLe-Regular.ttf');
  ben = loadImage('/assets/ben.png');
  emili = loadImage('/assets/emili.png');
  gernot = loadImage('/assets/gernot.png');
  tim = loadImage('/assets/tim.png');
}

function setup() {
  createCanvas(min(800, windowWidth - 25), 600);
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
    screenSpeed = min(screenSpeed + 0.01, 7);
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


