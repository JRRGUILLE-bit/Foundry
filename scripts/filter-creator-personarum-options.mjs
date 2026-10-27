#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const eq = token.indexOf("=");
    if (eq > 2) out[token.slice(2, eq)] = token.slice(eq + 1);
    else {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) { out[key] = next; i += 1; }
      else out[key] = true;
    }
  }
  return out;
}
const args = parseArgs(process.argv.slice(2));
const root = process.cwd();
const input = String(args.input ?? "creator-personarum-data/.player-options-metadata-index.json");
const output = String(args.output ?? "creator-personarum-data/player-options.json");
const booksPath = String(args.books ?? "data/books.json");
const adventuresPath = String(args.adventures ?? "data/adventures.json");
const load = p => JSON.parse(fs.readFileSync(path.resolve(root, p), "utf8"));
const norm = value => String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const code = value => String(value ?? "").replace(/[^a-z0-9]/gi, "").toUpperCase();
const inc = (obj, key) => { obj[key] = (obj[key] ?? 0) + 1; };
const allowedGroups = new Set(["core", "setting", "supplement"]);
const allowedAuthors = new Set(["wizards rpg team", "wizards of the coast"]);
const playerCategories = new Set([
  "species", "species_variant", "class", "subclass", "class_feature", "subclass_feature",
  "background", "feat", "spell", "equipment", "equipment_variant", "optional_feature",
  "character_creation_option", "language", "skill"
]);
const excludedCodes = new Set(["EGW", "EGTW", "CRCOTN", "TDCSR", "TDCS", "TCSR"]);
const rules2024 = new Set(["XPHB", "XDMG", "XMM", "XSRD", "SRD52", "SRD521", "PHB2024", "DMG2024", "MM2024"]);
const exandriaNames = ["exandria", "explorer's guide to wildemount", "explorers guide to wildemount", "critical role", "call of the netherdeep", "tal'dorei campaign setting", "taldorei campaign setting reborn"];

function isAllowedSource(record) {
  const author = norm(record.author);
  return allowedAuthors.has(author) &&
    allowedGroups.has(String(record.group ?? "").toLowerCase()) &&
    typeof record.published === "string" &&
    record.published < "2024-01-01";
}
const sourceIndex = new Map();
for (const source of [...(load(booksPath).book ?? []), ...(load(adventuresPath).adventure ?? [])]) {
  const k = code(source.source ?? source.id);
  if (!k || sourceIndex.has(k)) continue;
  sourceIndex.set(k, {
    code: k, name: source.name ?? source.source ?? k,
    published: source.published ?? null,
    group: source.group ?? null,
    allowed: isAllowedSource(source)
  });
}
sourceIndex.set("EEPC", { code: "EEPC", name: "Elemental Evil Player's Companion", published: "2015", group: "supplement", allowed: true });

const index = load(input);
if (!Array.isArray(index.records)) throw new Error("Metadata index is missing its records array.");
const excluded = { non_player_category: 0, exandria_critical_role: 0, "2024_or_later": 0, reference_only_source: 0, non_allowlisted_source: 0, missing_source: 0 };
const includedByCategory = {};
const includedBySource = {};
const excludedBySource = {};
const included = [];

for (const record of index.records) {
  if (!playerCategories.has(record.category)) { inc(excluded, "non_player_category"); continue; }
  if (!record.source) { inc(excluded, "missing_source"); inc(excludedBySource, "(missing source)"); continue; }
  const sourceCode = code(record.source);
  const sourceText = norm(record.source);
  if (excludedCodes.has(sourceCode) || sourceText.includes("exandria") || exandriaNames.some(n => sourceText.includes(norm(n)))) {
    inc(excluded, "exandria_critical_role"); inc(excludedBySource, sourceCode); continue;
  }
  if (rules2024.has(sourceCode) || sourceText.includes("2024") || sourceText.includes("5 5e") || sourceText.includes("srd 5 2")) {
    inc(excluded, "2024_or_later"); inc(excludedBySource, sourceCode); continue;
  }
  const source = sourceIndex.get(sourceCode);
  if (source?.published && source.published >= "2024-01-01") {
    inc(excluded, "2024_or_later"); inc(excludedBySource, sourceCode); continue;
  }
  if (sourceCode === "MM") { inc(excluded, "reference_only_source"); inc(excludedBySource, sourceCode); continue; }
  if (!source?.allowed) { inc(excluded, "non_allowlisted_source"); inc(excludedBySource, sourceCode); continue; }
  included.push({ ...record, ruleset: "dnd5e_2014", source: source.code });
  inc(includedByCategory, record.category);
  inc(includedBySource, source.code);
}
for (const required of ["species", "class", "subclass", "background", "feat", "spell"]) {
  if (!includedByCategory[required]) throw new Error("Filtered catalog is missing required category: " + required);
}
for (const record of included) {
  const source = sourceIndex.get(code(record.source));
  if (!(source?.allowed || record.source === "EEPC")) throw new Error("Disallowed source leaked into catalog: " + record.source);
}
included.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name) || a.source.localeCompare(b.source));
const result = {
  schema_version: 1,
  title: "Creator Personarum — D&D 5e Legacy/2014 player options",
  purpose: "Filtered metadata and mechanic indexes; lengthy descriptive rules prose is omitted.",
  generated_from: { index: input, books: booksPath, adventures: adventuresPath },
  policy: {
    include: "Wizards RPG Team official sources in core/setting/supplement groups published before 2024; plus EEPC 2015.",
    exclude: ["Exandria/Critical Role", "2024/5.5e", "Unearthed Arcana/playtest", "third-party/homebrew/unlisted sources", "missing source", "Monster Manual as player-option source"],
    campaign_specific_mechanical_exclusions: "Not applied by this generic source filter; do not exclude by keyword alone."
  },
  totals: {
    input_records: index.records.length,
    included_records: included.length,
    included_by_category: Object.fromEntries(Object.entries(includedByCategory).sort()),
    included_by_source: Object.fromEntries(Object.entries(includedBySource).sort()),
    excluded_by_reason: Object.fromEntries(Object.entries(excluded).sort()),
    excluded_by_source: Object.fromEntries(Object.entries(excludedBySource).sort())
  },
  records: included
};
const out = path.resolve(root, output);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(result, null, 2) + "\n", "utf8");
console.log(JSON.stringify({ output, totals: result.totals }, null, 2));
