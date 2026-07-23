#!/usr/bin/env node
"use strict";

import { chromium, webkit } from "playwright";
import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = resolve(ROOT, "audit", "browser-qa-artifacts");
const PORT = Number(process.env.BROWSER_QA_PORT || 4173);
const BASE_URL = `http://127.0.0.1:${PORT}/index.html`;
const CHARACTERS = ["artionketh", "balder", "ingwe", "magna", "melkor", "sathar"];
const EXPECTED_RACES = { artionketh: "Tiefling", melkor: "Semielfo", sathar: "Humano" };
const TAB_ROOTS = {
  combat: ".mcs-hp-panel",
  spells: "[data-a11-root]",
  inventory: "[data-a12-root]",
  features: "[data-a13-root]",
  more: "[data-a14-root]"
};
const PROFILES = [
  {
    name: "chromium-android",
    browserType: chromium,
    options: {
      viewport: { width: 412, height: 915 },
      screen: { width: 412, height: 915 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
      reducedMotion: "reduce",
      userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 Chrome/136.0 Mobile Safari/537.36"
    }
  },
  {
    name: "webkit-iphone",
    browserType: webkit,
    options: {
      viewport: { width: 390, height: 844 },
      screen: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
      reducedMotion: "reduce",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1"
    }
  },
  {
    name: "chromium-desktop",
    browserType: chromium,
    options: {
      viewport: { width: 1440, height: 900 },
      screen: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce"
    },
    desktop: true
  }
];

const report = {
  status: "RUNNING",
  generatedAt: new Date().toISOString(),
  baseUrl: BASE_URL,
  knownGaps: [],
  profiles: [],
  totals: { checks: 0, failures: 0, warnings: 0, screenshots: 0 },
  failures: [],
  warnings: []
};

const clean = (value) => String(value || "").replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
const sleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));

function check(profile, name, condition, details = "", severity = "error") {
  const entry = { name, passed: Boolean(condition), details, severity };
  profile.checks.push(entry);
  report.totals.checks += 1;
  if (entry.passed) return true;
  const message = `${profile.name}:${name}${details ? `: ${details}` : ""}`;
  if (severity === "warning") {
    profile.warnings.push(message);
    report.warnings.push(message);
    report.totals.warnings += 1;
  } else {
    profile.failures.push(message);
    report.failures.push(message);
    report.totals.failures += 1;
  }
  return false;
}

function requireStep(profile, name, condition, details = "") {
  if (!check(profile, name, condition, details)) throw new Error(`${name}${details ? `: ${details}` : ""}`);
}

async function waitForServer() {
  const deadline = Date.now() + 20_000;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(BASE_URL, { redirect: "manual" });
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await sleep(200);
  }
  throw new Error(`Static server did not start: ${lastError?.message || "timeout"}`);
}

async function sandboxNetwork(page) {
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const local = url.hostname === "127.0.0.1" || url.hostname === "localhost";
    if (local) {
      if (request.resourceType() === "media") {
        await route.fulfill({ status: 204, body: "" });
      } else {
        await route.continue();
      }
      return;
    }

    if (url.hostname.endsWith("script.google.com") || url.hostname.endsWith("script.googleusercontent.com")) {
      let payload = {};
      if (request.method() === "POST") {
        try { payload = JSON.parse(request.postData() || "{}"); } catch { payload = {}; }
      }
      const body = request.method() === "POST"
        ? { ok: true, protocolVersion: 1, accepted: true, direction: "equal", record: payload.record || null }
        : { ok: true, protocolVersion: 1, service: "BANDA_SESSION_LIVE_QA_MOCK", record: null };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify(body)
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: request.resourceType() === "stylesheet" ? "text/css" : "text/plain",
      headers: { "access-control-allow-origin": "*" },
      body: ""
    });
  });
}

