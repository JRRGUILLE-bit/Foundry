(() => {
  "use strict";

  const upstreamFetch = window.fetch.bind(window);
  const CHARACTER_PREFIX = "character-data:";
  const TIMEOUT_MS = 5000;
  const LEGACY_URL = "characters.json?v=20260722-1";
  let legacyPromise = null;

  const asArray = (value) => Array.isArray(value) ? value : [];
  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

  function timeoutAfter(ms) {
    return new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(`La carga excedió ${ms} ms`)), ms);
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
      requirements: "Respaldo resumido",
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
      source: { systemVersion: "RESPALDO RÁPIDO", fallback: true },
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

  async function getLegacyCharacters(init) {
    if (!legacyPromise) {
      legacyPromise = upstreamFetch(LEGACY_URL, { ...init, cache: "no-store" })
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}: characters.json`);
          return response.json();
        })
        .catch((error) => {
          legacyPromise = null;
          throw error;
        });
    }
    return legacyPromise;
  }

  async function fallbackResponse(id, init, cause) {
    console.warn(`[CHARACTER LOAD GUARD] Usando respaldo para ${id}.`, cause);
    const data = await getLegacyCharacters(init);
    const character = asArray(data.characters).find((entry) => entry?.id === id);
    if (!character) throw new Error(`No existe ${id} en characters.json`);
    return new Response(JSON.stringify(normalizeLegacy(character, id)), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Character-Data-Source": "legacy-fallback"
      }
    });
  }

  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input?.url || "";
    if (!url.startsWith(CHARACTER_PREFIX)) return upstreamFetch(input, init);

    const id = url.slice(CHARACTER_PREFIX.length).trim().toLowerCase();
    if (!id) return new Response(JSON.stringify({ error: "ID de personaje vacío" }), { status: 400 });

    try {
      const response = await Promise.race([
        upstreamFetch(input, init),
        timeoutAfter(TIMEOUT_MS)
      ]);
      if (!response.ok) throw new Error(`La fuente principal respondió HTTP ${response.status}`);
      return response;
    } catch (error) {
      try {
        return await fallbackResponse(id, init, error);
      } catch (fallbackError) {
        console.error(`[CHARACTER LOAD GUARD] Fallaron ambas fuentes para ${id}.`, fallbackError);
        return new Response(JSON.stringify({ error: String(fallbackError) }), {
          status: 500,
          headers: { "Content-Type": "application/json; charset=utf-8" }
        });
      }
    }
  };
})();
