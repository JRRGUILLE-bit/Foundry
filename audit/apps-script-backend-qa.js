#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const codePath = path.join(root, "apps-script", "Code.gs");
const code = fs.readFileSync(codePath, "utf8");
const configSource = fs.readFileSync(path.join(root, "mobile-session-remote-config.js"), "utf8");
const remoteSource = fs.readFileSync(path.join(root, "mobile-session-remote-sync.js"), "utf8");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "apps-script", "appsscript.json"), "utf8"));
const guide = fs.readFileSync(path.join(root, "docs", "session-live-apps-script-deployment.md"), "utf8");

const failures = [];
const checks = [];
function check(name, condition, details = "") {
  checks.push({ name, passed: Boolean(condition), details });
  if (!condition) failures.push(`${name}${details ? `: ${details}` : ""}`);
}

class MockRange {
  constructor(sheet, row, column, rows, columns) {
    this.sheet = sheet;
    this.row = row;
    this.column = column;
    this.rows = rows;
    this.columns = columns;
  }
  getValues() {
    const out = [];
    for (let r = 0; r < this.rows; r += 1) {
      const row = [];
      for (let c = 0; c < this.columns; c += 1) {
        row.push(this.sheet.valueAt(this.row + r, this.column + c));
      }
      out.push(row);
    }
    return out;
  }
  setValues(values) {
    for (let r = 0; r < this.rows; r += 1) {
      for (let c = 0; c < this.columns; c += 1) {
        this.sheet.setValue(this.row + r, this.column + c, values[r][c]);
      }
    }
    return this;
  }
  setFontWeight() { return this; }
}

class MockSheet {
  constructor(name) {
    this.name = name;
    this.data = [];
    this.frozenRows = 0;
  }
  getName() { return this.name; }
  valueAt(row, column) { return this.data[row - 1]?.[column - 1] ?? ""; }
  setValue(row, column, value) {
    while (this.data.length < row) this.data.push([]);
    while (this.data[row - 1].length < column) this.data[row - 1].push("");
    this.data[row - 1][column - 1] = value;
  }
  getLastRow() {
    for (let row = this.data.length; row > 0; row -= 1) {
      if ((this.data[row - 1] || []).some((value) => value !== "" && value !== null && value !== undefined)) return row;
    }
    return 0;
  }
  getLastColumn() {
    return this.data.reduce((maximum, row) => Math.max(maximum, row.length), 0);
  }
  getRange(row, column, rows = 1, columns = 1) { return new MockRange(this, row, column, rows, columns); }
  setFrozenRows(rows) { this.frozenRows = rows; }
  appendRow(values) { this.data.push([...values]); }
  deleteRow(row) { this.data.splice(row - 1, 1); }
}

class MockSpreadsheet {
  constructor(id = "sheet-test-id") {
    this.id = id;
    this.sheets = new Map();
  }
  getId() { return this.id; }
  getSheetByName(name) { return this.sheets.get(name) || null; }
  insertSheet(name) {
    const sheet = new MockSheet(name);
    this.sheets.set(name, sheet);
    return sheet;
  }
}

class MockTextOutput {
  constructor(content) { this.content = content; this.mimeType = null; }
  setMimeType(value) { this.mimeType = value; return this; }
  getContent() { return this.content; }
}

const spreadsheet = new MockSpreadsheet();
const properties = new Map();
const triggers = [];
const lockStats = { waited: 0, released: 0 };

