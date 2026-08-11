(() => {
  "use strict";

  const TOKEN_STORAGE_KEY = "banda.session-live.access-token.v1";
  const HASH_PARAMETER = "session-live-token";
  const MIN_TOKEN_LENGTH = 32;
  const baseConfig = window.BANDA_SESSION_REMOTE_CONFIG || {};
  const endpoint = String(baseConfig.endpoint || "").trim();
  const nativeFetch = window.fetch?.bind(window);

  function readToken() {
    try {
      return String(window.sessionStorage?.getItem(TOKEN_STORAGE_KEY) || "");
    } catch {
      return "";
    }
  }

  function storeToken(token) {
    const value = String(token || "").trim();
    if (value.length < MIN_TOKEN_LENGTH) {
      throw new Error(`SESSION_LIVE token must contain at least ${MIN_TOKEN_LENGTH} characters`);
    }
    window.sessionStorage?.setItem(TOKEN_STORAGE_KEY, value);
    return value;
  }

  function clearStoredToken() {
    try {
      window.sessionStorage?.removeItem(TOKEN_STORAGE_KEY);
    } catch {}
  }

  function importTokenFromHash() {
    const hash = String(window.location?.hash || "").replace(/^#/, "");
    if (!hash) return false;
    const params = new URLSearchParams(hash);
    const token = params.get(HASH_PARAMETER);
    if (!token) return false;
    storeToken(token);
    params.delete(HASH_PARAMETER);
    const cleanHash = params.toString();
    const next = `${window.location.pathname || ""}${window.location.search || ""}${cleanHash ? `#${cleanHash}` : ""}`;
    window.history?.replaceState?.(null, "", next);
    return true;
  }

  function isRemoteRequest(input) {
    if (!endpoint) return false;
    try {
      const candidate = new URL(typeof input === "string" ? input : input?.url, window.location?.href || endpoint);
      const target = new URL(endpoint, window.location?.href || endpoint);
      return candidate.origin === target.origin && candidate.pathname === target.pathname;
    } catch {
      return false;
    }
  }

  function payloadFromRequest(input, init = {}) {
    const method = String(init.method || "GET").toUpperCase();
    if (method === "GET") {
      const url = new URL(typeof input === "string" ? input : input?.url, window.location?.href || endpoint);
      return {
        action: String(url.searchParams.get("action") || "get"),
        protocolVersion: Number(url.searchParams.get("protocolVersion") || 1),
        characterId: String(url.searchParams.get("characterId") || "")
      };
    }
    if (!init.body) return {};
    try {
      return JSON.parse(String(init.body));
    } catch {
      throw new Error("SESSION_LIVE request body is not valid JSON");
    }
  }

  async function authenticatedFetch(input, init = {}) {
    if (!isRemoteRequest(input)) {
      if (!nativeFetch) throw new Error("Fetch no disponible");
      return nativeFetch(input, init);
    }

    const accessToken = readToken();
    if (accessToken.length < MIN_TOKEN_LENGTH) {
      throw new Error("SESSION_LIVE bloqueado: falta credencial privada en esta sesión del navegador");
    }

    const payload = {
      ...payloadFromRequest(input, init),
      accessToken
    };

    if (!nativeFetch) throw new Error("Fetch no disponible");
    return nativeFetch(endpoint, {
      ...init,
      method: "POST",
      headers: {
        ...(init.headers || {}),
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload),
      redirect: "follow",
      cache: "no-store"
    });
  }

  function applyInitialConfig() {
    window.BANDA_SESSION_REMOTE_CONFIG = Object.freeze({
      ...baseConfig,
      enabled: Boolean(endpoint && readToken().length >= MIN_TOKEN_LENGTH),
      fetchImpl: authenticatedFetch
    });
  }

  function setToken(token) {
    storeToken(token);
    window.BANDA_SESSION_REMOTE_SYNC?.configure?.({
      enabled: Boolean(endpoint),
      fetchImpl: authenticatedFetch
    });
    return true;
  }

  function clearToken() {
    clearStoredToken();
    window.BANDA_SESSION_REMOTE_SYNC?.configure?.({
      enabled: false,
      fetchImpl: authenticatedFetch
    });
    return true;
  }

  function buildPrivateLink(token, baseUrl = window.location?.href || "") {
    const value = String(token || "").trim();
    if (value.length < MIN_TOKEN_LENGTH) {
      throw new Error(`SESSION_LIVE token must contain at least ${MIN_TOKEN_LENGTH} characters`);
    }
    const url = new URL(baseUrl, window.location?.href);
    const params = new URLSearchParams(String(url.hash || "").replace(/^#/, ""));
    params.set(HASH_PARAMETER, value);
    url.hash = params.toString();
    return url.toString();
  }

  importTokenFromHash();
  applyInitialConfig();

  window.BANDA_SESSION_AUTH = Object.freeze({
    version: 1,
    storage: "sessionStorage",
    hasToken: () => readToken().length >= MIN_TOKEN_LENGTH,
    setToken,
    clearToken,
    buildPrivateLink
  });
})();
