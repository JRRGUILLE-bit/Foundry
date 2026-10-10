(() => {
  "use strict";

  const foundryUrl = "http://192.168.86.33:30000/";
  const dock = document.createElement("nav");
  dock.className = "behind-screen-dock";
  dock.setAttribute("aria-label", "Para Guille: abrir Foundry en la Dell");

  const link = document.createElement("a");
  link.className = "behind-screen-trigger";
  link.href = foundryUrl;
  link.setAttribute("aria-label", "Abrir Foundry en la Dell");
  link.innerHTML =
    '<span class="behind-screen-trigger__prefix" aria-hidden="true">[GM]</span>' +
    '<span class="behind-screen-trigger__copy">' +
      '<span class="behind-screen-trigger__title">BEHIND THE SCREEN</span>' +
      '<span class="behind-screen-trigger__tag">PARA GUILLE</span>' +
    '</span>';

  dock.append(link);
  document.body.append(dock);
})();
