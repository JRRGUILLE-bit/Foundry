#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const failures = [];
const warnings = [];
const checks = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function check(name, condition, details = null) {
  checks.push({ name, passed: Boolean(condition), details });
  if (!condition) failures.push(details ? `${name}: ${details}` : name);
}

function compile(relativePath) {
  const source = read(relativePath);
  try {
    new vm.Script(source, { filename: relativePath });
    check(`syntax:${relativePath}`, true);
  } catch (error) {
    check(`syntax:${relativePath}`, false, error.message);
  }
  return source;
}

const browserScripts = [
  "character-static-runtime.js",
  "character-canonical-overrides.js",
  "mobile-character-view-model.js",
  "characters.js",
  "desktop-character-portraits.js",
  "mobile-character-shell.js",
  "mobile-spells-renderer.js",
  "mobile-inventory-renderer.js",
  "mobile-features-renderer.js",
  "mobile-more-renderer.js",
  "mobile-character-portraits.js"
];

const sources = Object.fromEntries(browserScripts.map((file) => [file, compile(file)]));
const bundleSource = compile("foundry_characters_static/characters.bundle.js");

const index = read("index.html");
const orderedScripts = [
  "foundry_characters_static/characters.bundle.js",
  "character-static-runtime.js",
  "character-canonical-overrides.js",
  "mobile-character-view-model.js",
  "characters.js",
  "desktop-character-portraits.js",
  "mobile-character-shell.js",
  "mobile-spells-renderer.js",
  "mobile-inventory-renderer.js",
  "mobile-features-renderer.js",
  "mobile-more-renderer.js",
  "mobile-character-portraits.js"
];
let lastPosition = -1;
for (const script of orderedScripts) {
  const position = index.indexOf(`src="${script}`);
  check(`index-load:${script}`, position >= 0, "script missing from index.html");
  check(`index-order:${script}`, position > lastPosition, "script load order is invalid");
  if (position >= 0) lastPosition = position;
}

const rendererContracts = [
  ["mobile-spells-renderer.js", "BANDA_MOBILE_SPELLS", "data-a11-root", "spells"],
  ["mobile-inventory-renderer.js", "BANDA_MOBILE_INVENTORY", "data-a12-root", "inventory"],
  ["mobile-features-renderer.js", "BANDA_MOBILE_FEATURES", "data-a13-root", "features"],
  ["mobile-more-renderer.js", "BANDA_MOBILE_MORE", "data-a14-root", "more"]
];
for (const [file, globalName, marker, tab] of rendererContracts) {
  const source = sources[file];
  check(`renderer-global:${file}`, source.includes(globalName), `${globalName} not exported`);
  check(`renderer-marker:${file}`, source.includes(marker), `${marker} not rendered`);
  check(`renderer-tab:${file}`, source.includes(`data-tab="${tab}"`), `tab ${tab} not wired`);
  check(`renderer-mobile-scope:${file}`, source.includes("max-width:820px"), "mobile media scope missing");
  check(`renderer-touch-targets:${file}`, /(?:min-height|height):4[4-9]px/.test(source), "44px touch target evidence missing");
  check(`renderer-no-desktop-dom:${file}`, !/querySelector\([^)]*\.cv-(?:sheet|sidebar|tabs|content)/.test(source), "desktop character DOM is used as a data source");
}

