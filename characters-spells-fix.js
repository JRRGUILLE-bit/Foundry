(() => {
  "use strict";

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  const lines = (value) => escapeHtml(value || "").replace(/\n/g, "<br>");
  const asArray = (value) => Array.isArray(value) ? value : [];
  const sign = (value) => Number(value || 0) >= 0 ? `+${Number(value || 0)}` : `${Number(value || 0)}`;

  function badge(text, className = "") {
    return text ? `<span class="cv-badge ${className}">${escapeHtml(text)}</span>` : "";
  }

  function componentText(components) {
    if (Array.isArray(components)) return components.join("");
    if (typeof components === "string") return components;
    if (components && typeof components === "object") {
      return Object.entries(components)
        .filter(([, enabled]) => Boolean(enabled))
        .map(([key]) => key.charAt(0).toUpperCase())
        .join("");
    }
    return "";
  }

  function normalizeActivity(activity, index) {
    const value = activity && typeof activity === "object" ? activity : {};
    return {
      ...value,
      name: value.name || value.label || `ACTIVIDAD ${index + 1}`,
      type: value.type || "utility",
      activation: value.activation && typeof value.activation === "object" ? value.activation : {},
      range: value.range && typeof value.range === "object" ? value.range : {},
      target: value.target && typeof value.target === "object" ? value.target : {},
      duration: value.duration && typeof value.duration === "object" ? value.duration : {}
    };
  }

  function normalizeSpell(spell) {
    const value = spell && typeof spell === "object" ? spell : {};
    return {
      ...value,
      name: value.name || "HECHIZO SIN NOMBRE",
      level: Number(value.level || 0),
      schoolLabel: value.schoolLabel || value.school || "—",
      description: value.description || "",
      activation: value.activation && typeof value.activation === "object" ? value.activation : {},
      range: value.range && typeof value.range === "object" ? value.range : {},
      duration: value.duration && typeof value.duration === "object" ? value.duration : {},
      activities: asArray(value.activities).map(normalizeActivity),
      materials: typeof value.materials === "string" ? value.materials : value.materials?.value || ""
    };
  }

  function activityMeta(activity) {
    const values = [
      activity.activation?.label && `ACTIVACIÓN: ${activity.activation.label}`,
      activity.range?.label && activity.range.label !== "—" && `ALCANCE: ${activity.range.label}`,
      activity.target?.label && activity.target.label !== "—" && `OBJETIVO: ${activity.target.label}`,
      activity.duration?.label && activity.duration.label !== "—" && `DURACIÓN: ${activity.duration.label}`,
      activity.attack && `ATAQUE: ${sign(activity.attack.bonus)}`,
      activity.save && `SALVACIÓN: CD ${activity.save.dc}`,
      activity.damage?.parts?.length && `DAÑO: ${activity.damage.parts.join(" + ")}`,
      activity.healing?.parts?.length && `CURACIÓN: ${activity.healing.parts.join(" + ")}`,
      activity.roll && `TIRADA: ${activity.roll}`
    ];
    return values.filter(Boolean);
  }

  function renderActivity(activity) {
    return `<div class="cv-activity">
      <div class="cv-activity-title"><strong>${escapeHtml(activity.name)}</strong>${badge(String(activity.type).toUpperCase())}</div>
      <div class="cv-inline-data">${activityMeta(activity).map((entry) => badge(entry)).join("")}</div>
      ${activity.activation?.condition ? `<p class="cv-condition">${escapeHtml(activity.activation.condition)}</p>` : ""}
      ${activity.chatFlavor ? `<p>${lines(activity.chatFlavor)}</p>` : ""}
    </div>`;
  }

  function spellSummary(spell) {
    return [
      spell.activation?.label,
      spell.range?.label,
      spell.duration?.label,
      componentText(spell.components),
      spell.concentration ? "CONCENTRACIÓN" : "",
      spell.ritual ? "RITUAL" : ""
    ].filter(Boolean).join(" · ");
  }

  function renderSpells(character) {
    const spellcasting = character.spellcasting && typeof character.spellcasting === "object" ? character.spellcasting : {};
    const spells = asArray(character.spells)
      .map(normalizeSpell)
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, "es"));
    const levels = [...new Set(spells.map((spell) => spell.level))].sort((a, b) => a - b);
    const slots = asArray(spellcasting.slots);
    const pact = spellcasting.pact;

    return `<header class="cv-section-header">
      <h3>HECHIZOS</h3>
      <span>${spellcasting.ability ? `${String(spellcasting.abilityLabel || spellcasting.ability).toUpperCase()} // ATK ${sign(spellcasting.attack)} // CD ${spellcasting.dc ?? "—"}` : "HECHIZOS DEL JSON DE FOUNDRY"}</span>
    </header>
    ${slots.length || pact ? `<div class="cv-slot-strip">
      ${slots.map((slot) => `<span>N${slot.level} <strong>${slot.current}/${slot.max}</strong></span>`).join("")}
      ${pact ? `<span class="pact">PACTO N${pact.level} <strong>${pact.current}/${pact.max}</strong></span>` : ""}
    </div>` : ""}
    <div class="cv-toolbar">
      <label>BUSCAR<input type="search" data-spell-fix-search placeholder="HECHIZO, ESCUELA O EFECTO"></label>
      <div class="cv-filter-buttons cv-level-filters">
        <button type="button" data-spell-fix-level="all" class="active">TODOS</button>
        ${levels.map((level) => `<button type="button" data-spell-fix-level="${level}">${level === 0 ? "TRUCOS" : `N${level}`}</button>`).join("")}
      </div>
    </div>
    <div class="cv-card-list" data-spell-fix-list>
      ${spells.map((spell) => `<details class="cv-card cv-spell" data-level="${spell.level}" data-search="${escapeHtml(`${spell.name} ${spell.schoolLabel} ${spell.description}`.toLowerCase())}">
        <summary>
          <span>${escapeHtml(spell.name)}</span>
          <small>${spell.level === 0 ? "TRUCO" : `NIVEL ${spell.level}`} · ${escapeHtml(spell.schoolLabel)}</small>
          <em>${escapeHtml(spellSummary(spell))}</em>
        </summary>
        <div class="cv-card-body">
          <div class="cv-inline-data">
            ${badge(`ACTIVACIÓN: ${spell.activation?.label || "—"}`)}
            ${badge(`ALCANCE: ${spell.range?.label || "—"}`)}
            ${badge(`DURACIÓN: ${spell.duration?.label || "—"}`)}
            ${spell.prepared ? badge("PREPARADO", "ok") : ""}
            ${spell.concentration ? badge("CONCENTRACIÓN", "warn") : ""}
            ${spell.ritual ? badge("RITUAL") : ""}
            ${spell.method === "pact" ? badge("MAGIA DE PACTO", "pact") : ""}
          </div>
          ${spell.activities.map(renderActivity).join("")}
          ${spell.materials ? `<h5>MATERIALES</h5><p>${escapeHtml(spell.materials)}</p>` : ""}
          ${spell.description ? `<h5>DESCRIPCIÓN</h5><p>${lines(spell.description)}</p>` : ""}
        </div>
      </details>`).join("") || `<p class="cv-empty">EL JSON NO CONTIENE HECHIZOS PROCESADOS.</p>`}
    </div>`;
  }

  function bindFilters(content) {
    const input = content.querySelector("[data-spell-fix-search]");
    const cards = [...content.querySelectorAll("[data-spell-fix-list] > [data-search]")];
    let level = "all";
    const apply = () => {
      const query = (input?.value || "").trim().toLowerCase();
      cards.forEach((card) => {
        const textMatch = !query || (card.dataset.search || "").includes(query);
        const levelMatch = level === "all" || card.dataset.level === level;
        card.hidden = !(textMatch && levelMatch);
      });
    };
    input?.addEventListener("input", apply);
    content.querySelectorAll("[data-spell-fix-level]").forEach((button) => button.addEventListener("click", () => {
      level = button.dataset.spellFixLevel || "all";
      button.parentElement.querySelectorAll("button").forEach((candidate) => candidate.classList.toggle("active", candidate === button));
      apply();
    }));
  }

  async function repairCurrentSpellTab() {
    const modal = document.querySelector(".cv-modal:not([hidden])");
    const content = modal?.querySelector(".cv-content");
    const marker = modal?.querySelector(".cv-ident small")?.textContent || "";
    const match = marker.match(/>\s*([A-Z0-9_-]+)\.JSON/i);
    if (!content || !match) return;

    const id = match[1].toLowerCase();
    content.innerHTML = `<div class="cv-loading">CARGANDO HECHIZOS...</div>`;
    try {
      const response = await fetch(`character-data:${id}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const character = await response.json();
      content.innerHTML = renderSpells(character);
      bindFilters(content);
      content.scrollTop = 0;
    } catch (error) {
      console.error("[SPELL FIX]", error);
      content.innerHTML = `<div class="cv-loading cv-error">NO SE PUDIERON CARGAR LOS HECHIZOS<br><small>${escapeHtml(error.message)}</small></div>`;
    }
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest?.('[data-tab="spells"]');
    if (!button) return;
    setTimeout(repairCurrentSpellTab, 0);
  }, true);
})();