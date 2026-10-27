#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function argsOf(argv) {
  const out = {};
  for (let i=0; i<argv.length; i++) {
    if (!argv[i].startsWith("--")) continue;
    const [key, inline] = argv[i].slice(2).split("=", 2);
    if (inline !== undefined) out[key] = inline;
    else if (argv[i+1] && !argv[i+1].startsWith("--")) out[key] = argv[++i];
    else out[key] = true;
  }
  return out;
}
function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (error) { throw new Error("Invalid JSON " + file + ": " + error.message); }
}
function normalize(value) {
  return String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function codeOf(value) {
  return String(value ?? "").replace(/[^a-z0-9]/gi, "").toUpperCase();
}
const EXANDRIA_CODES = new Set(["EGW", "EGTW", "CRCOTN", "TDCSR", "TDCS", "TCSR"]);
const EXANDRIA_NAMES = ["exandria", "explorersguidetowildemount", "criticalrole", "callofthenetherdeep", "taldoreicampaignsetting", "taldorei"];
const RULES_2024_CODES = new Set(["XPHB", "XDMG", "XMM", "XSRD", "SRD52", "SRD521", "PHB2024", "DMG2024", "MM2024"]);
const args = argsOf(process.argv.slice(2));
const upstream = path.resolve(String(args.upstream ?? ""));
const output = path.resolve(String(args.output ?? "creator-personarum-data/.player-options-metadata-index.json"));
if (!upstream || !fs.existsSync(path.join(upstream, "data"))) throw new Error("Missing --upstream checkout of 5etools-mirror-3/5etools-2014-src");

const rows = [];
const excluded = { exandria: 0, rules_2024: 0 };
const missingSource = {};
const sourceCounts = {};
const categoryCounts = {};

function passesSource(source) {
  const code = codeOf(source);
  const normalized = normalize(source).replace(/\s/g, "");
  const isExandria = EXANDRIA_CODES.has(code) || normalized.includes("exandria") ||
    EXANDRIA_NAMES.some(name => normalized.includes(name));
  if (isExandria) { excluded.exandria++; return false; }
  if (RULES_2024_CODES.has(code) || normalized.includes("2024") || normalized.includes("5.5e")) {
    excluded.rules_2024++; return false;
  }
  return true;
}

function cleanPrerequisite(record) {
  const p = record?.prerequisite ?? record?.prerequisites ?? null;
  if (!p) return null;
  if (!Array.isArray(p)) return p;
  return p.map(x => {
    if (!x || typeof x !== "object") return x;
    const out = {};
    for (const key of ["ability", "minimum", "minimum_score", "level", "race", "proficiency", "spellcasting", "other", "feature"]) {
      if (x[key] !== undefined) out[key] = x[key];
    }
    return out;
  });
}

function add(category, record, extra={}) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return;
  const name = record.name ?? record.shortName ?? record.title ?? null;
  if (!name) return;
  const source = record.source ?? record.subclassSource ?? record.classSource ?? null;
  if (source && !passesSource(source)) return;
  if (!source) missingSource[category] = (missingSource[category] ?? 0) + 1;
  const sourceCode = source == null ? null : String(source);
  if (sourceCode) sourceCounts[sourceCode] = (sourceCounts[sourceCode] ?? 0) + 1;
  const item = {
    category,
    name: String(name),
    source: sourceCode,
    page: Number.isInteger(record.page) ? record.page : null,
    id: record.id ?? record.index ?? null,
    ruleset: "dnd5e_2014",
    reference_url: sourceCode ? "https://5e.tools/" : null,
    ...extra
  };
  // Metadata/mechanical fields only. Long descriptive rules prose (entries/desc/fluff) is not copied.
  for (const key of [
    "level", "school", "time", "range", "components", "duration", "concentration", "ritual",
    "classes", "subclasses", "className", "classSource", "subclassShortName",
    "hitDice", "hd", "proficiency", "spellcastingAbility", "ability", "speed", "size",
    "skillProficiencies", "languageProficiencies", "toolProficiencies",
    "weaponProficiencies", "armorProficiencies", "startingEquipment",
    "rarity", "type", "weaponCategory", "wondrous", "value", "weight",
    "damage", "range", "prerequisite", "prerequisites", "featureType", "optional"
  ]) {
    if (record[key] !== undefined) item[key] = record[key];
  }
  const prerequisite = cleanPrerequisite(record);
  if (prerequisite !== null) item.prerequisites = prerequisite;
  rows.push(item);
  categoryCounts[category] = (categoryCounts[category] ?? 0) + 1;
}

