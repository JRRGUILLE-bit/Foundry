#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const vm = require("node:vm");

const sourcePath = process.argv[2] || "mobile-session-remote-sync.js";
const source = fs.readFileSync(sourcePath, "utf8");
const failures = [];
const checks = [];

function check(name, condition, details = "") {
  checks.push({ name, passed: Boolean(condition), details });
  if (!condition) failures.push(`${name}${details ? `: ${details}` : ""}`);
}

class MemoryStorage {
  constructor(seed = {}) { this.map = new Map(Object.entries(seed)); }
  get length() { return this.map.size; }
  key(index) { return [...this.map.keys()][index] ?? null; }
  getItem(key) { return this.map.has(String(key)) ? this.map.get(String(key)) : null; }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  removeItem(key) { this.map.delete(String(key)); }
  clear() { this.map.clear(); }
}

class CustomEventPolyfill {
  constructor(type, options = {}) { this.type = type; this.detail = options.detail; }
}

function makeState(characterId, sessionId, hp = 10) {
  return {
    schemaVersion: 1,
    sessionId,
    characterId,
    updatedAt: "2026-07-23T10:00:00.000Z",
    hp: { current: hp, temporary: 0 },
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

function makeRecord(characterId, sessionId, updatedAt, hp = 10) {
  const state = makeState(characterId, sessionId, hp);
  state.updatedAt = updatedAt;
  return {
    schemaVersion: 1,
    characterId,
    sessionId,
    updatedAt,
    expiresAt: Date.parse("2026-07-23T20:00:00.000Z"),
    state
  };
}

function createStore(initialRecord) {
  let record = JSON.parse(JSON.stringify(initialRecord));
  const subscribers = new Set();
  const writes = [];
  const emit = (source) => subscribers.forEach((listener) => listener({
    characterId: record.characterId,
    sessionId: record.sessionId,
    updatedAt: record.updatedAt,
    source,
    state: JSON.parse(JSON.stringify(record.state))
  }));
  return {
    writes,
    exportRecord(characterId) {
      return record?.characterId === characterId ? JSON.parse(JSON.stringify(record)) : null;
    },
    set(characterId, state, options = {}) {
      record = {
        schemaVersion: 1,
        characterId,
        sessionId: state.sessionId,
        updatedAt: new Date().toISOString(),
        expiresAt: options.expiresAt || Date.now() + 18000000,
        state: JSON.parse(JSON.stringify(state))
      };
      writes.push({ source: options.source, record: JSON.parse(JSON.stringify(record)) });
      emit(options.source || "api-set");
      return JSON.parse(JSON.stringify(state));
    },
    subscribe(listener) { subscribers.add(listener); return () => subscribers.delete(listener); },
    localWrite(nextRecord, source = "api-set") {
      record = JSON.parse(JSON.stringify(nextRecord));
      writes.push({ source, record: JSON.parse(JSON.stringify(record)) });
      emit(source);
    },
    current() { return JSON.parse(JSON.stringify(record)); }
  };
}

function createEnvironment({ initialRecord, fetchImpl = null, storage = null, config = null, online = true } = {}) {
  const events = new Map();
  const badge = { textContent: "SESIÓN LOCAL", dataset: {}, title: "" };
  const styleNodes = [];
  const localStorage = storage || new MemoryStorage();
  const store = createStore(initialRecord);
  const sandbox = {
    console,
    JSON,
    Math,
    Map,
    Set,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Date,
    Error,
    Promise,
    URL,
    AbortController,
    setTimeout,
    clearTimeout,
    CustomEvent: CustomEventPolyfill,
    localStorage,
    navigator: { onLine: online },
    location: { href: "https://example.test/index.html" },
    fetch: fetchImpl,
    BANDA_SESSION_STORE: store,
    BANDA_SESSION_REMOTE_CONFIG: config,
    document: {
      querySelector(selector) { return selector === ".mcs-session" ? badge : null; },
      createElement(tag) { return { tagName: tag, id: "", textContent: "" }; },
      head: { append(node) { styleNodes.push(node); } }
    },
    addEventListener(type, listener) {
      if (!events.has(type)) events.set(type, new Set());
      events.get(type).add(listener);
    },
    removeEventListener(type, listener) { events.get(type)?.delete(listener); },
    dispatchEvent(event) {
      events.get(event.type)?.forEach((listener) => listener(event));
      return true;
    }
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  new vm.Script(source, { filename: sourcePath }).runInContext(sandbox, { timeout: 10000 });
  return { sandbox, api: sandbox.BANDA_SESSION_REMOTE_SYNC, store, storage: localStorage, badge, styleNodes };
}

async function run() {
  new vm.Script(source, { filename: sourcePath });
  check("syntax", true);

  const base = makeRecord("balder", "session-a", "2026-07-23T10:00:00.000Z", 20);
  const requests = [];
  const env = createEnvironment({ initialRecord: base });
  check("api-exported", Boolean(env.api?.configure && env.api?.pull && env.api?.flush && env.api?.queue));
  check("default-local", env.api.getStatus("balder").state === "LOCAL");
  check("status-style", env.styleNodes.some((node) => node.id === "banda-session-remote-sync-styles"));

  env.sandbox.dispatchEvent(new CustomEventPolyfill("banda:mobile-character-open", { detail: { characterId: "balder" } }));
  check("local-badge", env.badge.textContent === "LOCAL");

  const changed = makeRecord("balder", "session-a", "2026-07-23T10:05:00.000Z", 17);
  env.store.localWrite(changed, "api-set");
  check("local-change-queued", env.api.exportQueue("balder")?.record?.state?.hp?.current === 17);
  check("queue-persistent", env.storage.getItem(`${env.api.queuePrefix}balder`) !== null);

  env.api.configure({
    endpoint: "https://script.google.test/exec",
    debounceMs: 0,
    fetchImpl: async (url, init = {}) => {
      requests.push({ url, init });
      const body = init.body ? JSON.parse(init.body) : null;
      return { ok: true, status: 200, async json() { return { ok: true, record: body?.record || null }; } };
    }
  });
  await env.api.flush("balder");
  check("post-protocol", requests.some((entry) => JSON.parse(entry.init.body || "null")?.protocolVersion === 1));
  check("post-text-plain", requests.some((entry) => entry.init.headers?.["Content-Type"] === "text/plain;charset=utf-8"));
  check("no-authorization-header", requests.every((entry) => !entry.init.headers?.Authorization));
  check("queue-cleared-after-push", env.api.exportQueue("balder") === null);
  check("connected-after-push", env.api.getStatus("balder").state === "CONECTADO");
  check("connected-badge", env.badge.textContent === "CONECTADO");

  env.sandbox.navigator.onLine = false;
  const offlineRecord = makeRecord("balder", "session-a", "2026-07-23T10:10:00.000Z", 12);
  env.store.localWrite(offlineRecord, "api-set");
  const requestCountBeforeOffline = requests.length;
  const offlineResult = await env.api.flush("balder");
  check("offline-keeps-queue", offlineResult.offline === true && env.api.exportQueue("balder") !== null);
  check("offline-no-network", requests.length === requestCountBeforeOffline);
  check("offline-status-local", env.api.getStatus("balder").state === "LOCAL");

  env.sandbox.navigator.onLine = true;
  await env.api.flush("balder");
  check("online-retry-clears", env.api.exportQueue("balder") === null);

  const remoteNewer = makeRecord("balder", "session-a", "2026-07-23T11:00:00.000Z", 33);
  const pullRequests = [];
  const pullEnv = createEnvironment({
    initialRecord: makeRecord("balder", "session-a", "2026-07-23T10:00:00.000Z", 10),
    config: { endpoint: "https://script.google.test/exec", enabled: true },
    fetchImpl: async (url, init = {}) => {
      pullRequests.push({ url, init });
      return { ok: true, status: 200, async json() { return { ok: true, record: remoteNewer }; } };
    }
  });
  await pullEnv.api.pull("balder");
  check("get-protocol", pullRequests[0]?.url.includes("action=get") && pullRequests[0]?.url.includes("characterId=balder"));
  check("remote-newer-applied", pullEnv.store.current().state.hp.current === 33);
  check("remote-write-not-requeued", pullEnv.api.exportQueue("balder") === null);
  check("remote-source-labelled", pullEnv.store.writes.some((entry) => String(entry.source).startsWith("remote-")));

  const localNewer = makeRecord("balder", "session-a", "2026-07-23T12:00:00.000Z", 44);
  const remoteOlder = makeRecord("balder", "session-a", "2026-07-23T11:00:00.000Z", 22);
  const directions = [];
  const localWinsEnv = createEnvironment({
    initialRecord: localNewer,
    config: { endpoint: "https://script.google.test/exec", enabled: true },
    fetchImpl: async (url, init = {}) => {
      directions.push(init.method || "GET");
      const body = init.body ? JSON.parse(init.body) : null;
      return { ok: true, status: 200, async json() { return init.method === "POST" ? { ok: true, record: body.record } : { ok: true, record: remoteOlder }; } };
    }
  });
  await localWinsEnv.api.pull("balder");
  check("first-sync-local-newer-pushed", directions.includes("POST"));
  check("local-newer-preserved", localWinsEnv.store.current().state.hp.current === 44);

  const conflictLocal = makeRecord("balder", "session-a", "2026-07-23T12:00:00.000Z", 15);
  const conflictRemote = makeRecord("balder", "session-a", "2026-07-23T13:00:00.000Z", 50);
  const conflictEnv = createEnvironment({
    initialRecord: conflictLocal,
    config: { endpoint: "https://script.google.test/exec", enabled: true },
    fetchImpl: async () => ({ ok: true, status: 200, async json() { return { ok: true, record: conflictRemote }; } })
  });
  conflictEnv.store.localWrite(conflictLocal, "api-set");
  await conflictEnv.api.flush("balder");
  check("server-newer-wins-conflict", conflictEnv.store.current().state.hp.current === 50);
  check("conflict-queue-cleared", conflictEnv.api.exportQueue("balder") === null);

  const failureEnv = createEnvironment({
    initialRecord: base,
    config: { endpoint: "https://script.google.test/exec", enabled: true },
    fetchImpl: async () => { throw new Error("network down"); }
  });
  failureEnv.store.localWrite(changed, "api-set");
  let rejected = false;
  try { await failureEnv.api.flush("balder"); } catch { rejected = true; }
  check("failure-rejected", rejected);
  check("failure-keeps-queue", failureEnv.api.exportQueue("balder")?.attempts === 1);
  check("failure-status-error", failureEnv.api.getStatus("balder").state === "ERROR");

  const stopEnv = createEnvironment({ initialRecord: base });
  stopEnv.api.stop();
  stopEnv.store.localWrite(changed, "api-set");
  check("stop-unsubscribes", stopEnv.api.exportQueue("balder") === null);
  stopEnv.api.start();
  stopEnv.store.localWrite(changed, "api-set");
  check("restart-resubscribes", stopEnv.api.exportQueue("balder") !== null);

  const statusEvents = [];
  const off = env.api.subscribe((status) => statusEvents.push(status.state));
  env.api.configure({ enabled: false });
  off();
  check("status-subscription", statusEvents.includes("LOCAL"));
  check("config-disables-network", env.api.getConfig().enabled === false);

  const report = {
    status: failures.length ? "REMOTE_SYNC_QA_FAILED" : "REMOTE_SYNC_QA_PASSED",
    checks: checks.length,
    passed: checks.filter((entry) => entry.passed).length,
    failed: failures.length,
    failures
  };
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exitCode = 1;
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
