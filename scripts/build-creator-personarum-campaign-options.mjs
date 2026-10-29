#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const out = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const separator = token.indexOf("=");
    if (separator > 2) out[token.slice(2, separator)] = token.slice(separator + 1);
    else if (argv[index + 1] && !argv[index + 1].startsWith("--")) out[token.slice(2)] = argv[++index];
    else out[token.slice(2)] = true;
  }
  return out;
}

function readJson(root, relativePath) {
  const file = path.join(root, relativePath);
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error("Cannot read canonical campaign JSON " + relativePath + ": " + error.message);
  }
}

const args = parseArgs(process.argv.slice(2));
const campaignRoot = path.resolve(String(args["campaign-root"] ?? "../Firmamentum-Velatum"));
const outputPath = path.resolve(String(args.output ?? "creator-personarum-data/campaign-options.json"));
const originsPath = "character-data/campaign/kingdoms/canonical-racial-origins.json";
const racesPath = "character-data/rules/races/races.json";
const classesPath = "character-data/rules/classes/classes.json";
const subclassesPath = "character-data/rules/subclasses/subclasses.json";
const exclusionsPath = "character-data/campaign/excluded-subclass-records.json";

const origins = readJson(campaignRoot, originsPath);
const races = readJson(campaignRoot, racesPath);
const classes = readJson(campaignRoot, classesPath);
const subclasses = readJson(campaignRoot, subclassesPath);
const exclusions = readJson(campaignRoot, exclusionsPath);

if (origins.canonical_status !== "campaign_canon" || origins.source_of_truth !== true) {
  throw new Error("Canonical racial/origin source is not marked as campaign source of truth.");
}
if (![races, classes, subclasses].every(Array.isArray)) {
  throw new Error("Canonical race, class and subclass files must be JSON arrays.");
}

const readyRaceStatuses = new Set(["ready", "verified", "mapped_core_ancestries"]);
const blockedSubclassIds = new Set((exclusions.excluded_subclass_records ?? []).map(record => record.record_id));
const raceById = new Map(races.map(record => [record.id, record]));
const classById = new Map(classes.map(record => [record.id, record]));
const shortAbility = {
  strength: "str",
  dexterity: "dex",
  constitution: "con",
  intelligence: "int",
  wisdom: "wis",
  charisma: "cha"
};
const sizeCode = { Tiny: "T", Small: "S", Medium: "M", Large: "L", Huge: "H", Gargantuan: "G" };
const sourceOf = record => record?.source_refs?.[0]?.source_id ?? "";

function abilityGroups(mechanics) {
  const raw = mechanics?.ability_score_increase ?? {};
  if (Number.isInteger(raw.choice_count) && Number.isInteger(raw.choice_amount)) {
    return [{
      choose: {
        count: raw.choice_count,
        amount: raw.choice_amount,
        from: Object.values(shortAbility)
      }
    }];
  }
  if (raw.choose && typeof raw.choose === "object") {
    const choice = raw.choose;
    return [{
      choose: {
        count: Number.isInteger(choice.count) ? choice.count : 1,
        amount: Number.isInteger(choice.amount) ? choice.amount : 1,
        from: Array.isArray(choice.from)
          ? choice.from.map(key => shortAbility[key] ?? key).filter(key => Object.values(shortAbility).includes(key))
          : []
      }
    }];
  }
  const fixed = Object.fromEntries(
    Object.entries(raw)
      .filter(([key, value]) => shortAbility[key] && Number.isFinite(value) && value > 0)
      .map(([key, value]) => [shortAbility[key], value])
  );
  return Object.keys(fixed).length ? [fixed] : [];
}

const records = [];
for (const option of origins.playable_options ?? []) {
  if (option.campaign_canon_status !== "approved" || !readyRaceStatuses.has(option.rules_data_status)) continue;
  const sourceRaces = (option.character_data_record_ids ?? []).map(id => raceById.get(id));
  if (!sourceRaces.length || sourceRaces.some(record =>
    !record || record.campaign_status !== "approved" || record.data_quality !== "verified"
  )) {
    throw new Error("Playable race option is missing verified rules data: " + option.id);
  }
  const primary = sourceRaces[0];
  const mechanics = primary.mechanics ?? {};
  const languages = Array.isArray(mechanics.languages)
    ? mechanics.languages.filter(language => language !== "Choice")
    : [];
  records.push({
    category: "species",
    id: option.id,
    record_ids: sourceRaces.map(record => record.id),
    family_id: option.family_id,
    name: option.name.es,
    name_en: option.name.en,
    source: "Firmamentum Velatum — canon aprobado",
    source_refs: sourceRaces.flatMap(record => record.source_refs ?? []),
    campaign_status: "approved",
    data_quality: option.rules_data_status,
    size: mechanics.size && sizeCode[mechanics.size] ? [sizeCode[mechanics.size]] : [],
    speed: mechanics.speed ?? null,
    darkvision: mechanics.darkvision ?? null,
    ability: abilityGroups(mechanics),
    languageProficiencies: languages.length
      ? [Object.fromEntries(languages.map(language => [language.toLowerCase(), true]))]
      : [],
    traits: Array.isArray(mechanics.traits) ? mechanics.traits : [],
    ancestry_choices: sourceRaces.length > 1
      ? sourceRaces.map(record => ({
          id: record.id,
          name: record.name.es,
          name_en: record.name.en,
          mechanics: record.mechanics
        }))
      : []
  });
}

