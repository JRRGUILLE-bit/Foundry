(() => {
  "use strict";

  const body = document.body;
  const bootLine = document.querySelector(".dos-kicker");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!body || !bootLine) return;

  const fullLine = bootLine.dataset.bootLine || bootLine.textContent || "";
  const promptText = "C:\\BANDA\\FOUNDRY> ";
  const commandText = "BOOT PORTAL.EXE";
  const bootDuration = 1320;
  const commandDelay = 220;
  const commandStep = 32;

  let typedChars = 0;
  let typeTimer = 0;
  let finishTimer = 0;

  const finishBoot = () => {
    window.clearInterval(typeTimer);
    window.clearTimeout(finishTimer);
    bootLine.textContent = fullLine;
    body.classList.remove("is-booting");
    body.classList.add("boot-complete");
  };

  if (reducedMotion.matches) {
    finishBoot();
    return;
  }

  bootLine.textContent = promptText;

  window.setTimeout(() => {
    typeTimer = window.setInterval(() => {
      typedChars += 1;
      bootLine.textContent = promptText + commandText.slice(0, typedChars);

      if (typedChars >= commandText.length) {
        window.clearInterval(typeTimer);
      }
    }, commandStep);
  }, commandDelay);

  finishTimer = window.setTimeout(finishBoot, bootDuration);
})();