async function capture(page, profile, label) {
  const path = resolve(OUTPUT, profile.name, `${clean(label)}.png`);
  await mkdir(dirname(path), { recursive: true });
  await page.screenshot({ path, fullPage: false, animations: "disabled" });
  profile.screenshots.push(path.replace(`${ROOT}/`, ""));
  report.totals.screenshots += 1;
}

async function waitForApp(page) {
  await page.waitForFunction(() => Boolean(window.BANDA_MOBILE_SHELL?.open && window.BANDA_MOBILE_VIEW_MODEL?.buildAll), null, { timeout: 15_000 });
}

async function openCharacter(page, profile, characterId) {
  await page.waitForFunction(() => matchMedia("(max-width: 820px)").matches && innerWidth <= 820, null, { timeout: 5_000 });
  await sleep(350);
  let opened = await page.evaluate((id) => window.BANDA_MOBILE_SHELL.open(id), characterId);
  requireStep(profile, `${characterId}:open`, opened === true, `open returned ${opened}`);
  try {
    await page.locator(".mcs-root:not([hidden])").waitFor({ state: "visible", timeout: 1_500 });
  } catch {
    await page.waitForFunction(() => matchMedia("(max-width: 820px)").matches && innerWidth <= 820, null, { timeout: 15_000 });
    await sleep(500);
    opened = await page.evaluate((id) => window.BANDA_MOBILE_SHELL.open(id), characterId);
    requireStep(profile, `${characterId}:open-retry`, opened === true, `retry returned ${opened}`);
    await page.locator(".mcs-root:not([hidden])").waitFor({ state: "visible", timeout: 5_000 });
  }
  await page.waitForFunction((id) => window.BANDA_MOBILE_SHELL.activeCharacterId() === id, characterId);
  await sleep(220);
  const active = await page.evaluate(() => window.BANDA_MOBILE_SHELL.activeCharacterId());
  requireStep(profile, `${characterId}:active-id`, active === characterId, `active ${active}`);
}

async function closeCharacter(page) {
  await page.evaluate(() => window.BANDA_MOBILE_SHELL.close({ restoreFocus: false }));
  await page.locator(".mcs-root").waitFor({ state: "hidden", timeout: 5_000 });
}

async function selectTab(page, profile, characterId, tab) {
  const button = page.locator(`.mcs-nav [data-tab="${tab}"]`);
  await button.click();
  await page.locator(TAB_ROOTS[tab]).waitFor({ state: "visible", timeout: 5_000 });
  const selected = await button.getAttribute("aria-selected");
  check(profile, `${characterId}:${tab}:selected`, selected === "true", `aria-selected=${selected}`);
  await sleep(30);
}

async function layoutMetrics(page) {
  return page.evaluate(() => {
    const root = document.querySelector(".mcs-root");
    const header = document.querySelector(".mcs-header");
    const main = document.querySelector(".mcs-main");
    const nav = document.querySelector(".mcs-nav");
    const rect = (element) => {
      const box = element.getBoundingClientRect();
      return { top: box.top, right: box.right, bottom: box.bottom, left: box.left, width: box.width, height: box.height };
    };
    return {
      layoutViewport: { width: innerWidth, height: innerHeight },
      visualViewport: window.visualViewport
        ? { width: window.visualViewport.width, height: window.visualViewport.height, offsetTop: window.visualViewport.offsetTop }
        : null,
      rootPosition: getComputedStyle(root).position,
      rootOverflow: root.scrollWidth - root.clientWidth,
      mainOverflow: main.scrollWidth - main.clientWidth,
      documentOverflow: document.documentElement.scrollWidth - innerWidth,
      root: rect(root),
      header: rect(header),
      main: rect(main),
      nav: rect(nav)
    };
  });
}

