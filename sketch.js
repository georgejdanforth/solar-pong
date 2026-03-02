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

// ----------------------------------------------------------------------------
// Lifecycle functions
// ----------------------------------------------------------------------------
function setup() {
  createCanvas(windowWidth, windowHeight);
  // Run update bodies first to prepopulate the cache, then run it again so
  // that the correct scale factor is applied.
  updateScaleFactor();
  updateBodies();
  console.log(bodies);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateScaleFactor();
  updateBodies();
}

function draw() {
  updateBodies();

  background(0);
  Object.entries(bodies).forEach(([_, body]) => {
    circle(body.position.x, body.position.y, 10);
  });
  if (frameCount % 60 === 0) {
    console.log(Object.entries(bodies).map(([name, body]) => ({
      name: name,
      position: body.position,
    })));
  }

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
