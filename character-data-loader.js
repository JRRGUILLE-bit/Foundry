(() => {
  "use strict";

  const nativeFetch = window.fetch.bind(window);
  const cache = new Map();
  const version = "20260721-3";

  const sources = {
    sathar: [
      ["data/characters/sathar.json.gz.b64"],
      ["data/characters/sathar.json.gz.b64.part1", "data/characters/sathar.json.gz.b64.part2"]
    ],
    artionketh: [
      ["data/characters/artionketh.json.gz.b64.part1", "data/characters/artionketh.json.gz.b64.part2"]
    ],
    magna: [
      ["data/characters/magna.json.gz.b64"],
      ["data/characters/magna.json.gz.b64.part1", "data/characters/magna.json.gz.b64.part2"]
    ],
    melkor: [
      ["data/characters/melkor.json.gz.b64"],
      ["data/characters/melkor.json.gz.b64.part1", "data/characters/melkor.json.gz.b64.part2"]
    ],
    balder: [
      ["data/characters/balder.json.gz.b64"],
      ["data/characters/balder.json.gz.b64.part1", "data/characters/balder.json.gz.b64.part2"]
    ],
    ingwe: [
      ["data/characters/ingwe.json.gz.b64"]
    ]
  };

  function withVersion(path) {
    return `${path}${path.includes("?") ? "&" : "?"}v=${version}`;
  }

  async function decodeCandidate(paths, init) {
    if (!("DecompressionStream" in window)) {
      throw new Error("El navegador no soporta la descompresión gzip requerida.");
    }

    const chunks = [];
    for (const path of paths) {
      const response = await nativeFetch(withVersion(path), {
        ...init,
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);
      chunks.push(await response.text());
    }

    const encoded = chunks.join("").replace(/^\uFEFF/, "").replace(/\s+/g, "");
    if (!encoded.startsWith("H4sI")) throw new Error(`Contenido gzip inválido: ${paths[0]}`);

    let binary;
    try {
      binary = atob(encoded);
    } catch (error) {
      throw new Error(`Base64 inválido: ${paths[0]} (${error.message})`);
    }

    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    const text = await new Response(stream).text();
    const data = JSON.parse(text);

    data.actions = [...(data.inventory || []), ...(data.features || [])]
      .filter((entry) => entry.activities?.length)
      .map((entry) => ({
        source: entry.name,
        sourceType: entry.category || "feature",
        description: entry.description || "",
        activities: entry.activities,
        uses: entry.uses || null
      }));

    return data;
  }

  function legacySpell(spell) {
    return {
      name: spell.name,
      level: Number(spell.level || 0),
      schoolLabel: "—",
      description: "",
      activation: { label: "—" },
      range: { label: "—" },
      duration: { label: "—" },
      components: [],
      concentration: false,
      ritual: false,
      prepared: false,
      method: "spell",
      materials: "",
      activities: []
    };
  }

  function legacyItem(name, category) {
    return {
      name,
      category,
      description: "",
      quantity: 1,
      equipped: false,
      attuned: false,
      rarity: "",
      properties: [],
      weight: { value: 0, units: "lb" },
      activities: [],
      weapon: null,
      armor: null,
      uses: null
    };
  }

  function legacyFeature(name) {
    return {
      name,
      requirements: "",
      description: "",
      uses: null,
      activities: []
    };
  }

  function normalizeLegacy(character) {
    const abilities = (character.abilities || []).map((ability) => ({
      key: ability.key,
      label: ability.label || ability.key?.toUpperCase(),
      score: Number(ability.score || 0),
      modifier: Number(ability.modifier || 0),
      check: Number(ability.modifier || 0),
      save: Number(ability.modifier || 0),
      saveProficient: false
    }));

    const skills = (character.skills || []).map((skill) => ({
      key: skill.key,
      name: skill.name,
      ability: skill.ability || "",
      proficiency: Number(skill.proficiency || 0),
      jackOfAllTrades: false,
      bonus: Number(skill.bonus || 0),
      passive: 10 + Number(skill.bonus || 0)
    }));

    const inventory = [
      ...(character.weapons || []).map((name) => legacyItem(name, "weapon")),
      ...(character.equipment || []).map((name) => legacyItem(name, "equipment"))
    ];

    const notesText = (character.notes || []).map((entry) => entry.text || "").filter(Boolean).join("\n\n");

    return {
      id: character.id,
      name: character.name,
      race: character.race || "No registrado",
      level: Number(character.level || 0),
      classes: character.classes || [],
      subclasses: character.subclasses || [],
      source: { systemVersion: "FALLBACK", fallback: true },
      hp: {
        value: Number(character.hp?.current || 0),
        max: Number(character.hp?.max || 0),
        temp: Number(character.hp?.temp || 0)
      },
      ac: {
        value: Number(character.ac || 0),
        formula: "",
        armorSources: [],
        shieldSources: []
      },
      initiative: Number(character.initiative || 0),
      proficiency: Number(character.proficiency || 0),
      movement: { modes: { walk: Number(character.speed || 0) }, units: "ft" },
      spellcasting: {
        ability: "",
        abilityLabel: "",
        attack: 0,
        dc: 0,
        slots: [],
        pact: null
      },
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
      features: (character.features || []).map(legacyFeature),
      spells: (character.spells || []).map(legacySpell),
      actions: [],
      notes: {
        publicBiography: notesText,
        biography: "",
        appearance: "",
        trait: "",
        ideal: "",
        bond: "",
        flaw: "",
        faith: ""
      }
    };
  }

  async function loadLegacyCharacter(id) {
    const response = await nativeFetch(withVersion("characters.json"), { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}: characters.json`);
    const data = await response.json();
    const character = (data.characters || []).find((entry) => entry.id === id);
    if (!character) throw new Error(`No existe el personaje ${id} en el respaldo.`);
    return normalizeLegacy(character);
  }

  async function loadCharacter(id, init) {
    if (cache.has(id)) return cache.get(id);

    const request = (async () => {
      const errors = [];

      for (const candidate of sources[id] || []) {
        try {
          return await decodeCandidate(candidate, init);
        } catch (error) {
          errors.push(error.message);
          console.warn(`[CHARACTER DATA] Falló ${id}: ${candidate.join(" + ")}`, error);
        }
      }

      try {
        const fallback = await loadLegacyCharacter(id);
        fallback.loadWarnings = errors;
        console.warn(`[CHARACTER DATA] Usando respaldo resumido para ${id}.`, errors);
        return fallback;
      } catch (fallbackError) {
        errors.push(fallbackError.message);
        throw new Error(errors.join(" | "));
      }
    })();

    cache.set(id, request);
    return request;
  }

  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input?.url || "";
    if (!url.startsWith("character-data:")) return nativeFetch(input, init);

    const id = url.slice("character-data:".length);
    try {
      const data = await loadCharacter(id, init);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    } catch (error) {
      console.error(`[CHARACTER DATA] Error final para ${id}`, error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
  };
})();