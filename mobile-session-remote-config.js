(() => {
  "use strict";

  // Endpoint vacío usado durante el desarrollo y cubierto por QA: endpoint: ""
  // La URL pública /exec no es un secreto; el backend valida esquema, personaje y vencimiento.
  window.BANDA_SESSION_REMOTE_CONFIG = Object.freeze({
    endpoint: "https://script.google.com/macros/s/AKfycbz7X0451KOcVPEnaDa1WkF5-Xlm7J9DSJTWjc0BABeS69u1wWIQOntj7wxzXxbLarPSUQ/exec",
    enabled: true,
    debounceMs: 650,
    timeoutMs: 12000
  });
})();