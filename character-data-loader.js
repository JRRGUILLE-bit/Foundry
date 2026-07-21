(() => {
  "use strict";

  const nativeFetch = window.fetch.bind(window);
  const cache = new Map();
  const version = "20260721-5";

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
    ingwe: [["data/characters/ingwe.json.gz.b64"]]
  };

  const expected = {
    artionketh: { spells: 38, inventory: 23, features: 36 },
    balder: { spells: 17, inventory: 12, features: 27 },
    ingwe: { spells: 29, inventory: 12, features: 21 },
    melkor: { spells: 7, inventory: 18, features: 38 },
    magna: { spells: 20, inventory: 5, features: 12 },
    sathar: { spells: 17, inventory: 11, features: 21 }
  };

  const asArray = (value) => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") return Object.values(value);
    return [];
  };

  const asObject = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

  function withVersion(path) {
    return `${path}${path.includes("?") ? "&" : "?"}v=${version}`;
  }

  function normalizeComponents(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") return value.split("").filter(Boolean);
    return Object.entries(asObject(value)).filter(([, enabled]) => Boolean(enabled)).map(([key]) => key);
  }

  function normalizeRecovery(value) {
    return asArray(value).map((entry) => ({
      ...asObject(entry),
      label: entry?.label || ({ sr: "Descanso corto", lr: "Descanso largo", day: "Diario" }[entry?.period] || entry?.period || "")
    }));
  }

  function normalizeUses(value) {
    if (!value || typeof value !== "object") return null;
    const result = { ...value };
    result.recovery = normalizeRecovery(result.recovery);
    if (result.current == null && result.max != null && Number.isFinite(Number(result.max))) {
      result.current = number(result.max) - number(result.spent);
    }
    return result;
  }

  function normalizeActivity(value, index = 0) {
    const activity = asObject(value);
    return {
      ...activity,
      name: activity.name || activity.label || `Actividad ${index + 1}`,
      type: activity.type || "utility",
      activation: asObject(activity.activation),
      range: asObject(activity.range),
      target: asObject(activity.target),
      duration: asObject(activity.duration),
      damage: { ...asObject(activity.damage), parts: asArray(activity.damage?.parts) },
      healing: { ...asObject(activity.healing), parts: asArray(activity.healing?.parts) }
    };
  }

  function normalizeSpell(value) {
    const spell = asObject(value);
    return {
      ...spell,
      name: spell.name || "Hechizo sin nombre",
      level: number(spell.level),
      schoolLabel: spell.schoolLabel || spell.school || "—",
      description: spell.description || "",
      activation: asObject(spell.activation),
      range: asObject(spell.range),
      duration: asObject(spell.duration),
      components: normalizeComponents(spell.components),
      activities: asArray(spell.activities).map(normalizeActivity),
      materials: typeof spell.materials === "string" ? spell.materials : spell.materials?.value || "",
      prepared: Boolean(spell.prepared),
      concentration: Boolean(spell.concentration),
      ritual: Boolean(spell.ritual),
      method: spell.method || "spell",
      uses: normalizeUses(spell.uses)
    };
  }

  function normalizeInventoryItem(value) {
    const item = asObject(value);
    return {
      ...item,
      name: item.name || "Objeto sin nombre",
      category: item.category || "equipment",
      description: item.description || "",
      quantity: item.quantity ?? 1,
      equipped: Boolean(item.equipped),
      attuned: Boolean(item.attuned),
      rarity: item.rarity || "",
      properties: asArray(item.properties),
      weight: { value: number(item.weight?.value), units: item.weight?.units || "lb" },
      activities: asArray(item.activities).map(normalizeActivity),
      uses: normalizeUses(item.uses),
      weapon: item.weapon && typeof item.weapon === "object" ? item.weapon : null,
      armor: item.armor && typeof item.armor === "object" ? item.armor : null
    };
  }

  function normalizeFeature(value) {
    const feature = asObject(value);
    return {
      ...feature,
      name: feature.name || "Rasgo sin nombre",
      requirements: feature.requirements || feature.category || "Rasgo",
      description: feature.description || "",
      activities: asArray(feature.activities).map(normalizeActivity),
      uses: normalizeUses(feature.uses)
    };
  }

  function normalizeTrait(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === "string") return value ? [value] : [];
    const trait = asObject(value);
    const result = asArray(trait.value).filter(Boolean);
    if (trait.custom) result.push(trait.custom);
    return result;
  }

  function normalizeNotes(value) {
    if (Array.isArray(value)) {
      return {
        publicBiography: value.map((entry) => entry?.text || "").filter(Boolean).join("\n\n"),
        biography: "", appearance: "", trait: "", ideal: "", bond: "", flaw: "", faith: ""
      };
    }
    const notes = asObject(value);
    return {
      publicBiography: notes.publicBiography || "",
      biography: notes.biography || "",
      appearance: notes.appearance || "",
      trait: notes.trait || "",
      ideal: notes.ideal || "",
      bond: notes.bond || "",
      flaw: notes.flaw || "",
      faith: notes.faith || ""
    };
  }

  function normalizeCharacter(raw, id) {
    const data = asObject(raw);
    data.id = data.id || id;
    data.name = data.name || id;
    data.race = data.race || "No registrado";
    data.level = number(data.level);
    data.classes = asArray(data.classes).map((entry) => {
      if (typeof entry === "string") return { name: entry, levels: 0 };
      return { ...entry, name: entry?.name || "Clase", levels: number(entry?.levels) };
    });
    data.subclasses = asArray(data.subclasses).filter(Boolean);
    data.source = asObject(data.source);

    data.hp = { value: number(data.hp?.value ?? data.hp?.current), max: number(data.hp?.max ?? data.hp?.value ?? data.hp?.current), temp: number(data.hp?.temp), tempMax: number(data.hp?.tempMax) };
    data.ac = { ...asObject(data.ac), value: number(data.ac?.value ?? data.ac), formula: data.ac?.formula || "", armorSources: asArray(data.ac?.armorSources), shieldSources: asArray(data.ac?.shieldSources) };
    data.initiative = number(data.initiative);
    data.proficiency = number(data.proficiency);
    data.movement = { ...asObject(data.movement), modes: asObject(data.movement?.modes), units: data.movement?.units || "ft" };
    data.spellcasting = { ...asObject(data.spellcasting), slots: asArray(data.spellcasting?.slots), pact: data.spellcasting?.pact || null };
    data.resources = asArray(data.resources);
    data.hitDice = asArray(data.hitDice);
    data.senses = { ...asObject(data.senses), ranges: asObject(data.senses?.ranges), units: data.senses?.units || "ft", special: data.senses?.special || "" };

    const traits = asObject(data.traits);
    data.traits = {
      damageResistances: normalizeTrait(traits.damageResistances),
      damageImmunities: normalizeTrait(traits.damageImmunities),
      damageVulnerabilities: normalizeTrait(traits.damageVulnerabilities),
      conditionImmunities: normalizeTrait(traits.conditionImmunities),
      languages: normalizeTrait(traits.languages),
      armorProficiencies: normalizeTrait(traits.armorProficiencies),
      weaponProficiencies: normalizeTrait(traits.weaponProficiencies)
    };

    data.currency = asObject(data.currency);
    data.abilities = asArray(data.abilities).map((entry) => ({ ...asObject(entry), key: entry?.key || "", score: number(entry?.score), modifier: number(entry?.modifier), check: number(entry?.check ?? entry?.modifier), save: number(entry?.save ?? entry?.modifier), saveProficient: Boolean(entry?.saveProficient) }));
    data.skills = asArray(data.skills).map((entry) => ({ ...asObject(entry), name: entry?.name || entry?.key || "Habilidad", ability: entry?.ability || "", proficiency: number(entry?.proficiency), jackOfAllTrades: Boolean(entry?.jackOfAllTrades), bonus: number(entry?.bonus), passive: number(entry?.passive, 10 + number(entry?.bonus)) }));
    data.tools = asArray(data.tools);
    data.inventory = asArray(data.inventory).map(normalizeInventoryItem);
    data.features = asArray(data.features).map(normalizeFeature);
    data.spells = asArray(data.spells).map(normalizeSpell).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, "es"));
    data.notes = normalizeNotes(data.notes);

    data.actions = [...data.inventory, ...data.features]
      .filter((entry) => entry.activities.length)
      .map((entry) => ({ source: entry.name, sourceType: entry.category || "feature", description: entry.description || "", activities: entry.activities, uses: entry.uses || null }));

    const target = expected[id];
    const actual = { spells: data.spells.length, inventory: data.inventory.length, features: data.features.length };
    data.audit = { expected: target || null, actual, complete: !target || Object.keys(target).every((key) => actual[key] >= target[key]) };
    if (!data.audit.complete) console.warn(`[CHARACTER AUDIT] ${id} incompleto`, data.audit);
    return data;
  }

  async function decodeCandidate(paths, init) {
    if (!("DecompressionStream" in window)) throw new Error("El navegador no soporta la descompresión gzip requerida.");
    const chunks = [];
    for (const path of paths) {
      const response = await nativeFetch(withVersion(path), { ...init, cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);
      chunks.push(await response.text());
    }
    const encoded = chunks.join("").replace(/^\uFEFF/, "").replace(/\s+/g, "");
    if (!encoded.startsWith("H4sI")) throw new Error(`Contenido gzip inválido: ${paths[0]}`);
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return JSON.parse(await new Response(stream).text());
  }

  function legacySpell(spell) {
    return normalizeSpell({ name: spell.name, level: spell.level, schoolLabel: "—" });
  }

  function legacyItem(name, category) {
    return normalizeInventoryItem({ name, category });
  }

  function normalizeLegacy(character) {
    const data = {
      ...character,
      source: { systemVersion: "RESPALDO", fallback: true },
      hp: { value: character.hp?.current, max: character.hp?.max, temp: character.hp?.temp },
      ac: { value: character.ac, formula: "", armorSources: [], shieldSources: [] },
      movement: { modes: { walk: character.speed }, units: "ft" },
      spellcasting: { ability: "", abilityLabel: "", attack: 0, dc: 0, slots: [], pact: null },
      resources: [], hitDice: [], senses: { ranges: {}, units: "ft", special: "" },
      traits: {}, currency: {}, inspiration: false, exhaustion: 0,
      abilities: character.abilities || [], skills: character.skills || [], tools: [],
      inventory: [...(character.weapons || []).map((name) => legacyItem(name, "Arma")), ...(character.equipment || []).map((name) => legacyItem(name, "Equipo"))],
      features: (character.features || []).map((name) => normalizeFeature({ name })),
      spells: (character.spells || []).map(legacySpell), notes: character.notes || []
    };
    return normalizeCharacter(data, character.id);
  }

  async function loadLegacyCharacter(id) {
    const response = await nativeFetch(withVersion("characters.json"), { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}: characters.json`);
    const data = await response.json();
    const character = asArray(data.characters).find((entry) => entry.id === id);
    if (!character) throw new Error(`No existe ${id} en el respaldo.`);
    return normalizeLegacy(character);
  }

  async function loadCharacter(id, init) {
    if (cache.has(id)) return cache.get(id);
    const request = (async () => {
      const errors = [];
      for (const candidate of sources[id] || []) {
        try {
          const raw = await decodeCandidate(candidate, init);
          return normalizeCharacter(raw, id);
        } catch (error) {
          errors.push(error.message);
          console.warn(`[CHARACTER DATA] Falló ${id}: ${candidate.join(" + ")}`, error);
        }
      }
      const fallback = await loadLegacyCharacter(id);
      fallback.loadWarnings = errors;
      console.warn(`[CHARACTER DATA] Usando respaldo resumido para ${id}.`, errors);
      return fallback;
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
      return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } });
    } catch (error) {
      console.error(`[CHARACTER DATA] Error final para ${id}`, error);
      return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } });
    }
  };
})();