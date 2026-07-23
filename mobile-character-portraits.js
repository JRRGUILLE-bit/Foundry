(() => {
  "use strict";

  const portraits = Object.freeze({
    balder: "balder_portrait.webp?v=5b3db937",
    ingwe: "ingwe_portrait.webp?v=5b3db937",
    melkor: "melkor_portrait.webp?v=5b3db937",
    magna: "magna_portrait.webp?v=5b3db937",
    artionketh: "arti_portrait.webp?v=5b3db937",
    sathar: "sathar_portrait.webp?v=5b3db937"
  });

  const root = document.querySelector(".mcs-root");
  const portrait = root?.querySelector(".mcs-portrait");
  if (!root || !portrait) return;

  portrait.decoding = "async";

  function applyPortrait(characterId) {
    const source = portraits[characterId];
    if (!source || portrait.dataset.optimizedCharacter === characterId) return false;
    portrait.src = source;
    portrait.dataset.optimizedCharacter = characterId;
    return true;
  }

  root.addEventListener("banda:mobile-character-open", (event) => {
    applyPortrait(event.detail?.characterId);
  });

  const observer = new MutationObserver(() => {
    if (!root.hidden) {
      applyPortrait(window.BANDA_MOBILE_SHELL?.activeCharacterId?.());
    }
  });

  observer.observe(root, {
    attributes: true,
    attributeFilter: ["hidden"]
  });
})();
