(() => {
  "use strict";

  const canvas = document.querySelector("#dice-background");
  const ctx = canvas.getContext("2d", { alpha: false });
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // The scene is deliberately rendered at low resolution and enlarged by CSS.
  // This creates hard DOS-style pixels without image assets.
  const PIXEL_SCALE = 4;
  const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

  const RAW_VERTICES = [
    [-1, GOLDEN_RATIO, 0], [1, GOLDEN_RATIO, 0],
    [-1, -GOLDEN_RATIO, 0], [1, -GOLDEN_RATIO, 0],
    [0, -1, GOLDEN_RATIO], [0, 1, GOLDEN_RATIO],
    [0, -1, -GOLDEN_RATIO], [0, 1, -GOLDEN_RATIO],
    [GOLDEN_RATIO, 0, -1], [GOLDEN_RATIO, 0, 1],
    [-GOLDEN_RATIO, 0, -1], [-GOLDEN_RATIO, 0, 1]
  ];

  const VERTICES = RAW_VERTICES.map(normalize);
  const EDGES = buildEdges(VERTICES);
  const dice = [];
  let sceneWidth = 1;
  let sceneHeight = 1;
  let previousTime = performance.now();

  function normalize([x, y, z]) {
    const length = Math.hypot(x, y, z) || 1;
    return [x / length, y / length, z / length];
  }

  function squaredDistance(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    return dx * dx + dy * dy + dz * dz;
  }

  function buildEdges(vertices) {
    let shortest = Infinity;

    for (let i = 0; i < vertices.length; i += 1) {
      for (let j = i + 1; j < vertices.length; j += 1) {
        const distance = squaredDistance(vertices[i], vertices[j]);
        if (distance > 0.0001 && distance < shortest) shortest = distance;
      }
    }

    const tolerance = shortest * 0.06;
    const edges = [];

    for (let i = 0; i < vertices.length; i += 1) {
      for (let j = i + 1; j < vertices.length; j += 1) {
        if (Math.abs(squaredDistance(vertices[i], vertices[j]) - shortest) <= tolerance) {
          edges.push([i, j]);
        }
      }
    }

    return edges;
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function randomResult() {
    return Math.floor(Math.random() * 20) + 1;
  }

  function createDie(index, total) {
    const lane = (index + 0.5) / total;
    const phase = Math.random() * Math.PI * 2;

    return {
      xRatio: Math.min(0.9, Math.max(0.1, lane + randomBetween(-0.08, 0.08))),
      yRatio: randomBetween(0.13, 0.87),
      baseYRatio: 0,
      radiusRatio: randomBetween(0.055, 0.12),
      opacity: randomBetween(0.2, 0.62),
      angleX: randomBetween(-1, 1),
      angleY: randomBetween(-1, 1),
      angleZ: randomBetween(-0.35, 0.35),
      velocityX: 0,
      velocityY: 0,
      velocityZ: 0,
      phase,
      floatSpeed: randomBetween(0.18, 0.42),
      floatAmount: randomBetween(1.5, 5),
      result: randomResult(),
      state: "idle",
      stateTime: randomBetween(0.3, 4.5),
      idleDuration: randomBetween(3, 8),
      spinDuration: randomBetween(0.9, 2.2)
    };
  }

  function rebuildDice() {
    dice.length = 0;
    const total = sceneWidth < 170 ? 4 : sceneWidth < 300 ? 6 : 8;

    for (let i = 0; i < total; i += 1) {
      const die = createDie(i, total);
      die.baseYRatio = die.yRatio;
      dice.push(die);
    }
  }

  function resize() {
    const cssWidth = Math.max(1, window.innerWidth);
    const cssHeight = Math.max(1, window.innerHeight);

    sceneWidth = Math.max(160, Math.ceil(cssWidth / PIXEL_SCALE));
    sceneHeight = Math.max(100, Math.ceil(cssHeight / PIXEL_SCALE));

    canvas.width = sceneWidth;
    canvas.height = sceneHeight;
    ctx.imageSmoothingEnabled = false;
    rebuildDice();
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
    const cameraDistance = 3.5;
    const perspective = cameraDistance / (cameraDistance - vertex[2]);

    return {
      x: Math.round(centerX + vertex[0] * radius * perspective),
      y: Math.round(centerY + vertex[1] * radius * perspective),
      z: vertex[2]
    };
  }

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
  }

  function startSpin(die) {
    die.state = "spinning";
    die.stateTime = 0;
    die.spinDuration = randomBetween(0.95, 2.25);
    die.velocityX = randomBetween(5, 9) * (Math.random() < 0.5 ? -1 : 1);
    die.velocityY = randomBetween(6, 11) * (Math.random() < 0.5 ? -1 : 1);
    die.velocityZ = randomBetween(1, 3) * (Math.random() < 0.5 ? -1 : 1);
  }

  function stopSpin(die) {
    die.state = "idle";
    die.stateTime = 0;
    die.idleDuration = randomBetween(3.2, 8.5);
    die.result = randomResult();
    die.velocityX = 0;
    die.velocityY = 0;
    die.velocityZ = 0;

    // Snap to the low-resolution grid so the resting pose feels deliberately pixel-made.
    const snap = Math.PI / 10;
    die.angleX = Math.round(die.angleX / snap) * snap;
    die.angleY = Math.round(die.angleY / snap) * snap;
    die.angleZ = Math.round(die.angleZ / snap) * snap;
  }

  function updateDie(die, delta, time) {
    die.stateTime += delta;
    die.yRatio = die.baseYRatio + Math.sin(time * die.floatSpeed + die.phase) * die.floatAmount / sceneHeight;

    if (reducedMotion.matches) return;

    if (die.state === "idle") {
      if (die.stateTime >= die.idleDuration) startSpin(die);
      return;
    }

    const progress = Math.min(1, die.stateTime / die.spinDuration);
    const slowdown = 1 - easeOutCubic(progress);
    const motion = 0.16 + slowdown * 0.84;

    die.angleX += die.velocityX * delta * motion;
    die.angleY += die.velocityY * delta * motion;
    die.angleZ += die.velocityZ * delta * motion;

    if (progress >= 1) stopSpin(die);
  }

  function drawDie(die) {
    const centerX = Math.round(die.xRatio * sceneWidth);
    const centerY = Math.round(die.yRatio * sceneHeight);
    const radius = Math.max(9, Math.round(Math.min(sceneWidth, sceneHeight) * die.radiusRatio));

    const projected = VERTICES.map((vertex) => {
      const rotated = rotateVertex(vertex, die.angleX, die.angleY, die.angleZ);
      return projectVertex(rotated, centerX, centerY, radius);
    });

    ctx.save();
    ctx.globalAlpha = die.opacity;
    ctx.strokeStyle = "#ffffff";
    ctx.fillStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";

    // Rear edges are dimmer, giving depth while retaining the monochrome wireframe.
    const sortedEdges = EDGES.map(([a, b]) => ({
      a,
      b,
      depth: (projected[a].z + projected[b].z) / 2
    })).sort((left, right) => left.depth - right.depth);

    for (const edge of sortedEdges) {
      const start = projected[edge.a];
      const end = projected[edge.b];
      ctx.globalAlpha = die.opacity * (edge.depth < 0 ? 0.32 : 0.9);
      ctx.beginPath();
      ctx.moveTo(start.x + 0.5, start.y + 0.5);
      ctx.lineTo(end.x + 0.5, end.y + 0.5);
      ctx.stroke();
    }

    if (die.state === "idle" || reducedMotion.matches) {
      const fontSize = Math.max(5, Math.round(radius * 0.43));
      ctx.globalAlpha = Math.min(0.92, die.opacity + 0.18);
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(die.result), centerX, centerY);
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
    for (const die of dice) {
      die.state = "idle";
      die.stateTime = 0;
    }
  });

  window.addEventListener("resize", resize, { passive: true });
  resize();
  requestAnimationFrame(frame);
})();
