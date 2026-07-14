(() => {
  "use strict";

  const canvas = document.querySelector("#dice-background");
  const ctx = canvas.getContext("2d", { alpha: false });
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const PIXEL_SCALE = 4;
  const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;
  const BASE_RESTITUTION = 0.93;
  const WALL_RESTITUTION = 0.89;
  const MIN_SPEED = 7;
  const MAX_SPEED = 19;
  const TRANSLATION_SPEED_MULTIPLIER = 1.1;
  const BASE_ROTATION_SPEED_MULTIPLIER = 1.1;
  const COLLISION_FRICTION = 0.08;
  const WALL_FRICTION = 0.035;
  const ANGULAR_DAMPING = 0.82;
  const PENETRATION_SLOP = 0.8;
  const POSITION_CORRECTION = 0.74;
  const SOFT_SPEED_DAMPING = 0.035;
  const SLEEPY_SPEED_BOOST = 0.018;
  const MAX_SPIN = 1.35;
  const MAX_Z_SPIN = 0.9;
  const COLLISION_ITERATIONS = 2;
  const dice = [];
  let sceneWidth = 1;
  let sceneHeight = 1;
  let previousTime = performance.now();

  const SHAPES = {
    d4: makeTetrahedron(),
    d6: makeCube(),
    d8: makeOctahedron(),
    d10: makePentagonalTrapezohedron(),
    d12: makeDodecahedron(),
    d20: makeIcosahedron()
  };

  const STANDARD_SET = ["d4", "d6", "d8", "d10", "d10", "d12", "d20"];

  function normalizeVertex([x, y, z]) {
    const length = Math.hypot(x, y, z) || 1;
    return [x / length, y / length, z / length];
  }

  function normalizeShape(vertices) {
    const largest = Math.max(...vertices.map(([x, y, z]) => Math.hypot(x, y, z))) || 1;
    return vertices.map(([x, y, z]) => [x / largest, y / largest, z / largest]);
  }

  function add(a, b) {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  function scale(v, amount) {
    return [v[0] * amount, v[1] * amount, v[2] * amount];
  }

  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }

  function makeTetrahedron() {
    return {
      vertices: normalizeShape([
        [1, 1, 1],
        [-1, -1, 1],
        [-1, 1, -1],
        [1, -1, -1]
      ]),
      faces: [
        [0, 1, 2],
        [0, 3, 1],
        [0, 2, 3],
        [1, 3, 2]
      ]
    };
  }

  function makeCube() {
    return {
      vertices: normalizeShape([
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
      ]),
      faces: [
        [0, 1, 2, 3],
        [4, 7, 6, 5],
        [0, 4, 5, 1],
        [1, 5, 6, 2],
        [2, 6, 7, 3],
        [3, 7, 4, 0]
      ]
    };
  }

  function makeOctahedron() {
    return {
      vertices: [
        [1, 0, 0], [-1, 0, 0],
        [0, 1, 0], [0, -1, 0],
        [0, 0, 1], [0, 0, -1]
      ],
      faces: [
        [0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4],
        [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]
      ]
    };
  }

  function makePentagonalTrapezohedron() {
    const c0 = (Math.sqrt(5) - 1) / 4;
    const c1 = (1 + Math.sqrt(5)) / 4;
    const c2 = (3 + Math.sqrt(5)) / 4;
    const theta = Math.acos((c0 - c2) / Math.hypot(c0 - c2, 2 * c1));
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    const rotateZ = ([x, y, z]) => [
      x * cosTheta - y * sinTheta,
      x * sinTheta + y * cosTheta,
      z
    ];

    const vertices = normalizeShape([
      [0, c0, c1],
      [0, c0, -c1],
      [0, -c0, c1],
      [0, -c0, -c1],
      [0.5, 0.5, 0.5],
      [0.5, 0.5, -0.5],
      [-0.5, -0.5, 0.5],
      [-0.5, -0.5, -0.5],
      [c2, -c1, 0],
      [-c2, c1, 0],
      [c0, c1, 0],
      [-c0, -c1, 0]
    ].map(rotateZ));

    const faces = [
      [8, 6, 11], [8, 2, 6], [8, 7, 3], [8, 11, 7],
      [8, 1, 5], [8, 3, 1], [8, 10, 4], [8, 5, 10],
      [8, 0, 2], [8, 4, 0], [9, 4, 10], [9, 0, 4],
      [9, 5, 1], [9, 10, 5], [9, 3, 7], [9, 1, 3],
      [9, 11, 6], [9, 7, 11], [9, 2, 0], [9, 6, 2]
    ];

    return { vertices, faces };
  }

  function makeIcosahedron() {
    return {
      vertices: normalizeShape([
        [-1, GOLDEN_RATIO, 0], [1, GOLDEN_RATIO, 0],
        [-1, -GOLDEN_RATIO, 0], [1, -GOLDEN_RATIO, 0],
        [0, -1, GOLDEN_RATIO], [0, 1, GOLDEN_RATIO],
        [0, -1, -GOLDEN_RATIO], [0, 1, -GOLDEN_RATIO],
        [GOLDEN_RATIO, 0, -1], [GOLDEN_RATIO, 0, 1],
        [-GOLDEN_RATIO, 0, -1], [-GOLDEN_RATIO, 0, 1]
      ]),
      faces: [
        [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
        [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
        [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
        [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
      ]
    };
  }

  function makeDodecahedron() {
    const ico = makeIcosahedron();
    const vertices = ico.faces.map((face) => {
      const center = face.reduce((sum, index) => add(sum, ico.vertices[index]), [0, 0, 0]);
      return normalizeVertex(scale(center, 1 / face.length));
    });

    const faces = ico.vertices.map((axis, vertexIndex) => {
      const incident = [];

      ico.faces.forEach((face, faceIndex) => {
        if (face.includes(vertexIndex)) incident.push(faceIndex);
      });

      const reference = Math.abs(axis[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0];
      const tangentX = normalizeVertex(cross(reference, axis));
      const tangentY = normalizeVertex(cross(axis, tangentX));

      return incident.sort((left, right) => {
        const leftPoint = vertices[left];
        const rightPoint = vertices[right];
        const leftAngle = Math.atan2(dot(leftPoint, tangentY), dot(leftPoint, tangentX));
        const rightAngle = Math.atan2(dot(rightPoint, tangentY), dot(rightPoint, tangentX));
        return leftAngle - rightAngle;
      });
    });

    return { vertices: normalizeShape(vertices), faces };
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rotateVertex([x, y, z], angleX, angleY, angleZ) {
    const cosX = Math.cos(angleX);
    const sinX = Math.sin(angleX);
    const cosY = Math.cos(angleY);
    const sinY = Math.sin(angleY);
    const cosZ = Math.cos(angleZ);
    const sinZ = Math.sin(angleZ);

    const y1 = y * cosX - z * sinX;
    const z1 = y * sinX + z * cosX;
    const x2 = x * cosY + z1 * sinY;
    const z2 = -x * sinY + z1 * cosY;
    const x3 = x2 * cosZ - y1 * sinZ;
    const y3 = x2 * sinZ + y1 * cosZ;

    return [x3, y3, z2];
  }

  function projectVertex(vertex, centerX, centerY, radius) {
    const cameraDistance = 4.2;
    const perspective = cameraDistance / (cameraDistance - vertex[2]);

    return {
      x: Math.round(centerX + vertex[0] * radius * perspective),
      y: Math.round(centerY + vertex[1] * radius * perspective),
      z: vertex[2]
    };
  }

  function getLayout() {
    const portrait = sceneHeight > sceneWidth * 1.05;

    if (portrait) {
      return [
        [0.24, 0.13, 0.105],
        [0.74, 0.14, 0.1],
        [0.5, 0.32, 0.12],
        [0.23, 0.52, 0.105],
        [0.76, 0.52, 0.105],
        [0.29, 0.78, 0.115],
        [0.72, 0.8, 0.13]
      ];
    }

    return [
      [0.11, 0.26, 0.09],
      [0.29, 0.38, 0.105],
      [0.49, 0.22, 0.095],
      [0.69, 0.37, 0.105],
      [0.88, 0.25, 0.09],
      [0.31, 0.75, 0.115],
      [0.7, 0.74, 0.135]
    ];
  }

  function randomVelocity() {
    const angle = randomBetween(0, Math.PI * 2);
    const speed = randomBetween(MIN_SPEED, MAX_SPEED);
    return [
      Math.cos(angle) * speed * TRANSLATION_SPEED_MULTIPLIER,
      Math.sin(angle) * speed * TRANSLATION_SPEED_MULTIPLIER
    ];
  }

  function randomSign() {
    return Math.random() < 0.5 ? -1 : 1;
  }

  function rebuildDice() {
    dice.length = 0;
    const layout = getLayout();
    const minDimension = Math.min(sceneWidth, sceneHeight);

    STANDARD_SET.forEach((type, index) => {
      const [xRatio, yRatio, radiusRatio] = layout[index];
      const radius = Math.max(9, Math.round(minDimension * radiusRatio));
      const [vx, vy] = randomVelocity();

      dice.push({
        type,
        shape: SHAPES[type],
        x: clamp(Math.round(xRatio * sceneWidth), radius, sceneWidth - radius),
        y: clamp(Math.round(yRatio * sceneHeight), radius, sceneHeight - radius),
        radius,
        mass: Math.max(1, radius ** 2.18),
        bounciness: randomBetween(0.94, 1.06),
        surfaceFriction: randomBetween(0.88, 1.12),
        spinResponse: randomBetween(0.55, 0.82),
        opacity: randomBetween(0.58, 0.92),
        vx,
        vy,
        angleX: randomBetween(-Math.PI, Math.PI),
        angleY: randomBetween(-Math.PI, Math.PI),
        angleZ: randomBetween(-Math.PI, Math.PI),
        velocityX: randomBetween(0.26, 0.58) * randomSign() * BASE_ROTATION_SPEED_MULTIPLIER,
        velocityY: randomBetween(0.3, 0.66) * randomSign() * BASE_ROTATION_SPEED_MULTIPLIER,
        velocityZ: randomBetween(0.08, 0.28) * randomSign() * BASE_ROTATION_SPEED_MULTIPLIER
      });
    });

    separateInitialOverlaps();
  }

  function separateInitialOverlaps() {
    for (let pass = 0; pass < 20; pass += 1) {
      let moved = false;

      for (let i = 0; i < dice.length; i += 1) {
        for (let j = i + 1; j < dice.length; j += 1) {
          const a = dice[i];
          const b = dice[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distance = Math.hypot(dx, dy) || 0.0001;
          const minimum = a.radius + b.radius + 2;

          if (distance >= minimum) continue;

          const nx = dx / distance;
          const ny = dy / distance;
          const overlap = minimum - distance;
          a.x -= nx * overlap * 0.5;
          a.y -= ny * overlap * 0.5;
          b.x += nx * overlap * 0.5;
          b.y += ny * overlap * 0.5;
          clampToBounds(a);
          clampToBounds(b);
          moved = true;
        }
      }

      if (!moved) break;
    }
  }

  function resize() {
    const cssWidth = Math.max(1, window.innerWidth);
    const cssHeight = Math.max(1, window.innerHeight);

    sceneWidth = Math.max(150, Math.ceil(cssWidth / PIXEL_SCALE));
    sceneHeight = Math.max(100, Math.ceil(cssHeight / PIXEL_SCALE));

    canvas.width = sceneWidth;
    canvas.height = sceneHeight;
    ctx.imageSmoothingEnabled = false;
    rebuildDice();
  }

  function clampSpin(die) {
    die.velocityX = clamp(die.velocityX, -MAX_SPIN, MAX_SPIN);
    die.velocityY = clamp(die.velocityY, -MAX_SPIN, MAX_SPIN);
    die.velocityZ = clamp(die.velocityZ, -MAX_Z_SPIN, MAX_Z_SPIN);
  }

  function keepMoving(die) {
    const speed = Math.hypot(die.vx, die.vy);

    if (speed < 0.001) {
      die.vx += Math.cos(die.angleZ) * MIN_SPEED * SLEEPY_SPEED_BOOST;
      die.vy += Math.sin(die.angleZ) * MIN_SPEED * SLEEPY_SPEED_BOOST;
      return;
    }

    if (speed < MIN_SPEED) {
      const boost = (MIN_SPEED - speed) * SLEEPY_SPEED_BOOST;
      die.vx += (die.vx / speed) * boost;
      die.vy += (die.vy / speed) * boost;
    } else if (speed > MAX_SPEED) {
      const damping = 1 - SOFT_SPEED_DAMPING * (speed - MAX_SPEED) / speed;
      die.vx *= damping;
      die.vy *= damping;
    }
  }

  function wallImpact(die, normalX, normalY) {
    const tangentX = -normalY;
    const tangentY = normalX;
    const tangentialSpeed = die.vx * tangentX + die.vy * tangentY;
    const spinKick = tangentialSpeed * WALL_FRICTION * die.spinResponse;

    die.vx -= tangentX * tangentialSpeed * WALL_FRICTION * die.surfaceFriction;
    die.vy -= tangentY * tangentialSpeed * WALL_FRICTION * die.surfaceFriction;
    die.velocityX += normalY * spinKick * 0.12;
    die.velocityY -= normalX * spinKick * 0.12;
    die.velocityZ += (normalX * tangentY - normalY * tangentX) * spinKick * 0.08;
    clampSpin(die);
  }

  function clampToBounds(die) {
    die.x = clamp(die.x, die.radius, sceneWidth - die.radius);
    die.y = clamp(die.y, die.radius, sceneHeight - die.radius);
  }

  function updateDie(die, delta) {
    if (reducedMotion.matches) return;

    const angularDamping = Math.exp(-ANGULAR_DAMPING * delta);
    die.velocityX *= angularDamping;
    die.velocityY *= angularDamping;
    die.velocityZ *= angularDamping;
    die.x += die.vx * delta;
    die.y += die.vy * delta;
    die.angleX += die.velocityX * delta;
    die.angleY += die.velocityY * delta;
    die.angleZ += die.velocityZ * delta;

    if (die.x - die.radius <= 0 && die.vx < 0) {
      die.x = die.radius;
      die.vx = Math.abs(die.vx) * clamp(WALL_RESTITUTION * die.bounciness, 0.8, 0.95);
      die.vy += die.velocityZ * 0.012 * die.spinResponse;
      wallImpact(die, 1, 0);
    } else if (die.x + die.radius >= sceneWidth && die.vx > 0) {
      die.x = sceneWidth - die.radius;
      die.vx = -Math.abs(die.vx) * clamp(WALL_RESTITUTION * die.bounciness, 0.8, 0.95);
      die.vy -= die.velocityZ * 0.012 * die.spinResponse;
      wallImpact(die, -1, 0);
    }

    if (die.y - die.radius <= 0 && die.vy < 0) {
      die.y = die.radius;
      die.vy = Math.abs(die.vy) * clamp(WALL_RESTITUTION * die.bounciness, 0.8, 0.95);
      die.vx -= die.velocityZ * 0.012 * die.spinResponse;
      wallImpact(die, 0, 1);
    } else if (die.y + die.radius >= sceneHeight && die.vy > 0) {
      die.y = sceneHeight - die.radius;
      die.vy = -Math.abs(die.vy) * clamp(WALL_RESTITUTION * die.bounciness, 0.8, 0.95);
      die.vx += die.velocityZ * 0.012 * die.spinResponse;
      wallImpact(die, 0, -1);
    }

    keepMoving(die);
  }

  function resolveCollision(a, b) {
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    let distance = Math.hypot(dx, dy);
    const minimumDistance = a.radius + b.radius;

    if (distance >= minimumDistance) return;

    if (distance < 0.0001) {
      const angle = a.angleZ - b.angleZ + (a.radius - b.radius) * 0.01;
      dx = Math.cos(angle);
      dy = Math.sin(angle);
      distance = 1;
    }

    const nx = dx / distance;
    const ny = dy / distance;
    const overlap = minimumDistance - distance;
    const inverseMassA = 1 / a.mass;
    const inverseMassB = 1 / b.mass;
    const inverseMassTotal = inverseMassA + inverseMassB;
    const correction = Math.max(overlap - PENETRATION_SLOP, 0) * POSITION_CORRECTION;

    a.x -= nx * correction * (inverseMassA / inverseMassTotal);
    a.y -= ny * correction * (inverseMassA / inverseMassTotal);
    b.x += nx * correction * (inverseMassB / inverseMassTotal);
    b.y += ny * correction * (inverseMassB / inverseMassTotal);
    clampToBounds(a);
    clampToBounds(b);

    const relativeVelocityX = b.vx - a.vx;
    const relativeVelocityY = b.vy - a.vy;
    const velocityAlongNormal = relativeVelocityX * nx + relativeVelocityY * ny;

    if (velocityAlongNormal >= 0) return;

    const impactSpeed = Math.abs(velocityAlongNormal);
    const bounceMix = (a.bounciness + b.bounciness) * 0.5;
    const speedBounce = clamp(impactSpeed / MAX_SPEED, 0, 1) * 0.08 - 0.04;
    const restitution = clamp(BASE_RESTITUTION * bounceMix + speedBounce, 0.82, 0.98);
    const impulse = -(1 + restitution) * velocityAlongNormal / inverseMassTotal;
    const impulseX = impulse * nx;
    const impulseY = impulse * ny;

    a.vx -= impulseX * inverseMassA;
    a.vy -= impulseY * inverseMassA;
    b.vx += impulseX * inverseMassB;
    b.vy += impulseY * inverseMassB;

    const tangentX = -ny;
    const tangentY = nx;
    const tangentialVelocity = relativeVelocityX * tangentX + relativeVelocityY * tangentY;
    const frictionMix = COLLISION_FRICTION * (a.surfaceFriction + b.surfaceFriction) * 0.5;
    const tangentImpulse = clamp(
      -tangentialVelocity / inverseMassTotal,
      -impulse * frictionMix,
      impulse * frictionMix
    );
    const tangentImpulseX = tangentImpulse * tangentX;
    const tangentImpulseY = tangentImpulse * tangentY;

    a.vx -= tangentImpulseX * inverseMassA;
    a.vy -= tangentImpulseY * inverseMassA;
    b.vx += tangentImpulseX * inverseMassB;
    b.vy += tangentImpulseY * inverseMassB;

    const sizeBiasA = clamp(b.mass / a.mass, 0.45, 2.35);
    const sizeBiasB = clamp(a.mass / b.mass, 0.45, 2.35);
    const obliqueFactor = clamp(Math.abs(tangentialVelocity) / (impactSpeed + 1), 0, 1.35);
    const normalKick = impactSpeed * 0.004;
    const tangentKick = tangentImpulse * 0.006;

    a.velocityX -= (tangentY * tangentKick * sizeBiasA + nx * normalKick * obliqueFactor) * a.spinResponse;
    a.velocityY += (tangentX * tangentKick * sizeBiasA - ny * normalKick * obliqueFactor) * a.spinResponse;
    a.velocityZ -= (tangentKick * 0.75 + normalKick * 0.18) * a.spinResponse;
    b.velocityX += (tangentY * tangentKick * sizeBiasB + nx * normalKick * obliqueFactor) * b.spinResponse;
    b.velocityY -= (tangentX * tangentKick * sizeBiasB - ny * normalKick * obliqueFactor) * b.spinResponse;
    b.velocityZ += (tangentKick * 0.75 + normalKick * 0.18) * b.spinResponse;

    clampSpin(a);
    clampSpin(b);
    keepMoving(a);
    keepMoving(b);
  }

  function resolveAllCollisions() {
    for (let iteration = 0; iteration < COLLISION_ITERATIONS; iteration += 1) {
      for (let i = 0; i < dice.length; i += 1) {
        for (let j = i + 1; j < dice.length; j += 1) {
          resolveCollision(dice[i], dice[j]);
        }
      }
    }
  }

  function drawDie(die) {
    const centerX = Math.round(die.x);
    const centerY = Math.round(die.y);

    const projected = die.shape.vertices.map((vertex) => {
      const rotated = rotateVertex(vertex, die.angleX, die.angleY, die.angleZ);
      return projectVertex(rotated, centerX, centerY, die.radius);
    });

    const faces = die.shape.faces.map((face) => ({
      indices: face,
      depth: face.reduce((sum, index) => sum + projected[index].z, 0) / face.length
    })).sort((left, right) => left.depth - right.depth);

    ctx.save();
    ctx.lineWidth = 1;
    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";

    for (const face of faces) {
      const first = projected[face.indices[0]];
      ctx.beginPath();
      ctx.moveTo(first.x + 0.5, first.y + 0.5);

      for (let i = 1; i < face.indices.length; i += 1) {
        const point = projected[face.indices[i]];
        ctx.lineTo(point.x + 0.5, point.y + 0.5);
      }

      ctx.closePath();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#000000";
      ctx.fill();
      ctx.globalAlpha = die.opacity;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
    }

    ctx.restore();
  }

  function frame(now) {
    const delta = Math.min(0.033, Math.max(0, (now - previousTime) / 1000));
    previousTime = now;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, sceneWidth, sceneHeight);

    for (const die of dice) updateDie(die, delta);
    if (!reducedMotion.matches) resolveAllCollisions();
    for (const die of dice) drawDie(die);

    requestAnimationFrame(frame);
  }

  reducedMotion.addEventListener?.("change", () => {
    previousTime = performance.now();
  });

  window.addEventListener("resize", resize, { passive: true });
  resize();
  requestAnimationFrame(frame);
})();
