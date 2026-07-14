(() => {
  "use strict";

  const video = document.querySelector("#site-background");
  if (!video) return;

  const PLAYBACK_RATE = 0.4;

  const applyPlaybackRate = () => {
    video.defaultPlaybackRate = PLAYBACK_RATE;
    video.playbackRate = PLAYBACK_RATE;
  };

  applyPlaybackRate();
  video.addEventListener("loadedmetadata", applyPlaybackRate);
  video.addEventListener("play", applyPlaybackRate);

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const syncMotionPreference = () => {
    if (reducedMotion.matches) {
      video.pause();
      video.currentTime = 0;
    } else {
      applyPlaybackRate();
      const playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(() => {});
      }
    }
  };

  reducedMotion.addEventListener?.("change", syncMotionPreference);
  syncMotionPreference();
})();
