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
  const STORAGE_PREFIX = "banda.mobile.more.v1.";
  const overlays = new Map();
  let busy = false;
  let queued = false;

  const css = document.createElement("style");
  css.id = "banda-mobile-more-styles";
  css.textContent = `@media(max-width:820px){
.a14-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.a14-ability{min-height:104px;display:grid;place-items:center;align-content:center;gap:3px;padding:10px 6px;border:1px solid var(--mb);border-radius:15px;background:linear-gradient(rgba(23,32,25,.94),rgba(15,22,17,.94));text-align:center}.a14-ability span{color:var(--mm);font-size:9px;font-weight:850;letter-spacing:.08em}.a14-ability strong{font-size:25px;line-height:1}.a14-ability small{color:var(--mm);font-size:9px}.a14-skills{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.a14-skill{min-height:58px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;padding:10px 11px;border:1px solid var(--mb);border-radius:12px;background:var(--mp)}.a14-skill span{min-width:0;overflow:hidden;font-size:11px;font-weight:750;text-overflow:ellipsis;white-space:nowrap}.a14-skill strong{font-size:17px}.a14-skill small{grid-column:1/-1;color:var(--mm);font-size:8px}.a14-list{display:grid;gap:8px}.a14-info{padding:12px 13px;border:1px solid var(--mb);border-radius:13px;background:linear-gradient(rgba(23,32,25,.94),rgba(15,22,17,.94))}.a14-info h4{margin:0 0 7px;color:var(--mt);font-size:11px;letter-spacing:.06em;text-transform:uppercase}.a14-info p{margin:0;color:var(--mm);font-size:11px;line-height:1.48;white-space:pre-line;overflow-wrap:anywhere}.a14-tags{display:flex;flex-wrap:wrap;gap:6px}.a14-tag{padding:5px 8px;border:1px solid var(--mbs);border-radius:999px;color:var(--mm);background:rgba(255,255,255,.025);font-size:9px;font-weight:750}.a14-session{display:grid;gap:10px}.a14-toggle,.a14-step button,.a14-condition-add,.a14-condition-remove{min-width:44px;min-height:44px;border:1px solid var(--mb);border-radius:11px;color:var(--mt);background:var(--mp2);font:800 13px system-ui}.a14-toggle{width:100%;display:flex;align-items:center;justify-content:space-between;padding:0 13px}.a14-toggle[aria-pressed=true]{color:var(--ma);background:rgba(91,176,108,.16)}.a14-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;padding:11px 12px;border:1px solid var(--mb);border-radius:13px;background:var(--mp)}.a14-row-label strong{display:block;font-size:12px}.a14-row-label span{display:block;margin-top:3px;color:var(--mm);font-size:9px}.a14-step{display:grid;grid-template-columns:44px minmax(42px,auto) 44px;align-items:center;gap:5px}.a14-step button{font-size:20px}.a14-step output{min-width:40px;text-align:center;font-size:16px;font-weight:850;font-variant-numeric:tabular-nums}.a14-death{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.a14-death .a14-row{grid-template-columns:1fr;align-items:start}.a14-death .a14-step{width:100%;grid-template-columns:44px 1fr 44px}.a14-condition-form{display:grid;grid-template-columns:minmax(0,1fr) 48px;gap:8px}.a14-input,.a14-notes{width:100%;box-sizing:border-box;border:1px solid var(--mb);border-radius:12px;color:var(--mt);background:#0b110d;font:600 14px system-ui}.a14-input{min-height:46px;padding:0 12px}.a14-notes{min-height:132px;padding:12px;line-height:1.45;resize:vertical}.a14-input:focus,.a14-notes:focus,.a14-toggle:focus-visible,.a14-step button:focus-visible,.a14-condition-add:focus-visible,.a14-condition-remove:focus-visible{outline:2px solid var(--ma);outline-offset:2px}.a14-conditions{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}.a14-condition{display:inline-grid;grid-template-columns:auto 44px;align-items:center;min-height:44px;padding-left:10px;border:1px solid var(--mb);border-radius:999px;color:var(--mw);background:rgba(116,83,28,.12);font-size:10px;font-weight:800}.a14-condition-remove{border:0;border-left:1px solid var(--mbs);border-radius:0 999px 999px 0;background:transparent;font-size:18px}.a14-notes-list details{border:1px solid var(--mb);border-radius:13px;background:var(--mp);overflow:hidden}.a14-notes-list summary{min-height:48px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 12px;cursor:pointer;list-style:none;font-size:11px;font-weight:800}.a14-notes-list summary::-webkit-details-marker{display:none}.a14-notes-list details p{margin:0;padding:12px;border-top:1px solid var(--mbs);color:var(--mm);font-size:11px;line-height:1.5;white-space:pre-line}.a14-source{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.a14-source div{padding:10px;border:1px solid var(--mbs);border-radius:10px;background:rgba(0,0,0,.13)}.a14-source span{display:block;color:var(--mm);font-size:8px;font-weight:800;text-transform:uppercase}.a14-source strong{display:block;margin-top:3px;font-size:10px;overflow-wrap:anywhere}@media(max-width:390px){.a14-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.a14-skills{grid-template-columns:1fr}.a14-death{grid-template-columns:1fr}}
}`;
  document.head.append(css);

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
  const num = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
  const int = (value, fallback = 0) => num(value) === null ? fallback : Math.round(Number(value));
  const signed = (value) => num(value) === null ? "—" : Number(value) >= 0 ? `+${Number(value)}` : String(Number(value));
  const plain = (value) => {
    const template = document.createElement("template");
    template.innerHTML = String(value || "").replace(/<br\s*\/?>|<\/p>|<\/li>/gi, "\n");
    return (template.content.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
  };
  const selected = () => !root.hidden && nav.querySelector('[data-tab="more"]')?.getAttribute("aria-selected") === "true";
  const sessionKey = (characterId, sessionId) => `${characterId}.${sessionId}`;
  const storageKey = (characterId, sessionId) => `${STORAGE_PREFIX}${sessionKey(characterId, sessionId)}`;
  const sectionHead = (title, hint = "") => `<header class="mcs-section-title"><h3>${esc(title)}</h3>${hint ? `<span>${esc(hint)}</span>` : ""}</header>`;

  function normalizeOverlay(base) {
    return {
      inspiration: Boolean(base?.inspiration),
      exhaustion: Math.max(0, int(base?.exhaustion, 0)),
      conditions: Array.isArray(base?.conditions) ? [...new Set(base.conditions.map((entry) => String(entry || "").trim()).filter(Boolean))] : [],
      deathSaves: {
        successes: Math.min(3, Math.max(0, int(base?.deathSaves?.successes, 0))),
        failures: Math.min(3, Math.max(0, int(base?.deathSaves?.failures, 0)))
      },
      sessionNotes: String(base?.sessionNotes || "")
    };
  }

  function loadOverlay(characterId, sessionState) {
    const key = sessionKey(characterId, sessionState.sessionId);
    if (overlays.has(key)) return overlays.get(key);
    let overlay = null;
    try {
      const raw = localStorage.getItem(storageKey(characterId, sessionState.sessionId));
      if (raw) {
        const stored = JSON.parse(raw);
        if (stored?.expiresAt > Date.now() && stored?.sessionId === sessionState.sessionId) overlay = normalizeOverlay(stored.state);
        else localStorage.removeItem(storageKey(characterId, sessionState.sessionId));
      }
    } catch (error) {
      console.warn("Unable to restore mobile More state", error);
    }
    overlay ||= normalizeOverlay(sessionState);
    overlays.set(key, overlay);
    persistOverlay(characterId, sessionState.sessionId, overlay);
    return overlay;
  }

  function persistOverlay(characterId, sessionId, overlay) {
    overlays.set(sessionKey(characterId, sessionId), overlay);
    try {
      localStorage.setItem(storageKey(characterId, sessionId), JSON.stringify({
        expiresAt: Date.now() + SESSION_TTL_MS,
        sessionId,
        state: overlay
      }));
    } catch (error) {
      console.warn("Unable to persist mobile More state", error);
    }
  }

  function mergedSession(sessionState, overlay) {
    return {
      ...sessionState,
      inspiration: overlay.inspiration,
      exhaustion: overlay.exhaustion,
      conditions: [...overlay.conditions],
      deathSaves: { ...overlay.deathSaves },
      sessionNotes: overlay.sessionNotes
    };
  }

  function valueLabel(value) {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (Array.isArray(value)) return value.map(valueLabel).filter((entry) => entry !== "—").join(" · ") || "—";
    if (typeof value === "object") {
      if (value.label) return String(value.label);
      if (value.value !== undefined) return valueLabel(value.value);
      if (value.amount !== undefined) return valueLabel(value.amount);
      const parts = Object.entries(value)
        .filter(([, entry]) => entry !== null && entry !== undefined && entry !== "" && entry !== false)
        .map(([key, entry]) => `${key}: ${valueLabel(entry)}`);
      return parts.join(" · ") || "—";
    }
    return String(value);
  }

  function labels(items) {
    return (Array.isArray(items) ? items : [])
      .map((entry) => typeof entry === "string" ? entry : entry?.label || entry?.name || entry?.value || valueLabel(entry))
      .map((entry) => String(entry || "").trim())
      .filter(Boolean);
  }

  function abilityHtml(ability) {
    return `<article class="a14-ability"><span>${esc(ability.label || ability.key?.toUpperCase() || "—")}</span><strong>${esc(ability.score ?? "—")}</strong><small>Mod ${esc(signed(ability.modifier))} · Salv ${esc(signed(ability.save))}${ability.saveProficient ? " · COMP" : ""}</small></article>`;
  }

  function skillHtml(skill) {
    const label = skill?.label || skill?.name || skill?.key || "Habilidad";
    const total = [skill?.total, skill?.value, skill?.modifier, skill?.mod, skill?.check, skill?.bonus].find((entry) => num(entry) !== null);
    const proficient = Boolean(skill?.expertise || skill?.proficient || skill?.proficiency || skill?.prof);
    const expertise = Boolean(skill?.expertise || Number(skill?.proficiency) > 1 || Number(skill?.prof) > 1);
    const details = [skill?.abilityLabel || skill?.ability?.toUpperCase(), expertise ? "PERICIA" : proficient ? "COMPETENTE" : "", num(skill?.passive) !== null ? `Pasiva ${skill.passive}` : ""].filter(Boolean).join(" · ");
    return `<article class="a14-skill"><span>${esc(label)}</span><strong>${esc(signed(total))}</strong>${details ? `<small>${esc(details)}</small>` : ""}</article>`;
  }

  function infoBlock(title, values, empty = "No registrado") {
    const entries = labels(values);
    return `<article class="a14-info"><h4>${esc(title)}</h4>${entries.length ? `<div class="a14-tags">${entries.map((entry) => `<span class="a14-tag">${esc(entry)}</span>`).join("")}</div>` : `<p>${esc(empty)}</p>`}</article>`;
  }

  function senseEntries(senses) {
    if (!senses || typeof senses !== "object") return [];
    const units = senses.units || "ft";
    const ranges = senses.ranges && typeof senses.ranges === "object" ? senses.ranges : senses;
    const out = Object.entries(ranges)
      .filter(([key, value]) => !["units", "special", "ranges"].includes(key) && num(value) !== null && Number(value) > 0)
      .map(([key, value]) => `${key}: ${value} ${units}`);
    if (senses.special) out.push(String(senses.special));
    return out;
  }

  function currencyEntries(currency) {
    if (!currency || typeof currency !== "object") return [];
    const names = { pp: "PP", gp: "PO", ep: "PE", sp: "PPa", cp: "PC" };
    return Object.entries(currency)
      .filter(([, value]) => num(value) !== null && Number(value) !== 0)
      .map(([key, value]) => `${names[key] || key.toUpperCase()}: ${value}`);
  }

  function noteEntries(notes, prefix = "", depth = 0) {
    if (depth > 3 || notes === null || notes === undefined) return [];
    if (typeof notes === "string" || typeof notes === "number") {
      const text = plain(notes);
      return text ? [[prefix || "Notas", text]] : [];
    }
    if (Array.isArray(notes)) return notes.flatMap((entry, index) => noteEntries(entry, prefix || `Nota ${index + 1}`, depth + 1));
    if (typeof notes !== "object") return [];
    return Object.entries(notes).flatMap(([key, value]) => {
      const label = String(key).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").trim();
      return noteEntries(value, prefix ? `${prefix} · ${label}` : label, depth + 1);
    });
  }

  function stepperHtml(kind, current, max = null) {
    const display = max === null ? String(current) : `${current}/${max}`;
    return `<div class="a14-step"><button type="button" data-a14-step="${esc(kind)}" data-delta="-1" data-focus-key="${esc(kind)}:minus" aria-label="Reducir ${esc(kind)}">−</button><output>${esc(display)}</output><button type="button" data-a14-step="${esc(kind)}" data-delta="1" data-focus-key="${esc(kind)}:plus" aria-label="Aumentar ${esc(kind)}">+</button></div>`;
  }

  function render(options = {}) {
    if (!selected()) return false;
    const characterId = shell.activeCharacterId?.();
    const baseSession = shell.getSessionState?.();
    if (!characterId || !baseSession?.sessionId) return false;
    const overlay = loadOverlay(characterId, baseSession);
    const model = api.build(characterId, { sessionState: mergedSession(baseSession, overlay), throwOnInvalid: false });
    if (!model?.validation?.valid) return false;

    const previousScroll = options.keep ? main.scrollTop : 0;
    const notes = noteEntries(model.more.notes).slice(0, 20);
    const defenses = model.more.defenses || {};
    const proficiencies = model.more.proficiencies || {};
    const source = model.source || {};

    busy = true;
    view.innerHTML = `<section data-a14-root="${esc(characterId)}"><header class="mcs-heading"><h2>MÁS</h2><p>Atributos, habilidades, defensas y notas</p></header>
<section class="mcs-section">${sectionHead("Atributos", "puntuación, modificador y salvación")}<div class="a14-grid">${model.abilities.map(abilityHtml).join("")}</div></section>
<section class="mcs-section">${sectionHead("Habilidades", `${model.more.skills.length} registradas`)}${model.more.skills.length ? `<div class="a14-skills">${model.more.skills.map(skillHtml).join("")}</div>` : `<p class="mcs-empty">No hay habilidades normalizadas en el export.</p>`}</section>
<section class="mcs-section">${sectionHead("Sentidos y defensas")}<div class="a14-list">${infoBlock("Sentidos", senseEntries(model.more.senses))}${infoBlock("Resistencias", defenses.damageResistances)}${infoBlock("Inmunidades al daño", defenses.damageImmunities)}${infoBlock("Vulnerabilidades", defenses.damageVulnerabilities)}${infoBlock("Inmunidades a condiciones", defenses.conditionImmunities)}</div></section>
<section class="mcs-section">${sectionHead("Competencias e idiomas")}<div class="a14-list">${infoBlock("Armaduras", proficiencies.armor)}${infoBlock("Armas", proficiencies.weapons)}${infoBlock("Herramientas", proficiencies.tools)}${infoBlock("Idiomas", model.more.languages)}${infoBlock("Monedas", currencyEntries(model.more.currency), "Sin monedas registradas")}</div></section>
<section class="mcs-section">${sectionHead("Estado de sesión", "temporal · no modifica Foundry")}<div class="a14-session"><button class="a14-toggle" type="button" data-a14-inspiration data-focus-key="inspiration" aria-pressed="${String(overlay.inspiration)}"><span>Inspiración</span><strong>${overlay.inspiration ? "ACTIVA" : "INACTIVA"}</strong></button><div class="a14-row"><div class="a14-row-label"><strong>Agotamiento</strong><span>Nivel temporal de la sesión</span></div>${stepperHtml("exhaustion", overlay.exhaustion)}</div><div class="a14-death"><div class="a14-row"><div class="a14-row-label"><strong>Salvaciones exitosas</strong><span>Contra muerte</span></div>${stepperHtml("successes", overlay.deathSaves.successes, 3)}</div><div class="a14-row"><div class="a14-row-label"><strong>Salvaciones fallidas</strong><span>Contra muerte</span></div>${stepperHtml("failures", overlay.deathSaves.failures, 3)}</div></div><div><div class="a14-condition-form"><input class="a14-input" data-a14-condition-input type="text" maxlength="60" placeholder="Agregar condición" aria-label="Nueva condición"><button class="a14-condition-add" type="button" data-a14-condition-add aria-label="Agregar condición">+</button></div>${overlay.conditions.length ? `<div class="a14-conditions">${overlay.conditions.map((condition, index) => `<span class="a14-condition">${esc(condition)}<button class="a14-condition-remove" type="button" data-a14-condition-remove="${index}" aria-label="Quitar ${esc(condition)}">×</button></span>`).join("")}</div>` : `<p class="mcs-empty" style="margin-top:9px">Sin condiciones temporales.</p>`}</div><label><span class="mcs-hp-label">NOTAS DE SESIÓN</span><textarea class="a14-notes" data-a14-notes placeholder="Anotaciones temporales para esta sesión">${esc(overlay.sessionNotes)}</textarea></label></div></section>
<section class="mcs-section">${sectionHead("Notas del personaje", notes.length ? `${notes.length} bloques` : "sin notas")}${notes.length ? `<div class="a14-list a14-notes-list">${notes.map(([label, text]) => `<details><summary><span>${esc(label || "Notas")}</span><span>›</span></summary><p>${esc(text)}</p></details>`).join("")}</div>` : `<p class="mcs-empty">No hay notas o biografía legibles en el export.</p>`}</section>
<section class="mcs-section">${sectionHead("Fuente", source.auditStatus || "datos canónicos")}<div class="a14-source"><div><span>Foundry</span><strong>${esc(source.coreVersion || "—")}</strong></div><div><span>Sistema</span><strong>${esc(source.systemVersion || "—")}</strong></div><div><span>Bundle</span><strong>${esc(source.bundleVersion || "—")}</strong></div><div><span>Revisión</span><strong>${esc(source.reviewCount ?? 0)}</strong></div></div></section></section>`;
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
      if (!busy && selected() && !view.querySelector("[data-a14-root]")) render();
    });
  }

  function currentContext() {
    const characterId = shell.activeCharacterId?.();
    const baseSession = shell.getSessionState?.();
    if (!characterId || !baseSession?.sessionId) return null;
    return { characterId, baseSession, overlay: loadOverlay(characterId, baseSession) };
  }

  function saveAndRender(context, focus = null) {
    persistOverlay(context.characterId, context.baseSession.sessionId, context.overlay);
    render({ keep: true, focus });
  }

  function addCondition() {
    const input = view.querySelector("[data-a14-condition-input]");
    const value = String(input?.value || "").trim();
    if (!value) return;
    const context = currentContext();
    if (!context) return;
    if (!context.overlay.conditions.some((entry) => entry.toLocaleLowerCase() === value.toLocaleLowerCase())) context.overlay.conditions.push(value);
    saveAndRender(context);
    requestAnimationFrame(() => view.querySelector("[data-a14-condition-input]")?.focus());
  }

  view.addEventListener("click", (event) => {
    if (!selected()) return;
    const context = currentContext();
    if (!context) return;

    if (event.target.closest("[data-a14-inspiration]")) {
      context.overlay.inspiration = !context.overlay.inspiration;
      return saveAndRender(context, "inspiration");
    }

    const step = event.target.closest("[data-a14-step]");
    if (step) {
      const delta = int(step.dataset.delta, 0);
      const kind = step.dataset.a14Step;
      if (kind === "exhaustion") context.overlay.exhaustion = Math.max(0, context.overlay.exhaustion + delta);
      if (kind === "successes") context.overlay.deathSaves.successes = Math.min(3, Math.max(0, context.overlay.deathSaves.successes + delta));
      if (kind === "failures") context.overlay.deathSaves.failures = Math.min(3, Math.max(0, context.overlay.deathSaves.failures + delta));
      return saveAndRender(context, step.dataset.focusKey || null);
    }

    if (event.target.closest("[data-a14-condition-add]")) return addCondition();

    const remove = event.target.closest("[data-a14-condition-remove]");
    if (remove) {
      context.overlay.conditions.splice(int(remove.dataset.a14ConditionRemove, -1), 1);
      return saveAndRender(context);
    }
  });

  view.addEventListener("keydown", (event) => {
    if (selected() && event.key === "Enter" && event.target.matches("[data-a14-condition-input]")) {
      event.preventDefault();
      addCondition();
    }
  });

  view.addEventListener("input", (event) => {
    if (!selected() || !event.target.matches("[data-a14-notes]")) return;
    const context = currentContext();
    if (!context) return;
    context.overlay.sessionNotes = event.target.value;
    persistOverlay(context.characterId, context.baseSession.sessionId, context.overlay);
  });

  nav.addEventListener("click", (event) => { if (event.target.closest('[data-tab="more"]')) schedule(); });
  root.addEventListener("banda:mobile-character-open", schedule);
  const observer = new MutationObserver(() => { if (!busy && selected() && !view.querySelector("[data-a14-root]")) schedule(); });
  observer.observe(view, { childList: true });
  observer.observe(nav, { attributes: true, subtree: true, attributeFilter: ["aria-selected"] });

  window.BANDA_MOBILE_MORE = Object.freeze({
    version: 1,
    render: () => render({ keep: true }),
    isActive: selected
  });
})();
