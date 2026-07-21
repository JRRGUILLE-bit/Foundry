(() => {
  "use strict";

  const overlay = document.querySelector("#character-overlay");
  if (!overlay) return;

  const cache = new Map();
  let lastTrigger = null;
  let activeCharacter = null;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

  const lines = (value) => escapeHtml(value || "").replace(/\n/g, "<br>");
  const sign = (value) => Number(value) >= 0 ? `+${value}` : `${value}`;
  const compact = (array) => (array || []).filter(Boolean);
  const join = (array, fallback = "—") => compact(array).join(" · ") || fallback;

  const labels = {
    close: "CERRAR",
    loading: "CARGANDO ARCHIVO DE PERSONAJE...",
    error: "NO SE PUDO CARGAR EL ARCHIVO DEL PERSONAJE",
    overview: "COMBATE",
    abilities: "ATRIBUTOS",
    actions: "ACCIONES",
    spells: "HECHIZOS",
    inventory: "INVENTARIO",
    features: "RASGOS",
    notes: "NOTAS",
    search: "BUSCAR",
    all: "TODOS",
    equipped: "EQUIPADO",
    prepared: "PREPARADO",
    concentration: "CONCENTRACIÓN",
    ritual: "RITUAL",
    source: "DATOS EXTRAÍDOS DEL JSON DE FOUNDRY",
    empty: "SIN DATOS",
    hp: "PG",
    ac: "CA",
    init: "INICIATIVA",
    speed: "VELOCIDAD",
    prof: "COMPETENCIA",
    spellAttack: "ATAQUE DE HECHIZO",
    spellDc: "CD DE HECHIZO",
    passive: "PASIVA",
    saves: "SALVACIONES",
    skills: "HABILIDADES",
    resources: "RECURSOS",
    slots: "ESPACIOS DE CONJURO",
    pact: "MAGIA DE PACTO",
    hitDice: "DADOS DE GOLPE",
    senses: "SENTIDOS",
    defenses: "DEFENSAS",
    languages: "IDIOMAS",
    currency: "MONEDAS",
    details: "DETALLES",
    uses: "USOS",
    remaining: "RESTANTES",
    attack: "ATAQUE",
    damage: "DAÑO",
    save: "SALVACIÓN",
    range: "ALCANCE",
    duration: "DURACIÓN",
    target: "OBJETIVO",
    activation: "ACTIVACIÓN",
    components: "COMPONENTES",
    materials: "MATERIALES",
    school: "ESCUELA",
    level: "NIVEL",
    quantity: "CANTIDAD",
    weight: "PESO",
    rarity: "RAREZA",
    attuned: "SINTONIZADO",
    description: "DESCRIPCIÓN",
    action: "ACCIÓN",
    bonus: "ADICIONAL",
    reaction: "REACCIÓN"
  };

  const modal = document.createElement("div");
  modal.className = "cv-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="cv-backdrop" data-close></div>
    <section class="cv-window" role="dialog" aria-modal="true" aria-labelledby="cv-title" tabindex="-1">
      <header class="cv-window-bar">
        <span>C:\\BANDA\\CHARACTERS&gt; OPEN SHEET.EXE</span>
        <button type="button" data-close aria-label="${labels.close}">[X]</button>
      </header>
      <div class="cv-shell">
        <aside class="cv-sidebar"></aside>
        <section class="cv-content"></section>
      </div>
    </section>`;
  document.body.append(modal);

  const sidebar = modal.querySelector(".cv-sidebar");
  const content = modal.querySelector(".cv-content");
  const windowEl = modal.querySelector(".cv-window");

  modal.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", closeModal));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("cv-open");
    activeCharacter = null;
    lastTrigger?.focus();
  }

  function statCard(label, value, extra = "") {
    return `<div class="cv-stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>${extra ? `<small>${escapeHtml(extra)}</small>` : ""}</div>`;
  }

  function badge(text, className = "") {
    return text ? `<span class="cv-badge ${className}">${escapeHtml(text)}</span>` : "";
  }

  function detailRows(rows) {
    const filtered = rows.filter((row) => row[1] !== undefined && row[1] !== null && row[1] !== "" && row[1] !== "—");
    if (!filtered.length) return "";
    return `<dl class="cv-detail-list">${filtered.map(([key, value]) => `<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>`;
  }

  function usesLabel(uses) {
    if (!uses) return "";
    const current = uses.current ?? "?";
    const max = uses.max ?? uses.rawMax ?? "?";
    const recovery = (uses.recovery || []).map((entry) => entry.label).filter(Boolean).join(" / ");
    return `${current}/${max}${recovery ? ` · ${recovery}` : ""}`;
  }

  function renderSidebar(character, activeTab = "overview") {
    const classLine = character.classes.map((entry) => `${entry.name} ${entry.levels}`).join(" / ");
    const subclasses = character.subclasses?.join(" // ") || "";
    const tabs = [
      ["overview", labels.overview],
      ["abilities", labels.abilities],
      ["actions", labels.actions],
      ["spells", labels.spells],
      ["inventory", labels.inventory],
      ["features", labels.features],
      ["notes", labels.notes]
    ];

    sidebar.innerHTML = `
      <div class="cv-ident">
        <small>&gt; ${escapeHtml(character.id.toUpperCase())}.JSON</small>
        <h2 id="cv-title">${escapeHtml(character.name)}</h2>
        <p>${escapeHtml(character.race)} // NIVEL ${character.level}</p>
        <p>${escapeHtml(classLine)}</p>
        ${subclasses ? `<p class="cv-subclasses">${escapeHtml(subclasses)}</p>` : ""}
      </div>
      <nav class="cv-tabs" aria-label="Secciones de la ficha">
        ${tabs.map(([id, label]) => `<button type="button" data-tab="${id}" class="${id === activeTab ? "active" : ""}">${label}</button>`).join("")}
      </nav>
      <div class="cv-source">${labels.source}<br>DND5E ${escapeHtml(character.source.systemVersion || "")}</div>`;

    sidebar.querySelectorAll("[data-tab]").forEach((button) => {
      button.addEventListener("click", () => selectTab(button.dataset.tab));
    });
  }

  function selectTab(tab) {
    if (!activeCharacter) return;
    sidebar.querySelectorAll("[data-tab]").forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
    const renderers = {
      overview: renderOverview,
      abilities: renderAbilities,
      actions: renderActions,
      spells: renderSpells,
      inventory: renderInventory,
      features: renderFeatures,
      notes: renderNotes
    };
    content.innerHTML = renderers[tab](activeCharacter);
    bindInteractiveControls(tab);
    content.scrollTop = 0;
  }

  function renderOverview(character) {
    const movement = Object.entries(character.movement.modes || {}).map(([mode, value]) => `${mode.toUpperCase()} ${value} ${character.movement.units}`).join(" / ") || "—";
    const stats = [
      statCard(labels.hp, `${character.hp.value}/${character.hp.max}`, character.hp.temp ? `+${character.hp.temp} TEMP` : ""),
      statCard(labels.ac, character.ac.value, character.ac.formula),
      statCard(labels.init, sign(character.initiative)),
      statCard(labels.speed, movement),
      statCard(labels.prof, sign(character.proficiency)),
      character.spellcasting.ability ? statCard(labels.spellAttack, sign(character.spellcasting.attack), character.spellcasting.abilityLabel) : "",
      character.spellcasting.ability ? statCard(labels.spellDc, character.spellcasting.dc, character.spellcasting.abilityLabel) : ""
    ].join("");

    const resources = character.resources || [];
    const slots = character.spellcasting.slots || [];
    const pact = character.spellcasting.pact;
    const defenses = [
      ["RESISTENCIAS", join(character.traits.damageResistances)],
      ["INMUNIDADES AL DAÑO", join(character.traits.damageImmunities)],
      ["VULNERABILIDADES", join(character.traits.damageVulnerabilities)],
      ["INMUNIDADES DE ESTADO", join(character.traits.conditionImmunities)]
    ];
    const senses = Object.entries(character.senses.ranges || {}).map(([key, value]) => `${key.toUpperCase()} ${value} ${character.senses.units}`).join(" / ");
    const currency = Object.entries(character.currency || {}).filter(([, value]) => Number(value)).map(([key, value]) => `${key.toUpperCase()} ${value}`).join(" / ");

    return `
      <header class="cv-section-header"><h3>${labels.overview}</h3><span>LIVE REFERENCE // STATIC EXPORT</span></header>
      <div class="cv-stat-grid">${stats}</div>
      <div class="cv-two-column">
        <section class="cv-panel">
          <h4>${labels.resources}</h4>
          ${resources.length ? `<div class="cv-resource-list">${resources.map((resource) => {
            const current = resource.current ?? "—";
            const max = resource.max ?? "—";
            const rest = resource.shortRest ? "DESCANSO CORTO" : resource.longRest ? "DESCANSO LARGO" : (resource.recovery || []).map((entry) => entry.label).join(" / ");
            return `<div><span>${escapeHtml(resource.name)}</span><strong>${escapeHtml(`${current}/${max}`)}</strong><small>${escapeHtml(rest || "")}</small></div>`;
          }).join("")}</div>` : `<p class="cv-empty">${labels.empty}</p>`}
        </section>
        <section class="cv-panel">
          <h4>${labels.slots}</h4>
          ${slots.length || pact ? `<div class="cv-slot-list">${slots.map((slot) => `<div><span>N${slot.level}</span><strong>${slot.current}/${slot.max}</strong></div>`).join("")}${pact ? `<div class="pact"><span>${labels.pact} N${pact.level}</span><strong>${pact.current}/${pact.max}</strong></div>` : ""}</div>` : `<p class="cv-empty">${labels.empty}</p>`}
          <h4>${labels.hitDice}</h4>
          <div class="cv-inline-data">${character.hitDice.map((entry) => badge(`${entry.class}: ${entry.remaining}/${entry.total}${entry.die ? ` ${entry.die}` : ""}`)).join("") || labels.empty}</div>
        </section>
      </div>
      <div class="cv-two-column">
        <section class="cv-panel">
          <h4>${labels.senses}</h4>
          ${detailRows([["SENTIDOS", senses || character.senses.special || "—"], [labels.languages, join(character.traits.languages)]])}
        </section>
        <section class="cv-panel">
          <h4>${labels.defenses}</h4>
          ${detailRows(defenses)}
        </section>
      </div>
      <section class="cv-panel">
        <h4>${labels.details}</h4>
        ${detailRows([[labels.currency, currency || "—"], ["INSPIRACIÓN", character.inspiration ? "SÍ" : "NO"], ["AGOTAMIENTO", character.exhaustion], ["CA — FUENTES", join([...(character.ac.armorSources || []), ...(character.ac.shieldSources || [])])]])}
      </section>`;
  }

  function renderAbilities(character) {
    return `
      <header class="cv-section-header"><h3>${labels.abilities}</h3><span>CHECKS // SAVES // SKILLS</span></header>
      <div class="cv-ability-grid">
        ${character.abilities.map((ability) => `<article class="cv-ability-card">
          <header><span>${escapeHtml(ability.key.toUpperCase())}</span><strong>${ability.score}</strong><em>${sign(ability.modifier)}</em></header>
          <div><span>CHECK</span><strong>${sign(ability.check)}</strong></div>
          <div class="${ability.saveProficient ? "proficient" : ""}"><span>${labels.save}</span><strong>${sign(ability.save)}</strong></div>
        </article>`).join("")}
      </div>
      <section class="cv-panel">
        <h4>${labels.skills}</h4>
        <div class="cv-skill-grid">
          ${character.skills.map((skill) => `<div class="cv-skill-row ${skill.proficiency ? "proficient" : skill.jackOfAllTrades ? "half" : ""}">
            <span>${skill.proficiency === 2 ? "◆" : skill.proficiency ? "●" : skill.jackOfAllTrades ? "◐" : "○"} ${escapeHtml(skill.name)}</span>
            <small>${escapeHtml(skill.ability.toUpperCase())}</small>
            <strong>${sign(skill.bonus)}</strong>
            <em>${labels.passive} ${skill.passive}</em>
          </div>`).join("")}
        </div>
      </section>
      <section class="cv-panel">
        <h4>COMPETENCIAS</h4>
        ${detailRows([["ARMADURAS", join(character.traits.armorProficiencies)], ["ARMAS", join(character.traits.weaponProficiencies)], ["HERRAMIENTAS", join((character.tools || []).map((tool) => tool.name))]])}
      </section>`;
  }

  function activityMeta(activity) {
    return compact([
      activity.activation?.label && `${labels.activation}: ${activity.activation.label}`,
      activity.range?.label && activity.range.label !== "—" && `${labels.range}: ${activity.range.label}`,
      activity.target?.label && activity.target.label !== "—" && `${labels.target}: ${activity.target.label}`,
      activity.duration?.label && activity.duration.label !== "—" && `${labels.duration}: ${activity.duration.label}`,
      activity.attack && `${labels.attack}: ${sign(activity.attack.bonus)}`,
      activity.save && `${labels.save}: CD ${activity.save.dc} ${join(activity.save.labels, "")}`,
      activity.damage?.parts?.length && `${labels.damage}: ${activity.damage.parts.join(" + ")}`,
      activity.healing?.parts?.length && `CURACIÓN: ${activity.healing.parts.join(" + ")}`,
      activity.roll && `TIRADA: ${activity.roll}`
    ]);
  }

  function renderActivity(activity) {
    const meta = activityMeta(activity);
    return `<div class="cv-activity">
      <div class="cv-activity-title"><strong>${escapeHtml(activity.name)}</strong>${badge(activity.type.toUpperCase())}</div>
      <div class="cv-inline-data">${meta.map((entry) => badge(entry)).join("")}</div>
      ${activity.activation?.condition ? `<p class="cv-condition">${escapeHtml(activity.activation.condition)}</p>` : ""}
      ${activity.chatFlavor ? `<p>${lines(activity.chatFlavor)}</p>` : ""}
    </div>`;
  }

  function renderActions(character) {
    return `
      <header class="cv-section-header"><h3>${labels.actions}</h3><span>ATTACKS // FEATURES // ITEMS</span></header>
      <div class="cv-toolbar">
        <label>${labels.search}<input type="search" data-filter-input placeholder="NOMBRE O TEXTO"></label>
        <div class="cv-filter-buttons">
          <button type="button" data-action-filter="all" class="active">${labels.all}</button>
          <button type="button" data-action-filter="action">${labels.action}</button>
          <button type="button" data-action-filter="bonus">${labels.bonus}</button>
          <button type="button" data-action-filter="reaction">${labels.reaction}</button>
        </div>
      </div>
      <div class="cv-card-list" data-filter-list>
        ${character.actions.map((entry) => {
          const types = new Set(entry.activities.map((activity) => activity.activation?.type || ""));
          return `<details class="cv-card" data-search="${escapeHtml(`${entry.source} ${entry.description}`.toLowerCase())}" data-actions="${escapeHtml([...types].join(" "))}">
            <summary><span>${escapeHtml(entry.source)}</span><small>${escapeHtml(entry.sourceType.toUpperCase())}</small>${entry.uses ? `<em>${escapeHtml(usesLabel(entry.uses))}</em>` : ""}</summary>
            <div class="cv-card-body">
              ${entry.activities.map(renderActivity).join("")}
              ${entry.description ? `<h5>${labels.description}</h5><p>${lines(entry.description)}</p>` : ""}
            </div>
          </details>`;
        }).join("") || `<p class="cv-empty">${labels.empty}</p>`}
      </div>`;
  }

  function spellSummary(spell) {
    return compact([
      spell.activation?.label,
      spell.range?.label,
      spell.duration?.label,
      spell.components?.join(""),
      spell.concentration ? labels.concentration : "",
      spell.ritual ? labels.ritual : ""
    ]).join(" · ");
  }

  function renderSpells(character) {
    const levels = [...new Set(character.spells.map((spell) => spell.level))].sort((a, b) => a - b);
    const slots = character.spellcasting.slots || [];
    const pact = character.spellcasting.pact;
    return `
      <header class="cv-section-header"><h3>${labels.spells}</h3><span>${character.spellcasting.ability ? `${character.spellcasting.abilityLabel.toUpperCase()} // ATK ${sign(character.spellcasting.attack)} // CD ${character.spellcasting.dc}` : "NO SPELLCASTING ABILITY"}</span></header>
      ${slots.length || pact ? `<div class="cv-slot-strip">${slots.map((slot) => `<span>N${slot.level} <strong>${slot.current}/${slot.max}</strong></span>`).join("")}${pact ? `<span class="pact">PACTO N${pact.level} <strong>${pact.current}/${pact.max}</strong></span>` : ""}</div>` : ""}
      <div class="cv-toolbar">
        <label>${labels.search}<input type="search" data-filter-input placeholder="HECHIZO, ESCUELA O EFECTO"></label>
        <div class="cv-filter-buttons cv-level-filters">
          <button type="button" data-level-filter="all" class="active">${labels.all}</button>
          ${levels.map((level) => `<button type="button" data-level-filter="${level}">${level === 0 ? "TRUCOS" : `N${level}`}</button>`).join("")}
        </div>
      </div>
      <div class="cv-card-list" data-filter-list>
        ${character.spells.map((spell) => `<details class="cv-card cv-spell" data-level="${spell.level}" data-search="${escapeHtml(`${spell.name} ${spell.schoolLabel} ${spell.description}`.toLowerCase())}">
          <summary>
            <span>${escapeHtml(spell.name)}</span>
            <small>${spell.level === 0 ? "TRUCO" : `NIVEL ${spell.level}`} · ${escapeHtml(spell.schoolLabel)}</small>
            <em>${escapeHtml(spellSummary(spell))}</em>
          </summary>
          <div class="cv-card-body">
            <div class="cv-inline-data">
              ${badge(`${labels.activation}: ${spell.activation?.label || "—"}`)}
              ${badge(`${labels.range}: ${spell.range?.label || "—"}`)}
              ${badge(`${labels.duration}: ${spell.duration?.label || "—"}`)}
              ${spell.prepared ? badge(labels.prepared, "ok") : ""}
              ${spell.concentration ? badge(labels.concentration, "warn") : ""}
              ${spell.ritual ? badge(labels.ritual) : ""}
              ${spell.method === "pact" ? badge(labels.pact, "pact") : ""}
            </div>
            ${spell.activities.map(renderActivity).join("")}
            ${spell.materials ? `<h5>${labels.materials}</h5><p>${escapeHtml(spell.materials)}</p>` : ""}
            ${spell.description ? `<h5>${labels.description}</h5><p>${lines(spell.description)}</p>` : ""}
          </div>
        </details>`).join("") || `<p class="cv-empty">${labels.empty}</p>`}
      </div>`;
  }

  function inventoryMeta(item) {
    const weight = item.weight?.value ? `${item.weight.value} ${item.weight.units || "lb"}` : "";
    return compact([
      item.equipped ? labels.equipped : "",
      item.attuned ? labels.attuned : "",
      item.quantity && item.quantity !== 1 ? `${labels.quantity} ${item.quantity}` : "",
      weight ? `${labels.weight} ${weight}` : "",
      item.rarity ? `${labels.rarity} ${item.rarity}` : "",
      ...(item.properties || [])
    ]);
  }

  function renderInventory(character) {
    const categories = [...new Set(character.inventory.map((item) => item.category))];
    return `
      <header class="cv-section-header"><h3>${labels.inventory}</h3><span>WEAPONS // ARMOR // ITEMS</span></header>
      <div class="cv-toolbar">
        <label>${labels.search}<input type="search" data-filter-input placeholder="OBJETO, PROPIEDAD O DESCRIPCIÓN"></label>
        <div class="cv-filter-buttons">
          <button type="button" data-category-filter="all" class="active">${labels.all}</button>
          ${categories.map((category) => `<button type="button" data-category-filter="${escapeHtml(category)}">${escapeHtml(category.toUpperCase())}</button>`).join("")}
        </div>
      </div>
      <div class="cv-card-list" data-filter-list>
        ${character.inventory.map((item) => `<details class="cv-card" data-category="${escapeHtml(item.category)}" data-search="${escapeHtml(`${item.name} ${item.description} ${(item.properties || []).join(" ")}`.toLowerCase())}">
          <summary><span>${escapeHtml(item.name)}</span><small>${escapeHtml(item.category.toUpperCase())}</small><em>${escapeHtml(inventoryMeta(item).join(" · "))}</em></summary>
          <div class="cv-card-body">
            <div class="cv-inline-data">${inventoryMeta(item).map((entry) => badge(entry, entry === labels.equipped ? "ok" : "")).join("")}</div>
            ${item.weapon ? detailRows([[labels.damage, item.weapon.damage], [labels.range, item.weapon.range?.label], ["TIPO", item.weapon.type], ["BONO MÁGICO", item.weapon.magicalBonus ? sign(item.weapon.magicalBonus) : ""]]) : ""}
            ${item.armor ? detailRows([["TIPO DE ARMADURA", item.armor.type], ["BASE", item.armor.value], ["BONO MÁGICO", item.armor.magicalBonus ? sign(item.armor.magicalBonus) : ""]]) : ""}
            ${item.activities.map(renderActivity).join("")}
            ${item.description ? `<h5>${labels.description}</h5><p>${lines(item.description)}</p>` : ""}
          </div>
        </details>`).join("") || `<p class="cv-empty">${labels.empty}</p>`}
      </div>`;
  }

  function renderFeatures(character) {
    return `
      <header class="cv-section-header"><h3>${labels.features}</h3><span>CLASS // FEATS // CUSTOM POWERS</span></header>
      <div class="cv-toolbar"><label>${labels.search}<input type="search" data-filter-input placeholder="RASGO O EFECTO"></label></div>
      <div class="cv-card-list" data-filter-list>
        ${character.features.map((feature) => `<details class="cv-card" data-search="${escapeHtml(`${feature.name} ${feature.requirements} ${feature.description}`.toLowerCase())}">
          <summary><span>${escapeHtml(feature.name)}</span><small>${escapeHtml(feature.requirements || "RASGO")}</small><em>${feature.uses ? escapeHtml(usesLabel(feature.uses)) : ""}</em></summary>
          <div class="cv-card-body">
            ${feature.uses ? `<div class="cv-inline-data">${badge(`${labels.uses}: ${usesLabel(feature.uses)}`, "warn")}</div>` : ""}
            ${feature.activities.map(renderActivity).join("")}
            ${feature.description ? `<p>${lines(feature.description)}</p>` : `<p class="cv-empty">${labels.empty}</p>`}
          </div>
        </details>`).join("") || `<p class="cv-empty">${labels.empty}</p>`}
      </div>`;
  }

  function renderNotes(character) {
    const notes = character.notes || {};
    const rows = [
      ["APARIENCIA", notes.appearance],
      ["RASGO", notes.trait],
      ["IDEAL", notes.ideal],
      ["VÍNCULO", notes.bond],
      ["DEFECTO", notes.flaw],
      ["FE", notes.faith]
    ];
    return `
      <header class="cv-section-header"><h3>${labels.notes}</h3><span>CAMPAIGN MEMORY // CHARACTER TEXT</span></header>
      ${notes.publicBiography ? `<section class="cv-panel"><h4>BIOGRAFÍA PÚBLICA</h4><p>${lines(notes.publicBiography)}</p></section>` : ""}
      ${notes.biography ? `<section class="cv-panel"><h4>BIOGRAFÍA</h4><p>${lines(notes.biography)}</p></section>` : ""}
      <section class="cv-panel"><h4>${labels.details}</h4>${detailRows(rows) || `<p class="cv-empty">${labels.empty}</p>`}</section>`;
  }

  function bindInteractiveControls(tab) {
    const input = content.querySelector("[data-filter-input]");
    const cards = [...content.querySelectorAll("[data-filter-list] > [data-search]")];
    let activeValue = "all";

    function apply() {
      const query = (input?.value || "").trim().toLowerCase();
      cards.forEach((card) => {
        const textMatch = !query || (card.dataset.search || "").includes(query);
        let facetMatch = true;
        if (tab === "actions") facetMatch = activeValue === "all" || (card.dataset.actions || "").split(" ").includes(activeValue);
        if (tab === "spells") facetMatch = activeValue === "all" || card.dataset.level === activeValue;
        if (tab === "inventory") facetMatch = activeValue === "all" || card.dataset.category === activeValue;
        card.hidden = !(textMatch && facetMatch);
      });
    }

    input?.addEventListener("input", apply);
    content.querySelectorAll("[data-action-filter], [data-level-filter], [data-category-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        activeValue = button.dataset.actionFilter || button.dataset.levelFilter || button.dataset.categoryFilter || "all";
        button.parentElement.querySelectorAll("button").forEach((candidate) => candidate.classList.toggle("active", candidate === button));
        apply();
      });
    });
  }

  async function openCharacter(meta, trigger) {
    lastTrigger = trigger;
    modal.hidden = false;
    document.body.classList.add("cv-open");
    sidebar.innerHTML = "";
    content.innerHTML = `<div class="cv-loading">${labels.loading}</div>`;
    windowEl.focus();

    try {
      let character = cache.get(meta.id);
      if (!character) {
        const response = await fetch(meta.file, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        character = await response.json();
        cache.set(meta.id, character);
      }
      activeCharacter = character;
      renderSidebar(character, "overview");
      selectTab("overview");
    } catch (error) {
      console.error(error);
      content.innerHTML = `<div class="cv-loading cv-error">${labels.error}</div>`;
    }
  }

  function createHotspot(meta) {
    const button = document.createElement("button");
    button.className = "cv-hotspot";
    button.type = "button";
    button.style.cssText = `--x:${meta.sprite.x}%;--y:${meta.sprite.y}%;--w:${meta.sprite.w}%;--h:${meta.sprite.h}%`;
    button.innerHTML = `<span>${escapeHtml(meta.name)}</span>`;
    button.setAttribute("aria-label", `Abrir ficha de ${meta.name}`);
    button.addEventListener("click", () => openCharacter(meta, button));
    return button;
  }

  fetch("data/characters/index.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      overlay.replaceChildren(...(data.characters || []).map(createHotspot));
    })
    .catch((error) => {
      console.error(error);
      overlay.innerHTML = `<p class="cv-load-error">${labels.error}</p>`;
    });
})();
