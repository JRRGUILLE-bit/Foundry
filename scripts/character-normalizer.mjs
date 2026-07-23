const expected = {
  artionketh: { spells: 38, inventory: 23, features: 36 },
  balder: { spells: 17, inventory: 12, features: 27 },
  ingwe: { spells: 29, inventory: 12, features: 21 },
  melkor: { spells: 7, inventory: 18, features: 38 },
  magna: { spells: 20, inventory: 5, features: 12 },
  sathar: { spells: 17, inventory: 11, features: 21 }
};

const canonical = {
  artionketh: { hp: [154, 154, 14], ac: 25, initiative: 2, walk: 40, subclasses: ["Oath of Glory", "Rune Knight"], spellAttack: 8, spellDc: 16 },
  balder: { hp: [139, 139, 0], ac: 20, initiative: 6, walk: 25, subclasses: ["Oath of Vengeance"], spellAttack: 10, spellDc: 18 },
  ingwe: { hp: [123, 123, 0], ac: 14, initiative: 2, walk: 30, subclasses: ["College of Lore"], spellAttack: 10, spellDc: 18 },
  melkor: { hp: [129, 129, 14], ac: 23, initiative: 10, walk: 50, subclasses: ["Way of Shadow", "Assassin", "Battle Master"], spellAttack: 6, spellDc: 14 },
  magna: { hp: [89, 89, 0], ac: 14, initiative: 2, walk: 30, subclasses: ["Divine Soul"], spellAttack: 10, spellDc: 18 },
  sathar: { hp: [132, 132, 25], ac: 18, initiative: 0, walk: 30, subclasses: ["Hexblade"], spellAttack: 10, spellDc: 18 }
};

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return Object.values(value);
  return [];
};

const asObject = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

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

function ensureNamedEntry(array, name, factory) {
  if (!array.some((entry) => entry?.name === name)) array.push(factory());
}

function applyCanonicalCorrections(data, id) {
  const fix = canonical[id];
  if (!fix) return data;

  data.hp.value = fix.hp[0];
  data.hp.max = fix.hp[1];
  data.hp.temp = fix.hp[2];
  data.ac.value = fix.ac;
  data.initiative = fix.initiative;
  data.movement.modes.walk = fix.walk;
  data.subclasses = [...fix.subclasses];
  if (data.spellcasting.ability) {
    data.spellcasting.attack = fix.spellAttack;
    data.spellcasting.dc = fix.spellDc;
  }

  if (id === "ingwe") {
    data.inventory = data.inventory.filter((item) => !/leather armor|armadura de cuero/i.test(item.name));
    ensureNamedEntry(data.inventory, "Brazaletes de Defensa +2", () => normalizeInventoryItem({
      name: "Brazaletes de Defensa +2", category: "Equipo", equipped: true, properties: ["Mágico"],
      description: "Mientras estén equipados, otorgan +2 a la Clase de Armadura y no cuentan como armadura."
    }));
  }

  if (id === "melkor") {
    ensureNamedEntry(data.inventory, "Brazaletes de Defensa +3", () => normalizeInventoryItem({
      name: "Brazaletes de Defensa +3", category: "Equipo", equipped: true, properties: ["Mágico"],
      description: "Mientras estén equipados, otorgan +3 a la Clase de Armadura y no cuentan como armadura."
    }));
  }

  if (id === "balder") {
    const replacements = new Map([
      ["Oath of the Watchers", "Oath of Vengeance"],
      ["Aura of the Sentinel", "Relentless Avenger"],
      ["Vigilant Rebuke", "Soul of Vengeance"]
    ]);
    data.features.forEach((feature) => { if (replacements.has(feature.name)) feature.name = replacements.get(feature.name); });
    data.features = data.features.filter((feature) => !/watchers/i.test(feature.name));
    [
      ["Oath of Vengeance", "Paladin 3"],
      ["Channel Divinity: Oath of Vengeance", "Oath of Vengeance 3"],
      ["Relentless Avenger", "Oath of Vengeance 7"],
      ["Soul of Vengeance", "Oath of Vengeance 15"]
    ].forEach(([name, requirements]) => ensureNamedEntry(data.features, name, () => normalizeFeature({ name, requirements })));
    [["Bane",1],["Hunter's Mark",1],["Hold Person",2],["Misty Step",2],["Haste",3],["Protection from Energy",3],["Banishment",4],["Dimension Door",4]]
      .forEach(([name, level]) => ensureNamedEntry(data.spells, name, () => normalizeSpell({ name, level })));
  }

  return data;
}

export function normalizeCharacter(raw, id) {
  const data = structuredClone(asObject(raw));
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
  data.inspiration = Boolean(data.inspiration);
  data.exhaustion = number(data.exhaustion);
  data.abilities = asArray(data.abilities).map((entry) => ({ ...asObject(entry), key: entry?.key || "", score: number(entry?.score), modifier: number(entry?.modifier), check: number(entry?.check ?? entry?.modifier), save: number(entry?.save ?? entry?.modifier), saveProficient: Boolean(entry?.saveProficient) }));
  data.skills = asArray(data.skills).map((entry) => ({ ...asObject(entry), name: entry?.name || entry?.key || "Habilidad", ability: entry?.ability || "", proficiency: number(entry?.proficiency), jackOfAllTrades: Boolean(entry?.jackOfAllTrades), bonus: number(entry?.bonus), passive: number(entry?.passive, 10 + number(entry?.bonus)) }));
  data.tools = asArray(data.tools);
  data.inventory = asArray(data.inventory).map(normalizeInventoryItem);
  data.features = asArray(data.features).map(normalizeFeature);
  data.spells = asArray(data.spells).map(normalizeSpell).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, "es"));
  data.notes = normalizeNotes(data.notes);

  applyCanonicalCorrections(data, id);

  data.actions = [...data.inventory, ...data.features]
    .filter((entry) => entry.activities.length)
    .map((entry) => ({ source: entry.name, sourceType: entry.category || "feature", description: entry.description || "", activities: entry.activities, uses: entry.uses || null }));

  const target = expected[id];
  const actual = { spells: data.spells.length, inventory: data.inventory.length, features: data.features.length };
  data.audit = { expected: target || null, actual, complete: !target || Object.keys(target).every((key) => actual[key] >= target[key]) };
  if (!data.audit.complete) {
    throw new Error(`${id} incompleto: esperado ${JSON.stringify(target)}, obtenido ${JSON.stringify(actual)}`);
  }
  return data;
}