async function checkFrame(page, profile, characterId) {
  const metrics = await layoutMetrics(page);
  const expectedHeight = metrics.visualViewport?.height || profile.viewport.height;
  check(profile, `${characterId}:root-fixed`, metrics.rootPosition === "fixed", metrics.rootPosition);
  check(profile, `${characterId}:root-top`, Math.abs(metrics.root.top) <= 1.5, JSON.stringify(metrics));
  check(profile, `${characterId}:root-width`, Math.abs(metrics.root.width - metrics.layoutViewport.width) <= 1.5, JSON.stringify(metrics));
  check(profile, `${characterId}:root-height`, Math.abs(metrics.root.height - expectedHeight) <= 2.5, JSON.stringify(metrics));
  check(profile, `${characterId}:root-no-horizontal-overflow`, metrics.rootOverflow <= 1, `overflow ${metrics.rootOverflow}px`);
  check(profile, `${characterId}:main-no-horizontal-overflow`, metrics.mainOverflow <= 1, `overflow ${metrics.mainOverflow}px`);
  check(profile, `${characterId}:document-overflow`, metrics.documentOverflow <= 1, `underlying document overflow ${metrics.documentOverflow}px`, "warning");
  check(profile, `${characterId}:header-main-order`, metrics.header.bottom <= metrics.main.top + 2, JSON.stringify(metrics));
  check(profile, `${characterId}:main-nav-order`, metrics.main.bottom <= metrics.nav.top + 2, JSON.stringify(metrics));
  check(profile, `${characterId}:nav-at-root-bottom`, Math.abs(metrics.nav.bottom - metrics.root.bottom) <= 2, JSON.stringify(metrics));

  await page.evaluate(() => {
    const main = document.querySelector(".mcs-main");
    main.scrollTop = main.scrollHeight;
  });
  await sleep(50);
  const bottom = await page.evaluate(() => {
    const main = document.querySelector(".mcs-main");
    const root = document.querySelector(".mcs-root").getBoundingClientRect();
    const nav = document.querySelector(".mcs-nav").getBoundingClientRect();
    return {
      atBottom: main.scrollHeight <= main.clientHeight || main.scrollTop + main.clientHeight >= main.scrollHeight - 2,
      navBottom: nav.bottom,
      rootBottom: root.bottom
    };
  });
  check(profile, `${characterId}:scroll-bottom`, bottom.atBottom, JSON.stringify(bottom));
  check(profile, `${characterId}:nav-visible-after-scroll`, Math.abs(bottom.navBottom - bottom.rootBottom) <= 2, JSON.stringify(bottom));
  await page.evaluate(() => { document.querySelector(".mcs-main").scrollTop = 0; });
}

async function checkTouchTargets(page, profile, label) {
  const undersized = await page.evaluate(() => [...document.querySelectorAll(".mcs-root button, .mcs-root input, .mcs-root textarea, .mcs-root summary")]
    .filter((element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0;
    })
    .map((element) => {
      const box = element.getBoundingClientRect();
      return {
        label: element.getAttribute("aria-label") || element.textContent.trim().slice(0, 48) || element.tagName,
        width: Math.round(box.width * 10) / 10,
        height: Math.round(box.height * 10) / 10
      };
    })
    .filter((entry) => entry.width < 43.5 || entry.height < 43.5));
  check(profile, `${label}:touch-targets`, undersized.length === 0, JSON.stringify(undersized.slice(0, 12)));
}

async function checkIdentity(page, profile, characterId) {
  const identity = await page.evaluate(() => {
    const image = document.querySelector(".mcs-portrait");
    return {
      name: document.querySelector("#mcs-name")?.textContent?.trim() || "",
      line: document.querySelector(".mcs-identity p")?.textContent?.trim() || "",
      portrait: image?.currentSrc || image?.src || "",
      loaded: Boolean(image?.complete && image?.naturalWidth > 0)
    };
  });
  check(profile, `${characterId}:name`, identity.name.length > 0, JSON.stringify(identity));
  check(profile, `${characterId}:level`, /NIVEL\s+\d+/i.test(identity.line), identity.line);
  check(profile, `${characterId}:portrait-source`, /portrait\.webp|favicon\.svg/i.test(identity.portrait), identity.portrait);
  check(profile, `${characterId}:portrait-loaded`, identity.loaded, JSON.stringify(identity));
  if (EXPECTED_RACES[characterId]) {
    check(profile, `${characterId}:canonical-race`, identity.line.includes(EXPECTED_RACES[characterId]), identity.line);
  }
}

