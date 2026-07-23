(() => {
  "use strict";

  const media = matchMedia("(max-width: 820px)");
  const index = window.BANDA_CHARACTER_DATA?.index?.characters || [];
  const api = window.BANDA_MOBILE_VIEW_MODEL;
  if (!api || !index.length) return;

  const tabs = [
    ["combat", "Combate", "⚔"],
    ["spells", "Hechizos", "✦"],
    ["inventory", "Equipo", "▣"],
    ["features", "Rasgos", "◆"],
    ["more", "Más", "•••"]
  ];
  const copy = {
    combat: ["COMBATE", "Referencia rápida y estado de sesión"],
    spells: ["HECHIZOS", "Conjuros, espacios y concentración"],
    inventory: ["EQUIPO", "Armas, armadura, objetos y consumibles"],
    features: ["RASGOS", "Clase, subclase, dotes y recursos"],
    more: ["MÁS", "Atributos, habilidades, defensas y notas"]
  };

  const style = document.createElement("style");
  style.id = "banda-mobile-shell-styles";
  style.textContent = `
.mcs-root[hidden]{display:none!important}@media(min-width:821px){.mcs-root{display:none!important}}
@media(max-width:820px){
:root{--mbg:#090d0b;--mp:#111813;--mb:rgba(153,255,176,.28);--mt:#edf8ef;--mm:#91a895;--ma:#9cffad}
body.mcs-open{overflow:hidden;touch-action:none}.mcs-root{position:fixed;inset:0;z-index:10000;display:grid;grid-template-rows:auto minmax(0,1fr) auto;width:100%;height:100vh;height:100dvh;overflow:hidden;color:var(--mt);background:radial-gradient(circle at 50% -20%,rgba(84,190,110,.18),transparent 44%),linear-gradient(#0b110d,var(--mbg));font-family:system-ui,-apple-system,"Segoe UI",sans-serif;isolation:isolate}
.mcs-header{min-height:78px;display:grid;grid-template-columns:48px 48px minmax(0,1fr) auto;align-items:center;gap:10px;padding:calc(8px + env(safe-area-inset-top)) 12px 8px;border-bottom:1px solid var(--mb);background:rgba(9,14,10,.96);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
.mcs-back,.mcs-nav button{border:0;color:inherit;font:inherit;-webkit-tap-highlight-color:transparent}.mcs-back{width:44px;height:44px;border:1px solid var(--mb);border-radius:12px;background:var(--mp);font-size:24px}.mcs-portrait{width:46px;height:46px;border:1px solid var(--mb);border-radius:50%;object-fit:cover;background:#172019}.mcs-identity{min-width:0}.mcs-identity h1{margin:0;overflow:hidden;font-size:17px;line-height:1.18;text-overflow:ellipsis;white-space:nowrap}.mcs-identity p{margin:3px 0 0;overflow:hidden;color:var(--mm);font-size:12px;text-overflow:ellipsis;white-space:nowrap}.mcs-session{display:inline-flex;align-items:center;gap:6px;min-height:28px;padding:0 9px;border:1px solid rgba(156,255,173,.34);border-radius:999px;color:var(--ma);background:rgba(56,112,68,.18);font-size:10px;font-weight:800;letter-spacing:.08em}.mcs-session:before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor;box-shadow:0 0 10px currentColor}
.mcs-main{min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:18px 16px 28px;scrollbar-width:none}.mcs-main::-webkit-scrollbar{display:none}.mcs-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:14px}.mcs-heading h2{margin:0;color:var(--ma);font-family:"VT323",monospace;font-size:30px;font-weight:400}.mcs-heading p{max-width:180px;margin:0;color:var(--mm);font-size:11px;line-height:1.35;text-align:right}.mcs-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.mcs-stat,.mcs-placeholder{border:1px solid var(--mb);border-radius:15px;background:linear-gradient(rgba(23,32,25,.94),rgba(15,22,17,.94));box-shadow:0 16px 35px rgba(0,0,0,.18)}.mcs-stat{min-height:92px;display:grid;place-items:center;align-content:center;gap:3px;padding:12px 8px;text-align:center}.mcs-stat span{color:var(--mm);font-size:10px;font-weight:800;letter-spacing:.09em}.mcs-stat strong{font-size:24px;font-variant-numeric:tabular-nums}.mcs-placeholder{margin-top:12px;padding:18px}.mcs-placeholder strong{display:block;margin-bottom:6px;font-size:14px}.mcs-placeholder p{margin:0;color:var(--mm);font-size:13px;line-height:1.5}
.mcs-nav{min-height:72px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));padding:6px 6px calc(6px + env(safe-area-inset-bottom));border-top:1px solid var(--mb);background:rgba(8,13,9,.98);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.mcs-nav button{min-width:0;min-height:58px;display:grid;place-items:center;align-content:center;gap:3px;border-radius:12px;color:var(--mm);background:transparent;font-size:10px;font-weight:750}.mcs-nav button i{min-height:20px;font-style:normal;font-size:18px;line-height:1}.mcs-nav button[aria-selected=true]{color:var(--ma);background:rgba(91,176,108,.14)}.mcs-nav button:focus-visible,.mcs-back:focus-visible{outline:2px solid var(--ma);outline-offset:2px}
@media(max-width:360px){.mcs-header{grid-template-columns:44px 42px minmax(0,1fr);gap:8px;padding-inline:8px}.mcs-session{display:none}.mcs-main{padding-inline:12px}.mcs-stats{gap:7px}.mcs-stat strong{font-size:21px}.mcs-nav button{font-size:9px}}
@media(prefers-reduced-motion:no-preference){.mcs-root:not([hidden]){animation:mcs-in .16s ease-out}.mcs-view{animation:mcs-view .12s ease-out}@keyframes mcs-in{from{opacity:0;transform:translateY(10px)}}@keyframes mcs-view{from{opacity:0;transform:translateY(4px)}}}
}`;
  document.head.append(style);

  const root = document.createElement("section");
  root.className = "mcs-root";
  root.hidden = true;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "mcs-name");
  root.innerHTML = `
<header class="mcs-header"><button class="mcs-back" type="button" aria-label="Volver a la portada">‹</button><img class="mcs-portrait" alt=""><div class="mcs-identity"><h1 id="mcs-name">Personaje</h1><p>Cargando ficha...</p></div><span class="mcs-session">SESIÓN</span></header>
<main class="mcs-main" tabindex="-1"><section class="mcs-view" aria-live="polite"></section></main>
<nav class="mcs-nav" aria-label="Secciones de la ficha" role="tablist"></nav>`;
  document.body.append(root);

  const $ = (selector) => root.querySelector(selector);
  const back = $(".mcs-back");
  const portrait = $(".mcs-portrait");
  const name = $("#mcs-name");
  const line = $(".mcs-identity p");
  const main = $(".mcs-main");
  const view = $(".mcs-view");
  const nav = $(".mcs-nav");
  let model = null;
  let activeTab = "combat";
  let lastFocus = null;

  const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  const metaFromHotspot = (button) => {
    const label = normalize(button.querySelector("span")?.textContent || button.textContent);
    return index.find((entry) => normalize(entry.name) === label) || null;
  };
  const signed = (value) => Number.isFinite(Number(value)) ? (Number(value) >= 0 ? `+${value}` : String(value)) : "—";

  function stat(label, value) {
    const card = document.createElement("div");
    card.className = "mcs-stat";
    const key = document.createElement("span");
    const number = document.createElement("strong");
    key.textContent = label;
    number.textContent = value;
    card.append(key, number);
    return card;
  }

  function render(tabId) {
    if (!model) return;
    activeTab = tabs.some(([id]) => id === tabId) ? tabId : "combat";
    nav.querySelectorAll("button").forEach((button) => {
      const selected = button.dataset.tab === activeTab;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });

    const [title, subtitle] = copy[activeTab];
    view.replaceChildren();
    const heading = document.createElement("header");
    heading.className = "mcs-heading";
    const h2 = document.createElement("h2");
    const sub = document.createElement("p");
    h2.textContent = title;
    sub.textContent = subtitle;
    heading.append(h2, sub);
    view.append(heading);

    if (activeTab === "combat") {
      const grid = document.createElement("div");
      grid.className = "mcs-stats";
      grid.append(
        stat("PG", `${model.combat.hp.sessionCurrent ?? "—"}/${model.combat.hp.canonicalMaximum ?? "—"}`),
        stat("CA", model.combat.armorClass.value ?? "—"),
        stat("INICIATIVA", signed(model.combat.initiative))
      );
      view.append(grid);
    }

    const placeholder = document.createElement("div");
    placeholder.className = "mcs-placeholder";
    const strong = document.createElement("strong");
    const text = document.createElement("p");
    strong.textContent = activeTab === "combat" ? "Shell mobile operativo" : `${title} preparado para su renderer`;
    text.textContent = activeTab === "combat"
      ? "La ficha ya funciona a pantalla completa con encabezado fijo, contenido desplazable, navegación inferior y datos del MobileCharacterViewModel."
      : "La sección ya forma parte de la navegación estable. Sus tarjetas, filtros y controles se incorporan sin reutilizar el DOM desktop.";
    placeholder.append(strong, text);
    view.append(placeholder);
    main.scrollTop = 0;
  }

  function buildNav() {
    nav.replaceChildren(...tabs.map(([id, label, icon]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.tab = id;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(id === activeTab));
      button.tabIndex = id === activeTab ? 0 : -1;
      const symbol = document.createElement("i");
      symbol.setAttribute("aria-hidden", "true");
      symbol.textContent = icon;
      const caption = document.createElement("span");
      caption.textContent = label;
      button.append(symbol, caption);
      button.addEventListener("click", () => render(id));
      return button;
    }));
  }

  function open(meta, trigger = null) {
    if (!media.matches || !meta) return false;
    try {
      const sessionState = api.createSessionState(meta.id, { sessionId: `mobile-local-${meta.id}` });
      model = api.build(meta.id, { sessionState, throwOnInvalid: false });
    } catch (error) {
      console.error("Unable to build mobile character shell", error);
      return false;
    }
    lastFocus = trigger || document.activeElement;
    activeTab = "combat";
    name.textContent = model.identity.name;
    line.textContent = `${model.identity.race} · NIVEL ${model.identity.level} · ${model.identity.classLine}`;
    portrait.src = model.identity.portrait || "favicon.svg";
    portrait.alt = `Retrato de ${model.identity.name}`;
    buildNav();
    render(activeTab);
    root.hidden = false;
    document.body.classList.add("mcs-open");
    back.focus({ preventScroll: true });
    root.dispatchEvent(new CustomEvent("banda:mobile-character-open", { detail: { characterId: model.id } }));
    return true;
  }

  function close({ restoreFocus = true } = {}) {
    if (root.hidden) return;
    const characterId = model?.id || null;
    root.hidden = true;
    document.body.classList.remove("mcs-open");
    model = null;
    if (restoreFocus && lastFocus instanceof HTMLElement) lastFocus.focus({ preventScroll: true });
    lastFocus = null;
    root.dispatchEvent(new CustomEvent("banda:mobile-character-close", { detail: { characterId } }));
  }

  back.addEventListener("click", () => close());
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !root.hidden) close();
  });
  document.addEventListener("click", (event) => {
    if (!media.matches) return;
    const hotspot = event.target.closest?.(".cv-hotspot");
    if (!hotspot) return;
    const meta = metaFromHotspot(hotspot);
    if (!meta) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    open(meta, hotspot);
  }, true);
  media.addEventListener?.("change", (event) => {
    if (!event.matches) close({ restoreFocus: false });
  });

  window.BANDA_MOBILE_SHELL = Object.freeze({
    version: 1,
    open: (characterId) => open(index.find((entry) => entry.id === characterId)),
    close,
    selectTab: render,
    isOpen: () => !root.hidden,
    activeCharacterId: () => model?.id || null
  });
})();