for (const record of classes) {
  if (record.campaign_status !== "approved" || record.data_quality !== "verified") continue;
  const mechanics = record.mechanics ?? {};
  records.push({
    category: "class",
    id: record.id,
    class_key: record.id.replace(/^class\\./, ""),
    name: record.name.es,
    name_en: record.name.en,
    source: sourceOf(record),
    source_refs: record.source_refs ?? [],
    campaign_status: record.campaign_status,
    data_quality: record.data_quality,
    hitDice: mechanics.hit_die,
    primary_ability: mechanics.primary_ability ?? [],
    savingThrowProficiencies: mechanics.saving_throw_proficiencies ?? [],
    armorProficiencies: mechanics.armor_proficiencies ?? [],
    weaponProficiencies: mechanics.weapon_proficiencies ?? [],
    toolProficiencies: mechanics.tool_proficiencies ?? [],
    spellcastingAbility: mechanics.spellcasting_ability ?? null,
    skillChoices: {
      count: Number(mechanics.skill_choices?.choose ?? 0),
      skills: Array.isArray(mechanics.skill_choices?.from) ? mechanics.skill_choices.from : [],
      any: Array.isArray(mechanics.skill_choices?.from) && mechanics.skill_choices.from.includes("Any")
    },
    mechanics
  });
}

for (const subclass of subclasses) {
  if (subclass.campaign_status !== "approved" || subclass.data_quality !== "verified" || blockedSubclassIds.has(subclass.id)) continue;
  const parent = classById.get(subclass.class_id);
  if (!parent || parent.campaign_status !== "approved" || parent.data_quality !== "verified") continue;

  const classKey = subclass.class_id.replace(/^class\\./, "");
  const source = sourceOf(subclass);
  records.push({
    category: "subclass",
    id: subclass.id,
    class_id: subclass.class_id,
    class_key: classKey,
    class_name: parent.name.es,
    name: subclass.name.es,
    name_en: subclass.name.en,
    source,
    source_refs: subclass.source_refs ?? [],
    level: subclass.mechanics?.subclass_level ?? null,
    campaign_status: subclass.campaign_status,
    data_quality: subclass.data_quality,
    mechanics: subclass.mechanics ?? {}
  });

  for (const feature of subclass.mechanics?.features ?? []) {
    const featureName = feature.name?.en ?? feature.name?.es ?? "feature";
    records.push({
      category: "subclass_feature",
      id: subclass.id + "." + String(feature.level) + "." + String(featureName).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      class_id: subclass.class_id,
      class_key: classKey,
      class_name: parent.name.es,
      subclass_id: subclass.id,
      subclassShortName: subclass.name.es,
      name: feature.name?.es ?? feature.name?.en,
      name_en: feature.name?.en ?? feature.name?.es,
      level: feature.level,
      source,
      source_refs: subclass.source_refs ?? [],
      campaign_status: "approved",
      data_quality: "verified"
    });
  }
}

const includedByCategory = records.reduce((counts, record) => {
  counts[record.category] = (counts[record.category] ?? 0) + 1;
  return counts;
}, {});
if (includedByCategory.species !== 26) {
  throw new Error("Expected 26 currently implementation-ready campaign race options; got " + includedByCategory.species);
}
if (includedByCategory.class !== 13) {
  throw new Error("Expected 13 approved campaign classes; got " + includedByCategory.class);
}
if (includedByCategory.subclass !== 39) {
  throw new Error("Expected 39 approved and verified campaign subclasses; got " + includedByCategory.subclass);
}
if (records.some(record => blockedSubclassIds.has(record.id))) {
  throw new Error("An explicitly excluded subclass leaked into campaign options.");
}

const result = {
  schema_version: 1,
  title: "Creator Personarum — options approved by Firmamentum Velatum canon",
  source_of_truth: {
    repository: "JRRGUILLE-bit/Firmamentum-Velatum",
    branch: "main",
    status: "campaign_canon"
  },
  ruleset_id: "dnd5e_2014",
  generated_from: [originsPath, racesPath, classesPath, subclassesPath, exclusionsPath],
  policy: {
    only_approved_campaign_options: true,
    race_requires_ready_or_verified_rule_data: true,
    class_requires_campaign_status_approved_and_data_quality_verified: true,
    subclass_requires_campaign_status_approved_and_data_quality_verified: true,
    excluded_subclasses_removed: [...blockedSubclassIds],
    generic_source_catalog_is_not_a_player_option_source: true,
    categories_without_canonical_approval_data: ["background", "feat", "spell", "class_feature", "zodiac_mark"],
    categories_without_canonical_approval_data_are_omitted: true
  },
  totals: { included_records: records.length, included_by_category: includedByCategory },
  records
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + "\\n", "utf8");
console.log(JSON.stringify({ output: outputPath, totals: result.totals }, null, 2));
