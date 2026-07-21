(() => {
  "use strict";

  const nativeFetch = window.fetch.bind(window);
  const records = new Map();

  window.fetch = async (input, init) => {
    const response = await nativeFetch(input, init);
    const url = typeof input === "string" ? input : input?.url || "";
    if (url.startsWith("character-data:") && response.ok) {
      response.clone().json().then((data) => {
        if (data?.id) records.set(data.id, data);
        refresh();
      }).catch(() => {});
    }
    return response;
  };

  function refresh() {
    const modal = document.querySelector(".cv-modal:not([hidden])");
    const sidebar = modal?.querySelector(".cv-sidebar");
    const marker = modal?.querySelector(".cv-ident small")?.textContent || "";
    const id = marker.match(/>\s*([A-Z0-9_-]+)\.JSON/i)?.[1]?.toLowerCase();
    if (!sidebar || !id) return;

    const data = records.get(id);
    if (!data) return;

    let status = sidebar.querySelector(".cv-audit-status");
    if (!status) {
      status = document.createElement("div");
      status.className = "cv-audit-status";
      status.style.cssText = "margin:.55rem 0;padding:.38rem .5rem;border:1px solid var(--green-dim);background:#000;font-size:.86rem;line-height:1.2;letter-spacing:.04em";
      sidebar.querySelector(".cv-ident")?.after(status);
    }

    const audit = data.audit || {};
    const actual = audit.actual || {
      spells: data.spells?.length || 0,
      inventory: data.inventory?.length || 0,
      features: data.features?.length || 0
    };
    const complete = audit.complete !== false;
    status.style.color = complete ? "var(--green-bright)" : "var(--amber-bright)";
    status.textContent = `${complete ? "DATOS COMPLETOS" : "DATOS PARCIALES"} // ${actual.spells} HECHIZOS // ${actual.inventory} INVENTARIO // ${actual.features} RASGOS`;
  }

  new MutationObserver(refresh).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
})();