function readCollection(relativePath, prop, category, extraForRecord=()=>({})) {
  const file = path.join(upstream, relativePath);
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) return;
  const data = readJson(file);
  const values = Array.isArray(data) ? data : data[prop];
  if (!Array.isArray(values)) return;
  for (const record of values) add(category, record, extraForRecord(record));
}

// Basic player-option and equipment collections.
readCollection("data/feats.json", "feat", "feat");
readCollection("data/backgrounds.json", "background", "background");
readCollection("data/races.json", "race", "species");
readCollection("data/races.json", "subrace", "species_variant", record => ({ parent_name: record.raceName ?? record._copy?.raceName ?? null }));
readCollection("data/items-base.json", "baseitem", "equipment");
readCollection("data/items.json", "item", "equipment");
readCollection("data/magicvariants.json", "variant", "equipment_variant");
readCollection("data/optionalfeatures.json", "optionalfeature", "optional_feature");
readCollection("data/charcreationoptions.json", "charoption", "character_creation_option");
readCollection("data/rewards.json", "reward", "reward");
readCollection("data/deities.json", "deity", "deity");
readCollection("data/languages.json", "language", "language");
readCollection("data/skills.json", "skill", "skill");
readCollection("data/conditionsdiseases.json", "condition", "condition_or_disease");
readCollection("data/variantrules.json", "variantrule", "variant_rule");
readCollection("data/actions.json", "action", "action");

// Each 2014 class file contains class, subclass, and feature records. Copy indexable mechanics metadata only.
const classIndexPath = path.join(upstream, "data/class/index.json");
if (fs.existsSync(classIndexPath)) {
  const classIndex = readJson(classIndexPath);
  for (const [classKey, fileName] of Object.entries(classIndex)) {
    const file = path.join(upstream, "data/class", fileName);
    if (!fs.existsSync(file)) continue;
    const doc = readJson(file);
    for (const klass of (doc.class ?? [])) {
      add("class", klass, { class_key: classKey });
    }
    for (const subclass of (doc.subclass ?? [])) {
      add("subclass", subclass, { class_key: classKey, class_name: subclass.className ?? classKey });
    }
    for (const feature of (doc.classFeature ?? [])) {
      add("class_feature", feature, { class_key: classKey, class_name: feature.className ?? classKey });
    }
    for (const feature of (doc.subclassFeature ?? [])) {
      add("subclass_feature", feature, { class_key: classKey, class_name: feature.className ?? classKey });
    }
  }
}

// The source index tells us which 2014 spell files belong to each book. EGW is explicitly omitted.
const spellIndexPath = path.join(upstream, "data/spells/index.json");
if (fs.existsSync(spellIndexPath)) {
  const spellIndex = readJson(spellIndexPath);
  for (const [bookCode, fileName] of Object.entries(spellIndex)) {
    const file = path.join(upstream, "data/spells", fileName);
    if (!fs.existsSync(file)) continue;
    const doc = readJson(file);
    for (const spell of (doc.spell ?? [])) add("spell", spell, { indexed_in_book: bookCode });
  }
}

// Deduplicate only identical category/name/source/class combinations; keep same-named options from different books.
const unique = new Map();
for (const row of rows) {
  const key = [row.category, normalize(row.name), codeOf(row.source), normalize(row.class_name ?? row.className ?? "")].join("|");
  if (!unique.has(key)) unique.set(key, row);
}
const finalRows = [...unique.values()].sort((a,b)=>
  a.category.localeCompare(b.category) ||
  a.name.localeCompare(b.name) ||
  String(a.source ?? "").localeCompare(String(b.source ?? ""))
);

const report = {
  schema_version: 1,
  purpose: "Metadata and mechanical indexes from the 2014 reference repository; descriptive prose is intentionally omitted.",
  upstream: {
    repository: "5etools-mirror-3/5etools-2014-src",
    commit: "26fdaebc48e66a1494c6092b97c60a3c4674c6d4",
    ruleset: "D&D 5e Legacy / 2014"
  },
  filter: {
    excluded_exandria_records: excluded.exandria,
    excluded_2024_records: excluded.rules_2024,
    other_sources: "included as candidates for later campaign review",
    automatic_approval: false
  },
  totals: {
    records: finalRows.length,
    categories: Object.fromEntries(Object.entries(categoryCounts).sort(([a],[b])=>a.localeCompare(b))),
    by_primary_source: Object.fromEntries(Object.entries(sourceCounts).sort(([a],[b])=>a.localeCompare(b))),
    missing_primary_source_by_category: Object.fromEntries(Object.entries(missingSource).sort(([a],[b])=>a.localeCompare(b)))
  },
  records: finalRows
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify({output, totals:report.totals, filter:report.filter}, null, 2));
