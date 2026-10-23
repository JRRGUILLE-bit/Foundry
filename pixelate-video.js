(() => {
  "use strict";

  const video = document.querySelector("#site-background");
  const frame = video?.closest(".video-frame");
  if (!video || !frame) return;

  const canvas = document.createElement("canvas");
  canvas.className = "video-pixelate-layer";
  canvas.setAttribute("aria-hidden", "true");

  const context = canvas.getContext("2d");
  if (!context) return;

  frame.append(canvas);

  // Roughly three screen pixels per sample: enough to support the pixel-art look
  // without making the animation look heavily blocky.
  const PIXEL_SIZE = 2.7;
  const FRAME_INTERVAL = 1000 / 30;
  let animationFrameId = 0;
  let lastPaintTime = 0;
  let hasPaintedFrame = false;

  function resizeCanvas() {
    const width = Math.max(1, frame.clientWidth);
    const height = Math.max(1, frame.clientHeight);
    const sampleWidth = Math.max(1, Math.round(width / PIXEL_SIZE));
    const sampleHeight = Math.max(1, Math.round(height / PIXEL_SIZE));

    if (canvas.width !== sampleWidth || canvas.height !== sampleHeight) {
      canvas.width = sampleWidth;
      canvas.height = sampleHeight;
    }
  }

  function scheduleRender() {
    if (!animationFrameId) {
      animationFrameId = window.requestAnimationFrame(render);
    }
  }

  function render(timestamp) {
    animationFrameId = 0;

    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        !video.videoWidth || !video.videoHeight) {
      return;
    }

    if (timestamp - lastPaintTime < FRAME_INTERVAL) {
      scheduleRender();
      return;
    }

    lastPaintTime = timestamp;
    resizeCanvas();

    const targetAspect = canvas.width / canvas.height;
    const sourceAspect = video.videoWidth / video.videoHeight;
    let sx = 0;
    let sy = 0;
    let sw = video.videoWidth;
    let sh = video.videoHeight;

    // Match the video's object-fit: cover crop before applying the same CSS
    // transform, so the pixelated layer stays aligned with the original image.
    if (sourceAspect > targetAspect) {
      sw = video.videoHeight * targetAspect;
      sx = (video.videoWidth - sw) / 2;
    } else if (sourceAspect < targetAspect) {
      sh = video.videoWidth / targetAspect;
      sy = (video.videoHeight - sh) / 2;
    }

    const videoStyle = window.getComputedStyle(video);
    context.imageSmoothingEnabled = true;
    if ("filter" in context) {
      context.filter = videoStyle.filter === "none" ? "none" : videoStyle.filter;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(
      video,
      sx, sy, sw, sh,
      0, 0, canvas.width, canvas.height
    );
    context.filter = "none";

    canvas.style.transform = videoStyle.transform;
    canvas.style.transformOrigin = videoStyle.transformOrigin;

    if (!hasPaintedFrame) {
      canvas.classList.add("is-ready");
      hasPaintedFrame = true;
    }

    // Stop the render loop while paused; playback and resize events restart it.
    if (!video.paused && !video.ended) scheduleRender();
  }

  video.addEventListener("loadeddata", scheduleRender);
  video.addEventListener("playing", scheduleRender);
  video.addEventListener("pause", scheduleRender);
  window.addEventListener("resize", scheduleRender, { passive: true });

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(scheduleRender);
    observer.observe(frame);
  }

  scheduleRender();
})();
