// ---------- CONFIG ----------
const NUM_COLUMNS = 5;
const MIN_LEDGES_PER_COLUMN = 2;
const MAX_LEDGES_PER_COLUMN = 4;
const LEDGE_WIDTH = 180;
const COLUMN_GAP = 110;
const COLUMN_JITTER = 25;
const V_GAP_MIN = 60;
const V_GAP_MAX = 120;
const BOTTOM_MARGIN = 8;
const CEILING_VINE_SPACING = 50;

// ---------- GLOBAL ARRAYS ----------
let OBSTACLES = [];
let CEILING_VINES = [];
let ceilingVineMaxX = 0; 

// ---------- HELPERS ----------

// Gaussian random
function randomGaussian(mean = 300, stddev = 80) {
  let u = 0, v = 0;
  while(u === 0) u = random();
  while(v === 0) v = random();
  return mean + Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * stddev;
}

/**
 * Generate ceiling vines continuously from ceilingVineMaxX up to upToX
 */
function generateCeilingVines(upToX) {
  const meanHeight = height / 16;
  const stddev = height / 32;

  for (let x = ceilingVineMaxX; x < upToX; x += CEILING_VINE_SPACING) {
    const vine = new Vine();
    vine.x = x + random(-10, 10);
    vine.y = 0;
    vine.height = constrain(randomGaussian(meanHeight, stddev), 30, height / 8);
    vine.length = random(VINE_LENGTH * 0.8, VINE_LENGTH * 1.2);
    vine.fillColor = color(50, 180, 70, 180); 
    vine.strokeColor = color(30, 120, 40, 180);
    OBSTACLES.push(vine);
  }
  ceilingVineMaxX = upToX;
}

/**
 * Generate a column of ledges with spikes and hanging vines
 */
function generateColumn(baseX) {
  const ledgeCount = int(random(MIN_LEDGES_PER_COLUMN, MAX_LEDGES_PER_COLUMN + 1));
  const topLimit = height * 0.2;
  const maxBottomY = height - LEDGE_HEIGHT - BOTTOM_MARGIN;

  const gaps = [];
  let totalColumnHeight = ledgeCount * LEDGE_HEIGHT;
  for (let i = 0; i < ledgeCount - 1; i++) {
    const gap = random(V_GAP_MIN, V_GAP_MAX);
    gaps.push(gap);
    totalColumnHeight += gap;
  }

  const minBottomY = topLimit + totalColumnHeight;
  const bottomY = random(minBottomY, maxBottomY);

  // Create ledges bottom-up
  for (let i = 0; i < ledgeCount; i++) {
    let y = bottomY - i * LEDGE_HEIGHT;
    for (let g = 0; g < i; g++) y -= gaps[g];
    y = constrain(y, topLimit, maxBottomY);

    const jitterX = random(-20, 20);
    const ledge = new Ledge(baseX + jitterX, y);
    ledge.length = LEDGE_WIDTH;
    OBSTACLES.push(ledge);

    // --- Spikes on ledge ---
    if (random() < 0.25) {
      const maxSpikes = Math.floor(ledge.length / (SPIKE_LENGTH * 2));
      if (maxSpikes > 0) {
        const spikeCount = int(random(1, maxSpikes + 1));
        const maxStartOffset = ledge.length - spikeCount * SPIKE_LENGTH * 2;
        const startX = ledge.x + random(0, maxStartOffset);
        const spike = new Spike(startX, ledge.y);
        spike.count = spikeCount;
        OBSTACLES.push(spike);
      }
    }

    // --- Vine hanging from ledge ---
    if (random() < 0.2) {
      const vine = new Vine();
      vine.x = ledge.x + random(0, Math.max(0, ledge.length - VINE_LENGTH));
      vine.y = ledge.y + LEDGE_HEIGHT;
      vine.height = random(100, 500);
      vine.length = random(VINE_LENGTH * 0.8, VINE_LENGTH * 1.2);
      vine.fillColor = color(50, 180, 70, 180);
      vine.strokeColor = color(30, 120, 40, 180);
      OBSTACLES.push(vine);
    }
  }

    // --- Floor spikes (70% chance per column) ---
  if (random() < 0.70) {
    const floorY = height - BOTTOM_MARGIN; // base of screen
    const maxSpikes = Math.floor(LEDGE_WIDTH / (SPIKE_LENGTH * 2));
    const spikeCount = int(random(2, maxSpikes + 1));
    const startX = baseX + random(-20, 20); // small jitter so they vary
    const spike = new Spike(startX, floorY);
    spike.count = spikeCount;
    OBSTACLES.push(spike);
  }
}


/**
 * Generate initial world
 */
function startGeneration() {
  OBSTACLES = [];
  CEILING_VINES = [];
  ceilingVineMaxX = 0;

  // Ceiling vines for initial screen
  generateCeilingVines(width * NUM_COLUMNS);

  // --- SAFE STARTING PLATFORM: multiple ledges in a row ---
  const safeLedgeCount = 3;
  const safeLedgeWidth = LEDGE_WIDTH;
  const safeLedgeHeight = LEDGE_HEIGHT * 2;

  // Center the safe platform vertically around mid-screen
  const startY = height / 2;

  // Horizontal start position
  const totalSafeWidth = safeLedgeCount * safeLedgeWidth;
  const startX = width / 2 - totalSafeWidth / 2;

  for (let i = 0; i < safeLedgeCount; i++) {
    const safeLedge = new Ledge(startX + i * safeLedgeWidth, startY);
    safeLedge.length = safeLedgeWidth;
    safeLedge.height = safeLedgeHeight;
    safeLedge.fillColor = color(255, 215, 0, 220);
    safeLedge.strokeColor = color(200, 150, 0);
    OBSTACLES.push(safeLedge);
  }

  // --- Normal columns after safe start ---
  const firstColumnX = startX + totalSafeWidth;
  for (let c = 0; c < NUM_COLUMNS; c++) {
    const baseX = firstColumnX + c * (LEDGE_WIDTH + COLUMN_GAP) + random(-COLUMN_JITTER, COLUMN_JITTER);
    generateColumn(baseX);
  }
}



/**
 * Generate a new column dynamically
 */
function generateNew() {
  let rightmostX = 0;
  for (const o of OBSTACLES) {
    if (o.x > rightmostX) rightmostX = o.x;
  }

  const baseX = rightmostX + LEDGE_WIDTH + COLUMN_GAP + random(-COLUMN_JITTER, COLUMN_JITTER);
  generateColumn(baseX);

  // Ceiling vines for new portion
  generateCeilingVines(baseX + LEDGE_WIDTH + COLUMN_GAP);
}

/**
 * Update all obstacles and remove off-screen ones
 */
function updateObstacles(speed) {
  for (let i = OBSTACLES.length - 1; i >= 0; i--) {
    const o = OBSTACLES[i];
    o.move(speed);
    o.draw();
    if (o.isOffScreen()) OBSTACLES.splice(i, 1);
  }

  // Check if we need new columns
  const columnObstacleCount = OBSTACLES.filter(o => !(o instanceof Vine && o.y === 0)).length;
  const desiredCount = NUM_COLUMNS * ((MIN_LEDGES_PER_COLUMN + MAX_LEDGES_PER_COLUMN) / 2);
  if (columnObstacleCount < desiredCount) generateNew();
}