const sandbox = {
  console,
  JSON,
  Math,
  Number,
  String,
  Object,
  Array,
  Boolean,
  Error,
  Date,
  SpreadsheetApp: {
    getActiveSpreadsheet: () => spreadsheet,
    openById: (id) => id === spreadsheet.id ? spreadsheet : null
  },
  PropertiesService: {
    getScriptProperties: () => ({
      getProperty: (key) => properties.get(key) || null,
      setProperty: (key, value) => { properties.set(key, String(value)); }
    })
  },
  LockService: {
    getScriptLock: () => ({
      waitLock: () => { lockStats.waited += 1; },
      releaseLock: () => { lockStats.released += 1; }
    })
  },
  ScriptApp: {
    getProjectTriggers: () => triggers,
    newTrigger: (handler) => ({
      timeBased: () => ({
        everyHours: (hours) => ({
          create: () => triggers.push({ getHandlerFunction: () => handler, hours })
        })
      })
    })
  },
  ContentService: {
    MimeType: { JSON: "application/json" },
    createTextOutput: (content) => new MockTextOutput(content)
  }
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

try {
  new vm.Script(code, { filename: "apps-script/Code.gs" });
  check("syntax:Code.gs", true);
} catch (error) {
  check("syntax:Code.gs", false, error.message);
}

try {
  vm.runInContext(code, sandbox, { filename: "apps-script/Code.gs", timeout: 10000 });
  check("execute:Code.gs", true);
} catch (error) {
  check("execute:Code.gs", false, error.stack || error.message);
}

const parseOutput = (output) => JSON.parse(output.getContent());
const get = (parameters) => parseOutput(sandbox.doGet({ parameter: parameters }));
const post = (payload) => parseOutput(sandbox.doPost({ postData: { contents: JSON.stringify(payload) } }));

function record(characterId, updatedOffsetMs = 0, expiresOffsetMs = 5 * 60 * 60 * 1000, hp = 30) {
  const updatedAt = new Date(Date.now() + updatedOffsetMs).toISOString();
  const sessionId = `session-${characterId}`;
  return {
    schemaVersion: 1,
    characterId,
    sessionId,
    updatedAt,
    expiresAt: Date.now() + expiresOffsetMs,
    state: {
      schemaVersion: 1,
      characterId,
      sessionId,
      updatedAt,
      hp: { current: hp, temporary: 0 },
      resources: {},
      spellSlots: {},
      inventoryUses: {},
      inspiration: false,
      exhaustion: 0,
      conditions: [],
      deathSaves: { successes: 0, failures: 0 },
      sessionNotes: ""
    }
  };
}

const setup = sandbox.setupSessionLive();
const sheet = spreadsheet.getSheetByName("SESSION_LIVE");
check("setup:result", setup.ok === true && setup.sheetName === "SESSION_LIVE");
check("setup:property", properties.get("BANDA_SESSION_SPREADSHEET_ID") === spreadsheet.id);
check("setup:headers", sheet?.data[0]?.join("|") === "schema_version|character_id|session_id|updated_at|expires_at|record_json|stored_at");
check("setup:frozen-header", sheet?.frozenRows === 1);
check("setup:cleanup-trigger", triggers.length === 1 && triggers[0].getHandlerFunction() === "cleanupExpiredSessions");

const health = get({ action: "health", protocolVersion: "1" });
check("get:health", health.ok === true && health.service === "BANDA_SESSION_LIVE");
check("get:protocol-error", get({ action: "health", protocolVersion: "2" }).code === "PROTOCOL_VERSION_UNSUPPORTED");
check("get:character-whitelist", get({ action: "get", protocolVersion: "1", characterId: "intruder" }).code === "CHARACTER_NOT_ALLOWED");

const first = record("balder", -2000, 5 * 60 * 60 * 1000, 40);
const created = post({ action: "upsert", protocolVersion: 1, record: first });
check("post:create", created.ok === true && created.accepted === true && created.direction === "created");
check("sheet:one-row-per-character", sheet.getLastRow() === 2);

const fetched = get({ action: "get", protocolVersion: "1", characterId: "balder" });
check("get:record", fetched.ok === true && fetched.record?.state?.hp?.current === 40);

const newer = record("balder", -1000, 5 * 60 * 60 * 1000, 31);
const replaced = post({ action: "upsert", protocolVersion: 1, record: newer });
check("post:newer-wins", replaced.accepted === true && replaced.direction === "client" && replaced.record.state.hp.current === 31);
check("sheet:still-one-row", sheet.getLastRow() === 2);

const older = record("balder", -3000, 5 * 60 * 60 * 1000, 5);
const conflict = post({ action: "upsert", protocolVersion: 1, record: older });
check("post:server-newer-wins", conflict.accepted === false && conflict.direction === "server" && conflict.record.state.hp.current === 31);

const equal = post({ action: "upsert", protocolVersion: 1, record: newer });
check("post:equal-idempotent", equal.accepted === true && equal.direction === "equal");

const magna = record("magna", -500, 5 * 60 * 60 * 1000, 18);
const second = post({ action: "upsert", protocolVersion: 1, record: magna });
check("post:second-character", second.ok === true && sheet.getLastRow() === 3);

const expired = record("sathar", -10000, -1000, 12);
sheet.appendRow([1, expired.characterId, expired.sessionId, expired.updatedAt, expired.expiresAt, JSON.stringify(expired), new Date().toISOString()]);
const cleanup = sandbox.cleanupExpiredSessions();
check("cleanup:expired", cleanup.removed === 1 && sheet.getLastRow() === 3);

const invalidJson = parseOutput(sandbox.doPost({ postData: { contents: "{" } }));
check("post:invalid-json", invalidJson.code === "INVALID_JSON");

const mismatch = record("ingwe");
mismatch.state.characterId = "balder";
check("post:identity-validation", post({ action: "upsert", protocolVersion: 1, record: mismatch }).code === "STATE_IDENTITY_MISMATCH");

const expiredPost = record("ingwe", -10000, -1000, 12);
check("post:expired-rejected", post({ action: "upsert", protocolVersion: 1, record: expiredPost }).code === "SESSION_EXPIRED");

const tooLarge = record("ingwe");
tooLarge.state.sessionNotes = "x".repeat(46000);
check("post:size-limit", post({ action: "upsert", protocolVersion: 1, record: tooLarge }).code === "RECORD_TOO_LARGE");
check("lock:balanced", lockStats.waited > 0 && lockStats.waited === lockStats.released, JSON.stringify(lockStats));

check("protocol:remote-get", remoteSource.includes('url.searchParams.set("action", "get")'));
check("protocol:remote-upsert", remoteSource.includes('action: "upsert"'));
check("protocol:text-plain", remoteSource.includes('"Content-Type": "text/plain;charset=utf-8"'));
check("config:empty-endpoint", /endpoint:\s*""/.test(configSource));
check("config:no-secret", !/(token|secret|authorization)\s*:/i.test(configSource));
const configPosition = indexSource.indexOf('src="mobile-session-remote-config.js');
const adapterPosition = indexSource.indexOf('src="mobile-session-remote-sync.js');
check("index:config-before-adapter", configPosition >= 0 && adapterPosition > configPosition);
check("manifest:timezone", manifest.timeZone === "America/Montevideo");
check("manifest:v8", manifest.runtimeVersion === "V8");
check("guide:anyone-access", guide.includes("Quién tiene acceso: **Cualquier persona**"));
check("guide:health-check", guide.includes("action=health&protocolVersion=1"));
check("backend:lock-service", code.includes("LockService.getScriptLock"));
check("backend:hourly-cleanup", code.includes("everyHours(1)"));
check("backend:allowed-ids", ["artionketh", "balder", "ingwe", "magna", "melkor", "sathar"].every((id) => code.includes(`"${id}"`)));

const report = {
  status: failures.length ? "APPS_SCRIPT_BACKEND_QA_FAILED" : "APPS_SCRIPT_BACKEND_QA_PASSED",
  total: checks.length,
  passed: checks.filter((entry) => entry.passed).length,
  failed: failures.length,
  failures
};
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
