const fs = require("fs");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const html = fs.readFileSync("index.html", "utf8");
const script = fs.readFileSync("behind-screen.js", "utf8");
const styles = fs.readFileSync("behind-screen.css", "utf8");

assert(
  html.includes('href="behind-screen.css?v=20261009-2"'),
  "index.html must load the versioned Behind the Screen stylesheet"
);
assert(
  html.includes('src="behind-screen.js?v=20261009-2"'),
  "index.html must load the versioned Behind the Screen script"
);
assert(
  script.includes('http://192.168.86.35:30000/game'),
  "Behind the Screen button must point directly to Guille's local Foundry"
);
assert(script.includes('link.href = foundryUrl'), "shortcut must open the configured Foundry URL");
assert(script.includes("BEHIND THE SCREEN") && script.includes("PARA GUILLE"), "shortcut label must be present");
assert(!/\blocalStorage\b/.test(script), "shortcut must not require saved settings");
assert(!/\bfetch\s*\(/.test(script), "shortcut must not scan the network or send the address to a remote service");
assert(styles.includes("position: fixed") && styles.includes("bottom:"), "shortcut must stay fixed at the bottom of the viewport");

console.log("Behind the Screen QA: PASS");
