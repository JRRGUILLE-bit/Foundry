(() => {
  "use strict";

  const roster = document.querySelector("#party-roster");
  const overlay = document.querySelector("#character-overlay");
  if (!roster || !overlay) return;

  const portraits = {
    sathar: "sathar_portrait.webp",
    artionketh: "arti_portrait.webp",
    magna: "magna_portrait.webp",
    melkor: "melkor_portrait.webp",
    balder: "balder_portrait.webp",
    ingwe: "ingwe_portrait.webp"
  };

  const shortNames = {
    sathar: "Sathar",
    artionketh: "Arthi",
    magna: "Magna",
    melkor: "Melkor",
    balder: "Balder",
    ingwe: "Ingwë"
  };

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

  function openExistingSheet(index) {
    const hotspots = overlay.querySelectorAll(".cv-hotspot");
    const hotspot = hotspots[index];
    if (hotspot) {
      hotspot.click();
      return;
    }

    window.setTimeout(() => {
      const retry = overlay.querySelectorAll(".cv-hotspot")[index];
      retry?.click();
    }, 180);
  }

  function createCard(meta, index) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "party-card";
    button.setAttribute("aria-label", `Abrir ficha de ${meta.name}`);
    button.innerHTML = `
      <img class="party-card-image" src="${escapeHtml(portraits[meta.id] || "")}" alt="" loading="lazy" decoding="async">
      <span class="party-card-level">LV ${escapeHtml(meta.level)}</span>
      <span class="party-card-copy">
        <strong class="party-card-name">${escapeHtml(shortNames[meta.id] || meta.name)}</strong>
        <span class="party-card-class">${escapeHtml(meta.classes || "")}</span>
      </span>`;
    button.addEventListener("click", () => openExistingSheet(index));
    return button;
  }

  fetch("data/characters/index.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      const characters = data.characters || [];
      roster.replaceChildren(...characters.map(createCard));
      roster.dataset.state = "ready";
    })
    .catch((error) => {
      console.error("Party roster unavailable", error);
      roster.dataset.state = "error";
    });
})();
