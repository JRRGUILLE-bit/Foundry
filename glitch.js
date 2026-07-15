(() => {
  "use strict";

  const body = document.body;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const MIN_DELAY = 45000;
  const MAX_DELAY = 90000;
  const MIN_FIRST_DELAY = 35000;
  const GLITCHES = [
    { name: "sync-a", duration: 96, x: "3px", band: "-4px", scale: "0.998" },
    { name: "sync-b", duration: 132, x: "-4px", band: "5px", scale: "0.996" },
    { name: "sync-c", duration: 168, x: "2px", band: "3px", scale: "0.999" },
  ];

  if (!body) return;

  let glitchTimer = 0;
  let cleanupTimer = 0;
  let hasScheduledFirst = false;

  const randomBetween = (min, max) => Math.round(min + Math.random() * (max - min));

  const clearGlitch = () => {
    window.clearTimeout(cleanupTimer);
    cleanupTimer = 0;
    body.classList.remove("crt-glitch", "crt-glitch-sync-a", "crt-glitch-sync-b", "crt-glitch-sync-c");
    body.style.removeProperty("--glitch-x");
    body.style.removeProperty("--glitch-band-x");
    body.style.removeProperty("--glitch-scale-y");
  };

  const stop = () => {
    window.clearTimeout(glitchTimer);
    glitchTimer = 0;
    clearGlitch();
  };

  const canRun = () => !reducedMotion.matches && document.visibilityState === "visible" && !body.classList.contains("is-booting");

  const schedule = () => {
    window.clearTimeout(glitchTimer);
    if (reducedMotion.matches || document.visibilityState !== "visible") {
      clearGlitch();
      return;
    }

    const delay = hasScheduledFirst ? randomBetween(MIN_DELAY, MAX_DELAY) : randomBetween(MIN_FIRST_DELAY, MAX_DELAY);
    hasScheduledFirst = true;
    glitchTimer = window.setTimeout(runGlitch, delay);
  };

  const runGlitch = () => {
    glitchTimer = 0;

    if (!canRun()) {
      schedule();
      return;
    }

    const glitch = GLITCHES[Math.floor(Math.random() * GLITCHES.length)];
    clearGlitch();
    body.style.setProperty("--glitch-x", glitch.x);
    body.style.setProperty("--glitch-band-x", glitch.band);
    body.style.setProperty("--glitch-scale-y", glitch.scale);
    body.classList.add("crt-glitch", `crt-glitch-${glitch.name}`);

    cleanupTimer = window.setTimeout(() => {
      clearGlitch();
      schedule();
    }, glitch.duration);
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      stop();
      return;
    }
    schedule();
  });

  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) {
      stop();
      return;
    }
    schedule();
  });

  const bootObserver = new MutationObserver(() => {
    if (!body.classList.contains("is-booting")) {
      bootObserver.disconnect();
      schedule();
    }
  });

  if (body.classList.contains("is-booting")) {
    bootObserver.observe(body, { attributes: true, attributeFilter: ["class"] });
  } else {
    schedule();
  }
})();
