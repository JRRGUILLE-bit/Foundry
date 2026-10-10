const fs = require("fs");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const html = fs.readFileSync("index.html", "utf8");
const script = fs.readFileSync("behind-screen.js", "utf8");
const styles = fs.readFileSync("behind-screen.css", "utf8");

assert(
  html.includes('href="behind-screen.css?v=20261009-1"'),
  "index.html must load the versioned Behind the Screen stylesheet"
);
assert(
  html.includes('src="behind-screen.js?v=20261009-1"'),
  "index.html must load the versioned Behind the Screen script"
);
assert(script.includes("banda.behind-screen.local-url.v1"), "shortcut must use a namespaced local storage key");
assert(script.includes("window.localStorage.setItem"), "saved address must remain local to the browser");
assert(script.includes("window.localStorage.getItem"), "shortcut must reuse the saved address");
assert(script.includes('url.protocol !== "http:" && url.protocol !== "https:"'), "shortcut must allow HTTP(S) only");
assert(script.includes("url.username") && script.includes("url.password"), "shortcut must reject URLs containing credentials");
assert(script.includes("window.location.assign(savedUrl)"), "configured shortcut must navigate directly to Foundry");
assert(script.includes("window.location.assign(url)"), "saving a valid address must open Foundry");
assert(script.includes("settingsButton.addEventListener"), "saved address must be editable");
assert(!/\bfetch\s*\(/.test(script), "shortcut must not scan the network or send the address to a remote service");
assert(!script.includes("santipc.tail278254.ts.net"), "shortcut must not hard-code or replace the existing Tailscale endpoint");
assert(styles.includes("position: fixed") && styles.includes("bottom:"), "shortcut must stay fixed at the bottom of the viewport");
assert(styles.includes("behind-screen-dialog::backdrop"), "configuration dialog must have a backdrop");

console.log("Behind the Screen QA: PASS");
