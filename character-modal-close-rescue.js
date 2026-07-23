(() => {
  "use strict";

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
