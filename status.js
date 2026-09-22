(() => {
  "use strict";

  const STATUS_URL = "server-status.json";
  const FOUNDRY_URL = "http://190.133.176.41:30000/";
  const POLL_INTERVAL = 30000;
  const PROBE_TIMEOUT = 7000;

  const panel = document.querySelector("#server-panel");
  const statusText = document.querySelector("#status-text");
  const foundryLink = document.querySelector("#foundry-link");
  const mastheadStatus = document.querySelector("#masthead-status");
  const mastheadStatusText = document.querySelector("#masthead-status-text");

  if (!panel || !statusText || !foundryLink) return;

  foundryLink.href = FOUNDRY_URL;
  foundryLink.setAttribute("aria-disabled", "false");
  foundryLink.removeAttribute("tabindex");

  function translatedStatus(key, fallback) {
    const value = window.FoundryI18n?.t(`status.${key}`);
    return typeof value === "string" ? value : fallback;
  }

  function setMastheadState(state) {
    if (!mastheadStatus || !mastheadStatusText) return;

    mastheadStatus.dataset.state = state;
    mastheadStatusText.textContent = state === "online"
      ? "PORTAL ONLINE"
      : state === "offline"
        ? "PORTAL OFFLINE"
        : "CHECKING PORTAL...";
  }

  function setState(state) {
    panel.dataset.state = state;
    setMastheadState(state);

    // The Foundry button always points directly to the live game endpoint.
    // Keep it enabled even when the status monitor cannot probe the HTTP endpoint.
    foundryLink.href = FOUNDRY_URL;
    foundryLink.setAttribute("aria-disabled", "false");
    foundryLink.removeAttribute("tabindex");

    if (state === "online") {
      statusText.textContent = translatedStatus(
        "online",
        "ONLINE // BAD IDEAS WELCOME"
      );
      return;
    }

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

  async function probeServer(url) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT);

    try {
      const separator = url.includes("?") ? "&" : "?";
      await fetch(`${url}${separator}portal-check=${Date.now()}`, {
        method: "GET",
        mode: "no-cors",
        cache: "no-store",
        redirect: "follow",
        signal: controller.signal
      });
      return true;
    } catch {
      return false;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function refreshStatus(showChecking = false) {
    if (showChecking) setState("checking");

    try {
      const response = await fetch(`${STATUS_URL}?t=${Date.now()}`, {
        cache: "no-store"
      });

      if (!response.ok) throw new Error("Status file unavailable");

      const status = await response.json();

      // The status monitor is informational only. The actual button target is
      // intentionally fixed to the current Foundry game endpoint above.
      if (status.enabled === false || status.online !== true) {
        setState("offline");
        return;
      }

      const reachable = await probeServer(FOUNDRY_URL);
      setState(reachable ? "online" : "offline");
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
