// ---------- CONFIG ----------
const NUM_COLUMNS = 5;               // how many columns are visible at once
const MIN_LEDGES_PER_COLUMN = 2;
const MAX_LEDGES_PER_COLUMN = 4;
const LEDGE_WIDTH = 180;             // equal ledge width
const COLUMN_GAP = 140;              // base horizontal gap between columns
const COLUMN_JITTER = 40;            // small x jitter per column for variety
const V_GAP_MIN = 60;                // min vertical gap between ledges in a column
const V_GAP_MAX = 120;               // max vertical gap between ledges in a column
const BOTTOM_MARGIN = 8;             // how many px above bottom a ledge can sit

// ---------- HELPERS ----------
/**
 * Create a column of ledges centered around baseX.
 * Ledges are stacked upward from a bottom baseline (bottomY), using
 * a variable vertical gap between them so spacing isn't uniform.
 */
function generateColumn(baseX) {
  const ledgeCount = int(random(MIN_LEDGES_PER_COLUMN, MAX_LEDGES_PER_COLUMN + 1));

  // Pick a bottom Y for this column (very close to bottom allowed, but not touching)
  // We allow some vertical variation so columns are staggered.
  const maxBottomY = height - LEDGE_HEIGHT - BOTTOM_MARGIN;
  const minBottomY = Math.max(40 + LEDGE_HEIGHT, height * 0.45); // avoid very top
  let bottomY = random(minBottomY, maxBottomY);

  // Generate variable gaps for each position above the bottom one
  const gaps = [];
  for (let i = 0; i < ledgeCount - 1; i++) {
    gaps.push(random(V_GAP_MIN, V_GAP_MAX));
  }

  // Create ledges bottom-up so the bottom-most is near the bottom of the screen
  for (let i = 0; i < ledgeCount; i++) {
    // y for ledge i (0 -> bottom-most)
    let y = bottomY - i * LEDGE_HEIGHT;
    for (let g = 0; g < i; g++) y -= gaps[g];

    // ensure y stays in screen bounds
    if (y < 10) y = 10;
    if (y > height - LEDGE_HEIGHT - BOTTOM_MARGIN) y = height - LEDGE_HEIGHT - BOTTOM_MARGIN;

    // small per-ledge horizontal jitter so same-row gaps vary
    const jitterX = random(-20, 20);
    const ledge = new Ledge(baseX + jitterX, y);

    // force equal length
    ledge.length = LEDGE_WIDTH;

    OBSTACLES.push(ledge);
  }
}

/**
 * Create the initial columns across the screen.
 */
function startGeneration() {
  OBSTACLES = [];

  // Determine start X so columns begin somewhere right of player
  const startX = width / 2;

  for (let c = 0; c < NUM_COLUMNS; c++) {
    // base column x with a small column-level jitter
    const baseX = startX + c * (LEDGE_WIDTH + COLUMN_GAP) + random(-COLUMN_JITTER, COLUMN_JITTER);
    generateColumn(baseX);
  }
}

/**
 * Generate a new column to the right when we need more obstacles.
 */
function generateNew() {
  // Find rightmost column position (approx by finding max x)
  let rightmostX = 0;
  for (const o of OBSTACLES) {
    if (o.x > rightmostX) rightmostX = o.x;
  }

  const baseX = rightmostX + LEDGE_WIDTH + COLUMN_GAP + random(-COLUMN_JITTER, COLUMN_JITTER);
  generateColumn(baseX);
}

/**
 * Move, draw, and remove off-screen ledges. If we fall below a threshold,
 * generate another column to keep the world filled.
 */
function updateObstacles(speed) {
  for (let i = OBSTACLES.length - 1; i >= 0; i--) {
    const o = OBSTACLES[i];
    o.move(speed);
    o.draw();

    if (o.isOffScreen()) {
      OBSTACLES.splice(i, 1);
    }
  }

  // If we don't have enough ledges (rough estimate), create another column
  const desiredCount = NUM_COLUMNS * ((MIN_LEDGES_PER_COLUMN + MAX_LEDGES_PER_COLUMN) / 2);
  if (OBSTACLES.length < desiredCount) {
    generateNew();
  }
}
