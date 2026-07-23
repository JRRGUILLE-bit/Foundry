(() => {
  "use strict";

  const api = window.BANDA_MOBILE_VIEW_MODEL;
  const shell = window.BANDA_MOBILE_SHELL;
  const root = document.querySelector(".mcs-root");
  const view = root?.querySelector(".mcs-view");
  const main = root?.querySelector(".mcs-main");
  const nav = root?.querySelector(".mcs-nav");
  if (!api || !shell || !root || !view || !main || !nav) return;

  const SESSION_TTL_MS = 5 * 60 * 60 * 1000;
  const STORAGE_PREFIX = "banda.mobile.inventory.v1.";
  const uiStates = new Map();
  const inventorySessions = new Map();
  let busy = false;
  let queued = false;

  const css = document.createElement("style");
  css.id = "banda-mobile-inventory-styles";
  css.textContent = `@media(max-width:820px){
.a12-tools{display:grid;gap:9px}.a12-search{width:100%;min-height:46px;box-sizing:border-box;padding:0 13px;border:1px solid var(--mb);border-radius:12px;color:var(--mt);background:#0b110d;font:600 15px system-ui}.a12-search:focus,.a12-chip:focus-visible,.a12-item summary:focus-visible,.a12-step:focus-visible{outline:2px solid var(--ma);outline-offset:2px}.a12-chips{display:flex;gap:7px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}.a12-chips::-webkit-scrollbar{display:none}.a12-chip{min-height:44px;flex:none;padding:0 12px;border:1px solid var(--mb);border-radius:999px;color:var(--mm);background:var(--mp);font:800 10px system-ui}.a12-chip[aria-pressed=true]{color:var(--ma);background:rgba(91,176,108,.16)}.a12-count{margin:8px 0 0;color:var(--mm);font-size:10px;text-align:right}.a12-group{display:grid;gap:8px;margin-top:16px}.a12-group[hidden],.a12-item[hidden]{display:none}.a12-group h3{display:flex;justify-content:space-between;margin:0;color:var(--mt);font-size:11px;letter-spacing:.1em;text-transform:uppercase}.a12-group h3 span{color:var(--mm);font-size:9px;letter-spacing:0}.a12-list{display:grid;gap:8px}.a12-item{border:1px solid var(--mb);border-radius:15px;background:linear-gradient(rgba(23,32,25,.94),rgba(15,22,17,.94));overflow:hidden}.a12-item summary{min-height:68px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;padding:11px 12px;cursor:pointer;list-style:none}.a12-item summary::-webkit-details-marker{display:none}.a12-title strong{display:block;overflow:hidden;font-size:14px;text-overflow:ellipsis;white-space:nowrap}.a12-title small{display:block;margin-top:3px;color:var(--mm);font-size:10px}.a12-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}.a12-tag{padding:3px 6px;border:1px solid var(--mbs);border-radius:999px;color:var(--mm);font-size:8px;font-weight:800}.a12-tag.ok{color:var(--ma)}.a12-tag.warn{color:var(--mw)}.a12-arrow{color:var(--ma);font-size:18px}.a12-item[open] .a12-arrow{transform:rotate(90deg)}.a12-body{display:grid;gap:10px;padding:12px;border-top:1px solid var(--mbs)}.a12-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.a12-meta div,.a12-activity,.a12-session-control{padding:9px;border:1px solid var(--mbs);border-radius:10px;background:rgba(0,0,0,.14)}.a12-meta span{display:block;color:var(--mm);font-size:8px;font-weight:800;text-transform:uppercase}.a12-meta strong{display:block;margin-top:3px;font-size:11px;overflow-wrap:anywhere}.a12-properties{display:flex;flex-wrap:wrap;gap:5px}.a12-body p{margin:0;color:var(--mm);font-size:11px;line-height:1.5;white-space:pre-line}.a12-activity strong{font-size:12px}.a12-session{display:grid;gap:8px}.a12-session-control{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px}.a12-session-control label{display:grid;gap:3px}.a12-session-control label strong{font-size:12px}.a12-session-control label span{color:var(--mm);font-size:9px}.a12-mini-stepper{display:grid;grid-template-columns:44px minmax(52px,auto) 44px;align-items:center;gap:5px}.a12-step{width:44px;height:44px;border:1px solid var(--mb);border-radius:10px;color:var(--mt);background:var(--mp2);font:700 21px system-ui}.a12-mini-stepper output{min-width:48px;text-align:center;font-size:15px;font-weight:850;font-variant-numeric:tabular-nums}.a12-empty{margin-top:14px}
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
  const clamp = (value, min, max = Infinity) => Math.min(max, Math.max(min, int(value, min)));

  const plain = (value) => {
    const template = document.createElement("template");
    template.innerHTML = String(value || "").replace(/<br\s*\/?>|<\/p>|<\/li>/gi, "\n");
    return (template.content.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
  };

  const selected = () => !root.hidden
    && nav.querySelector('[data-tab="inventory"]')?.getAttribute("aria-selected") === "true";

  const stateKey = (characterId, sessionId) => `${characterId}:${sessionId}`;

  const uiState = (characterId, sessionId) => {
    const key = stateKey(characterId, sessionId);
    if (!uiStates.has(key)) {
      uiStates.set(key, {
        query: "",
        facet: "all",
        bucket: "all",
        open: new Set()
      });
    }
    return uiStates.get(key);
  };

  const storageKey = (characterId, sessionId) =>
    `${STORAGE_PREFIX}${characterId}.${sessionId}`;

  function copy(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function inventorySession(baseSession) {
    const key = stateKey(baseSession.characterId, baseSession.sessionId);
    if (inventorySessions.has(key)) return inventorySessions.get(key);

    let inventoryUses = copy(baseSession.inventoryUses || {});
    try {
      const raw = localStorage.getItem(storageKey(baseSession.characterId, baseSession.sessionId));
      if (raw) {
        const stored = JSON.parse(raw);
        if (stored?.expiresAt > Date.now()
          && stored?.characterId === baseSession.characterId
          && stored?.sessionId === baseSession.sessionId
          && stored?.inventoryUses
          && typeof stored.inventoryUses === "object") {
          inventoryUses = stored.inventoryUses;
        } else {
          localStorage.removeItem(storageKey(baseSession.characterId, baseSession.sessionId));
        }
      }
    } catch (error) {
      console.warn("Unable to restore mobile inventory session", error);
    }

    const overlay = {
      characterId: baseSession.characterId,
      sessionId: baseSession.sessionId,
      inventoryUses
    };
    inventorySessions.set(key, overlay);
    return overlay;
  }

  function persistInventory(overlay) {
    inventorySessions.set(stateKey(overlay.characterId, overlay.sessionId), overlay);
    try {
      localStorage.setItem(storageKey(overlay.characterId, overlay.sessionId), JSON.stringify({
        expiresAt: Date.now() + SESSION_TTL_MS,
        characterId: overlay.characterId,
        sessionId: overlay.sessionId,
        inventoryUses: overlay.inventoryUses
      }));
    } catch (error) {
      console.warn("Unable to persist mobile inventory session", error);
    }
  }

  function mergedSession(baseSession, overlay) {
    return {
      ...copy(baseSession),
      inventoryUses: {
        ...(copy(baseSession.inventoryUses) || {}),
        ...(copy(overlay.inventoryUses) || {})
      }
    };
  }

  function bucket(item) {
    const key = norm(`${item.type || ""} ${item.category || ""}`);
    if (item.weapon || /\bweapon\b|\barma\b/.test(key)) return "weapons";
    if (item.armor || /\barmor\b|\barmadura\b|\bshield\b|\bescudo\b/.test(key)) return "armor";
    if (/\bconsumable\b|\bconsumible\b|\bpotion\b|\bpocion\b|\bscroll\b|\bpergamino\b|\bammunition\b|\bmunicion\b|\bfood\b|\bcomida\b/.test(key)) {
      return "consumables";
    }
    if (num(item.canonicalQuantity) !== null && Number(item.canonicalQuantity) > 1) return "consumables";
    return "other";
  }

  const bucketLabels = {
    weapons: "Armas",
    armor: "Armaduras",
    consumables: "Consumibles",
    other: "Otros"
  };

  const tag = (label, className = "") =>
    `<span class="a12-tag ${className}">${esc(label)}</span>`;

  const sectionHead = (title, hint = "") =>
    `<header class="mcs-section-title"><h3>${esc(title)}</h3>${hint ? `<span>${esc(hint)}</span>` : ""}</header>`;

  function valueLabel(value, fallback = "—") {
    if (value === null || value === undefined || value === "") return fallback;
    if (typeof value === "object") {
      const amount = value.value ?? value.amount ?? value.number;
      const units = value.units ?? value.denomination ?? value.unit ?? "";
      if (amount !== null && amount !== undefined && amount !== "") {
        return `${amount}${units ? ` ${units}` : ""}`;
      }
      return fallback;
    }
    return String(value);
  }

  function formulaFrom(value, depth = 0) {
    if (depth > 4 || value === null || value === undefined) return "";
    if (typeof value === "string" || typeof value === "number") {
      const text = String(value).trim();
      return text;
    }
    if (Array.isArray(value)) {
      return value.map((entry) => formulaFrom(entry, depth + 1)).filter(Boolean).join(" + ");
    }
    if (typeof value === "object") {
      for (const key of ["formula", "value", "number", "bonus", "parts", "custom"]) {
        if (!(key in value)) continue;
        const result = formulaFrom(value[key], depth + 1);
        if (result) return result;
      }
    }
    return "";
  }

  function activityHtml(activity) {
    const parts = [];
    const activation = activity?.activation?.label;
    const range = activity?.range?.label;
    const target = activity?.target?.label;
    const attack = activity?.attack?.bonus ?? activity?.attack?.value;
    const saveDc = activity?.save?.dc ?? activity?.save?.value;
    const damage = formulaFrom(activity?.damage);
    if (activation) parts.push(activation);
    if (range && range !== "—") parts.push(range);
    if (target && target !== "—") parts.push(target);
    if (num(attack) !== null) parts.push(`Ataque ${Number(attack) >= 0 ? "+" : ""}${attack}`);
    if (num(saveDc) !== null) parts.push(`Salvación CD ${saveDc}`);
    if (damage) parts.push(`Daño ${damage}`);
    const flavor = plain(activity?.chatFlavor || activity?.description);
    return `<section class="a12-activity"><strong>${esc(activity?.name || "Actividad")}</strong>${parts.length ? `<p>${esc(parts.join(" · "))}</p>` : ""}${flavor ? `<p>${esc(flavor)}</p>` : ""}</section>`;
  }

  function stepperHtml(item, field, current, maximum = null) {
    const id = String(item.id);
    const label = field === "quantity" ? "cantidad" : "usos";
    const maxLabel = maximum === null ? String(current) : `${current}/${maximum}`;
    return `<div class="a12-mini-stepper">
<button class="a12-step" type="button" data-a12-step="${esc(id)}" data-field="${field}" data-delta="-1" data-focus-key="${esc(`${field}:${id}:minus`)}" aria-label="Reducir ${label}">−</button>
<output>${esc(maxLabel)}</output>
<button class="a12-step" type="button" data-a12-step="${esc(id)}" data-field="${field}" data-delta="1" data-focus-key="${esc(`${field}:${id}:plus`)}" aria-label="Aumentar ${label}">+</button>
</div>`;
  }

  function itemHtml(item, ui) {
    const id = String(item.id || item.name);
    const itemBucket = bucket(item);
    const quantity = int(item.quantity, int(item.canonicalQuantity, 1));
    const maximumUses = num(item.uses?.canonicalMax);
    const currentUses = item.uses?.sessionCurrent ?? item.uses?.canonicalCurrent;
    const tags = [
      item.equipped && tag("EQUIPADO", "ok"),
      item.attuned && tag("SINTONIZADO", "ok"),
      item.magical && tag("MÁGICO", "warn"),
      quantity !== 1 && tag(`CANT. ${quantity}`)
    ].filter(Boolean).join("");

    const meta = [
      ["Categoría", item.category || item.type || "—"],
      ["Peso", valueLabel(item.weight)],
      ["Rareza", item.rarity || "—"],
      ["Precio", valueLabel(item.price)]
    ];

    if (item.weapon) {
      const weaponDamage = typeof item.weapon.damage === "string"
        ? item.weapon.damage
        : formulaFrom(item.weapon.damage);
      meta.push(["Daño", weaponDamage || "—"]);
      meta.push(["Alcance", item.weapon.range?.label || valueLabel(item.weapon.range)]);
      meta.push(["Tipo de arma", item.weapon.type || "—"]);
      if (num(item.weapon.magicalBonus) !== null && Number(item.weapon.magicalBonus) !== 0) {
        meta.push(["Bono mágico", `${Number(item.weapon.magicalBonus) >= 0 ? "+" : ""}${item.weapon.magicalBonus}`]);
      }
    }

    if (item.armor) {
      meta.push(["Tipo de armadura", item.armor.type || "—"]);
      meta.push(["CA base", item.armor.value ?? "—"]);
      if (num(item.armor.magicalBonus) !== null && Number(item.armor.magicalBonus) !== 0) {
        meta.push(["Bono mágico", `${Number(item.armor.magicalBonus) >= 0 ? "+" : ""}${item.armor.magicalBonus}`]);
      }
    }

    const sessionControls = [];
    if (itemBucket === "consumables" || Number(item.canonicalQuantity) > 1) {
      sessionControls.push(`<div class="a12-session-control"><label><strong>Cantidad en sesión</strong><span>No modifica el inventario permanente</span></label>${stepperHtml(item, "quantity", quantity)}</div>`);
    }
    if (maximumUses !== null) {
      sessionControls.push(`<div class="a12-session-control"><label><strong>Usos restantes</strong><span>Máximo ${maximumUses}</span></label>${stepperHtml(item, "current", int(currentUses), maximumUses)}</div>`);
    }

    const properties = (item.properties || []).map((property) => tag(property)).join("");
    const activities = (item.activities || []).map(activityHtml).join("");
    const description = plain(item.description);

    return `<details class="a12-item" data-id="${esc(id)}" data-bucket="${itemBucket}" data-equipped="${!!item.equipped}" data-attuned="${!!item.attuned}" data-search="${esc(item.searchText || norm(`${item.name} ${item.category} ${description}`))}" ${ui.open.has(id) ? "open" : ""}>
<summary><div class="a12-title"><strong>${esc(item.name)}</strong><small>${esc(bucketLabels[itemBucket])} · ${esc(item.category || item.type || "Sin categoría")}</small>${tags ? `<div class="a12-tags">${tags}</div>` : ""}</div><span class="a12-arrow">›</span></summary>
<div class="a12-body">
<div class="a12-meta">${meta.map(([label, value]) => `<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join("")}</div>
${properties ? `<div class="a12-properties">${properties}</div>` : ""}
${sessionControls.length ? `<section class="a12-session">${sessionControls.join("")}</section>` : ""}
${activities}
${description ? `<p>${esc(description)}</p>` : ""}
</div></details>`;
  }

  function apply(container, ui) {
    const query = norm(ui.query);
    let count = 0;
    container.querySelectorAll(".a12-item").forEach((card) => {
      const searchMatch = !query || card.dataset.search.includes(query);
      const bucketMatch = ui.bucket === "all" || card.dataset.bucket === ui.bucket;
      const facetMatch = ui.facet === "all"
        || (ui.facet === "equipped" && card.dataset.equipped === "true")
        || (ui.facet === "attuned" && card.dataset.attuned === "true");
      const visible = searchMatch && bucketMatch && facetMatch;
      card.hidden = !visible;
      if (visible) count += 1;
    });
    container.querySelectorAll(".a12-group").forEach((group) => {
      group.hidden = !group.querySelector(".a12-item:not([hidden])");
    });
    const countLabel = container.querySelector(".a12-count");
    if (countLabel) countLabel.textContent = `${count} ${count === 1 ? "objeto" : "objetos"}`;
    const empty = container.querySelector(".a12-empty");
    if (empty) empty.hidden = count > 0;
  }

  function chips(kind, items, active) {
    return `<div class="a12-chips">${items.map(([label, value]) =>
      `<button type="button" class="a12-chip" data-a12-filter="${kind}" data-value="${esc(value)}" aria-pressed="${String(active === String(value))}">${esc(label)}</button>`
    ).join("")}</div>`;
  }

  function render(options = {}) {
    if (!selected()) return false;
    const characterId = shell.activeCharacterId?.();
    const baseSession = shell.getSessionState?.();
    if (!characterId || !baseSession?.sessionId) return false;

    const overlay = inventorySession(baseSession);
    const sessionState = mergedSession(baseSession, overlay);
    const model = api.build(characterId, { sessionState, throwOnInvalid: false });
    if (!model?.validation?.valid) return false;

    const ui = uiState(characterId, baseSession.sessionId);
    const scroll = options.keep ? main.scrollTop : 0;
    const groups = ["weapons", "armor", "consumables", "other"].map((groupId) => {
      const items = model.inventory.filter((item) => bucket(item) === groupId);
      if (!items.length) return "";
      return `<section class="a12-group" data-group="${groupId}"><h3><strong>${bucketLabels[groupId]}</strong><span>${items.length} ${items.length === 1 ? "objeto" : "objetos"}</span></h3><div class="a12-list">${items.map((item) => itemHtml(item, ui)).join("")}</div></section>`;
    }).join("");

    busy = true;
    view.innerHTML = `<section data-a12-root="${esc(characterId)}"><header class="mcs-heading"><h2>EQUIPO</h2><p>Armas, armadura, objetos y consumibles</p></header>
<section class="mcs-section">${sectionHead("Inventario", `${model.inventory.length} objetos registrados`)}
<div class="a12-tools">
<input class="a12-search" type="search" data-a12-search value="${esc(ui.query)}" placeholder="Buscar objeto, propiedad o efecto" aria-label="Buscar equipo">
${chips("facet", [["Todos","all"],["Equipados","equipped"],["Sintonizados","attuned"]], ui.facet)}
${chips("bucket", [["Todo el equipo","all"],["Armas","weapons"],["Armaduras","armor"],["Consumibles","consumables"],["Otros","other"]], ui.bucket)}
</div>
<p class="a12-count"></p>
${groups}
<p class="mcs-empty a12-empty">No hay objetos que coincidan con los filtros actuales.</p>
</section></section>`;

    apply(view, ui);
    main.scrollTop = scroll;
    busy = false;
    if (options.focus) {
      requestAnimationFrame(() => {
        view.querySelector(`[data-focus-key="${options.focus}"]`)?.focus({ preventScroll: true });
      });
    }
    return true;
  }

  function schedule() {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      if (!busy && selected() && !view.querySelector("[data-a12-root]")) render();
    });
  }

  function changeInventory(itemId, field, delta, focusKey) {
    const baseSession = shell.getSessionState?.();
    const characterId = shell.activeCharacterId?.();
    if (!baseSession?.sessionId || !characterId) return;

    const overlay = inventorySession(baseSession);
    const sessionState = mergedSession(baseSession, overlay);
    const model = api.build(characterId, { sessionState, throwOnInvalid: false });
    const item = model.inventory.find((entry) => String(entry.id) === String(itemId));
    if (!item) return;

    const entry = overlay.inventoryUses[item.id] ||= {
      current: item.uses?.sessionCurrent ?? item.uses?.canonicalCurrent ?? null,
      spent: item.uses?.sessionSpent ?? item.uses?.canonicalSpent ?? null,
      quantity: item.quantity ?? item.canonicalQuantity ?? 1
    };

    if (field === "quantity") {
      entry.quantity = clamp((item.quantity ?? item.canonicalQuantity ?? 1) + delta, 0);
    } else if (field === "current") {
      const maximum = num(item.uses?.canonicalMax);
      const current = int(item.uses?.sessionCurrent ?? item.uses?.canonicalCurrent, 0);
      entry.current = clamp(current + delta, 0, maximum ?? Infinity);
      if (maximum !== null) entry.spent = maximum - entry.current;
    } else {
      return;
    }

    persistInventory(overlay);
    render({ keep: true, focus: focusKey });
  }

  view.addEventListener("input", (event) => {
    if (!selected() || !event.target.matches("[data-a12-search]")) return;
    const baseSession = shell.getSessionState?.();
    if (!baseSession?.sessionId) return;
    const ui = uiState(shell.activeCharacterId(), baseSession.sessionId);
    ui.query = event.target.value;
    apply(view, ui);
  });

  view.addEventListener("click", (event) => {
    const step = event.target.closest("[data-a12-step]");
    if (step && selected()) {
      changeInventory(
        step.dataset.a12Step,
        step.dataset.field,
        int(step.dataset.delta),
        step.dataset.focusKey
      );
      return;
    }

    const filter = event.target.closest("[data-a12-filter]");
    if (!filter || !selected()) return;
    const baseSession = shell.getSessionState?.();
    if (!baseSession?.sessionId) return;
    const ui = uiState(shell.activeCharacterId(), baseSession.sessionId);
    ui[filter.dataset.a12Filter] = filter.dataset.value;
    view.querySelectorAll(`[data-a12-filter="${filter.dataset.a12Filter}"]`).forEach((button) => {
      button.setAttribute("aria-pressed", String(button === filter));
    });
    apply(view, ui);
  });

  view.addEventListener("toggle", (event) => {
    if (!event.target.matches?.(".a12-item")) return;
    const baseSession = shell.getSessionState?.();
    if (!baseSession?.sessionId) return;
    const open = uiState(shell.activeCharacterId(), baseSession.sessionId).open;
    event.target.open ? open.add(event.target.dataset.id) : open.delete(event.target.dataset.id);
  }, true);

  nav.addEventListener("click", (event) => {
    if (event.target.closest('[data-tab="inventory"]')) schedule();
  });

  root.addEventListener("banda:mobile-character-open", schedule);

  const observer = new MutationObserver(() => {
    if (!busy && selected() && !view.querySelector("[data-a12-root]")) schedule();
  });

  observer.observe(view, { childList: true });
  observer.observe(nav, {
    attributes: true,
    subtree: true,
    attributeFilter: ["aria-selected"]
  });

  window.BANDA_MOBILE_INVENTORY = Object.freeze({
    version: 1,
    render: () => render({ keep: true }),
    isActive: selected
  });
})();