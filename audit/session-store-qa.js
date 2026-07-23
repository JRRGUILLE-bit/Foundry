#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const source = fs.readFileSync(process.argv[2] || "mobile-session-store.js", "utf8");

class StorageMock {
  constructor() { this.data = new Map(); }
  get length() { return this.data.size; }
  key(index) { return [...this.data.keys()][index] ?? null; }
  getItem(key) { return this.data.has(String(key)) ? this.data.get(String(key)) : null; }
  setItem(key, value) { this.data.set(String(key), String(value)); }
  removeItem(key) { this.data.delete(String(key)); }
  clear() { this.data.clear(); }
}

const rawGetItem = StorageMock.prototype.getItem;
const localStorage = new StorageMock();
const now = Date.now();
const initial = {
  schemaVersion: 1,
  sessionId: "session-old",
  characterId: "hero",
  updatedAt: new Date(now).toISOString(),
  hp: { current: 20, temporary: 0 },
  resources: { rage: { current: 2, spent: 0 } },
  spellSlots: { "slot:1": { current: 3 } },
  inventoryUses: { potion: { current: null, spent: null, quantity: 1 } },
  conditions: [],
  deathSaves: { successes: 0, failures: 0 },
  inspiration: false,
  exhaustion: 0,
  sessionNotes: ""
};
localStorage.setItem("banda.mobile.session.v1.hero", JSON.stringify({ expiresAt: now + 100000, state: initial }));
localStorage.setItem("banda.mobile.inventory.v1.hero.session-old", JSON.stringify({
  expiresAt: now + 100000,
  characterId: "hero",
  sessionId: "session-old",
  inventoryUses: { potion: { current: null, spent: null, quantity: 3 } }
}));
localStorage.setItem("banda.mobile.more.v1.hero.session-old", JSON.stringify({
  expiresAt: now + 100000,
  sessionId: "session-old",
  state: {
    inspiration: true,
    exhaustion: 2,
    conditions: ["Poisoned"],
    deathSaves: { successes: 1, failures: 0 },
    sessionNotes: "migrated"
  }
}));

const events = [];
class CustomEventMock {
  constructor(type, options = {}) { this.type = type; this.detail = options.detail; }
}
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
  Error,
  TypeError,
  Storage: StorageMock,
  localStorage,
  CustomEvent: CustomEventMock,
  dispatchEvent(event) { events.push(event); },
  BANDA_CHARACTERS: { hero: { id: "hero" } },
  BANDA_MOBILE_VIEW_MODEL: {
    createSessionState(characterId, options = {}) {
      return {
        schemaVersion: 1,
        sessionId: options.sessionId || "fresh",
        characterId,
        updatedAt: new Date().toISOString(),
        hp: { current: 30, temporary: 0 },
        resources: {},
        spellSlots: {},
        inventoryUses: {},
        conditions: [],
        deathSaves: { successes: 0, failures: 0 },
        inspiration: false,
        exhaustion: 0,
        sessionNotes: ""
      };
    }
  }
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: "mobile-session-store.js", timeout: 10000 });

const store = sandbox.BANDA_SESSION_STORE;
assert.ok(store, "store global missing");
assert.equal(store.version, 1);
assert.equal(localStorage.getItem("banda.mobile.session.v1.hero") !== null, true, "legacy session facade missing");
assert.equal(rawGetItem.call(localStorage, "banda.mobile.session.v1.hero"), null, "raw legacy key was not removed");

let state = store.get("hero");
assert.equal(state.inventoryUses.potion.quantity, 3, "inventory migration failed");
assert.equal(state.inspiration, true, "More migration failed");
assert.deepEqual(state.conditions, ["Poisoned"]);
assert.equal(state.sessionNotes, "migrated");

localStorage.setItem("banda.mobile.inventory.v1.hero.session-old", JSON.stringify({
  expiresAt: now + 100000,
  characterId: "hero",
  sessionId: "session-old",
  inventoryUses: { potion: { current: null, spent: null, quantity: 2 } }
}));
state = store.get("hero");
assert.equal(state.inventoryUses.potion.quantity, 2, "inventory write did not reach unified state");

localStorage.setItem("banda.mobile.more.v1.hero.session-old", JSON.stringify({
  expiresAt: now + 100000,
  sessionId: "session-old",
  state: {
    inspiration: false,
    exhaustion: 1,
    conditions: ["Prone"],
    deathSaves: { successes: 2, failures: 1 },
    sessionNotes: "updated"
  }
}));
state = store.get("hero");
assert.equal(state.exhaustion, 1);
assert.deepEqual(state.deathSaves, { successes: 2, failures: 1 });
assert.equal(state.sessionNotes, "updated");

const staleShellState = { ...state, hp: { current: 12, temporary: 4 }, inventoryUses: initial.inventoryUses, inspiration: true };
localStorage.setItem("banda.mobile.session.v1.hero", JSON.stringify({ expiresAt: now + 100000, state: staleShellState }));
state = store.get("hero");
assert.equal(state.hp.current, 12, "combat write failed");
assert.equal(state.inventoryUses.potion.quantity, 2, "combat write overwrote inventory overlay");
assert.equal(state.inspiration, false, "combat write overwrote More overlay");

const patched = store.patch("hero", { sessionNotes: "api patch" });
assert.equal(patched.sessionNotes, "api patch");
assert.ok(events.some((event) => event.type === "banda:session-live-change"), "change event missing");

const reset = store.reset("hero", { sessionId: "session-new" });
assert.equal(reset.sessionId, "session-new");
assert.deepEqual(reset.inventoryUses, {}, "reset retained old inventory overlay");
assert.equal(reset.inspiration, false, "reset retained old More overlay");

const legacyAfterReset = JSON.parse(localStorage.getItem("banda.mobile.session.v1.hero"));
assert.equal(legacyAfterReset.state.sessionId, "session-new", "legacy facade did not expose reset state");
assert.ok(rawGetItem.call(localStorage, store.storageKey("hero")), "unified record missing");

console.log(JSON.stringify({
  status: "SESSION_STORE_QA_PASSED",
  checks: 18,
  unifiedKey: store.storageKey("hero"),
  sessionId: store.get("hero").sessionId
}, null, 2));
