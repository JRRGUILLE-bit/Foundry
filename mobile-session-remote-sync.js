(() => {
  "use strict";

  const store = window.BANDA_SESSION_STORE;
  const storage = window.localStorage;
  if (!store || !storage || window.BANDA_SESSION_REMOTE_SYNC) return;

  const PROTOCOL_VERSION = 1;
  const QUEUE_PREFIX = "banda.mobile.remote-queue.v1.";
  const META_PREFIX = "banda.mobile.remote-meta.v1.";
  const DEFAULT_DEBOUNCE_MS = 650;
  const DEFAULT_TIMEOUT_MS = 12000;
  const STATUS = Object.freeze({
    LOCAL: "LOCAL",
    SYNCING: "SINCRONIZANDO",
    CONNECTED: "CONECTADO",
    ERROR: "ERROR"
  });

  const listeners = new Set();
  const states = new Map();
  const timers = new Map();
  let activeCharacterId = null;
  let started = false;
  let unsubscribeStore = null;
  let config = normalizeConfig(window.BANDA_SESSION_REMOTE_CONFIG || {});

  const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
  const queueKey = (characterId) => `${QUEUE_PREFIX}${characterId}`;
  const metaKey = (characterId) => `${META_PREFIX}${characterId}`;
  const timestamp = (value) => {
    const parsed = Date.parse(String(value || ""));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  function normalizeConfig(value = {}) {
    return {
      endpoint: String(value.endpoint || "").trim(),
      enabled: value.enabled !== false,
      debounceMs: Number.isFinite(Number(value.debounceMs)) ? Math.max(0, Number(value.debounceMs)) : DEFAULT_DEBOUNCE_MS,
      timeoutMs: Number.isFinite(Number(value.timeoutMs)) ? Math.max(1000, Number(value.timeoutMs)) : DEFAULT_TIMEOUT_MS,
      fetchImpl: typeof value.fetchImpl === "function" ? value.fetchImpl : null
    };
  }

  function safeParse(raw) {
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  }

  function validRecord(record, characterId = null) {
    return Boolean(record
      && record.schemaVersion === 1
      && record.characterId
      && record.sessionId
      && record.updatedAt
      && record.state
      && record.state.schemaVersion === 1
      && record.state.characterId === record.characterId
      && record.state.sessionId === record.sessionId
      && (!characterId || record.characterId === characterId));
  }

  function readQueue(characterId) {
    const payload = safeParse(storage.getItem(queueKey(characterId)));
    if (!payload || payload.schemaVersion !== 1 || !validRecord(payload.record, characterId)) return null;
    return payload;
  }

  function writeQueue(characterId, record, attempts = 0) {
    if (!validRecord(record, characterId)) return null;
    const payload = {
      schemaVersion: 1,
      characterId,
      queuedAt: new Date().toISOString(),
      attempts: Math.max(0, Number(attempts) || 0),
      record: clone(record)
    };
    storage.setItem(queueKey(characterId), JSON.stringify(payload));
    return payload;
  }

  function removeQueue(characterId) {
    storage.removeItem(queueKey(characterId));
    const timer = timers.get(characterId);
    if (timer) clearTimeout(timer);
    timers.delete(characterId);
  }

  function readMeta(characterId) {
    const meta = safeParse(storage.getItem(metaKey(characterId)));
    return meta && meta.schemaVersion === 1 ? meta : null;
  }

  function writeMeta(characterId, remoteUpdatedAt) {
    const meta = {
      schemaVersion: 1,
      characterId,
      remoteUpdatedAt: String(remoteUpdatedAt || ""),
      lastSyncedAt: new Date().toISOString()
    };
    storage.setItem(metaKey(characterId), JSON.stringify(meta));
    return meta;
  }

  function canSync() {
    return Boolean(config.enabled && config.endpoint && window.navigator?.onLine !== false);
  }

  function pending(characterId) {
    return Boolean(readQueue(characterId));
  }

  function statusOf(characterId = activeCharacterId) {
    if (!characterId) {
      return {
        state: canSync() ? STATUS.CONNECTED : STATUS.LOCAL,
        characterId: null,
        pending: false,
        message: canSync() ? "Sin personaje activo" : "Sesión local",
        updatedAt: null,
        error: null
      };
    }
    return clone(states.get(characterId) || {
      state: canSync() ? STATUS.CONNECTED : STATUS.LOCAL,
      characterId,
      pending: pending(characterId),
      message: canSync() ? "Listo para sincronizar" : "Sesión local",
      updatedAt: null,
      error: null
    });
  }

  function updateBadge(status) {
    if (!activeCharacterId || status.characterId !== activeCharacterId) return;
    const badge = window.document?.querySelector?.(".mcs-session");
    if (!badge) return;
    badge.textContent = status.state;
    badge.dataset.syncState = status.state.toLocaleLowerCase("es");
    badge.title = status.message || status.state;
  }

  function emitStatus(characterId, state, options = {}) {
    const status = {
      state,
      characterId,
      pending: pending(characterId),
      message: options.message || state,
      updatedAt: new Date().toISOString(),
      error: options.error ? String(options.error.message || options.error) : null
    };
    states.set(characterId, status);
    updateBadge(status);
    listeners.forEach((listener) => {
      try { listener(clone(status)); } catch (error) { console.error("Remote sync subscriber failed", error); }
    });
    if (typeof window.dispatchEvent === "function" && typeof window.CustomEvent === "function") {
      window.dispatchEvent(new CustomEvent("banda:session-remote-status", { detail: clone(status) }));
    }
    return status;
  }

  function remoteUrl(characterId) {
    const url = new URL(config.endpoint, window.location?.href || undefined);
    url.searchParams.set("action", "get");
    url.searchParams.set("protocolVersion", String(PROTOCOL_VERSION));
    url.searchParams.set("characterId", characterId);
    return url.toString();
  }

  function responseRecord(payload) {
    if (!payload) return null;
    const candidate = payload.record || payload.data?.record || payload.data || payload;
    return validRecord(candidate) ? candidate : null;
  }

  async function request(url, init = {}) {
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), config.timeoutMs) : null;
    try {
      const fetchImpl = config.fetchImpl || window.fetch?.bind(window);
      if (!fetchImpl) throw new Error("Fetch no disponible");
      const response = await fetchImpl(url, {
        redirect: "follow",
        cache: "no-store",
        ...init,
        signal: controller?.signal
      });
      if (!response?.ok) throw new Error(`Remote sync HTTP ${response?.status || "error"}`);
      const payload = await response.json();
      if (payload?.ok === false) throw new Error(payload.error || "Remote sync rechazado");
      return payload;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function queue(characterId, options = {}) {
    const record = store.exportRecord(characterId);
    if (!validRecord(record, characterId)) return null;
    const previous = readQueue(characterId);
    const payload = writeQueue(characterId, record, previous?.attempts || 0);
    emitStatus(characterId, canSync() ? STATUS.SYNCING : STATUS.LOCAL, {
      message: canSync() ? "Cambio pendiente" : "Cambio guardado localmente"
    });
    if (options.schedule !== false) scheduleFlush(characterId);
    return clone(payload);
  }

  function scheduleFlush(characterId) {
    const previous = timers.get(characterId);
    if (previous) clearTimeout(previous);
    if (!canSync()) return;
    timers.set(characterId, setTimeout(() => {
      timers.delete(characterId);
      flush(characterId).catch(() => {});
    }, config.debounceMs));
  }

  function applyRemote(record, source = "remote-pull") {
    if (!validRecord(record)) throw new Error("Registro remoto inválido");
    store.set(record.characterId, record.state, {
      expiresAt: record.expiresAt,
      source
    });
    writeMeta(record.characterId, record.updatedAt);
    removeQueue(record.characterId);
    return store.exportRecord(record.characterId);
  }

  async function flush(characterId) {
    const queued = readQueue(characterId);
    if (!queued) {
      if (canSync()) emitStatus(characterId, STATUS.CONNECTED, { message: "Sin cambios pendientes" });
      return { ok: true, skipped: true };
    }
    if (!canSync()) {
      emitStatus(characterId, STATUS.LOCAL, { message: "Cambio pendiente sin conexión" });
      return { ok: false, queued: true, offline: true };
    }

    emitStatus(characterId, STATUS.SYNCING, { message: "Enviando cambios" });
    try {
      const payload = await request(config.endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "upsert",
          protocolVersion: PROTOCOL_VERSION,
          record: queued.record
        })
      });
      const remote = responseRecord(payload) || queued.record;
      if (timestamp(remote.updatedAt) > timestamp(queued.record.updatedAt)
        && JSON.stringify(remote.state) !== JSON.stringify(queued.record.state)) {
        applyRemote(remote, "remote-conflict");
      } else {
        writeMeta(characterId, remote.updatedAt || queued.record.updatedAt);
        removeQueue(characterId);
      }
      emitStatus(characterId, STATUS.CONNECTED, { message: "Cambios sincronizados" });
      return { ok: true, record: clone(remote) };
    } catch (error) {
      writeQueue(characterId, queued.record, queued.attempts + 1);
      emitStatus(characterId, STATUS.ERROR, { message: "No se pudo sincronizar", error });
      throw error;
    }
  }

  async function pull(characterId) {
    if (!canSync()) {
      emitStatus(characterId, STATUS.LOCAL, { message: "Sesión local" });
      return { ok: false, offline: true };
    }

    emitStatus(characterId, STATUS.SYNCING, { message: "Leyendo sesión remota" });
    try {
      const payload = await request(remoteUrl(characterId), { method: "GET" });
      const remote = responseRecord(payload);
      const queued = readQueue(characterId);
      const local = store.exportRecord(characterId);
      const meta = readMeta(characterId);

      if (!remote) {
        if (queued || local) {
          if (!queued && local) writeQueue(characterId, local);
          return flush(characterId);
        }
        emitStatus(characterId, STATUS.CONNECTED, { message: "Sin sesión remota" });
        return { ok: true, record: null };
      }

      if (queued) {
        if (timestamp(remote.updatedAt) > timestamp(queued.record.updatedAt)) {
          applyRemote(remote, "remote-newer");
          emitStatus(characterId, STATUS.CONNECTED, { message: "Sesión remota aplicada" });
          return { ok: true, record: clone(remote), direction: "remote" };
        }
        if (timestamp(remote.updatedAt) === timestamp(queued.record.updatedAt)) {
          writeMeta(characterId, remote.updatedAt);
          removeQueue(characterId);
          emitStatus(characterId, STATUS.CONNECTED, { message: "Sesión al día" });
          return { ok: true, record: clone(remote), direction: "equal" };
        }
        return flush(characterId);
      }

      if (!meta) {
        if (local && timestamp(local.updatedAt) > timestamp(remote.updatedAt)) {
          writeQueue(characterId, local);
          return flush(characterId);
        }
        applyRemote(remote, "remote-first-sync");
        emitStatus(characterId, STATUS.CONNECTED, { message: "Sesión remota aplicada" });
        return { ok: true, record: clone(remote), direction: "remote" };
      }

      if (meta.remoteUpdatedAt !== remote.updatedAt) {
        applyRemote(remote, "remote-refresh");
        emitStatus(characterId, STATUS.CONNECTED, { message: "Sesión remota actualizada" });
        return { ok: true, record: clone(remote), direction: "remote" };
      }

      emitStatus(characterId, STATUS.CONNECTED, { message: "Sesión al día" });
      return { ok: true, record: clone(remote), direction: "equal" };
    } catch (error) {
      emitStatus(characterId, STATUS.ERROR, { message: "No se pudo leer la sesión remota", error });
      throw error;
    }
  }

  async function sync(characterId) {
    return pull(characterId);
  }

  async function flushAll() {
    const characters = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith(QUEUE_PREFIX)) characters.push(key.slice(QUEUE_PREFIX.length));
    }
    const results = [];
    for (const characterId of [...new Set(characters)]) {
      try { results.push(await flush(characterId)); }
      catch (error) { results.push({ ok: false, characterId, error: String(error.message || error) }); }
    }
    return results;
  }

  function configure(next = {}) {
    config = normalizeConfig({ ...config, ...next });
    if (!canSync()) {
      if (activeCharacterId) emitStatus(activeCharacterId, STATUS.LOCAL, { message: "Sesión local" });
      return clone(config);
    }
    flushAll().catch(() => {});
    if (activeCharacterId) pull(activeCharacterId).catch(() => {});
    return clone({ ...config, fetchImpl: config.fetchImpl ? "custom" : null });
  }

  function onStoreChange(detail) {
    if (!detail?.characterId || String(detail.source || "").startsWith("remote-")) return;
    queue(detail.characterId);
  }

  function onOpen(event) {
    activeCharacterId = event?.detail?.characterId || null;
    if (!activeCharacterId) return;
    updateBadge(statusOf(activeCharacterId));
    if (canSync()) pull(activeCharacterId).catch(() => {});
  }

  function onClose() {
    activeCharacterId = null;
  }

  function onOnline() {
    flushAll().then(() => {
      if (activeCharacterId) return pull(activeCharacterId);
      return null;
    }).catch(() => {});
  }

  function onOffline() {
    if (activeCharacterId) emitStatus(activeCharacterId, STATUS.LOCAL, { message: "Sin conexión · cambios locales" });
  }

  function start() {
    if (started) return true;
    started = true;
    unsubscribeStore = store.subscribe(onStoreChange);
    window.addEventListener?.("banda:mobile-character-open", onOpen);
    window.addEventListener?.("banda:mobile-character-close", onClose);
    window.addEventListener?.("online", onOnline);
    window.addEventListener?.("offline", onOffline);
    if (canSync()) flushAll().catch(() => {});
    return true;
  }

  function stop() {
    if (!started) return false;
    started = false;
    unsubscribeStore?.();
    unsubscribeStore = null;
    window.removeEventListener?.("banda:mobile-character-open", onOpen);
    window.removeEventListener?.("banda:mobile-character-close", onClose);
    window.removeEventListener?.("online", onOnline);
    window.removeEventListener?.("offline", onOffline);
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
    return true;
  }

  const style = window.document?.createElement?.("style");
  if (style) {
    style.id = "banda-session-remote-sync-styles";
    style.textContent = `@media(max-width:820px){.mcs-session[data-sync-state="sincronizando"]{color:var(--mw)}.mcs-session[data-sync-state="error"]{color:var(--md)}.mcs-session[data-sync-state="local"]{color:var(--mm)}}`;
    window.document.head?.append?.(style);
  }

  window.BANDA_SESSION_REMOTE_SYNC = Object.freeze({
    version: 1,
    protocolVersion: PROTOCOL_VERSION,
    statusValues: STATUS,
    queuePrefix: QUEUE_PREFIX,
    configure,
    start,
    stop,
    sync,
    pull,
    flush,
    flushAll,
    queue,
    getStatus: statusOf,
    subscribe(listener) {
      if (typeof listener !== "function") return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    exportQueue: (characterId) => clone(readQueue(characterId)),
    clearQueue: (characterId) => removeQueue(characterId),
    getConfig: () => clone({ ...config, fetchImpl: config.fetchImpl ? "custom" : null })
  });

  start();
})();