async function exerciseSearch(page, profile, prefix, searchSelector, cardSelector, titleSelector) {
  const cards = page.locator(`${cardSelector}:not([hidden])`);
  const visible = await cards.count();
  check(profile, `${prefix}:cards`, visible > 0, `visible ${visible}`);
  if (!visible) return;
  const title = (await cards.first().locator(titleSelector).textContent() || "").trim();
  if (title) {
    const search = page.locator(searchSelector);
    await search.fill(title);
    await sleep(80);
    check(profile, `${prefix}:search`, await page.locator(`${cardSelector}:not([hidden])`).count() >= 1, title);
    await search.fill("");
  }
  await cards.first().locator("summary").click();
  check(profile, `${prefix}:expand`, await cards.first().getAttribute("open") !== null, "details did not open");
}

async function exerciseBalder(page, profile) {
  const id = "balder";
  await selectTab(page, profile, id, "combat");
  const hp = page.locator(".mcs-hp-value strong");
  const before = Number(await hp.textContent());
  if (Number.isFinite(before) && before > 0) {
    await page.locator('[data-action="hp-delta"][data-delta="-1"]').click();
    await page.waitForFunction((expected) => Number(document.querySelector(".mcs-hp-value strong")?.textContent) === expected, before - 1);
    const temp = page.locator("#mcs-temp-hp");
    await temp.fill("3");
    await temp.press("Tab");
    await closeCharacter(page);
    await openCharacter(page, profile, id);
    check(profile, `${id}:hp-persistence`, Number(await hp.textContent()) === before - 1, `expected ${before - 1}`);
    check(profile, `${id}:temp-hp-persistence`, await page.locator("#mcs-temp-hp").inputValue() === "3", "expected 3");
  }

  await selectTab(page, profile, id, "spells");
  await exerciseSearch(page, profile, `${id}:spells`, ".a11-search", ".a11-spell", ".a11-title strong");
  await checkTouchTargets(page, profile, `${id}:spells`);
  await capture(page, profile, `${id}-spells`);

  await selectTab(page, profile, id, "inventory");
  await exerciseSearch(page, profile, `${id}:inventory`, ".a12-search", ".a12-item", ".a12-title strong");
  await checkTouchTargets(page, profile, `${id}:inventory`);
  await capture(page, profile, `${id}-inventory`);

  await selectTab(page, profile, id, "features");
  await exerciseSearch(page, profile, `${id}:features`, ".a13-search", ".a13-feature", ".a13-title strong");
  await checkTouchTargets(page, profile, `${id}:features`);
  await capture(page, profile, `${id}-features`);

  await selectTab(page, profile, id, "more");
  const inspiration = page.locator(".a14-toggle").first();
  if (await inspiration.count()) {
    const previous = await inspiration.getAttribute("aria-pressed");
    await inspiration.click();
    check(profile, `${id}:inspiration-toggle`, await inspiration.getAttribute("aria-pressed") !== previous, previous || "null");
  }
  const notes = page.locator(".a14-notes");
  if (await notes.count()) {
    await notes.fill("Browser QA session note");
    await notes.press("Tab");
    check(profile, `${id}:session-notes`, await notes.inputValue() === "Browser QA session note", "notes mismatch");
  }
  await checkTouchTargets(page, profile, `${id}:more`);
  await capture(page, profile, `${id}-more`);

  check(profile, `${id}:reset-api`, await page.evaluate(() => window.BANDA_MOBILE_SHELL.resetSession()) === true, "reset returned false");
  await selectTab(page, profile, id, "combat");
  await capture(page, profile, `${id}-combat-reset`);
}

