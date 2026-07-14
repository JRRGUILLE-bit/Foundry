(() => {
  "use strict";

  const canvas = document.querySelector("#dice-background");
  const ctx = canvas.getContext("2d", { alpha: false });
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const PIXEL_SCALE = 4;
  const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;
  const RESTITUTION = 0.94;
  const WALL_RESTITUTION = 0.96;
  const MIN_SPEED = 7;
  const MAX_SPEED = 19;
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
    return [Math.cos(angle) * speed, Math.sin(angle) * speed];
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
        mass: Math.max(1, radius * radius),
        opacity: randomBetween(0.58, 0.92),
        vx,
        vy,
        angleX: randomBetween(-Math.PI, Math.PI),
        angleY: randomBetween(-Math.PI, Math.PI),
        angleZ: randomBetween(-Math.PI, Math.PI),
        velocityX: randomBetween(0.32, 0.78) * (Math.random() < 0.5 ? -1 : 1),
        velocityY: randomBetween(0.38, 0.9) * (Math.random() < 0.5 ? -1 : 1),
        velocityZ: randomBetween(0.12, 0.42) * (Math.random() < 0.5 ? -1 : 1)
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
    die.velocityX = clamp(die.velocityX, -2.2, 2.2);
    die.velocityY = clamp(die.velocityY, -2.2, 2.2);
    die.velocityZ = clamp(die.velocityZ, -1.5, 1.5);
  }

  function keepMoving(die) {
    const speed = Math.hypot(die.vx, die.vy);

    if (speed < MIN_SPEED) {
      const multiplier = MIN_SPEED / (speed || 1);
      die.vx *= multiplier;
      die.vy *= multiplier;
    } else if (speed > MAX_SPEED) {
      const multiplier = MAX_SPEED / speed;
      die.vx *= multiplier;
      die.vy *= multiplier;
    }
  }

  function wallImpact(die, normalX, normalY) {
    const tangentialSpeed = die.vx * -normalY + die.vy * normalX;
    die.velocityX += normalY * tangentialSpeed * 0.025;
    die.velocityY -= normalX * tangentialSpeed * 0.025;
    die.velocityZ += (normalX - normalY) * 0.08;
    clampSpin(die);
  }

  function clampToBounds(die) {
    die.x = clamp(die.x, die.radius, sceneWidth - die.radius);
    die.y = clamp(die.y, die.radius, sceneHeight - die.radius);
  }

  function updateDie(die, delta) {
    if (reducedMotion.matches) return;

    die.x += die.vx * delta;
    die.y += die.vy * delta;
    die.angleX += die.velocityX * delta;
    die.angleY += die.velocityY * delta;
    die.angleZ += die.velocityZ * delta;

    if (die.x - die.radius <= 0 && die.vx < 0) {
      die.x = die.radius;
      die.vx = Math.abs(die.vx) * WALL_RESTITUTION;
      wallImpact(die, 1, 0);
    } else if (die.x + die.radius >= sceneWidth && die.vx > 0) {
      die.x = sceneWidth - die.radius;
      die.vx = -Math.abs(die.vx) * WALL_RESTITUTION;
      wallImpact(die, -1, 0);
    }

    if (die.y - die.radius <= 0 && die.vy < 0) {
      die.y = die.radius;
      die.vy = Math.abs(die.vy) * WALL_RESTITUTION;
      wallImpact(die, 0, 1);
    } else if (die.y + die.radius >= sceneHeight && die.vy > 0) {
      die.y = sceneHeight - die.radius;
      die.vy = -Math.abs(die.vy) * WALL_RESTITUTION;
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
      const angle = randomBetween(0, Math.PI * 2);
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

    a.x -= nx * overlap * (inverseMassA / inverseMassTotal);
    a.y -= ny * overlap * (inverseMassA / inverseMassTotal);
    b.x += nx * overlap * (inverseMassB / inverseMassTotal);
    b.y += ny * overlap * (inverseMassB / inverseMassTotal);
    clampToBounds(a);
    clampToBounds(b);

    const relativeVelocityX = b.vx - a.vx;
    const relativeVelocityY = b.vy - a.vy;
    const velocityAlongNormal = relativeVelocityX * nx + relativeVelocityY * ny;

    if (velocityAlongNormal >= 0) return;

    const impulse = -(1 + RESTITUTION) * velocityAlongNormal / inverseMassTotal;
    const impulseX = impulse * nx;
    const impulseY = impulse * ny;

    a.vx -= impulseX * inverseMassA;
    a.vy -= impulseY * inverseMassA;
    b.vx += impulseX * inverseMassB;
    b.vy += impulseY * inverseMassB;

    const tangentX = -ny;
    const tangentY = nx;
    const tangentialVelocity = relativeVelocityX * tangentX + relativeVelocityY * tangentY;
    const spinKick = tangentialVelocity * 0.028;
    const normalKick = velocityAlongNormal * 0.018;

    a.velocityX -= tangentY * spinKick;
    a.velocityY += tangentX * spinKick;
    a.velocityZ -= normalKick;
    b.velocityX += tangentY * spinKick;
    b.velocityY -= tangentX * spinKick;
    b.velocityZ += normalKick;

    clampSpin(a);
    clampSpin(b);
    keepMoving(a);
    keepMoving(b);
  }

  function resolveAllCollisions() {
    for (let i = 0; i < dice.length; i += 1) {
      for (let j = i + 1; j < dice.length; j += 1) {
        resolveCollision(dice[i], dice[j]);
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
