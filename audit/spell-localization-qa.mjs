#!/usr/bin/env node
"use strict";

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");
const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const failures = [];
const checks = [];

function check(name, condition, details = "") {
  const passed = Boolean(condition);
  checks.push({ name, passed, details });
  if (!passed) failures.push(`${name}${details ? `: ${details}` : ""}`);
}

const expectedLocales = {
  artionketh: "en",
  balder: "en",
  ingwe: "en",
  magna: "es",
  melkor: "es",
  sathar: "en"
};

const expectedNames = {
  magna: {
    UQyNolXpS2tTno4W: "Prestidigitación",
    AKzVK0M2rvGswx4L: "Rayo de escarcha",
    FwIOYu6VGcu5Xw7X: "Toque helado",
    QflsM41BgH91BaC5: "Caída de pluma",
    rVkx50mFl1HtThRl: "Curar heridas",
    LYbgbgZ6LINZplsT: "Escudo",
    AjoRBbyrShYt3KPq: "Proyectil mágico",
    jJ2K8U3uGGNGbezi: "Detectar pensamientos",
    h3zmXPhHRtO3wWIf: "Rayo abrasador",
    "56n4A0O9QuFUH2xC": "Inmovilizar persona",
    "7G73KSissqcUwnuL": "Bola de fuego",
    jG9xL7OOWJJxlPbO: "Luz del día",
    fxoCqiiSaea9DwTM: "Relámpago",
    qCJlbEGeJm04khaT: "Puerta dimensional",
    Kpscg5jIjl4lC0P8: "Círculo de teletransportación",
    "8RVPPGS8tu9C7p1h": "Mano arcana",
    p3SUcC91hi9q1uDO: "Cadena de relámpagos",
    PrbKLNvodK3mUXjg: "Telequinesis",
    c6FAcc3MRmWCUitV: "Rociada prismática",
    "4zkfk97kctVDE3hB": "Dominar monstruo"
  },
  melkor: {
    dWzFWbADUsv0DIon: "Ilusión menor",
    SCuq0QpsICcM8TlR: "Imagen especular",
    PdRNQV4cu8DyTMb0: "Oscuridad",
    di7iUi7U7ISL7hwf: "Pasar sin dejar rastro",
    fcpdwqcZV9Sbkd3H: "Silencio",
    "5LY2PfFqPIuYMpQ7": "Visión en la oscuridad",
    Dzan2aPdK45Hh9Gi: "Acelerar"
  }
};

const audits = {};
for (const id of Object.keys(expectedLocales)) {
  audits[id] = JSON.parse(await readFile(resolve(root, `audit/spells/${id}.json`), "utf8"));
}

class HeadersMock {
  constructor(init = {}) {
    this.values = new Map();
    if (init instanceof HeadersMock) {
      for (const [key, value] of init.values) this.values.set(key, value);
    } else if (init && typeof init === "object") {
      for (const [key, value] of Object.entries(init)) this.values.set(key.toLowerCase(), String(value));
    }
  }
  set(key, value) { this.values.set(String(key).toLowerCase(), String(value)); }
  get(key) { return this.values.get(String(key).toLowerCase()) || null; }
}

function response(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new HeadersMock({ "content-type": "application/json" }),
    async json() { return clone(data); },
    async text() { return JSON.stringify(data); },
    clone() { return response(data, status); }
  };
}

