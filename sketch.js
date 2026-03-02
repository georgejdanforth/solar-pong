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
BODY_STYLES = {
  sun: {
    radius: 20,
    color: "#fdf83e"
  },
  mercury: {
    radius: 5,
    color: "#a41600",
  },
  venus: {
    radius: 8,
    color: "#dcb100",
  },
  earth: {
    radius: 10,
    color: "#1ee6a9",
  },
  mars: {
    radius: 8,
    color: "#de2202",
  },
  jupiter: {
    radius: 16,
    color: "#f89125",
  },
  saturn: {
    radius: 14,
    color: "#f5ca66",
  },
  neptune: {
    radius: 12,
    color: "#66c9f5",
  },
  uranus: {
    radius: 11,
    color: "#66f5d5",
  },
  pluto: {
    radius: 5,
    color: "#1887dc",
  },
};
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const PADDLE_SPEED = 10;

const G = 1e-26;

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

var paddles = {
  player1: {},
  player2: {},
};

var score = {
  player1: 0,
  player2: 0,
};

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
  initPaddles();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateScaleFactor();
  updateBodies();
}

function draw() {
  updateBodies();
  updatePaddles();
  updateBall();

  background(0);
  Object.entries(bodies).forEach(([_, body]) => {
    const bodyStyle = BODY_STYLES[body.name];
    const r = bodyStyle.radius;
    fill(bodyStyle.color);
    noStroke();
    circle(body.position.x, body.position.y, r);
    fill(255);
    textSize(11);
    textAlign(CENTER, TOP);
    text(body.name, body.position.x, body.position.y + r / 2 + 4);
  });

  ball.prevPositions.forEach((pos, i) => {
    const alpha = (i + 1) / ball.prevPositions.length;
    fill(255, 255, 255, alpha * 255);
    noStroke();
    circle(pos.x, pos.y, 20 * alpha);
  });
  circle(ball.position.x, ball.position.y, 20);
  drawPaddles();
  drawScore();

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
  ball.position.x = windowWidth / 2.0;
  ball.position.y = 0.0;
  ball.prevPositions = [];
  const angle = random(TWO_PI);
  ball.velocity.x = 10 * cos(angle);
  ball.velocity.y = 10 * sin(angle);
}

function resetBall() {
  currentDate = new Date();
  initBall();
}

function updateBall() {
  let ax = 0, ay = 0;
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

  if (ball.position.x < 0) {
    score.player1++;
    resetBall();
    return;
  }
  if (ball.position.x > windowWidth) {
    score.player2++;
    resetBall();
    return;
  }
  if (ball.position.y < 0 || ball.position.y > windowHeight) ball.velocity.y *= -1;

  if (ballHitsPaddle(paddles.player1)) {
    ball.velocity.x *= -1;
    ball.position.x = paddles.player1.x - 10;
  }
  if (ballHitsPaddle(paddles.player2)) {
    ball.velocity.x *= -1;
    ball.position.x = paddles.player2.x + paddles.player2.w + 10;
  }
}

function ballHitsPaddle(paddle) {
  const radius = 10;
  const closestX = constrain(ball.position.x, paddle.x, paddle.x + paddle.w);
  const closestY = constrain(ball.position.y, paddle.y, paddle.y + paddle.h);
  const dx = ball.position.x - closestX;
  const dy = ball.position.y - closestY;
  return (dx * dx + dy * dy) < (radius * radius);
}

function debug(fn) {
  if (frameCount === 1 || frameCount % 60 === 0) {
    fn();
  }
}

function initPaddles() {
  paddles.player1 = {
    x: windowWidth - 40,
    y: (windowHeight / 2) - (PADDLE_HEIGHT / 2),
    w: PADDLE_WIDTH,
    h: PADDLE_HEIGHT,
  };
  paddles.player2 = {
    x: 40,
    y: (windowHeight / 2) - (PADDLE_HEIGHT / 2),
    w: PADDLE_WIDTH,
    h: PADDLE_HEIGHT,
  };
}

function updatePaddles() {
  if (keyIsDown(UP_ARROW)) {
    paddles.player1.y -= PADDLE_SPEED;
    if (paddles.player1.y < 0) {
      paddles.player1.y = 0;
    }
  }
  if (keyIsDown(DOWN_ARROW)) {
    paddles.player1.y += PADDLE_SPEED;
    if (paddles.player1.y > windowHeight - PADDLE_HEIGHT) {
      paddles.player1.y = windowHeight - PADDLE_HEIGHT;
    }
  }
  updateAI();
}

function predictBallY() {
  if (ball.velocity.x >= 0) return null; // ball moving away
  const t = -ball.position.x / ball.velocity.x;
  let y = ball.position.y + t * ball.velocity.y;
  // fold y back into window bounds to account for wall bounces
  y = y % (2 * windowHeight);
  if (y < 0) y += 2 * windowHeight;
  if (y > windowHeight) y = 2 * windowHeight - y;
  return y;
}

function updateAI() {
  const targetY = predictBallY();
  const centerY = windowHeight / 2 - PADDLE_HEIGHT / 2;
  const aimY = targetY !== null ? targetY - PADDLE_HEIGHT / 2 : centerY;
  const paddle = paddles.player2;
  if (paddle.y < aimY - PADDLE_SPEED) {
    paddle.y += PADDLE_SPEED;
  } else if (paddle.y > aimY + PADDLE_SPEED) {
    paddle.y -= PADDLE_SPEED;
  }
  paddle.y = constrain(paddle.y, 0, windowHeight - PADDLE_HEIGHT);
}

function drawScore() {
  fill(255);
  noStroke();
  textAlign(CENTER, BOTTOM);
  textSize(24);
  text(`${score.player2}  —  ${score.player1}`, windowWidth / 2, windowHeight - 32);
  textSize(14);
  text(currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), windowWidth / 2, windowHeight - 12);
}

function drawPaddles() {
  fill('white');
  noStroke();
  rect(paddles.player1.x, paddles.player1.y, paddles.player1.w, paddles.player1.h);
  rect(paddles.player2.x, paddles.player2.y, paddles.player2.w, paddles.player2.h);
}
