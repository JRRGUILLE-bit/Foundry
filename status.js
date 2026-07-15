(() => {
  "use strict";

  const STATUS_URL = "server-status.json";
  const POLL_INTERVAL = 30000;
  const PROBE_TIMEOUT = 7000;

  const panel = document.querySelector("#server-panel");
  const statusText = document.querySelector("#status-text");
  const foundryLink = document.querySelector("#foundry-link");

  if (!panel || !statusText || !foundryLink) return;

  function setState(state, url = "") {
    panel.dataset.state = state;

    if (state === "online") {
      statusText.textContent = "ONLINE // GATE OPEN";
      foundryLink.href = url;
      foundryLink.setAttribute("aria-disabled", "false");
      foundryLink.removeAttribute("tabindex");
      return;
    }

    foundryLink.removeAttribute("href");
    foundryLink.setAttribute("aria-disabled", "true");
    foundryLink.setAttribute("tabindex", "-1");

    if (state === "checking") {
      statusText.textContent = "CHECKING FOUNDRY LINK...";
    } else {
      statusText.textContent = "OFFLINE";
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
      const url = getValidHttpsUrl(status.url);

      if (status.online !== true || !url) {
        setState("offline");
        return;
      }

      const reachable = await probeServer(url);
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
