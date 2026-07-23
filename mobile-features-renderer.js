(() => {
  "use strict";

  const api = window.BANDA_MOBILE_VIEW_MODEL;
  const shell = window.BANDA_MOBILE_SHELL;
  const root = document.querySelector(".mcs-root");
  const view = root?.querySelector(".mcs-view");
  const main = root?.querySelector(".mcs-main");
  const nav = root?.querySelector(".mcs-nav");
  if (!api || !shell || !root || !view || !main || !nav) return;

  const states = new Map();
  let busy = false;
  let queued = false;

  const categoryLabels = {
    class: "Clase",
    subclass: "Subclase",
    race: "Raza",
    feat: "Dotes y rasgos",
    background: "Trasfondo",
    other: "Otros"
  };
  const categoryOrder = ["class", "subclass", "race", "feat", "background", "other"];
  const actionLabels = {
    ACTION: "ACCIÓN",
    BONUS_ACTION: "ADICIONAL",
    REACTION: "REACCIÓN",
    PASSIVE_OR_SPECIAL: "PASIVO / ESPECIAL"
  };

  const css = document.createElement("style");
  css.id = "banda-mobile-features-styles";
  css.textContent = `@media(max-width:820px){
.a13-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.a13-tools{display:grid;gap:9px}.a13-search{width:100%;min-height:46px;box-sizing:border-box;padding:0 13px;border:1px solid var(--mb);border-radius:12px;color:var(--mt);background:#0b110d;font:600 15px system-ui}.a13-search:focus,.a13-chip:focus-visible,.a13-feature summary:focus-visible,.a13-step:focus-visible{outline:2px solid var(--ma);outline-offset:2px}.a13-chips{display:flex;gap:7px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}.a13-chips::-webkit-scrollbar{display:none}.a13-chip{min-height:44px;flex:none;padding:0 12px;border:1px solid var(--mb);border-radius:999px;color:var(--mm);background:var(--mp);font:800 10px system-ui}.a13-chip[aria-pressed=true]{color:var(--ma);background:rgba(91,176,108,.16)}.a13-count{margin:8px 0 0;color:var(--mm);font-size:10px;text-align:right}.a13-group{display:grid;gap:8px;margin-top:16px}.a13-group[hidden],.a13-feature[hidden]{display:none}.a13-group h3{display:flex;justify-content:space-between;margin:0;color:var(--mt);font-size:11px;letter-spacing:.1em;text-transform:uppercase}.a13-group h3 span{color:var(--mm);font-size:9px;letter-spacing:0}.a13-list{display:grid;gap:8px}.a13-feature{border:1px solid var(--mb);border-radius:15px;background:linear-gradient(rgba(23,32,25,.94),rgba(15,22,17,.94));overflow:hidden}.a13-feature summary{min-height:64px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;padding:11px 12px;cursor:pointer;list-style:none}.a13-feature summary::-webkit-details-marker{display:none}.a13-title strong{display:block;font-size:14px;line-height:1.3}.a13-title small{display:block;margin-top:3px;color:var(--mm);font-size:10px;line-height:1.35}.a13-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}.a13-tag{padding:3px 6px;border:1px solid var(--mbs);border-radius:999px;color:var(--mm);font-size:8px;font-weight:800}.a13-tag.ok{color:var(--ma)}.a13-tag.warn{color:var(--mw)}.a13-arrow{color:var(--ma);font-size:18px}.a13-feature[open] .a13-arrow{transform:rotate(90deg)}.a13-body{display:grid;gap:10px;padding:12px;border-top:1px solid var(--mbs)}.a13-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.a13-meta div,.a13-activity,.a13-uses{padding:9px;border:1px solid var(--mbs);border-radius:10px;background:rgba(0,0,0,.14)}.a13-meta span{display:block;color:var(--mm);font-size:8px;font-weight:800;text-transform:uppercase}.a13-meta strong{display:block;margin-top:3px;font-size:11px;overflow-wrap:anywhere}.a13-body p{margin:0;color:var(--mm);font-size:11px;line-height:1.5;white-space:pre-line}.a13-activity strong{font-size:12px}.a13-uses{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px}.a13-uses-copy strong{display:block;font-size:12px}.a13-uses-copy span{display:block;margin-top:3px;color:var(--mm);font-size:9px}.a13-stepper{display:grid;grid-template-columns:44px minmax(52px,auto) 44px;align-items:center;gap:5px}.a13-step{width:44px;height:44px;border:1px solid var(--mb);border-radius:10px;color:var(--mt);background:var(--mp2);font:700 21px system-ui}.a13-stepper output{min-width:48px;text-align:center;font-size:15px;font-weight:850;font-variant-numeric:tabular-nums}.a13-empty{margin-top:14px}@media(max-width:360px){.a13-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.a13-summary .mcs-stat:last-child{grid-column:1/-1}.a13-uses{grid-template-columns:1fr}.a13-stepper{justify-content:start}}
}`;
  document.head.append(css);

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
  const norm = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
  const num = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
  const int = (value, fallback = 0) => num(value) === null ? fallback : Math.round(Number(value));
  const sign = (value) => num(value) === null ? "—" : Number(value) >= 0 ? `+${Number(value)}` : String(Number(value));
  const plain = (value) => {
    const template = document.createElement("template");
    template.innerHTML = String(value || "").replace(/<br\s*\/?>|<\/p>|<\/li>/gi, "\n");
    return (template.content.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
  };
  const state = (characterId) => {
    if (!states.has(characterId)) states.set(characterId, {
      query: "",
      category: "all",
      action: "all",
      open: new Set()
    });
    return states.get(characterId);
  };
  const selected = () => !root.hidden && nav.querySelector('[data-tab="features"]')?.getAttribute("aria-selected") === "true";
  const sectionHead = (title, hint = "") => `<header class="mcs-section-title"><h3>${esc(title)}</h3>${hint ? `<span>${esc(hint)}</span>` : ""}</header>`;
  const stat = (label, value, detail) => `<div class="mcs-stat"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small></div>`;
  const tag = (label, className = "") => `<span class="a13-tag ${className}">${esc(label)}</span>`;

  function categoryOf(feature) {
    const type = norm(feature?.type);
    if (type === "class") return "class";
    if (type === "subclass") return "subclass";
    if (type === "race") return "race";
    if (type === "background") return "background";
    if (type === "feat") return "feat";
    return "other";
  }

  function recoveryLabel(uses) {
    const labels = (uses?.recovery || []).map((entry) => {
      if (entry?.label) return entry.label;
      if (entry?.period === "sr") return "Descanso corto";
      if (entry?.period === "lr") return "Descanso largo";
      if (entry?.period === "day") return "Diario";
      return entry?.period || "";
    }).filter(Boolean);
    return labels.join(" · ") || "Sin recuperación registrada";
  }

  function formulaFrom(value, depth = 0) {
    if (depth > 4 || value === null || value === undefined) return null;
    if (typeof value === "string") {
      const cleaned = value.trim();
      return cleaned && (/\d+d\d/i.test(cleaned) || /@|\+|−|-|\*/.test(cleaned)) ? cleaned : null;
    }
    if (typeof value === "number") return String(value);
    if (Array.isArray(value)) {
      for (const entry of value) {
        const found = formulaFrom(entry, depth + 1);
        if (found) return found;
      }
      return null;
    }
    if (typeof value === "object") {
      for (const key of ["formula", "value", "number", "bonus", "parts", "custom"]) {
        if (!(key in value)) continue;
        const found = formulaFrom(value[key], depth + 1);
        if (found) return found;
      }
    }
    return null;
  }

  function activityMeta(activity) {
    const parts = [];
    const attack = activity?.attack?.bonus ?? activity?.attack?.value;
    const saveDc = num(activity?.save?.dc ?? activity?.save?.value);
    const damage = formulaFrom(activity?.damage);
    if (activity?.activation?.label) parts.push(`Activación ${activity.activation.label}`);
    if (activity?.range?.label && activity.range.label !== "—") parts.push(`Alcance ${activity.range.label}`);
    if (activity?.target?.label && activity.target.label !== "—") parts.push(`Objetivo ${activity.target.label}`);
    if (attack !== undefined && attack !== null && attack !== "") parts.push(`Ataque ${sign(attack)}`);
    if (saveDc !== null) parts.push(`Salvación CD ${saveDc}`);
    if (damage) parts.push(`Daño ${damage}`);
    return parts;
  }

  function resourceFor(model, feature) {
    return (model.combat.resources || []).find((resource) => resource.id === feature.id) || null;
  }

  function usesHtml(model, feature) {
    const resource = resourceFor(model, feature);
    if (!resource) return "";
    const current = resource.sessionCurrent ?? resource.canonicalCurrent;
    const maximum = resource.canonicalMax;
    if (current === null && maximum === null) return "";
    const output = maximum === null ? String(current ?? "—") : `${current ?? "—"}/${maximum}`;
    return `<section class="a13-uses"><div class="a13-uses-copy"><strong>Usos de sesión</strong><span>${esc(recoveryLabel(feature.uses))}</span></div><div class="a13-stepper"><button class="a13-step" type="button" data-a13-resource="${esc(feature.id)}" data-delta="-1" data-focus-key="resource:${esc(feature.id)}:minus" aria-label="Reducir usos de ${esc(feature.name)}">−</button><output>${esc(output)}</output><button class="a13-step" type="button" data-a13-resource="${esc(feature.id)}" data-delta="1" data-focus-key="resource:${esc(feature.id)}:plus" aria-label="Aumentar usos de ${esc(feature.name)}">+</button></div></section>`;
  }

  function featureHtml(model, feature, ui) {
    const id = String(feature.id || feature.name);
    const category = categoryOf(feature);
    const action = feature.actionCategory || "PASSIVE_OR_SPECIAL";
    const requirements = feature.requirements || "Sin requisito registrado";
    const description = plain(feature.description);
    const resource = resourceFor(model, feature);
    const tags = [
      tag(categoryLabels[category] || "Otro"),
      tag(actionLabels[action] || "ESPECIAL", action === "PASSIVE_OR_SPECIAL" ? "" : "ok"),
      resource && tag("USOS", "warn")
    ].filter(Boolean).join("");
    const activities = (feature.activities || []).map((activity) => {
      const metadata = activityMeta(activity);
      const flavor = plain(activity.chatFlavor || activity.description);
      return `<section class="a13-activity"><strong>${esc(activity.name || "Actividad")}</strong>${metadata.length ? `<p>${esc(metadata.join(" · "))}</p>` : ""}${flavor ? `<p>${esc(flavor)}</p>` : ""}</section>`;
    }).join("");
    const sourceType = feature.source?.rawItemType || feature.type || "no registrado";
    const searchText = feature.searchText || norm(`${feature.name} ${requirements} ${description} ${categoryLabels[category]} ${actionLabels[action]}`);
    return `<details class="a13-feature" data-id="${esc(id)}" data-category="${esc(category)}" data-action="${esc(action)}" data-search="${esc(searchText)}" ${ui.open.has(id) ? "open" : ""}>
<summary><div class="a13-title"><strong>${esc(feature.name)}</strong><small>${esc(requirements)}</small><div class="a13-tags">${tags}</div></div><span class="a13-arrow">›</span></summary>
<div class="a13-body"><div class="a13-meta"><div><span>Tipo</span><strong>${esc(categoryLabels[category] || "Otro")}</strong></div><div><span>Economía</span><strong>${esc(actionLabels[action] || "ESPECIAL")}</strong></div><div><span>Requisitos</span><strong>${esc(requirements)}</strong></div><div><span>Fuente</span><strong>${esc(sourceType)}</strong></div></div>${usesHtml(model, feature)}${activities}${description ? `<p>${esc(description)}</p>` : ""}</div></details>`;
  }

  function filterChips(kind, items, active) {
    return `<div class="a13-chips">${items.map(([label, value]) => `<button type="button" class="a13-chip" data-a13-filter="${kind}" data-value="${esc(value)}" aria-pressed="${String(active === String(value))}">${esc(label)}</button>`).join("")}</div>`;
  }

  function apply(container, ui) {
    const query = norm(ui.query);
    let count = 0;
    container.querySelectorAll(".a13-feature").forEach((card) => {
      const visible = (!query || card.dataset.search.includes(query))
        && (ui.category === "all" || card.dataset.category === ui.category)
        && (ui.action === "all" || card.dataset.action === ui.action);
      card.hidden = !visible;
      if (visible) count += 1;
    });
    container.querySelectorAll(".a13-group").forEach((group) => {
      group.hidden = !group.querySelector(".a13-feature:not([hidden])");
    });
    const counter = container.querySelector(".a13-count");
    if (counter) counter.textContent = `${count} ${count === 1 ? "rasgo" : "rasgos"}`;
    const empty = container.querySelector(".a13-empty");
    if (empty) empty.hidden = count > 0;
  }

  function render(options = {}) {
    if (!selected()) return false;
    const characterId = shell.activeCharacterId?.();
    const sessionState = shell.getSessionState?.();
    if (!characterId || !sessionState) return false;
    const model = api.build(characterId, { sessionState, throwOnInvalid: false });
    if (!model?.validation?.valid) return false;

    const ui = state(characterId);
    const previousScroll = options.keep ? main.scrollTop : 0;
    const presentCategories = new Set(model.features.map(categoryOf));
    const categoryItems = [["Todos", "all"], ...categoryOrder
      .filter((category) => presentCategories.has(category))
      .map((category) => [categoryLabels[category], category])];
    const presentActions = new Set(model.features.map((feature) => feature.actionCategory || "PASSIVE_OR_SPECIAL"));
    const actionItems = [["Toda economía", "all"],
      ["Acción", "ACTION"],
      ["Adicional", "BONUS_ACTION"],
      ["Reacción", "REACTION"],
      ["Pasivos", "PASSIVE_OR_SPECIAL"]
    ].filter(([, value]) => value === "all" || presentActions.has(value));
    const activeCount = model.features.filter((feature) => feature.actionCategory !== "PASSIVE_OR_SPECIAL").length;
    const resourceCount = model.features.filter((feature) => resourceFor(model, feature)).length;
    const groups = categoryOrder.map((category) => {
      const features = model.features.filter((feature) => categoryOf(feature) === category);
      if (!features.length) return "";
      return `<section class="a13-group"><h3><strong>${esc(categoryLabels[category])}</strong><span>${features.length} ${features.length === 1 ? "rasgo" : "rasgos"}</span></h3><div class="a13-list">${features.map((feature) => featureHtml(model, feature, ui)).join("")}</div></section>`;
    }).join("");

    busy = true;
    view.innerHTML = `<section data-a13-root="${esc(characterId)}"><header class="mcs-heading"><h2>RASGOS</h2><p>Clase, subclase, dotes y recursos</p></header>
<section class="mcs-section">${sectionHead("Resumen", `${model.features.length} rasgos registrados`)}<div class="a13-summary">${stat("TOTAL", model.features.length, "rasgos")}${stat("ACTIVOS", activeCount, "acción / reacción")}${stat("CON USOS", resourceCount, "sincronizados")}</div></section>
<section class="mcs-section">${sectionHead("Rasgos y capacidades", "usos compartidos con Combate")}<div class="a13-tools"><input class="a13-search" type="search" data-a13-search value="${esc(ui.query)}" placeholder="Buscar rasgo, requisito o efecto" aria-label="Buscar rasgos">${filterChips("category", categoryItems, ui.category)}${filterChips("action", actionItems, ui.action)}</div><p class="a13-count"></p>${groups}<p class="mcs-empty a13-empty">No hay rasgos que coincidan con los filtros actuales.</p></section></section>`;
    apply(view, ui);
    main.scrollTop = previousScroll;
    busy = false;
    if (options.focus) requestAnimationFrame(() => view.querySelector(`[data-focus-key="${options.focus}"]`)?.focus({ preventScroll: true }));
    return true;
  }

  function schedule() {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      if (!busy && selected() && !view.querySelector("[data-a13-root]")) render();
    });
  }

  function changeResource(resourceId, delta, focusKey) {
    const scroll = main.scrollTop;
    shell.selectTab("combat");
    const control = [...view.querySelectorAll('[data-action="step"][data-domain="resource"]')]
      .find((button) => button.dataset.id === resourceId && button.dataset.delta === String(delta));
    control?.click();
    shell.selectTab("features");
    render({ keep: true, focus: focusKey });
    main.scrollTop = scroll;
  }

  view.addEventListener("input", (event) => {
    if (!selected() || !event.target.matches("[data-a13-search]")) return;
    const ui = state(shell.activeCharacterId());
    ui.query = event.target.value;
    apply(view, ui);
  });

  view.addEventListener("click", (event) => {
    const step = event.target.closest("[data-a13-resource]");
    if (step && selected()) {
      changeResource(step.dataset.a13Resource, int(step.dataset.delta), step.dataset.focusKey);
      return;
    }
    const filter = event.target.closest("[data-a13-filter]");
    if (!filter || !selected()) return;
    const ui = state(shell.activeCharacterId());
    ui[filter.dataset.a13Filter] = filter.dataset.value;
    view.querySelectorAll(`[data-a13-filter="${filter.dataset.a13Filter}"]`).forEach((button) => {
      button.setAttribute("aria-pressed", String(button === filter));
    });
    apply(view, ui);
  });

  view.addEventListener("toggle", (event) => {
    if (!event.target.matches?.(".a13-feature")) return;
    const open = state(shell.activeCharacterId()).open;
    event.target.open ? open.add(event.target.dataset.id) : open.delete(event.target.dataset.id);
  }, true);

  nav.addEventListener("click", (event) => {
    if (event.target.closest('[data-tab="features"]')) schedule();
  });
  root.addEventListener("banda:mobile-character-open", schedule);
  const observer = new MutationObserver(() => {
    if (!busy && selected() && !view.querySelector("[data-a13-root]")) schedule();
  });
  observer.observe(view, { childList: true });
  observer.observe(nav, { attributes: true, subtree: true, attributeFilter: ["aria-selected"] });

  window.BANDA_MOBILE_FEATURES = Object.freeze({
    version: 1,
    render: () => render({ keep: true }),
    isActive: selected
  });
})();
