(() => {
  "use strict";

  // This script is intentionally a UI safety net only.
  // Character data must continue through the full Foundry JSON loader and its timeout guard.
  const delegatedFetch = window.fetch.bind(window);

  window.fetch = (input, init) => delegatedFetch(input, init);

  function forceClose(target) {
    const modal = target?.closest?.(".cv-modal") || document.querySelector(".cv-modal:not([hidden])");
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute("hidden", "");
    document.body.classList.remove("cv-open");
  }

  document.addEventListener("click", (event) => {
    const close = event.target.closest?.(".cv-modal [data-close], .cv-modal .cv-window-bar button");
    if (!close) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    forceClose(close);
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    forceClose(document.querySelector(".cv-modal:not([hidden])"));
  }, true);
})();
