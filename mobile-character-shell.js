(() => {
  "use strict";

  const media = matchMedia("(max-width: 820px)");
  const characterMap = window.BANDA_CHARACTERS || window.BANDA_CHARACTER_DATA?.characters || {};
  const index = Object.values(characterMap)
    .filter((character) => character?.id && character?.name)
    .map((character) => ({ id: character.id, name: character.name }));
  const api = window.BANDA_MOBILE_VIEW_MODEL;
  if (!api || !index.length) return;

  const SESSION_TTL_MS = 5 * 60 * 60 * 1000;
  const STORAGE_PREFIX = "banda.mobile.session.v1.";
  const sessionCache = new Map();
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
  const moneyNames = new Set(["copper", "silver", "electrum", "gold", "platinum", "cobre", "plata", "electro", "oro", "platino"]);

  const style = document.createElement("style");
  style.id = "banda-mobile-shell-styles";
  style.textContent = `
.mcs-root[hidden]{display:none!important}@media(min-width:821px){.mcs-root{display:none!important}}
@media(max-width:820px){
:root{--mbg:#090d0b;--mp:#111813;--mp2:#172019;--mb:rgba(153,255,176,.28);--mbs:rgba(153,255,176,.14);--mt:#edf8ef;--mm:#91a895;--ma:#9cffad;--md:#ff9f9f;--mw:#ffd98a}
body.mcs-open{overflow:hidden}.mcs-root{position:fixed;inset:0;z-index:10000;display:grid;grid-template-rows:auto minmax(0,1fr) auto;width:100%;height:100vh;height:100dvh;overflow:hidden;color:var(--mt);background:radial-gradient(circle at 50% -20%,rgba(84,190,110,.18),transparent 44%),linear-gradient(#0b110d,var(--mbg));font-family:system-ui,-apple-system,"Segoe UI",sans-serif;isolation:isolate;touch-action:manipulation}
.mcs-header{min-height:78px;display:grid;grid-template-columns:48px 48px minmax(0,1fr) auto;align-items:center;gap:10px;padding:calc(8px + env(safe-area-inset-top)) 12px 8px;border-bottom:1px solid var(--mb);background:rgba(9,14,10,.96);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
.mcs-back,.mcs-nav button,.mcs-button,.mcs-stepper button,.mcs-reset{border:0;color:inherit;font:inherit;-webkit-tap-highlight-color:transparent}.mcs-back{width:44px;height:44px;border:1px solid var(--mb);border-radius:12px;background:var(--mp);font-size:24px}.mcs-portrait{width:46px;height:46px;border:1px solid var(--mb);border-radius:50%;object-fit:cover;background:#172019}.mcs-identity{min-width:0}.mcs-identity h1{margin:0;overflow:hidden;font-size:17px;line-height:1.18;text-overflow:ellipsis;white-space:nowrap}.mcs-identity p{margin:3px 0 0;overflow:hidden;color:var(--mm);font-size:12px;text-overflow:ellipsis;white-space:nowrap}.mcs-session{display:inline-flex;align-items:center;gap:6px;min-height:28px;padding:0 9px;border:1px solid rgba(156,255,173,.34);border-radius:999px;color:var(--ma);background:rgba(56,112,68,.18);font-size:10px;font-weight:800;letter-spacing:.08em}.mcs-session:before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor;box-shadow:0 0 10px currentColor}
.mcs-main{min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;padding:18px 16px 28px;scrollbar-width:none}.mcs-main::-webkit-scrollbar{display:none}.mcs-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:14px}.mcs-heading h2{margin:0;color:var(--ma);font-family:"VT323",monospace;font-size:30px;font-weight:400}.mcs-heading p{max-width:180px;margin:0;color:var(--mm);font-size:11px;line-height:1.35;text-align:right}
.mcs-section{margin-top:18px}.mcs-section-title{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 9px}.mcs-section-title h3{margin:0;color:var(--mt);font-size:12px;letter-spacing:.1em;text-transform:uppercase}.mcs-section-title span{color:var(--mm);font-size:10px}.mcs-panel,.mcs-stat,.mcs-placeholder,.mcs-resource,.mcs-action-card,.mcs-save{border:1px solid var(--mb);border-radius:15px;background:linear-gradient(rgba(23,32,25,.94),rgba(15,22,17,.94));box-shadow:0 16px 35px rgba(0,0,0,.16)}
.mcs-hp-panel{padding:15px}.mcs-hp-top{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px}.mcs-hp-value{display:flex;align-items:baseline;gap:6px}.mcs-hp-value strong{font-size:42px;line-height:1;font-variant-numeric:tabular-nums}.mcs-hp-value span{color:var(--mm);font-size:17px}.mcs-hp-label{display:block;margin-bottom:5px;color:var(--mm);font-size:10px;font-weight:800;letter-spacing:.12em}.mcs-hp-state{color:var(--ma);font-size:11px;font-weight:750;text-align:right}.mcs-hp-state[data-state=critical]{color:var(--md)}.mcs-hp-state[data-state=warning]{color:var(--mw)}
.mcs-quick-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:14px}.mcs-button,.mcs-reset{min-height:44px;border:1px solid var(--mb);border-radius:11px;background:var(--mp2);font-weight:800}.mcs-button:active,.mcs-stepper button:active,.mcs-reset:active{transform:translateY(1px);background:rgba(80,145,94,.25)}.mcs-temp-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;margin-top:13px;padding-top:12px;border-top:1px solid var(--mbs)}.mcs-temp-row label{display:grid;gap:3px;color:var(--mm);font-size:11px}.mcs-temp-row label strong{color:var(--mt);font-size:13px}.mcs-number-input{width:74px;min-height:44px;box-sizing:border-box;border:1px solid var(--mb);border-radius:10px;color:var(--mt);background:#0b110d;font:700 18px/1 system-ui;text-align:center;font-variant-numeric:tabular-nums}.mcs-number-input:focus{outline:2px solid var(--ma);outline-offset:1px}
.mcs-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.mcs-stat{min-height:82px;display:grid;place-items:center;align-content:center;gap:3px;padding:10px 6px;text-align:center}.mcs-stat span{color:var(--mm);font-size:9px;font-weight:800;letter-spacing:.08em}.mcs-stat strong{font-size:22px;font-variant-numeric:tabular-nums}.mcs-stat small{max-width:100%;overflow:hidden;color:var(--mm);font-size:9px;text-overflow:ellipsis;white-space:nowrap}
.mcs-resource-list{display:grid;gap:9px}.mcs-resource{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;padding:11px 11px 11px 13px}.mcs-resource-name{min-width:0}.mcs-resource-name strong{display:block;overflow:hidden;font-size:13px;text-overflow:ellipsis;white-space:nowrap}.mcs-resource-name span{display:block;margin-top:3px;color:var(--mm);font-size:10px}.mcs-stepper{display:grid;grid-template-columns:44px minmax(58px,auto) 44px;align-items:center;gap:5px}.mcs-stepper button{width:44px;height:44px;border:1px solid var(--mb);border-radius:10px;background:var(--mp2);font-size:21px;font-weight:700}.mcs-stepper output{min-width:52px;text-align:center;font-size:16px;font-weight:850;font-variant-numeric:tabular-nums}.mcs-empty{margin:0;padding:13px;border:1px dashed var(--mb);border-radius:12px;color:var(--mm);font-size:12px;line-height:1.45}
.mcs-slots{display:flex;gap:8px;overflow-x:auto;padding:1px 1px 5px;scrollbar-width:none;scroll-snap-type:x proximity}.mcs-slots::-webkit-scrollbar{display:none}.mcs-slot{min-width:120px;display:grid;gap:7px;padding:11px;border:1px solid var(--mb);border-radius:14px;background:var(--mp);scroll-snap-align:start}.mcs-slot header{display:flex;align-items:center;justify-content:space-between;gap:8px}.mcs-slot header strong{font-size:12px}.mcs-slot header span{color:var(--mm);font-size:9px}.mcs-slot .mcs-stepper{grid-template-columns:44px 1fr 44px}
.mcs-actions{display:grid;gap:8px}.mcs-action-card{padding:12px 13px}.mcs-action-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.mcs-action-head strong{font-size:13px;line-height:1.35}.mcs-badge{flex:none;padding:4px 7px;border:1px solid var(--mb);border-radius:999px;color:var(--ma);background:rgba(75,139,88,.13);font-size:8px;font-weight:850;letter-spacing:.06em}.mcs-action-meta{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}.mcs-action-meta span{padding:3px 6px;border-radius:6px;color:var(--mm);background:rgba(255,255,255,.035);font-size:9px}.mcs-action-card p{margin:8px 0 0;color:var(--mm);font-size:11px;line-height:1.42}
.mcs-saves{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.mcs-save{min-height:65px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:5px;padding:10px}.mcs-save span{color:var(--mm);font-size:10px;font-weight:750}.mcs-save strong{font-size:18px;font-variant-numeric:tabular-nums}.mcs-save i{grid-column:1/-1;color:var(--ma);font-style:normal;font-size:8px;font-weight:850;letter-spacing:.05em}.mcs-reset{width:100%;margin-top:20px;color:var(--md);background:rgba(95,39,39,.16)}
.mcs-placeholder{margin-top:12px;padding:18px}.mcs-placeholder strong{display:block;margin-bottom:6px;font-size:14px}.mcs-placeholder p{margin:0;color:var(--mm);font-size:13px;line-height:1.5}
.mcs-nav{min-height:72px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));padding:6px 6px calc(6px + env(safe-area-inset-bottom));border-top:1px solid var(--mb);background:rgba(8,13,9,.98);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);touch-action:manipulation}.mcs-nav button{min-width:0;min-height:58px;display:grid;place-items:center;align-content:center;gap:3px;border-radius:12px;color:var(--mm);background:transparent;font-size:10px;font-weight:750}.mcs-nav button i{min-height:20px;font-style:normal;font-size:18px;line-height:1}.mcs-nav button[aria-selected=true]{color:var(--ma);background:rgba(91,176,108,.14)}.mcs-nav button:focus-visible,.mcs-back:focus-visible,.mcs-button:focus-visible,.mcs-stepper button:focus-visible,.mcs-reset:focus-visible{outline:2px solid var(--ma);outline-offset:2px}
@media(max-width:390px){.mcs-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.mcs-quick-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:360px){.mcs-header{grid-template-columns:44px 42px minmax(0,1fr);gap:8px;padding-inline:8px}.mcs-session{display:none}.mcs-main{padding-inline:12px}.mcs-hp-value strong{font-size:36px}.mcs-nav button{font-size:9px}}
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
<header class="mcs-header"><button class="mcs-back" type="button" aria-label="Volver a la portada">‹</button><img class="mcs-portrait" alt=""><div class="mcs-identity"><h1 id="mcs-name">Personaje</h1><p>Cargando ficha...</p></div><span class="mcs-session">SESIÓN LOCAL</span></header>
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
  let sessionState = null;
  let activeTab = "combat";
  let lastFocus = null;

  const normalize = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  const number = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
  const integer = (value, fallback = 0) => {
    const parsed = number(value);
    return parsed === null ? fallback : Math.round(parsed);
  };
  const clamp = (value, min, max = Infinity) => Math.min(max, Math.max(min, integer(value, min)));
  const signed = (value) => number(value) === null ? "—" : (Number(value) >= 0 ? `+${Number(value)}` : String(Number(value)));
  const create = (tag, className, textContent) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (textContent !== undefined) element.textContent = textContent;
    return element;
  };
  const metaFromHotspot = (button) => {
    const label = normalize(button.querySelector("span")?.textContent || button.textContent);
    return index.find((entry) => normalize(entry.name) === label) || null;
  };
  const storageKey = (characterId) => `${STORAGE_PREFIX}${characterId}`;

  function freshSession(characterId) {
    return api.createSessionState(characterId, { sessionId: `mobile-local-${characterId}-${Date.now()}` });
  }

  function persistSession(state) {
    if (!state?.characterId) return;
    state.updatedAt = new Date().toISOString();
    sessionCache.set(state.characterId, state);
    try {
      localStorage.setItem(storageKey(state.characterId), JSON.stringify({
        expiresAt: Date.now() + SESSION_TTL_MS,
        state
      }));
    } catch (error) {
      console.warn("Unable to persist mobile session state", error);
    }
  }

  function loadSession(characterId) {
    if (sessionCache.has(characterId)) return sessionCache.get(characterId);
    try {
      const raw = localStorage.getItem(storageKey(characterId));
      if (raw) {
        const stored = JSON.parse(raw);
        const state = stored?.state;
        if (stored?.expiresAt > Date.now() && state?.schemaVersion === 1 && state?.characterId === characterId) {
          sessionCache.set(characterId, state);
          return state;
        }
        localStorage.removeItem(storageKey(characterId));
      }
    } catch (error) {
      console.warn("Unable to restore mobile session state", error);
    }
    const state = freshSession(characterId);
    persistSession(state);
    return state;
  }

  function rebuildModel() {
    if (!sessionState?.characterId) return false;
    model = api.build(sessionState.characterId, { sessionState, throwOnInvalid: false });
    return Boolean(model?.validation?.valid);
  }

  function commitSession(focusKey = null) {
    persistSession(sessionState);
    rebuildModel();
    render(activeTab, { preserveScroll: true, focusKey });
  }

  function hpState(current, maximum) {
    if (!Number.isFinite(current) || !Number.isFinite(maximum) || maximum <= 0) return ["Sin referencia", "unknown"];
    const ratio = current / maximum;
    if (current <= 0) return ["FUERA DE COMBATE", "critical"];
    if (ratio <= 0.25) return ["CRÍTICO", "critical"];
    if (ratio <= 0.5) return ["HERIDO", "warning"];
    return ["OPERATIVO", "healthy"];
  }

  function stat(label, value, detail = "") {
    const card = create("div", "mcs-stat");
    card.append(create("span", "", label), create("strong", "", String(value)));
    if (detail) card.append(create("small", "", detail));
    return card;
  }

  function section(title, hint = "") {
    const wrapper = create("section", "mcs-section");
    const heading = create("header", "mcs-section-title");
    heading.append(create("h3", "", title));
    if (hint) heading.append(create("span", "", hint));
    wrapper.append(heading);
    return wrapper;
  }

  function stepper({ id, current, maximum = null, domain, label }) {
    const group = create("div", "mcs-stepper");
    const minus = create("button", "", "−");
    const plus = create("button", "", "+");
    const output = create("output", "", maximum === null ? String(current ?? "—") : `${current ?? "—"}/${maximum}`);
    minus.type = plus.type = "button";
    minus.dataset.action = "step";
    minus.dataset.domain = domain;
    minus.dataset.id = id;
    minus.dataset.delta = "-1";
    plus.dataset.action = "step";
    plus.dataset.domain = domain;
    plus.dataset.id = id;
    plus.dataset.delta = "1";
    minus.dataset.focusKey = `${domain}:${id}:minus`;
    plus.dataset.focusKey = `${domain}:${id}:plus`;
    minus.setAttribute("aria-label", `Reducir ${label}`);
    plus.setAttribute("aria-label", `Aumentar ${label}`);
    output.setAttribute("aria-label", `${label}: ${output.textContent}`);
    group.append(minus, output, plus);
    return group;
  }

  function movementSummary(movement) {
    const units = movement?.units || "ft";
    const source = movement?.modes && typeof movement.modes === "object" ? movement.modes : movement || {};
    const entries = Object.entries(source)
      .filter(([key, value]) => key !== "units" && key !== "hover" && number(value) !== null && Number(value) > 0)
      .sort(([a], [b]) => (a === "walk" ? -1 : b === "walk" ? 1 : a.localeCompare(b)));
    if (!entries.length) return { value: "—", detail: "Movimiento" };
    const [primaryKey, primaryValue] = entries[0];
    const labels = { walk: "caminar", fly: "volar", swim: "nadar", climb: "trepar", burrow: "excavar" };
    return {
      value: `${primaryValue} ${units}`,
      detail: entries.map(([key, value]) => `${labels[key] || key} ${value}`).join(" · ")
    };
  }

  function recoveryLabel(resource) {
    if (resource.shortRest && resource.longRest) return "Descanso corto/largo";
    if (resource.shortRest) return "Descanso corto";
    if (resource.longRest) return "Descanso largo";
    return resource.sourceType === "FEATURE_USES" ? "Uso de rasgo" : "Recurso";
  }

  function isCombatResource(resource) {
    const key = normalize(resource?.name);
    if (moneyNames.has(key)) return false;
    return resource?.canonicalCurrent !== null || resource?.canonicalMax !== null || resource?.sessionCurrent !== null;
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

  function actionCategoryLabel(category) {
    return ({
      ACTION: "ACCIÓN",
      BONUS_ACTION: "ADICIONAL",
      REACTION: "REACCIÓN",
      PASSIVE_OR_SPECIAL: "ESPECIAL"
    })[category] || "ACCIÓN";
  }

  function actionMeta(action) {
    const activity = action.activities?.[0] || {};
    const parts = [];
    const attack = formulaFrom(activity.attack);
    const damage = formulaFrom(activity.damage);
    const saveDc = number(activity.save?.dc ?? activity.save?.value);
    if (attack) parts.push(`Ataque ${attack.startsWith("+") || attack.startsWith("-") ? attack : `+${attack}`}`);
    if (saveDc !== null) parts.push(`CD ${saveDc}`);
    if (damage) parts.push(`Daño ${damage}`);
    if (action.uses?.sessionCurrent !== null && action.uses?.sessionCurrent !== undefined) {
      const max = action.uses.canonicalMax;
      parts.push(`Usos ${action.uses.sessionCurrent}${max !== null && max !== undefined ? `/${max}` : ""}`);
    }
    return parts.slice(0, 3);
  }

  function renderHpPanel() {
    const hp = model.combat.hp;
    const current = integer(hp.sessionCurrent, 0);
    const maximum = integer(hp.canonicalMaximum, 0);
    const temporary = integer(hp.sessionTemporary, 0);
    const [status, state] = hpState(current, maximum);
    const panel = create("section", "mcs-panel mcs-hp-panel");
    const top = create("div", "mcs-hp-top");
    const valueWrap = create("div");
    valueWrap.append(create("span", "mcs-hp-label", "PUNTOS DE GOLPE"));
    const value = create("div", "mcs-hp-value");
    value.append(create("strong", "", String(current)), create("span", "", `/ ${maximum}`));
    valueWrap.append(value);
    const stateLabel = create("div", "mcs-hp-state", status);
    stateLabel.dataset.state = state;
    top.append(valueWrap, stateLabel);
    panel.append(top);

    const controls = create("div", "mcs-quick-controls");
    [-5, -1, 1, 5].forEach((delta) => {
      const control = create("button", "mcs-button", delta > 0 ? `+${delta}` : String(delta));
      control.type = "button";
      control.dataset.action = "hp-delta";
      control.dataset.delta = String(delta);
      control.dataset.focusKey = `hp:${delta}`;
      control.setAttribute("aria-label", `${delta > 0 ? "Recuperar" : "Quitar"} ${Math.abs(delta)} puntos de golpe`);
      controls.append(control);
    });
    panel.append(controls);

    const tempRow = create("div", "mcs-temp-row");
    const tempLabel = create("label");
    tempLabel.htmlFor = "mcs-temp-hp";
    tempLabel.append(create("strong", "", "PG temporales"), create("span", "", "Absorben daño antes que los PG actuales"));
    const tempInput = create("input", "mcs-number-input");
    tempInput.id = "mcs-temp-hp";
    tempInput.type = "number";
    tempInput.inputMode = "numeric";
    tempInput.min = "0";
    tempInput.value = String(temporary);
    tempInput.dataset.action = "temp-hp";
    tempInput.dataset.focusKey = "temp-hp";
    tempInput.setAttribute("aria-label", "Puntos de golpe temporales");
    tempRow.append(tempLabel, tempInput);
    panel.append(tempRow);
    return panel;
  }

  function renderQuickStats() {
    const movement = movementSummary(model.combat.movement);
    const grid = create("div", "mcs-stats");
    grid.append(
      stat("CA", model.combat.armorClass.value ?? "—", model.combat.armorClass.shieldSources?.length ? "con escudo" : "armadura"),
      stat("INICIATIVA", signed(model.combat.initiative), "orden de turno"),
      stat("MOVIMIENTO", movement.value, movement.detail),
      stat("COMPETENCIA", signed(model.combat.proficiency), "bonificador")
    );
    return grid;
  }

  function renderResources() {
    const wrapper = section("Recursos", "editables durante la sesión");
    const list = create("div", "mcs-resource-list");
    const resources = model.combat.resources.filter(isCombatResource);
    if (!resources.length) {
      list.append(create("p", "mcs-empty", "Este personaje no tiene recursos de combate registrados."));
    } else {
      resources.forEach((resource) => {
        const card = create("article", "mcs-resource");
        const identity = create("div", "mcs-resource-name");
        identity.append(create("strong", "", resource.name), create("span", "", recoveryLabel(resource)));
        const maximum = number(resource.canonicalMax);
        card.append(identity, stepper({
          id: resource.id,
          current: resource.sessionCurrent ?? "—",
          maximum,
          domain: "resource",
          label: resource.name
        }));
        list.append(card);
      });
    }
    wrapper.append(list);
    return wrapper;
  }

  function renderSpellSlots() {
    const casting = model.combat.spellcasting;
    const slots = [...(casting.slots || []), ...(casting.pact ? [{ ...casting.pact, pact: true }] : [])]
      .filter((slot) => number(slot.max) !== null && Number(slot.max) > 0);
    if (!slots.length) return null;
    const wrapper = section("Espacios de conjuro", casting.dc ? `CD ${casting.dc} · ataque ${signed(casting.attack)}` : "editables durante la sesión");
    const rail = create("div", "mcs-slots");
    slots.forEach((slot) => {
      const card = create("article", "mcs-slot");
      const heading = create("header");
      heading.append(
        create("strong", "", slot.pact ? `Pacto · nivel ${slot.level}` : `Nivel ${slot.level}`),
        create("span", "", slot.pact ? "PACTO" : "ESPACIOS")
      );
      card.append(heading, stepper({
        id: slot.key,
        current: slot.sessionCurrent ?? 0,
        maximum: number(slot.max),
        domain: "slot",
        label: slot.pact ? `espacios de pacto nivel ${slot.level}` : `espacios nivel ${slot.level}`
      }));
      rail.append(card);
    });
    wrapper.append(rail);
    return wrapper;
  }

  function renderActions() {
    const wrapper = section("Acciones frecuentes", "referencia rápida");
    const list = create("div", "mcs-actions");
    const priority = { ACTION: 0, BONUS_ACTION: 1, REACTION: 2, PASSIVE_OR_SPECIAL: 3 };
    const actions = model.actions
      .filter((action) => action.actionCategory !== "PASSIVE_OR_SPECIAL")
      .sort((a, b) => (priority[a.actionCategory] ?? 9) - (priority[b.actionCategory] ?? 9))
      .slice(0, 10);
    if (!actions.length) {
      list.append(create("p", "mcs-empty", "No hay acciones activas normalizadas para este personaje."));
    } else {
      actions.forEach((action) => {
        const card = create("article", "mcs-action-card");
        const head = create("div", "mcs-action-head");
        head.append(create("strong", "", action.name), create("span", "mcs-badge", actionCategoryLabel(action.actionCategory)));
        card.append(head);
        const metadata = actionMeta(action);
        if (metadata.length) {
          const meta = create("div", "mcs-action-meta");
          metadata.forEach((entry) => meta.append(create("span", "", entry)));
          card.append(meta);
        }
        const description = String(action.description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (description) card.append(create("p", "", description.length > 180 ? `${description.slice(0, 177)}…` : description));
        list.append(card);
      });
    }
    wrapper.append(list);
    return wrapper;
  }

  function renderSavingThrows() {
    const wrapper = section("Salvaciones", "bonificador total");
    const grid = create("div", "mcs-saves");
    model.combat.savingThrows.forEach((save) => {
      const card = create("article", "mcs-save");
      card.append(create("span", "", save.label || save.ability?.toUpperCase() || "—"), create("strong", "", signed(save.value)));
      if (save.proficient) card.append(create("i", "", "COMPETENTE"));
      grid.append(card);
    });
    wrapper.append(grid);
    return wrapper;
  }

  function renderCombat() {
    view.append(renderHpPanel());
    const quick = section("Defensa y turno");
    quick.append(renderQuickStats());
    view.append(quick, renderResources());
    const slots = renderSpellSlots();
    if (slots) view.append(slots);
    view.append(renderActions(), renderSavingThrows());
    const reset = create("button", "mcs-reset", "Reiniciar estado de sesión");
    reset.type = "button";
    reset.dataset.action = "reset-session";
    reset.dataset.focusKey = "reset-session";
    view.append(reset);
  }

  function renderPlaceholder(title) {
    const placeholder = create("div", "mcs-placeholder");
    placeholder.append(
      create("strong", "", `${title} preparado para su renderer`),
      create("p", "", "La sección ya forma parte de la navegación estable. Sus tarjetas, filtros y controles se incorporan sin reutilizar el DOM desktop.")
    );
    view.append(placeholder);
  }

  function render(tabId, options = {}) {
    if (!model) return;
    const previousScroll = options.preserveScroll ? main.scrollTop : 0;
    activeTab = tabs.some(([id]) => id === tabId) ? tabId : "combat";
    nav.querySelectorAll("button").forEach((button) => {
      const selected = button.dataset.tab === activeTab;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });

    const [title, subtitle] = copy[activeTab];
    view.replaceChildren();
    const heading = create("header", "mcs-heading");
    heading.append(create("h2", "", title), create("p", "", subtitle));
    view.append(heading);
    if (activeTab === "combat") renderCombat();
    else renderPlaceholder(title);
    main.scrollTop = previousScroll;

    if (options.focusKey) {
      requestAnimationFrame(() => {
        view.querySelector(`[data-focus-key="${options.focusKey}"]`)?.focus({ preventScroll: true });
      });
    }
  }

  function buildNav() {
    nav.replaceChildren(...tabs.map(([id, label, icon]) => {
      const button = create("button");
      button.type = "button";
      button.dataset.tab = id;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(id === activeTab));
      button.tabIndex = id === activeTab ? 0 : -1;
      const symbol = create("i", "", icon);
      symbol.setAttribute("aria-hidden", "true");
      button.append(symbol, create("span", "", label));
      button.addEventListener("click", () => render(id));
      return button;
    }));
  }

  function applyStep(domain, id, delta) {
    if (!sessionState) return;
    if (domain === "resource") {
      const resource = model.combat.resources.find((entry) => entry.id === id);
      if (!resource) return;
      const maximum = number(resource.canonicalMax);
      const current = integer(resource.sessionCurrent, 0);
      sessionState.resources[id] ||= { current, spent: resource.sessionSpent ?? null };
      sessionState.resources[id].current = clamp(current + delta, 0, maximum ?? Infinity);
      if (maximum !== null) sessionState.resources[id].spent = maximum - sessionState.resources[id].current;
    } else if (domain === "slot") {
      const slots = [...model.combat.spellcasting.slots, ...(model.combat.spellcasting.pact ? [model.combat.spellcasting.pact] : [])];
      const slot = slots.find((entry) => entry.key === id);
      if (!slot) return;
      const maximum = number(slot.max) ?? 0;
      const current = integer(slot.sessionCurrent, 0);
      sessionState.spellSlots[id] ||= { current };
      sessionState.spellSlots[id].current = clamp(current + delta, 0, maximum);
    }
  }

  function handleCombatClick(event) {
    const control = event.target.closest("[data-action]");
    if (!control || !model || activeTab !== "combat") return;
    const action = control.dataset.action;
    const focusKey = control.dataset.focusKey || null;
    if (action === "hp-delta") {
      const maximum = integer(model.combat.hp.canonicalMaximum, 0);
      sessionState.hp.current = clamp(integer(model.combat.hp.sessionCurrent, 0) + integer(control.dataset.delta, 0), 0, maximum);
      commitSession(focusKey);
    } else if (action === "step") {
      applyStep(control.dataset.domain, control.dataset.id, integer(control.dataset.delta, 0));
      commitSession(focusKey);
    } else if (action === "reset-session") {
      if (!window.confirm("¿Reiniciar PG, recursos y espacios de esta sesión? Los datos permanentes del personaje no se modifican.")) return;
      sessionState = freshSession(model.id);
      persistSession(sessionState);
      rebuildModel();
      render("combat", { preserveScroll: false, focusKey });
    }
  }

  function handleCombatChange(event) {
    const control = event.target.closest("[data-action]");
    if (!control || !model || activeTab !== "combat") return;
    if (control.dataset.action === "temp-hp") {
      sessionState.hp.temporary = clamp(control.value, 0);
      commitSession(control.dataset.focusKey || null);
    }
  }

  function open(meta, trigger = null) {
    if (!media.matches || !meta) return false;
    try {
      sessionState = loadSession(meta.id);
      rebuildModel();
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
    root.dispatchEvent(new CustomEvent("banda:mobile-character-open", {
      detail: { characterId: model.id, sessionId: sessionState.sessionId }
    }));
    return true;
  }

  function close({ restoreFocus = true } = {}) {
    if (root.hidden) return;
    const characterId = model?.id || null;
    const sessionId = sessionState?.sessionId || null;
    if (sessionState) persistSession(sessionState);
    root.hidden = true;
    document.body.classList.remove("mcs-open");
    model = null;
    sessionState = null;
    if (restoreFocus && lastFocus instanceof HTMLElement) lastFocus.focus({ preventScroll: true });
    lastFocus = null;
    root.dispatchEvent(new CustomEvent("banda:mobile-character-close", {
      detail: { characterId, sessionId }
    }));
  }

  function trapFocus(event) {
    if (event.key !== "Tab" || root.hidden) return;
    const focusable = [...root.querySelectorAll("button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")]
      .filter((element) => !element.hidden && element.getClientRects().length);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  back.addEventListener("click", () => close());
  root.addEventListener("keydown", trapFocus);
  view.addEventListener("click", handleCombatClick);
  view.addEventListener("change", handleCombatChange);
  nav.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    const currentIndex = tabs.findIndex(([id]) => id === activeTab);
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = tabs[(currentIndex + delta + tabs.length) % tabs.length][0];
    event.preventDefault();
    render(next);
    nav.querySelector(`[data-tab="${next}"]`)?.focus();
  });
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
    version: 2,
    open: (characterId) => open(index.find((entry) => entry.id === characterId)),
    close,
    selectTab: render,
    isOpen: () => !root.hidden,
    activeCharacterId: () => model?.id || null,
    getSessionState: () => sessionState ? JSON.parse(JSON.stringify(sessionState)) : null,
    resetSession: () => {
      if (!model) return false;
      sessionState = freshSession(model.id);
      persistSession(sessionState);
      rebuildModel();
      render(activeTab);
      return true;
    }
  });
})();