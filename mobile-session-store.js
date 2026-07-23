(() => {
  "use strict";

  const api = window.BANDA_MOBILE_VIEW_MODEL;
  const storage = window.localStorage;
  const StorageCtor = window.Storage;
  if (!api || !storage || !StorageCtor || window.BANDA_SESSION_STORE) return;

  const TTL_MS = 5 * 60 * 60 * 1000;
  const UNIFIED_PREFIX = "banda.mobile.session-live.v1.";
  const LEGACY_SESSION_PREFIX = "banda.mobile.session.v1.";
  const LEGACY_INVENTORY_PREFIX = "banda.mobile.inventory.v1.";
  const LEGACY_MORE_PREFIX = "banda.mobile.more.v1.";
  const OVERLAY_FIELDS = ["inventoryUses", "inspiration", "exhaustion", "conditions", "deathSaves", "sessionNotes"];
  const listeners = new Set();
  const proto = StorageCtor.prototype;
  const native = {
    getItem: proto.getItem,
    setItem: proto.setItem,
    removeItem: proto.removeItem,
    key: proto.key
  };

  const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
  const characters = () => window.BANDA_CHARACTERS || window.BANDA_CHARACTER_DATA?.characters || {};
  const characterIds = () => Object.keys(characters());
  const unifiedKey = (characterId) => `${UNIFIED_PREFIX}${characterId}`;
  const sessionKey = (characterId) => `${LEGACY_SESSION_PREFIX}${characterId}`;
  const inventoryKey = (characterId, sessionId) => `${LEGACY_INVENTORY_PREFIX}${characterId}.${sessionId}`;
  const moreKey = (characterId, sessionId) => `${LEGACY_MORE_PREFIX}${characterId}.${sessionId}`;

  function safeParse(raw) {
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function parseLegacyKey(key) {
    const text = String(key || "");
    if (text.startsWith(LEGACY_SESSION_PREFIX)) {
      return { kind: "session", characterId: text.slice(LEGACY_SESSION_PREFIX.length) };
    }
    for (const [kind, prefix] of [["inventory", LEGACY_INVENTORY_PREFIX], ["more", LEGACY_MORE_PREFIX]]) {
      if (!text.startsWith(prefix)) continue;
      const suffix = text.slice(prefix.length);
      const characterId = characterIds()
        .filter((id) => suffix.startsWith(`${id}.`))
        .sort((a, b) => b.length - a.length)[0];
      if (!characterId) return null;
      return { kind, characterId, sessionId: suffix.slice(characterId.length + 1) };
    }
    return null;
  }

  function validState(state, characterId = null) {
    return Boolean(state
      && state.schemaVersion === 1
      && state.characterId
      && state.sessionId
      && (!characterId || state.characterId === characterId));
  }

  function readRecord(characterId, { removeExpired = true } = {}) {
    const raw = native.getItem.call(storage, unifiedKey(characterId));
    const record = safeParse(raw);
    if (!record || record.schemaVersion !== 1 || !validState(record.state, characterId)) return null;
    if (Number(record.expiresAt) <= Date.now()) {
      if (removeExpired) native.removeItem.call(storage, unifiedKey(characterId));
      return null;
    }
    return record;
  }

  function emit(record, source) {
    const detail = {
      characterId: record.characterId,
      sessionId: record.sessionId,
      updatedAt: record.updatedAt,
      source,
      state: clone(record.state)
    };
    listeners.forEach((listener) => {
      try { listener(detail); } catch (error) { console.error("Session store subscriber failed", error); }
    });
    if (typeof window.dispatchEvent === "function" && typeof window.CustomEvent === "function") {
      window.dispatchEvent(new CustomEvent("banda:session-live-change", { detail }));
    }
  }

  function writeRecord(characterId, state, options = {}) {
    if (!validState(state, characterId)) throw new Error(`Invalid SESSION_LIVE state for ${characterId}`);
    const updatedAt = new Date().toISOString();
    const normalized = clone(state);
    normalized.updatedAt = updatedAt;
    const record = {
      schemaVersion: 1,
      characterId,
      sessionId: normalized.sessionId,
      updatedAt,
      expiresAt: Number(options.expiresAt) > Date.now() ? Number(options.expiresAt) : Date.now() + TTL_MS,
      state: normalized
    };
    native.setItem.call(storage, unifiedKey(characterId), JSON.stringify(record));
    emit(record, options.source || "store");
    return clone(record.state);
  }

  function mergeLegacySession(characterId, payload) {
    const incoming = payload?.state;
    if (!validState(incoming, characterId)) return false;
    const previous = readRecord(characterId);
    let next = clone(incoming);
    if (previous?.sessionId === incoming.sessionId) {
      next = { ...clone(previous.state), ...next };
      OVERLAY_FIELDS.forEach((field) => {
        if (previous.state[field] !== undefined) next[field] = clone(previous.state[field]);
      });
    }
    writeRecord(characterId, next, { expiresAt: payload.expiresAt, source: "legacy-session" });
    return true;
  }

  function mergeLegacyInventory(characterId, sessionId, payload) {
    const record = readRecord(characterId);
    if (!record || record.sessionId !== sessionId || !payload?.inventoryUses || typeof payload.inventoryUses !== "object") return false;
    const next = clone(record.state);
    next.inventoryUses = clone(payload.inventoryUses);
    writeRecord(characterId, next, { expiresAt: payload.expiresAt, source: "legacy-inventory" });
    return true;
  }

  function mergeLegacyMore(characterId, sessionId, payload) {
    const record = readRecord(characterId);
    if (!record || record.sessionId !== sessionId || !payload?.state || typeof payload.state !== "object") return false;
    const next = clone(record.state);
    for (const field of ["inspiration", "exhaustion", "conditions", "deathSaves", "sessionNotes"]) {
      if (payload.state[field] !== undefined) next[field] = clone(payload.state[field]);
    }
    writeRecord(characterId, next, { expiresAt: payload.expiresAt, source: "legacy-more" });
    return true;
  }

  function legacyRead(meta) {
    const record = readRecord(meta.characterId);
    if (!record) return null;
    if (meta.kind === "session") {
      return JSON.stringify({ expiresAt: record.expiresAt, state: clone(record.state) });
    }
    if (record.sessionId !== meta.sessionId) return null;
    if (meta.kind === "inventory") {
      return JSON.stringify({
        expiresAt: record.expiresAt,
        characterId: meta.characterId,
        sessionId: record.sessionId,
        inventoryUses: clone(record.state.inventoryUses || {})
      });
    }
    if (meta.kind === "more") {
      const state = {};
      for (const field of ["inspiration", "exhaustion", "conditions", "deathSaves", "sessionNotes"]) {
        state[field] = clone(record.state[field]);
      }
      return JSON.stringify({ expiresAt: record.expiresAt, sessionId: record.sessionId, state });
    }
    return null;
  }

  function migrateCharacter(characterId) {
    if (readRecord(characterId)) return true;
    const sessionPayload = safeParse(native.getItem.call(storage, sessionKey(characterId)));
    if (!sessionPayload || !validState(sessionPayload.state, characterId) || Number(sessionPayload.expiresAt) <= Date.now()) return false;
    writeRecord(characterId, sessionPayload.state, { expiresAt: sessionPayload.expiresAt, source: "migration" });
    const sessionId = sessionPayload.state.sessionId;
    const inventoryPayload = safeParse(native.getItem.call(storage, inventoryKey(characterId, sessionId)));
    if (inventoryPayload) mergeLegacyInventory(characterId, sessionId, inventoryPayload);
    const morePayload = safeParse(native.getItem.call(storage, moreKey(characterId, sessionId)));
    if (morePayload) mergeLegacyMore(characterId, sessionId, morePayload);
    return true;
  }

  function cleanLegacyKeys() {
    const keys = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = native.key.call(storage, index);
      if (parseLegacyKey(key)) keys.push(key);
    }
    keys.forEach((key) => native.removeItem.call(storage, key));
  }

  characterIds().forEach(migrateCharacter);
  cleanLegacyKeys();

  Object.defineProperties(proto, {
    getItem: {
      configurable: true,
      writable: true,
      value(key) {
        if (this !== storage) return native.getItem.call(this, key);
        const meta = parseLegacyKey(key);
        return meta ? legacyRead(meta) : native.getItem.call(this, key);
      }
    },
    setItem: {
      configurable: true,
      writable: true,
      value(key, value) {
        if (this !== storage) return native.setItem.call(this, key, value);
        const meta = parseLegacyKey(key);
        if (!meta) return native.setItem.call(this, key, value);
        const payload = safeParse(String(value));
        if (meta.kind === "session" && mergeLegacySession(meta.characterId, payload)) return;
        if (meta.kind === "inventory" && mergeLegacyInventory(meta.characterId, meta.sessionId, payload)) return;
        if (meta.kind === "more" && mergeLegacyMore(meta.characterId, meta.sessionId, payload)) return;
        console.warn("Ignored invalid legacy session write", key);
      }
    },
    removeItem: {
      configurable: true,
      writable: true,
      value(key) {
        if (this !== storage) return native.removeItem.call(this, key);
        const meta = parseLegacyKey(key);
        if (!meta) return native.removeItem.call(this, key);
        native.removeItem.call(this, key);
        if (meta.kind === "session") native.removeItem.call(this, unifiedKey(meta.characterId));
      }
    }
  });

  function get(characterId) {
    return clone(readRecord(characterId)?.state || null);
  }

  function set(characterId, state, options = {}) {
    return writeRecord(characterId, state, { ...options, source: options.source || "api-set" });
  }

  function patch(characterId, patchValue, options = {}) {
    const record = readRecord(characterId);
    if (!record) return null;
    const patchObject = typeof patchValue === "function" ? patchValue(clone(record.state)) : patchValue;
    if (!patchObject || typeof patchObject !== "object") return clone(record.state);
    return writeRecord(characterId, { ...clone(record.state), ...clone(patchObject) }, {
      ...options,
      expiresAt: options.expiresAt || record.expiresAt,
      source: options.source || "api-patch"
    });
  }

  function reset(characterId, options = {}) {
    const state = api.createSessionState(characterId, {
      sessionId: options.sessionId || `mobile-local-${characterId}-${Date.now()}`
    });
    return writeRecord(characterId, state, { source: options.source || "api-reset" });
  }

  function subscribe(listener) {
    if (typeof listener !== "function") return () => {};
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  window.BANDA_SESSION_STORE = Object.freeze({
    version: 1,
    schemaVersion: 1,
    storagePrefix: UNIFIED_PREFIX,
    ttlMs: TTL_MS,
    get,
    set,
    patch,
    reset,
    subscribe,
    exportRecord: (characterId) => clone(readRecord(characterId)),
    storageKey: unifiedKey
  });
})();
