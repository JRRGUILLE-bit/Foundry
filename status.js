(() => {
  "use strict";

  const STATUS_URL = "server-status.json";
  const POLL_INTERVAL = 30000;
  const PROBE_TIMEOUT = 7000;

  const panel = document.querySelector("#server-panel");
  const statusText = document.querySelector("#status-text");
  const foundryLink = document.querySelector("#foundry-link");

  if (!panel || !statusText || !foundryLink) return;

  function translatedStatus(key, fallback) {
    const value = window.FoundryI18n?.t(`status.${key}`);
    return typeof value === "string" ? value : fallback;
  }

  function setState(state, url = "") {
    panel.dataset.state = state;

    if (state === "online") {
      statusText.textContent = translatedStatus(
        "online",
        "ONLINE // BAD IDEAS WELCOME"
      );
      foundryLink.href = url;
      foundryLink.setAttribute("aria-disabled", "false");
      foundryLink.removeAttribute("tabindex");
      return;
    }

    foundryLink.removeAttribute("href");
    foundryLink.setAttribute("aria-disabled", "true");
    foundryLink.setAttribute("tabindex", "-1");

    if (state === "checking") {
      statusText.textContent = translatedStatus(
        "checking",
        "ASKING WIZARD TO REBOOT..."
      );
    } else {
      statusText.textContent = translatedStatus(
        "offline",
        "OFFLINE // PORTAL ON BREAK"
      );
    }
  }

  function getValidHttpsUrl(value) {
    if (typeof value !== "string" || value.trim() === "") return "";

    try {
      const url = new URL(value);
      return url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }

  function getFoundrySocketUrl(baseUrl) {
    const base = new URL(baseUrl);
    const socket = new URL("/socket.io/", base);
    socket.protocol = "wss:";
    socket.searchParams.set("EIO", "4");
    socket.searchParams.set("transport", "websocket");
    socket.searchParams.set("portal_check", Date.now().toString());
    return socket.href;
  }

  function probeFoundry(url) {
    return new Promise((resolve) => {
      let settled = false;
      let socket;

      const finish = (ok) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        if (socket && socket.readyState < WebSocket.CLOSING) {
          socket.close(1000, "portal health check complete");
        }
        resolve(ok);
      };

      const timeout = window.setTimeout(() => finish(false), PROBE_TIMEOUT);

      try {
        socket = new WebSocket(getFoundrySocketUrl(url));
      } catch {
        finish(false);
        return;
      }

      socket.addEventListener("message", (event) => {
        const payload = typeof event.data === "string" ? event.data : "";
        // Engine.IO opens a valid Socket.IO connection with packet type "0".
        // Requiring the handshake avoids treating an arbitrary HTTPS response
        // or unrelated WebSocket service as a healthy Foundry instance.
        if (payload.startsWith("0")) finish(true);
      });
      socket.addEventListener("error", () => finish(false));
      socket.addEventListener("close", () => finish(false));
    });
  }

  async function refreshStatus(showChecking = false) {
    if (showChecking) setState("checking");

    try {
      const response = await fetch(`${STATUS_URL}?t=${Date.now()}`, {
        cache: "no-store"
      });

      if (!response.ok) throw new Error("Status file unavailable");

      const status = await response.json();
      const url = getValidHttpsUrl(status.url);

      // `enabled` is the operator kill switch. `online` is retained as a
      // human-readable last-known state only; the browser decides live status
      // from a real Foundry Socket.IO handshake.
      if (status.enabled === false || !url) {
        setState("offline");
        return;
      }

      const reachable = await probeFoundry(url);
      setState(reachable ? "online" : "offline", reachable ? url : "");
    } catch {
      setState("offline");
    }
  }

  refreshStatus(true);
  window.setInterval(() => refreshStatus(false), POLL_INTERVAL);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refreshStatus(true);
  });
})();
