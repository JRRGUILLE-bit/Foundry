(() => {
  "use strict";

  // The Apps Script URL is public by design. Security comes from the private
  // access token stored only in Apps Script Script Properties and in the
  // current browser session. Fail closed until mobile-session-auth.js finds
  // a valid local token.
  window.BANDA_SESSION_REMOTE_CONFIG = Object.freeze({
    endpoint: "https://script.google.com/macros/s/AKfycbylwSlLjyeZLxA_m3A7ONpAveKZA9YOPB3OVnSWu9GD6lws5r1gIgkaQPf_BxZeoov2/exec",
    enabled: false,
    debounceMs: 650,
    timeoutMs: 12000
  });
})();