const sandbox = {
  console,
  JSON,
  Object,
  Array,
  String,
  Number,
  Boolean,
  RegExp,
  Date,
  Map,
  Set,
  Headers: HeadersMock,
  BANDA_MOBILE_VIEW_MODEL: {
    version: 1,
    build(input) {
      const id = typeof input === "string" ? input : input.id;
      return { id, spells: clone(audits[id].spells) };
    },
    buildAll() {
      return Object.keys(audits).map((id) => ({ id, spells: clone(audits[id].spells) }));
    },
    createSessionState() { return {}; },
    validate() { return { valid: true }; },
    makeSessionKey() { return "key"; }
  },
  async fetch(input) {
    const url = typeof input === "string" ? input : input?.url || "";
    if (url.startsWith("character-data:")) {
      const id = url.slice("character-data:".length);
      return response({ id, spells: clone(audits[id].spells) });
    }
    return response({ ok: true });
  }
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const runtimeSource = await readFile(resolve(root, "spell-localization-runtime.js"), "utf8");
new vm.Script(runtimeSource, { filename: "spell-localization-runtime.js" }).runInContext(sandbox);

const api = sandbox.BANDA_SPELL_LOCALIZATION;
check("runtime-api", Boolean(api?.localizeSpell && api?.localizeCharacter && api?.localeForCharacter));
check("runtime-default-locale", api?.defaultLocale === "en", String(api?.defaultLocale));

for (const [id, locale] of Object.entries(expectedLocales)) {
  check(`locale:${id}`, api.localeForCharacter(id) === locale, api.localeForCharacter(id));
}
check("locale:unknown-fallback", api.localeForCharacter("unknown") === "en", api.localeForCharacter("unknown"));

const englishPattern = /\b(?:the|you|your|creature|creatures|target|targets|spell|saving throw|within range|damage|action|bonus action|reaction|feet|foot|until|when|each|must|make|takes|higher levels?|choose|chosen|object|duration|rounds?|minutes?|hours?|self|touch|instantaneous)\b/i;
const englishLabelPattern = /\b(?:self|touch|instantaneous|minutes?|hours?|rounds?|feet|foot|ft|action|bonus action|reaction)\b/i;
const allowedComponents = new Set(["V", "S", "M", "Concentración", "Ritual"]);
const mechanicFields = ["id", "level", "school", "prepared", "method", "concentration", "ritual"];

for (const characterId of ["magna", "melkor"]) {
  const original = audits[characterId].spells;
  const localized = api.localizeSpells(characterId, original);
  check(`${characterId}:count`, localized.length === audits[characterId].spellCount, `${localized.length}/${audits[characterId].spellCount}`);
  check(`${characterId}:unique-ids`, new Set(localized.map((spell) => spell.id)).size === localized.length);

  localized.forEach((spell, index) => {
    const source = original[index];
    const expectedName = expectedNames[characterId][spell.id];
    check(`${characterId}:${spell.id}:name`, spell.name === expectedName, `${spell.name} !== ${expectedName}`);
    check(`${characterId}:${spell.id}:locale-marker`, spell.localization?.locale === "es", JSON.stringify(spell.localization));
    check(`${characterId}:${spell.id}:description`, Boolean(String(spell.description || "").trim()));
    check(`${characterId}:${spell.id}:description-spanish`, !englishPattern.test(String(spell.description || "")), String(spell.description || "").slice(0, 140));
    check(`${characterId}:${spell.id}:materials-spanish`, !englishPattern.test(String(spell.materials || "")), String(spell.materials || ""));
    check(`${characterId}:${spell.id}:activation-spanish`, !englishLabelPattern.test(String(spell.activation?.label || "")), String(spell.activation?.label || ""));
    check(`${characterId}:${spell.id}:range-spanish`, !englishLabelPattern.test(String(spell.range?.label || "")), String(spell.range?.label || ""));
    check(`${characterId}:${spell.id}:duration-spanish`, !englishLabelPattern.test(String(spell.duration?.label || "")), String(spell.duration?.label || ""));
    check(`${characterId}:${spell.id}:components`, (spell.components || []).every((entry) => allowedComponents.has(entry)), JSON.stringify(spell.components));
    check(`${characterId}:${spell.id}:search-text`, String(spell.searchText || "").includes(spell.name.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim()));

    for (const field of mechanicFields) {
      check(`${characterId}:${spell.id}:mechanic:${field}`, JSON.stringify(spell[field]) === JSON.stringify(source[field]), `${field} changed`);
    }
    check(`${characterId}:${spell.id}:activities-count`, (spell.activities || []).length === (source.activities || []).length);
    (spell.activities || []).forEach((activity) => {
      check(`${characterId}:${spell.id}:activity-name`, !englishPattern.test(String(activity.name || "")), String(activity.name || ""));
      check(`${characterId}:${spell.id}:activity-activation`, !englishLabelPattern.test(String(activity.activation?.label || "")), String(activity.activation?.label || ""));
      check(`${characterId}:${spell.id}:activity-range`, !englishLabelPattern.test(String(activity.range?.label || "")), String(activity.range?.label || ""));
      check(`${characterId}:${spell.id}:activity-target`, !englishLabelPattern.test(String(activity.target?.label || "")), String(activity.target?.label || ""));
      check(`${characterId}:${spell.id}:activity-duration`, !englishLabelPattern.test(String(activity.duration?.label || "")), String(activity.duration?.label || ""));
    });
  });
}

for (const characterId of ["artionketh", "balder", "ingwe", "sathar"]) {
  const original = audits[characterId].spells[0];
  const localized = api.localizeSpell(characterId, original);
  check(`${characterId}:english-fallback-unchanged`, JSON.stringify(localized) === JSON.stringify(original));
}

const mobileMagna = sandbox.BANDA_MOBILE_VIEW_MODEL.build("magna");
const mobileBalder = sandbox.BANDA_MOBILE_VIEW_MODEL.build("balder");
check("mobile-wrapper:magna", mobileMagna.spells[0].localization?.locale === "es");
check("mobile-wrapper:balder", !mobileBalder.spells[0].localization);

const desktopMagnaResponse = await sandbox.fetch("character-data:magna");
const desktopBalderResponse = await sandbox.fetch("character-data:balder");
const desktopMagna = await desktopMagnaResponse.json();
const desktopBalder = await desktopBalderResponse.json();
check("desktop-wrapper:magna", desktopMagna.spells[0].localization?.locale === "es");
check("desktop-wrapper:header", desktopMagnaResponse.headers.get("x-spell-localization") === "es-static-override");
check("desktop-wrapper:balder", !desktopBalder.spells[0].localization);

const report = {
  status: failures.length ? "SPELL_LOCALIZATION_QA_FAILED" : "SPELL_LOCALIZATION_QA_PASSED",
  characters: { magna: 20, melkor: 7, englishFallback: 4 },
  checks: { total: checks.length, passed: checks.filter((entry) => entry.passed).length, failed: failures.length },
  failures
};
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);