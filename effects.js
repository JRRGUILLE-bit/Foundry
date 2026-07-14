(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const fogCanvases = Array.from(document.querySelectorAll(".fog-layer"));
  const lightningCanvas = document.querySelector("#lightning-canvas");
  const lightningFlash = document.querySelector("#lightning-flash");

  const FOG_SCALE = 6;
  const LIGHTNING_SCALE = 4;
  const MIN_LIGHTNING_DELAY = 30000;
  const MAX_LIGHTNING_DELAY = 120000;
  let lightningTimer = 0;
  let activeFrame = 0;

  const fogProfiles = {
    "fog-back": { seed: 19, coverage: 0.58, levels: [0, 34, 58, 82], vertical: (y) => 0.78 - Math.abs(y - 0.42) * 0.85 },
    "fog-mid": { seed: 47, coverage: 0.52, levels: [0, 42, 72, 106], vertical: (y) => 0.9 - Math.abs(y - 0.52) * 1.25 },
    "fog-low": { seed: 83, coverage: 0.5, levels: [0, 52, 88, 128], vertical: (y) => Math.max(0, (y - 0.42) * 1.55) + (y > 0.72 ? 0.28 : 0) }
  };

  function hash(x, y, seed) {
    let n = x * 374761393 + y * 668265263 + seed * 1442695041;
    n = (n ^ (n >> 13)) * 1274126177;
    return ((n ^ (n >> 16)) >>> 0) / 4294967295;
  }

  function valueNoise(x, y, seed, cell) {
    const xi = Math.floor(x / cell);
    const yi = Math.floor(y / cell);
    return (
      hash(xi, yi, seed) +
      hash(xi + 1, yi, seed) +
      hash(xi, yi + 1, seed) +
      hash(xi + 1, yi + 1, seed)
    ) * 0.25;
  }

  function drawFog(canvas) {
    const width = Math.max(96, Math.ceil(window.innerWidth / FOG_SCALE));
    const height = Math.max(64, Math.ceil(window.innerHeight / FOG_SCALE));
    canvas.width = width;
    canvas.height = height;

    const key = Object.keys(fogProfiles).find((name) => canvas.classList.contains(name));
    const profile = fogProfiles[key] || fogProfiles["fog-back"];
    const ctx = canvas.getContext("2d", { alpha: true });
    const image = ctx.createImageData(width, height);
    const data = image.data;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const coarse = valueNoise(x, y, profile.seed, 10);
        const broad = valueNoise(x, y, profile.seed + 7, 24);
        const dither = hash(x, y, profile.seed + 101) > 0.55 ? 0.06 : -0.04;
        const vertical = Math.max(0, profile.vertical(y / height));
        const mass = broad * 0.68 + coarse * 0.32 + vertical * 0.38 + dither;
        const levelIndex = Math.max(0, Math.min(profile.levels.length - 1, Math.floor((mass - profile.coverage) * 8)));
        const alpha = mass > profile.coverage ? profile.levels[levelIndex] : 0;
        const i = (y * width + x) * 4;
        data[i] = 118;
        data[i + 1] = 133;
        data[i + 2] = 146;
        data[i + 3] = alpha;
      }
    }

    ctx.putImageData(image, 0, 0);
  }

  function redrawFog() {
    fogCanvases.forEach(drawFog);
  }

  function resizeLightningCanvas() {
    if (!lightningCanvas) return;
    lightningCanvas.width = Math.max(160, Math.ceil(window.innerWidth / LIGHTNING_SCALE));
    lightningCanvas.height = Math.max(100, Math.ceil(window.innerHeight / LIGHTNING_SCALE));
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function createBolt(width, height) {
    const startX = randomBetween(width * 0.16, width * 0.84);
    const points = [{ x: startX, y: randomBetween(0, height * 0.06) }];
    const steps = Math.floor(randomBetween(9, 15));
    for (let i = 1; i <= steps; i += 1) {
      points.push({
        x: startX + randomBetween(-width * 0.12, width * 0.12) + (Math.random() > 0.5 ? 1 : -1) * i * randomBetween(0.3, 1.2),
        y: (height * 0.08) + (height * 0.58 * i) / steps
      });
    }
    return points;
  }

  function drawSegmentedLine(ctx, points, width) {
    ctx.lineWidth = width;
    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";
    ctx.beginPath();
    ctx.moveTo(Math.round(points[0].x), Math.round(points[0].y));
    points.slice(1).forEach((point) => ctx.lineTo(Math.round(point.x), Math.round(point.y)));
    ctx.stroke();
  }

  function runLightning() {
    if (!lightningCanvas || !lightningFlash || reducedMotion.matches || document.visibilityState !== "visible") return;
    const ctx = lightningCanvas.getContext("2d");
    const width = lightningCanvas.width;
    const height = lightningCanvas.height;
    const bolt = createBolt(width, height);
    const branches = Array.from({ length: Math.floor(randomBetween(1, 4)) }, () => {
      const root = bolt[Math.floor(randomBetween(2, bolt.length - 3))];
      const dir = Math.random() > 0.5 ? 1 : -1;
      return [root, { x: root.x + dir * randomBetween(width * 0.05, width * 0.16), y: root.y + randomBetween(height * 0.04, height * 0.16) }];
    });
    const duration = randomBetween(700, 1400);
    const start = performance.now();
    lightningFlash.style.setProperty("--lightning-x", `${(bolt[0].x / width) * 100}%`);
    lightningCanvas.classList.add("is-active");

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const pulse = Math.max(0, 1 - Math.abs(t - 0.08) / 0.08) * 0.75 + Math.max(0, 1 - Math.abs(t - 0.34) / 0.06) * 0.42 + Math.max(0, 1 - Math.abs(t - 0.68) / 0.08) * 0.2;
      ctx.clearRect(0, 0, width, height);
      lightningFlash.style.opacity = String(Math.min(0.48, pulse));
      if (pulse > 0.02) {
        ctx.strokeStyle = `rgba(162, 190, 218, ${Math.min(0.8, pulse)})`;
        drawSegmentedLine(ctx, bolt, 3);
        ctx.strokeStyle = `rgba(218, 230, 235, ${Math.min(0.75, pulse * 0.9)})`;
        drawSegmentedLine(ctx, bolt, 1);
        branches.forEach((branch) => drawSegmentedLine(ctx, branch, 1));
      }
      if (t < 1 && document.visibilityState === "visible") {
        activeFrame = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, width, height);
        lightningFlash.style.opacity = "0";
        lightningCanvas.classList.remove("is-active");
        scheduleLightning();
      }
    }

    activeFrame = requestAnimationFrame(frame);
  }

  function clearLightning() {
    window.clearTimeout(lightningTimer);
    cancelAnimationFrame(activeFrame);
    if (lightningCanvas) lightningCanvas.getContext("2d")?.clearRect(0, 0, lightningCanvas.width, lightningCanvas.height);
    if (lightningFlash) lightningFlash.style.opacity = "0";
  }

  function scheduleLightning() {
    window.clearTimeout(lightningTimer);
    if (reducedMotion.matches || document.visibilityState !== "visible") return;
    lightningTimer = window.setTimeout(runLightning, randomBetween(MIN_LIGHTNING_DELAY, MAX_LIGHTNING_DELAY));
  }

  redrawFog();
  resizeLightningCanvas();
  scheduleLightning();

  window.addEventListener("resize", () => {
    redrawFog();
    resizeLightningCanvas();
  });

  document.addEventListener("visibilitychange", () => {
    clearLightning();
    if (document.visibilityState === "visible") scheduleLightning();
  });

  reducedMotion.addEventListener?.("change", () => {
    clearLightning();
    scheduleLightning();
  });
})();
