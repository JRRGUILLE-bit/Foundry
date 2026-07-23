(() => {
  "use strict";

  // La URL pública /exec del Web App de Apps Script se agrega después del despliegue.
  // No es un secreto: el backend está diseñado para sesiones temporales sin autenticación.
  window.BANDA_SESSION_REMOTE_CONFIG = Object.freeze({
    endpoint: "",
    enabled: true,
    debounceMs: 650,
    timeoutMs: 12000
  });
})();
