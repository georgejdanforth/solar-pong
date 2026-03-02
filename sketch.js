const BODY_NAMES = [
  "sun",
  "mercury",
  "venus",
  "earth",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
];

// ----------------------------------------------------------------------------
// Global state
// ----------------------------------------------------------------------------
var currentDate = new Date();
var bodies = {};
var orbitScaleFactor = 0;

var ball = {
  position: { x: 0.0, y: 0.0 },
  velocity: { x: 0.0, y: 0.0 },
  prevPositions: [],
}

// ----------------------------------------------------------------------------
// Lifecycle functions
// ----------------------------------------------------------------------------
function setup() {
  createCanvas(windowWidth, windowHeight);
  // Run update bodies first to prepopulate the cache, then run it again so
  // that the correct scale factor is applied.
  updateScaleFactor();
  updateBodies();
  initBall();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateScaleFactor();
  updateBodies();
}

function draw() {
  updateBodies();
  updateBall();

  background(0);
  Object.entries(bodies).forEach(([_, body]) => {
    circle(body.position.x, body.position.y, 10);
  });

  ball.prevPositions.forEach((pos, i) => {
    const alpha = (i + 1) / ball.prevPositions.length;
    fill(255, 255, 255, alpha * 255);
    noStroke();
    circle(pos.x, pos.y, 20 * alpha);
  });
  circle(ball.position.x, ball.position.y, 20);

  incrementDate();
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function incrementDate() {
  currentDate.setDate(currentDate.getDate() + 1);
}

function scaleAndTranslateVec(vec) {
  return {
    x: (vec.x * orbitScaleFactor) + (windowWidth / 2.0),
    y:  (-1.0 * (vec.y * orbitScaleFactor)) + (windowHeight / 2.0),
    z: 0.0,
  };
}

function updateBodies() {
  const positions = window.lagrange.planet_positions.getPositions(currentDate, true);
  BODY_NAMES.forEach(name => {
    const body = window.lagrange.planet_positions.getBody(name);
    if (bodies[name] != null) {
      body.previousPosition = bodies[name].position;
    }
    const position = positions.find(p => p.name === body.name);
    if (position != null) {
      body.position = scaleAndTranslateVec(position.position);
      body.velocity = scaleAndTranslateVec(position.velocity);
    }
    bodies[name] = body;
  });
}

function updateScaleFactor() {
  if (Object.keys(bodies).length === 0) {
    window.lagrange.planet_positions.getPositions(currentDate, true);
  }
  const pluto = window.lagrange.planet_positions.getBody("pluto");
  const radius = sqrt(sq(pluto.position.x) + sq(pluto.position.y));
  orbitScaleFactor = (0.6 * windowWidth) / radius;
}

function initBall() {
  ball.position.x = 0.0;
  ball.position.y = 0.0;
  ball.velocity.x = 2.0;
  ball.velocity.y = 2.0;
}

function computeGravity(bodies) {

  return { x: ax, y: ay };
}

function updateBall() {
  let ax = 0, ay = 0;
  const G = 1e-27;
  Object.values(bodies).forEach(body => {
    const dx = body.position.x - ball.position.x;
    const dy = body.position.y - ball.position.y;
    const rSq = max(sq(dx) + sq(dy), 0.01);
    const r = sqrt(rSq);
    const a = (G * body.mass) / rSq;
    ax += a * (dx / r);
    ay += a * (dy / r);
  });
  ball.velocity.x += ax;
  ball.velocity.y += ay;
  ball.prevPositions.push({ x: ball.position.x, y: ball.position.y });
  if (ball.prevPositions.length > 100) ball.prevPositions.shift();
  ball.position.x += ball.velocity.x;
  ball.position.y += ball.velocity.y;

  if (ball.position.x < 0 || ball.position.x > windowWidth)  ball.velocity.x *= -1;
  if (ball.position.y < 0 || ball.position.y > windowHeight) ball.velocity.y *= -1;
}

function debug(fn) {
  if (frameCount === 1 || frameCount % 60 === 0) {
    fn();
  }
}
