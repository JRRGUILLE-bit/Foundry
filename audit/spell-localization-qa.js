#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const json = (file) => JSON.parse(read(file));
const audit = {
  magna: json("audit/spells/magna.json"),
  melkor: json("audit/spells/melkor.json")
};
const auditByUrl = new Map([
  ["audit/spells/magna.json", audit.magna],
  ["audit/spells/melkor.json", audit.melkor]
]);

class ResponseMock {
  constructor(body, options = {}) {
    this._body = String(body ?? "");
    this.status = options.status ?? 200;
    this.statusText = options.statusText || "OK";
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = options.headers || new Map();
  }
  async json() { return JSON.parse(this._body); }
  async text() { return this._body; }
  clone() { return new ResponseMock(this._body, { status: this.status, statusText: this.statusText, headers: this.headers }); }
}

const events = [];
const sandbox = {
  console,
  Date,
  JSON,
  Math,
  Map,
  Set,
  Object,
  Array,
  String,
  Number,
  Boolean,
  RegExp,
  Error,
  TypeError,
  Promise,
  URL,
  Response: ResponseMock,
  Headers: class Headers extends Map {},
  CustomEvent: class CustomEvent { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } },
  location: { href: "https://example.test/index.html" },
  document: { querySelector() { return null; } },
  addEventListener() {},
  dispatchEvent(event) { events.push(event); },
  fetch: async (input) => {
    const url = new URL(typeof input === "string" ? input : input.url, "https://example.test/");
    const relative = url.pathname.replace(/^\//, "");
    if (auditByUrl.has(relative)) return new ResponseMock(JSON.stringify(auditByUrl.get(relative)));
    const desktop = relative.match(/^data\/characters\/(magna|melkor)\.json$/);
    if (desktop) {
      const character = sandbox.BANDA_CHARACTERS[desktop[1]];
      return new ResponseMock(JSON.stringify(character));
    }
    return new ResponseMock("{}", { status: 404, statusText: "Not Found" });
  }
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

for (const file of [
  "foundry_characters_static/characters.bundle.js",
  "character-static-runtime.js",
  "character-canonical-overrides.js",
  "mobile-character-view-model.js"
]) {
  vm.runInContext(read(file), sandbox, { filename: file, timeout: 10000 });
}

const before = Object.fromEntries(Object.entries(sandbox.BANDA_CHARACTERS).map(([id, character]) => [id, JSON.parse(JSON.stringify(character.spells || []))]));
const mechanical = (spell) => ({
  id: spell.id,
  level: spell.level,
  school: spell.school,
  prepared: spell.prepared,
  method: spell.method,
  concentration: spell.concentration,
  ritual: spell.ritual
});
const stable = (value) => JSON.stringify(value);

vm.runInContext(read("spell-localization-es.js"), sandbox, { filename: "spell-localization-es.js", timeout: 10000 });

(async () => {
  await Promise.all([sandbox.BANDA_SPELL_LOCALIZATION.load("magna"), sandbox.BANDA_SPELL_LOCALIZATION.load("melkor")]);

  assert.equal(stable([...sandbox.BANDA_SPELL_LOCALIZATION.targets]), stable(["magna", "melkor"]));
  assert.equal(sandbox.BANDA_SPELL_LOCALIZATION.ready("magna"), true);
  assert.equal(sandbox.BANDA_SPELL_LOCALIZATION.ready("melkor"), true);

  for (const id of ["magna", "melkor"]) {
    const character = sandbox.BANDA_CHARACTERS[id];
    const source = new Map(audit[id].spells.map((spell) => [spell.id, spell]));
    assert.equal(character.spells.length, audit[id].spellCount, `${id} spell count`);
    for (const spell of character.spells) {
      const localized = source.get(spell.id);
      assert.ok(localized, `${id}:${spell.id} exists in audit`);
      if (localized.name) assert.equal(spell.name, localized.name, `${id}:${spell.id} localized name`);
      if (localized.description) assert.equal(spell.description, localized.description, `${id}:${spell.id} localized description`);
      assert.equal(stable(mechanical(spell)), stable(mechanical(before[id].find((entry) => entry.id === spell.id))), `${id}:${spell.id} mechanics unchanged`);
    }
  }

  for (const id of ["artionketh", "balder", "ingwe", "sathar"]) {
    assert.equal(stable(sandbox.BANDA_CHARACTERS[id].spells), stable(before[id]), `${id} must remain untouched`);
  }

  const desktopResponse = await sandbox.fetch("data/characters/magna.json");
  const desktopCharacter = await desktopResponse.json();
  const expectedDesktop = audit.magna.spells.find((spell) => spell.id === desktopCharacter.spells[0].id);
  assert.equal(desktopCharacter.spells[0].name, expectedDesktop.name);

  assert.equal(events.filter((event) => event.type === "banda:spell-localization-ready").length, 2);
  assert.ok(read("index.html").includes('src="spell-localization-es.js?v=20260723-1"'));

  console.log(JSON.stringify({
    status: "SPELL_LOCALIZATION_QA_PASSED",
    targets: { magna: audit.magna.spellCount, melkor: audit.melkor.spellCount },
    untouched: ["artionketh", "balder", "ingwe", "sathar"],
    totalLocalized: audit.magna.spellCount + audit.melkor.spellCount
  }, null, 2));
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
