(() => {
  "use strict";

  const canvas = document.querySelector("#dice-background");
  const ctx = canvas.getContext("2d", { alpha: false });
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const PIXEL_SCALE = 4;
  const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;
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
    const vertices = [];
    const faces = [];
    const sides = 5;
    const ringRadius = 1;
    const ringHeight = 0.34;
    const apexHeight = 1.42;

    vertices.push([0, 0, apexHeight]);
    vertices.push([0, 0, -apexHeight]);

    for (let i = 0; i < sides; i += 1) {
      const upperAngle = (Math.PI * 2 * i) / sides;
      const lowerAngle = (Math.PI * 2 * (i + 0.5)) / sides;
      vertices.push([Math.cos(upperAngle) * ringRadius, Math.sin(upperAngle) * ringRadius, ringHeight]);
      vertices.push([Math.cos(lowerAngle) * ringRadius, Math.sin(lowerAngle) * ringRadius, -ringHeight]);
    }

    for (let i = 0; i < sides; i += 1) {
      const next = (i + 1) % sides;
      const upper = 2 + i * 2;
      const lower = upper + 1;
      const nextUpper = 2 + next * 2;
      const nextLower = nextUpper + 1;

      faces.push([0, upper, lower, nextUpper]);
      faces.push([1, nextLower, nextUpper, lower]);
    }

    return { vertices: normalizeShape(vertices), faces };
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

  function rebuildDice() {
    dice.length = 0;
    const layout = getLayout();

    STANDARD_SET.forEach((type, index) => {
      const [xRatio, yRatio, radiusRatio] = layout[index];
      dice.push({
        type,
        shape: SHAPES[type],
        xRatio,
        yRatio,
        baseYRatio: yRatio,
        radiusRatio,
        opacity: randomBetween(0.54, 0.9),
        angleX: randomBetween(-Math.PI, Math.PI),
        angleY: randomBetween(-Math.PI, Math.PI),
        angleZ: randomBetween(-Math.PI, Math.PI),
        velocityX: randomBetween(0.32, 0.78) * (Math.random() < 0.5 ? -1 : 1),
        velocityY: randomBetween(0.38, 0.9) * (Math.random() < 0.5 ? -1 : 1),
        velocityZ: randomBetween(0.12, 0.42) * (Math.random() < 0.5 ? -1 : 1),
        phase: randomBetween(0, Math.PI * 2),
        floatSpeed: randomBetween(0.22, 0.5),
        floatAmount: randomBetween(1, 3.2)
      });
    });
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

  function updateDie(die, delta, time) {
    const speed = reducedMotion.matches ? 0 : 1;
    die.angleX += die.velocityX * delta * speed;
    die.angleY += die.velocityY * delta * speed;
    die.angleZ += die.velocityZ * delta * speed;
    die.yRatio = die.baseYRatio + Math.sin(time * die.floatSpeed + die.phase) * die.floatAmount / sceneHeight;
  }

  function drawDie(die) {
    const centerX = Math.round(die.xRatio * sceneWidth);
    const centerY = Math.round(die.yRatio * sceneHeight);
    const radius = Math.max(9, Math.round(Math.min(sceneWidth, sceneHeight) * die.radiusRatio));

    const projected = die.shape.vertices.map((vertex) => {
      const rotated = rotateVertex(vertex, die.angleX, die.angleY, die.angleZ);
      return projectVertex(rotated, centerX, centerY, radius);
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
    const delta = Math.min(0.05, Math.max(0, (now - previousTime) / 1000));
    previousTime = now;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, sceneWidth, sceneHeight);

    const time = now / 1000;
    for (const die of dice) {
      updateDie(die, delta, time);
      drawDie(die);
    }

    requestAnimationFrame(frame);
  }

  reducedMotion.addEventListener?.("change", () => {
    previousTime = performance.now();
  });

  window.addEventListener("resize", resize, { passive: true });
  resize();
  requestAnimationFrame(frame);
})();
