(() => {
  "use strict";

  const delegatedFetch = window.fetch.bind(window);
  const PREFIX = "character-data:";
  const LEGACY_URL = "characters.json?v=20260722-2";
  let legacyPromise = null;

  const asArray = (value) => Array.isArray(value) ? value : [];
  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

  function xhrJson(url, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("GET", url, true);
      request.responseType = "json";
      request.timeout = timeout;
      request.setRequestHeader("Cache-Control", "no-cache");
      request.onload = () => {
        if (request.status >= 200 && request.status < 300) {
          try {
            const value = request.response ?? JSON.parse(request.responseText);
            resolve(value);
          } catch (error) {
            reject(error);
          }
          return;
        }
        reject(new Error(`HTTP ${request.status}: ${url}`));
      };
      request.onerror = () => reject(new Error(`Error de red: ${url}`));
      request.ontimeout = () => reject(new Error(`Timeout: ${url}`));
      request.send();
    });
  }

  function normalizeLegacy(character, id) {
    const inventory = [
      ...asArray(character.weapons).map((name) => ({ name, category: "Arma", equipped: true })),
      ...asArray(character.equipment).map((name) => ({ name, category: "Equipo", equipped: true }))
    ].map((item) => ({
      ...item,
      description: "",
      quantity: 1,
      attuned: false,
      rarity: "",
      properties: [],
      weight: { value: 0, units: "lb" },
      activities: [],
      uses: null,
      weapon: null,
      armor: null
    }));

    const features = asArray(character.features).map((name) => ({
      name,
      requirements: "Respaldo estable",
      description: "",
      activities: [],
      uses: null
    }));

    const spells = asArray(character.spells)
      .map((spell) => ({
        name: spell?.name || "Hechizo sin nombre",
        level: number(spell?.level),
        schoolLabel: "—",
        description: "",
        activation: {},
        range: {},
        duration: {},
        components: [],
        activities: [],
        materials: "",
        prepared: false,
        concentration: false,
        ritual: false,
        method: "spell",
        uses: null
      }))
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, "es"));

    const notes = asArray(character.notes)
      .map((entry) => entry?.text || "")
      .filter(Boolean)
      .join("\n\n");

    const abilities = asArray(character.abilities).map((ability) => ({
      ...ability,
      key: ability?.key || "",
      score: number(ability?.score),
      modifier: number(ability?.modifier),
      check: number(ability?.modifier),
      save: number(ability?.modifier),
      saveProficient: false
    }));

    const skills = asArray(character.skills).map((skill) => ({
      ...skill,
      name: skill?.name || skill?.key || "Habilidad",
      ability: skill?.ability || "",
      proficiency: number(skill?.proficiency),
      jackOfAllTrades: false,
      bonus: number(skill?.bonus),
      passive: 10 + number(skill?.bonus)
    }));

    return {
      id: character.id || id,
      name: character.name || id,
      race: character.race || "No registrado",
      level: number(character.level),
      classes: asArray(character.classes),
      subclasses: asArray(character.subclasses),
      source: { systemVersion: "RESPALDO ESTABLE", fallback: true },
      hp: {
        value: number(character.hp?.current),
        max: number(character.hp?.max ?? character.hp?.current),
        temp: number(character.hp?.temp),
        tempMax: 0
      },
      ac: { value: number(character.ac), formula: "", armorSources: [], shieldSources: [] },
      initiative: number(character.initiative),
      proficiency: number(character.proficiency),
      movement: { modes: { walk: number(character.speed) }, units: "ft" },
      spellcasting: { ability: "", abilityLabel: "", attack: 0, dc: 0, slots: [], pact: null },
      resources: [],
      hitDice: [],
      senses: { ranges: {}, units: "ft", special: "" },
      traits: {
        damageResistances: [],
        damageImmunities: [],
        damageVulnerabilities: [],
        conditionImmunities: [],
        languages: [],
        armorProficiencies: [],
        weaponProficiencies: []
      },
      currency: {},
      inspiration: false,
      exhaustion: 0,
      abilities,
      skills,
      tools: [],
      inventory,
      features,
      spells,
      notes: {
        publicBiography: notes,
        biography: "",
        appearance: "",
        trait: "",
        ideal: "",
        bond: "",
        flaw: "",
        faith: ""
      },
      actions: [],
      audit: {
        expected: null,
        actual: { spells: spells.length, inventory: inventory.length, features: features.length },
        complete: false,
        fallback: true
      }
    };
  }

  function loadLegacy() {
    if (!legacyPromise) {
      legacyPromise = xhrJson(LEGACY_URL).catch((error) => {
        legacyPromise = null;
        throw error;
      });
    }
    return legacyPromise;
  }

  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input?.url || "";
    if (!url.startsWith(PREFIX)) return delegatedFetch(input, init);

    const id = url.slice(PREFIX.length).trim().toLowerCase();
    try {
      const data = await loadLegacy();
      const character = asArray(data.characters).find((entry) => entry?.id === id);
      if (!character) throw new Error(`No existe ${id} en characters.json`);
      return new Response(JSON.stringify(normalizeLegacy(character, id)), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "X-Character-Data-Source": "xhr-stable-fallback"
        }
      });
    } catch (error) {
      console.error(`[CHARACTER RUNTIME RESCUE] ${id}`, error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
  };

  function forceClose(target) {
    const modal = target?.closest?.(".cv-modal") || document.querySelector(".cv-modal:not([hidden])");
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute("hidden", "");
    document.body.classList.remove("cv-open");
  }

  document.addEventListener("click", (event) => {
    const close = event.target.closest?.(".cv-modal [data-close], .cv-modal .cv-window-bar button");
    if (!close) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    forceClose(close);
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    forceClose(document.querySelector(".cv-modal:not([hidden])"));
  }, true);
})();