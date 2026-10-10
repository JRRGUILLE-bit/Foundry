(() => {
  "use strict";

  const foundryUrl = "http://192.168.86.35:30000/game";
  const dock = document.createElement("nav");
  dock.className = "behind-screen-dock";
  dock.setAttribute("aria-label", "Para Guille: abrir Foundry local");

  const link = document.createElement("a");
  link.className = "behind-screen-trigger";
  link.href = foundryUrl;
  link.setAttribute("aria-label", "Abrir Foundry en la Asus");
  link.innerHTML =
    '<span class="behind-screen-trigger__prefix" aria-hidden="true">[GM]</span>' +
    '<span class="behind-screen-trigger__copy">' +
      '<span class="behind-screen-trigger__title">BEHIND THE SCREEN</span>' +
      '<span class="behind-screen-trigger__tag">PARA GUILLE</span>' +
    '</span>';

  dock.append(link);
  document.body.append(dock);
})();
