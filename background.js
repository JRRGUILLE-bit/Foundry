(() => {
  "use strict";

  const video = document.querySelector("#site-background");
  const canvas = document.querySelector("#pixelated-background");
  if (!video) return;

  const context = canvas?.getContext("2d", {
    alpha: false,
    desynchronized: true
  });

  const PLAYBACK_RATE = 0.4;
  const PIXEL_DIVISOR = 3;
  const FALLBACK_FRAME_INTERVAL = 1000 / 30;
  const BAYER_4X4 = [
    0, 8, 2, 10,
    12, 4, 14, 6,
    3, 11, 1, 9,
    15, 7, 13, 5
  ];
  const RED_LEVELS = 7;
  const GREEN_LEVELS = 8;
  const BLUE_LEVELS = 7;
  const DITHER_STRENGTH = 6;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const supportsVideoFrames = typeof video.requestVideoFrameCallback === "function";

  let frameRequest = 0;
  let resizeRequest = 0;
  let lastFallbackFrame = 0;

  const applyPlaybackRate = () => {
    video.defaultPlaybackRate = PLAYBACK_RATE;
    video.playbackRate = PLAYBACK_RATE;
  };

  const quantizeChannel = (value, levels) => {
    const maxLevel = levels - 1;
    return Math.round(Math.max(0, Math.min(255, value)) / 255 * maxLevel) * (255 / maxLevel);
  };

  const applyVgaPalette = (targetWidth, targetHeight) => {
    const frame = context.getImageData(0, 0, targetWidth, targetHeight);
    const { data } = frame;

    for (let y = 0; y < targetHeight; y += 1) {
      const rowOffset = y * targetWidth * 4;
      const bayerRow = (y & 3) * 4;

      for (let x = 0; x < targetWidth; x += 1) {
        const index = rowOffset + x * 4;
        const threshold = ((BAYER_4X4[bayerRow + (x & 3)] + 0.5) / 16 - 0.5) * DITHER_STRENGTH;

        data[index] = quantizeChannel(data[index] + threshold, RED_LEVELS);
        data[index + 1] = quantizeChannel(data[index + 1] + threshold, GREEN_LEVELS);
        data[index + 2] = quantizeChannel(data[index + 2] + threshold, BLUE_LEVELS);
      }
    }

    context.putImageData(frame, 0, 0);
  };

  const drawFrame = () => {
    if (!canvas || !context || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return;

    const targetWidth = canvas.width;
    const targetHeight = canvas.height;
    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;
    const targetRatio = targetWidth / targetHeight;
    const sourceRatio = sourceWidth / sourceHeight;

    let cropX = 0;
    let cropY = 0;
    let cropWidth = sourceWidth;
    let cropHeight = sourceHeight;

    if (sourceRatio > targetRatio) {
      cropWidth = sourceHeight * targetRatio;
      cropX = (sourceWidth - cropWidth) * 0.5;
    } else if (sourceRatio < targetRatio) {
      cropHeight = sourceWidth / targetRatio;
      cropY = (sourceHeight - cropHeight) * 0.5;
    }

    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, targetWidth, targetHeight);
    context.drawImage(
      video,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      targetWidth,
      targetHeight
    );
    applyVgaPalette(targetWidth, targetHeight);
  };

  const resizeCanvas = () => {
    if (!canvas) return;

    const width = Math.max(160, Math.ceil(window.innerWidth / PIXEL_DIVISOR));
    const height = Math.max(90, Math.ceil(window.innerHeight / PIXEL_DIVISOR));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    drawFrame();
  };

  const cancelRenderLoop = () => {
    if (!frameRequest) return;

    if (supportsVideoFrames) {
      video.cancelVideoFrameCallback?.(frameRequest);
    } else {
      cancelAnimationFrame(frameRequest);
    }

    frameRequest = 0;
  };

  const scheduleFrame = () => {
    if (
      frameRequest ||
      reducedMotion.matches ||
      document.visibilityState !== "visible" ||
      video.paused ||
      video.ended
    ) {
      return;
    }

    frameRequest = supportsVideoFrames
      ? video.requestVideoFrameCallback(renderFrame)
      : requestAnimationFrame(renderFrame);
  };

  function renderFrame(now) {
    frameRequest = 0;

    if (supportsVideoFrames || now - lastFallbackFrame >= FALLBACK_FRAME_INTERVAL) {
      drawFrame();
      lastFallbackFrame = now;
    }

    scheduleFrame();
  }

  const startRenderLoop = () => {
    cancelRenderLoop();
    drawFrame();
    scheduleFrame();
  };

  const syncMotionPreference = () => {
    if (reducedMotion.matches) {
      cancelRenderLoop();
      video.pause();

      if (video.readyState >= 1 && video.currentTime !== 0) {
        video.currentTime = 0;
      } else {
        drawFrame();
      }
      return;
    }

    applyPlaybackRate();
    const playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === "function") {
      playAttempt.catch(() => {});
    }
  };

  applyPlaybackRate();
  resizeCanvas();

  video.addEventListener("loadedmetadata", () => {
    applyPlaybackRate();
    resizeCanvas();
  });
  video.addEventListener("loadeddata", startRenderLoop);
  video.addEventListener("play", () => {
    applyPlaybackRate();
    startRenderLoop();
  });
  video.addEventListener("pause", () => {
    cancelRenderLoop();
    drawFrame();
  });
  video.addEventListener("seeked", drawFrame);

  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeRequest);
    resizeRequest = requestAnimationFrame(resizeCanvas);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      startRenderLoop();
    } else {
      cancelRenderLoop();
    }
  });

  reducedMotion.addEventListener?.("change", syncMotionPreference);
  syncMotionPreference();
})();
