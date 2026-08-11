(() => {
  "use strict";

  // The Apps Script URL is public by design. Security comes from the private
  // access token stored only in Apps Script Script Properties and in the
  // current browser session. Fail closed until mobile-session-auth.js finds
  // a valid local token.
  window.BANDA_SESSION_REMOTE_CONFIG = Object.freeze({
    endpoint: "https://script.google.com/macros/s/AKfycbz7X0451KOcVPEnaDa1WkF5-Xlm7J9DSJTWjc0BABeS69u1wWIQOntj7wxzXxbLarPSUQ/exec",
    enabled: false,
    debounceMs: 650,
    timeoutMs: 12000
  });
})();