async function runMobile(config, profile) {
  const browser = await config.browserType.launch({ headless: true });
  const context = await browser.newContext(config.options);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  await sandboxNetwork(page);

  try {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 20_000 });
    await waitForApp(page);
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "domcontentloaded", timeout: 20_000 });
    await waitForApp(page);

    for (const characterId of CHARACTERS) {
      try {
        await openCharacter(page, profile, characterId);
        await checkIdentity(page, profile, characterId);
        await checkFrame(page, profile, characterId);
        await checkTouchTargets(page, profile, `${characterId}:combat`);
        for (const tab of Object.keys(TAB_ROOTS)) await selectTab(page, profile, characterId, tab);
        await selectTab(page, profile, characterId, "combat");
        await capture(page, profile, `${characterId}-combat`);
        if (characterId === "balder") await exerciseBalder(page, profile);
        await closeCharacter(page);
      } catch (error) {
        check(profile, `${characterId}:exception`, false, error.stack || error.message);
        try { await closeCharacter(page); } catch { /* continue */ }
      }
    }

    const relevant = [...new Set(errors)].filter((message) => !/Failed to load resource/i.test(message));
    check(profile, "console-clean", relevant.length === 0, JSON.stringify(relevant));
  } finally {
    await context.close();
    await browser.close();
  }
}

async function runDesktop(config, profile) {
  const browser = await config.browserType.launch({ headless: true });
  const context = await browser.newContext(config.options);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  await sandboxNetwork(page);

  try {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 20_000 });
    await waitForApp(page);
    const state = await page.evaluate(() => ({
      terminalVisible: document.querySelector(".terminal-shell")?.getClientRects().length > 0,
      mobileHidden: document.querySelector(".mcs-root")?.hidden === true,
      mobileDisplay: getComputedStyle(document.querySelector(".mcs-root")).display,
      width: document.documentElement.scrollWidth,
      viewport: innerWidth
    }));
    check(profile, "terminal-visible", state.terminalVisible, JSON.stringify(state));
    check(profile, "mobile-hidden", state.mobileHidden && state.mobileDisplay === "none", JSON.stringify(state));
    check(profile, "horizontal-overflow", state.width <= state.viewport + 1, JSON.stringify(state), "warning");
    check(profile, "mobile-open-blocked", await page.evaluate(() => window.BANDA_MOBILE_SHELL.open("balder")) === false, "mobile shell opened on desktop");
    await capture(page, profile, "desktop-home");
    const relevant = [...new Set(errors)].filter((message) => !/Failed to load resource/i.test(message));
    check(profile, "console-clean", relevant.length === 0, JSON.stringify(relevant));
  } finally {
    await context.close();
    await browser.close();
  }
}

async function main() {
  await rm(OUTPUT, { recursive: true, force: true });
  await mkdir(OUTPUT, { recursive: true });
  const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], {
    cwd: ROOT,
    stdio: ["ignore", "ignore", "ignore"]
  });

  try {
    await waitForServer();
    for (const config of PROFILES) {
      const profile = {
        name: config.name,
        viewport: config.options.viewport,
        checks: [],
        failures: [],
        warnings: [],
        screenshots: []
      };
      report.profiles.push(profile);
      try {
        if (config.desktop) await runDesktop(config, profile);
        else await runMobile(config, profile);
      } catch (error) {
        check(profile, "profile-exception", false, error.stack || error.message);
      }
    }
  } finally {
    server.kill("SIGTERM");
  }

  report.status = report.totals.failures ? "BROWSER_MOBILE_QA_FAILED" : "BROWSER_MOBILE_QA_PASSED";
  report.generatedAt = new Date().toISOString();
  await writeFile(resolve(OUTPUT, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
  if (report.totals.failures) process.exitCode = 1;
}

main().catch(async (error) => {
  report.status = "BROWSER_MOBILE_QA_CRASHED";
  report.failures.push(error.stack || error.message);
  report.totals.failures += 1;
  await mkdir(OUTPUT, { recursive: true });
  await writeFile(resolve(OUTPUT, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.error(error);
  process.exitCode = 1;
});