const sandbox = {
  console,
  Date,
  JSON,
  Math,
  Map,
  Set,
  WeakMap,
  WeakSet,
  Object,
  Array,
  String,
  Number,
  Boolean,
  RegExp,
  Error,
  TypeError,
  Intl,
  Headers: class Headers { constructor(init = {}) { this.values = init; } },
  fetch: async () => ({ ok: true, status: 200, json: async () => ({}), text: async () => "" }),
  structuredClone: global.structuredClone
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

function execute(relativePath, source) {
  try {
    vm.runInContext(source, sandbox, { filename: relativePath, timeout: 10000 });
    check(`execute:${relativePath}`, true);
  } catch (error) {
    check(`execute:${relativePath}`, false, error.stack || error.message);
  }
}

execute("foundry_characters_static/characters.bundle.js", bundleSource);
execute("character-static-runtime.js", sources["character-static-runtime.js"]);
execute("character-canonical-overrides.js", sources["character-canonical-overrides.js"]);
execute("mobile-character-view-model.js", sources["mobile-character-view-model.js"]);

const characters = sandbox.BANDA_CHARACTERS || sandbox.BANDA_CHARACTER_DATA?.characters || {};
const api = sandbox.BANDA_MOBILE_VIEW_MODEL;
const characterIds = Object.keys(characters).sort();
const expectedIds = ["artionketh", "balder", "ingwe", "magna", "melkor", "sathar"].sort();
check("canonical-character-count", characterIds.length === 6, `expected 6, found ${characterIds.length}`);
check("canonical-character-ids", JSON.stringify(characterIds) === JSON.stringify(expectedIds), `found ${characterIds.join(", ")}`);
check("adapter-global", Boolean(api?.build && api?.buildAll && api?.createSessionState && api?.validate), "mobile adapter API incomplete");

const raceExpectations = { artionketh: "Tiefling", melkor: "Semielfo", sathar: "Humano" };
for (const [id, race] of Object.entries(raceExpectations)) {
  check(`canonical-race:${id}`, characters[id]?.race === race, `expected ${race}, found ${characters[id]?.race}`);
}

const totals = { actions: 0, spells: 0, inventory: 0, features: 0, resources: 0, warnings: 0 };
const characterResults = [];
if (api) {
  for (const id of characterIds) {
    try {
      const sessionState = api.createSessionState(id, { sessionId: `qa-${id}` });
      const model = api.build(id, { sessionState, throwOnInvalid: false });
      check(`model-valid:${id}`, model.validation.valid, model.validation.errors.join("; "));
      check(`session-character:${id}`, sessionState.characterId === id, "session character mismatch");
      check(`session-schema:${id}`, sessionState.schemaVersion === 1, `schema ${sessionState.schemaVersion}`);
      check(`session-shape:${id}`, Boolean(sessionState.hp && sessionState.resources && sessionState.spellSlots && sessionState.inventoryUses && sessionState.deathSaves), "session state fields missing");

      for (const domain of ["actions", "spells", "inventory", "features"]) {
        const ids = model[domain].map((entry) => entry.id);
        check(`stable-ids:${id}:${domain}`, ids.length === new Set(ids).size && ids.every(Boolean), "missing or duplicate stable ID");
        check(`source-links:${id}:${domain}`, model[domain].every((entry) => entry.source?.linked), "broken canonical source link");
      }

      if (model.combat.hp.canonicalMaximum > 0) {
        sessionState.hp.current = Math.max(0, model.combat.hp.canonicalMaximum - 1);
        sessionState.hp.temporary = 3;
      }
      const firstResource = model.combat.resources.find((entry) => Number.isFinite(Number(entry.canonicalMax)) && Number(entry.canonicalMax) > 0);
      if (firstResource) {
        sessionState.resources[firstResource.id] ||= {};
        sessionState.resources[firstResource.id].current = Math.max(0, Number(firstResource.canonicalMax) - 1);
      }
      const firstSlot = model.combat.spellcasting.slots.find((entry) => Number(entry.max) > 0) || model.combat.spellcasting.pact;
      if (firstSlot) {
        sessionState.spellSlots[firstSlot.key] ||= {};
        sessionState.spellSlots[firstSlot.key].current = Math.max(0, Number(firstSlot.max) - 1);
      }
      const firstInventory = model.inventory[0];
      if (firstInventory) {
        sessionState.inventoryUses[firstInventory.id] ||= {};
        sessionState.inventoryUses[firstInventory.id].quantity = 7;
      }
      sessionState.inspiration = true;
      sessionState.exhaustion = 2;
      sessionState.conditions = ["QA condition"];
      sessionState.deathSaves = { successes: 2, failures: 1 };
      sessionState.sessionNotes = "QA note";

      const overlaid = api.build(id, { sessionState, throwOnInvalid: false });
      check(`overlay-valid:${id}`, overlaid.validation.valid, overlaid.validation.errors.join("; "));
      check(`overlay-hp:${id}`, overlaid.combat.hp.sessionCurrent === sessionState.hp.current && overlaid.combat.hp.sessionTemporary === 3, "HP overlay failed");
      if (firstResource) check(`overlay-resource:${id}`, overlaid.combat.resources.find((entry) => entry.id === firstResource.id)?.sessionCurrent === sessionState.resources[firstResource.id].current, "resource overlay failed");
      if (firstSlot) {
        const allSlots = [...overlaid.combat.spellcasting.slots, ...(overlaid.combat.spellcasting.pact ? [overlaid.combat.spellcasting.pact] : [])];
        check(`overlay-slot:${id}`, allSlots.find((entry) => entry.key === firstSlot.key)?.sessionCurrent === sessionState.spellSlots[firstSlot.key].current, "slot overlay failed");
      }
      if (firstInventory) check(`overlay-inventory:${id}`, overlaid.inventory.find((entry) => entry.id === firstInventory.id)?.quantity === 7, "inventory overlay failed");
      check(`overlay-more:${id}`, overlaid.more.inspiration === true && overlaid.more.exhaustion === 2 && overlaid.more.conditions[0] === "QA condition" && overlaid.more.deathSaves.successes === 2 && overlaid.more.sessionNotes === "QA note", "More/session overlay failed");

      totals.actions += model.actions.length;
      totals.spells += model.spells.length;
      totals.inventory += model.inventory.length;
      totals.features += model.features.length;
      totals.resources += model.combat.resources.length;
      totals.warnings += model.validation.warnings.length;
      characterResults.push({
        id,
        valid: model.validation.valid,
        actions: model.actions.length,
        spells: model.spells.length,
        inventory: model.inventory.length,
        features: model.features.length,
        resources: model.combat.resources.length,
        warnings: model.validation.warnings.length
      });
    } catch (error) {
      check(`model-exception:${id}`, false, error.stack || error.message);
    }
  }
}

const expectedTotals = { actions: 89, spells: 126, inventory: 80, features: 155, resources: 37 };
for (const [key, expected] of Object.entries(expectedTotals)) {
  check(`global-total:${key}`, totals[key] === expected, `expected ${expected}, found ${totals[key]}`);
}
check("global-unresolved-actions", characterResults.length === 6, "not all characters completed QA");

const portraitFiles = [
  "balder_portrait.webp",
  "ingwe_portrait.webp",
  "melkor_portrait.webp",
  "magna_portrait.webp",
  "arti_portrait.webp",
  "sathar_portrait.webp"
];
for (const file of portraitFiles) check(`portrait:${file}`, fs.existsSync(path.join(root, file)), "portrait file missing");

if (totals.warnings !== 53) warnings.push(`Expected 53 non-blocking data warnings, found ${totals.warnings}.`);

const report = {
  status: failures.length ? "FAILED" : "PASSED",
  generatedAt: new Date().toISOString(),
  characters: characterResults,
  totals,
  checks: { passed: checks.filter((entry) => entry.passed).length, failed: failures.length },
  failures,
  warnings
};

console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
