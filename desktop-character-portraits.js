(() => {
  "use strict";

  const media = window.matchMedia("(min-width: 821px)");
  const portraits = Object.freeze({
    balder: "balder_portrait.webp?v=5b3db937",
    ingwe: "ingwe_portrait.webp?v=5b3db937",
    melkor: "melkor_portrait.webp?v=5b3db937",
    magna: "magna_portrait.webp?v=5b3db937",
    artionketh: "arti_portrait.webp?v=5b3db937",
    sathar: "sathar_portrait.webp?v=5b3db937"
  });

  const sidebar = document.querySelector(".cv-sidebar");
  if (!sidebar) return;

  const style = document.createElement("style");
  style.id = "banda-desktop-character-portrait-styles";
  style.textContent = `
@media (min-width: 821px) {
  .cv-desktop-portrait {
    position: relative;
    width: min(100%, 230px);
    aspect-ratio: 1;
    margin: 0.45rem auto 0.8rem;
    border: 2px solid var(--green-dim);
    outline: 1px solid rgba(255, 209, 92, 0.52);
    background: #000;
    box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.75);
    overflow: hidden;
  }

  .cv-desktop-portrait::after {
    content: "PORTRAIT.DAT";
    position: absolute;
    right: 0;
    bottom: 0;
    padding: 0.15rem 0.35rem;
    background: rgba(0, 0, 0, 0.82);
    color: var(--amber);
    font: 0.72rem var(--font);
    letter-spacing: 0.07em;
  }

  .cv-desktop-portrait img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
`;
  document.head.append(style);

  function characterIdFromSidebar() {
    const sourceLabel = sidebar.querySelector(".cv-ident > small")?.textContent || "";
    const match = sourceLabel.match(/>\s*([^.\s]+)\.JSON/i);
    return match?.[1]?.toLowerCase() || null;
  }

  function applyPortrait() {
    if (!media.matches) return false;
    const ident = sidebar.querySelector(".cv-ident");
    if (!ident) return false;

    const characterId = characterIdFromSidebar();
    const source = portraits[characterId];
    if (!source) return false;

    const existing = ident.querySelector(".cv-desktop-portrait");
    if (existing?.dataset.characterId === characterId) return true;
    existing?.remove();

    const figure = document.createElement("figure");
    figure.className = "cv-desktop-portrait";
    figure.dataset.characterId = characterId;

    const image = document.createElement("img");
    image.src = source;
    image.alt = `Retrato de ${sidebar.querySelector("#cv-title")?.textContent?.trim() || characterId}`;
    image.decoding = "async";
    image.loading = "eager";

    figure.append(image);
    const sourceLabel = ident.querySelector("small");
    sourceLabel?.insertAdjacentElement("afterend", figure);
    return true;
  }

  const observer = new MutationObserver(applyPortrait);
  observer.observe(sidebar, { childList: true, subtree: true });
  media.addEventListener?.("change", applyPortrait);
  applyPortrait();
})();
