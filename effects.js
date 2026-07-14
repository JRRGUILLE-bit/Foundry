(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const lightningCanvas = document.querySelector("#lightning-canvas");
  const lightningFlash = document.querySelector("#lightning-flash");

  const LIGHTNING_SCALE = 4;
  const MIN_LIGHTNING_DELAY = 30000;
  const MAX_LIGHTNING_DELAY = 120000;
  let lightningTimer = 0;
  let activeFrame = 0;

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
        y: height * 0.08 + (height * 0.58 * i) / steps
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
      return [
        root,
        {
          x: root.x + dir * randomBetween(width * 0.05, width * 0.16),
          y: root.y + randomBetween(height * 0.04, height * 0.16)
        }
      ];
    });
    const duration = randomBetween(700, 1400);
    const start = performance.now();

    lightningFlash.style.setProperty("--lightning-x", `${(bolt[0].x / width) * 100}%`);
    lightningCanvas.classList.add("is-active");

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const pulse =
        Math.max(0, 1 - Math.abs(t - 0.08) / 0.08) * 0.75 +
        Math.max(0, 1 - Math.abs(t - 0.34) / 0.06) * 0.42 +
        Math.max(0, 1 - Math.abs(t - 0.68) / 0.08) * 0.2;

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
    if (lightningCanvas) {
      lightningCanvas.getContext("2d")?.clearRect(0, 0, lightningCanvas.width, lightningCanvas.height);
      lightningCanvas.classList.remove("is-active");
    }
    if (lightningFlash) lightningFlash.style.opacity = "0";
  }

  function scheduleLightning() {
    window.clearTimeout(lightningTimer);
    if (reducedMotion.matches || document.visibilityState !== "visible") return;
    lightningTimer = window.setTimeout(runLightning, randomBetween(MIN_LIGHTNING_DELAY, MAX_LIGHTNING_DELAY));
  }

  resizeLightningCanvas();
  scheduleLightning();

  window.addEventListener("resize", resizeLightningCanvas);

  document.addEventListener("visibilitychange", () => {
    clearLightning();
    if (document.visibilityState === "visible") scheduleLightning();
  });

  reducedMotion.addEventListener?.("change", () => {
    clearLightning();
    scheduleLightning();
  });
})();
