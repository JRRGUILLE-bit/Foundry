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
const RACE_EXPECTATIONS = {
  artionketh: "Tiefling",
  melkor: "Semielfo",
  sathar: "Humano"
};
const TABS = {
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
    context: {
      viewport: { width: 412, height: 915 },
      screen: { width: 412, height: 915 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
      userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 Chrome/136.0 Mobile Safari/537.36"
    }
  },
  {
    name: "webkit-iphone",
    browserType: webkit,
    context: {
      viewport: { width: 390, height: 844 },
      screen: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1"
    }
  },
  {
    name: "chromium-desktop",
    browserType: chromium,
    context: {
      viewport: { width: 1440, height: 900 },
      screen: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false
    },
    desktop: true
  }
];

const report = {
  status: "RUNNING",
  generatedAt: new Date().toISOString(),
  baseUrl: BASE_URL,
  profiles: [],
  totals: { checks: 0, failures: 0, warnings: 0, screenshots: 0 },
  failures: [],
  warnings: []
};

function clean(value) {
  return String(value || "").replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

function record(profile, name, passed, details = "", severity = "error") {
  const entry = { name, passed: Boolean(passed), details, severity };
  profile.checks.push(entry);
  report.totals.checks += 1;
  if (entry.passed) return;
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
}

function assert(profile, name, condition, details = "") {
  record(profile, name, condition, details, "error");
  if (!condition) throw new Error(`${name}${details ? `: ${details}` : ""}`);
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
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 200));
  }
  throw new Error(`Static server did not start: ${lastError?.message || "timeout"}`);
}

async function installNetworkSandbox(page) {
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.hostname === "127.0.0.1" || url.hostname === "localhost") {
      await route.continue();
      return;
    }

    if (url.hostname.endsWith("script.google.com") || url.hostname.endsWith("script.googleusercontent.com")) {
      let payload = {};
      if (request.method() === "POST") {
        try { payload = JSON.parse(request.postData() || "{}"); } catch { payload = {}; }
      }
      const body = request.method() === "POST"
        ? {
            ok: true,
            protocolVersion: 1,
            accepted: true,
            direction: "equal",
            record: payload.record || null
          }
        : {
            ok: true,
            protocolVersion: 1,
            service: "BANDA_SESSION_LIVE_QA_MOCK",
            record: null
          };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify(body)
      });
      return;
    }

    const resourceType = request.resourceType();
    await route.fulfill({
      status: 200,
      contentType: resourceType === "stylesheet" ? "text/css" : "text/plain",
      headers: { "access-control-allow-origin": "*" },
      body: ""
    });
  });
}

async function screenshot(page, profile, label) {
  const path = resolve(OUTPUT, profile.name, `${clean(label)}.png`);
  await mkdir(dirname(path), { recursive: true });
  await page.screenshot({ path, fullPage: false, animations: "disabled" });
  profile.screenshots.push(path.replace(`${ROOT}/`, ""));
  report.totals.screenshots += 1;
}

async function waitForApplication(page) {
  await page.waitForFunction(() => Boolean(window.BANDA_MOBILE_SHELL?.open && window.BANDA_MOBILE_VIEW_MODEL?.buildAll), null, { timeout: 15_000 });
}

async function openCharacter(page, profile, characterId) {
  const opened = await page.evaluate((id) => window.BANDA_MOBILE_SHELL.open(id), characterId);
  assert(profile, `${characterId}:open`, opened === true, `open returned ${opened}`);
  await page.locator(".mcs-root:not([hidden])").waitFor({ state: "visible", timeout: 5_000 });
  await page.waitForFunction((id) => window.BANDA_MOBILE_SHELL.activeCharacterId() === id, characterId);
  const active = await page.evaluate(() => window.BANDA_MOBILE_SHELL.activeCharacterId());
  assert(profile, `${characterId}:active-id`, active === characterId, `active ${active}`);
}

async function closeCharacter(page) {
  await page.evaluate(() => window.BANDA_MOBILE_SHELL.close({ restoreFocus: false }));
  await page.locator(".mcs-root").waitFor({ state: "hidden", timeout: 5_000 });
}

async function selectTab(page, profile, characterId, tab) {
  const button = page.locator(`.mcs-nav [data-tab="${tab}"]`);
  await button.click();
  await page.locator(TABS[tab]).waitFor({ state: "visible", timeout: 5_000 });
  const selected = await button.getAttribute("aria-selected");
  assert(profile, `${characterId}:${tab}:selected`, selected === "true", `aria-selected=${selected}`);
}

async function checkMobileFrame(page, profile, characterId) {
  const metrics = await page.evaluate(() => {
    const root = document.querySelector(".mcs-root");
    const header = document.querySelector(".mcs-header");
    const main = document.querySelector(".mcs-main");
    const nav = document.querySelector(".mcs-nav");
    const rect = (element) => {
      const box = element.getBoundingClientRect();
      return { top: box.top, right: box.right, bottom: box.bottom, left: box.left, width: box.width, height: box.height };
    };
    return {
      viewport: { width: innerWidth, height: innerHeight },
      rootStyle: getComputedStyle(root).position,
      rootOverflow: root.scrollWidth - root.clientWidth,
      documentOverflow: document.documentElement.scrollWidth - innerWidth,
      root: rect(root),
      header: rect(header),
      main: rect(main),
      nav: rect(nav),
      mainScroll: { height: main.scrollHeight, client: main.clientHeight }
    };
  });

  assert(profile, `${characterId}:root-fixed`, metrics.rootStyle === "fixed", metrics.rootStyle);
  assert(profile, `${characterId}:root-width`, Math.abs(metrics.root.width - metrics.viewport.width) <= 1.5, JSON.stringify(metrics));
  assert(profile, `${characterId}:root-height`, Math.abs(metrics.root.height - metrics.viewport.height) <= 2, JSON.stringify(metrics));
  assert(profile, `${characterId}:root-no-horizontal-overflow`, metrics.rootOverflow <= 1, `overflow ${metrics.rootOverflow}px`);
  record(profile, `${characterId}:document-no-horizontal-overflow`, metrics.documentOverflow <= 1, `underlying document overflow ${metrics.documentOverflow}px`, "warning");
  assert(profile, `${characterId}:header-main-order`, metrics.header.bottom <= metrics.main.top + 2, JSON.stringify(metrics));
  assert(profile, `${characterId}:main-nav-order`, metrics.main.bottom <= metrics.nav.top + 2, JSON.stringify(metrics));
  assert(profile, `${characterId}:nav-visible-bottom`, Math.abs(metrics.nav.bottom - metrics.viewport.height) <= 2, JSON.stringify(metrics));

  const badTargets = await page.evaluate(() => [...document.querySelectorAll(".mcs-root button, .mcs-root input, .mcs-root textarea, .mcs-root summary")]
    .filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
    })
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        label: element.getAttribute("aria-label") || element.textContent.trim().slice(0, 50) || element.tagName,
        width: Math.round(rect.width * 10) / 10,
        height: Math.round(rect.height * 10) / 10
      };
    })
    .filter((entry) => entry.width < 43.5 || entry.height < 43.5));
  assert(profile, `${characterId}:touch-targets`, badTargets.length === 0, JSON.stringify(badTargets.slice(0, 10)));

  await page.evaluate(() => {
    const main = document.querySelector(".mcs-main");
    main.scrollTop = main.scrollHeight;
  });
  await page.waitForTimeout(50);
  const afterScroll = await page.evaluate(() => {
    const main = document.querySelector(".mcs-main");
    const nav = document.querySelector(".mcs-nav").getBoundingClientRect();
    return {
      atBottom: main.scrollHeight <= main.clientHeight || main.scrollTop + main.clientHeight >= main.scrollHeight - 2,
      navBottom: nav.bottom,
      viewport: innerHeight
    };
  });
  assert(profile, `${characterId}:scroll-to-bottom`, afterScroll.atBottom, JSON.stringify(afterScroll));
  assert(profile, `${characterId}:nav-stays-visible`, Math.abs(afterScroll.navBottom - afterScroll.viewport) <= 2, JSON.stringify(afterScroll));
  await page.evaluate(() => { document.querySelector(".mcs-main").scrollTop = 0; });
}

async function checkIdentity(page, profile, characterId) {
  const identity = await page.evaluate(() => ({
    name: document.querySelector("#mcs-name")?.textContent?.trim() || "",
    line: document.querySelector(".mcs-identity p")?.textContent?.trim() || "",
    portrait: document.querySelector(".mcs-portrait")?.currentSrc || document.querySelector(".mcs-portrait")?.src || "",
    portraitComplete: Boolean(document.querySelector(".mcs-portrait")?.complete),
    portraitWidth: Number(document.querySelector(".mcs-portrait")?.naturalWidth || 0)
  }));
  assert(profile, `${characterId}:identity-name`, identity.name.length > 0, JSON.stringify(identity));
  assert(profile, `${characterId}:identity-level`, /NIVEL\s+\d+/i.test(identity.line), identity.line);
  assert(profile, `${characterId}:portrait-source`, /portrait\.webp|favicon\.svg/i.test(identity.portrait), identity.portrait);
  assert(profile, `${characterId}:portrait-loaded`, identity.portraitComplete && identity.portraitWidth > 0, JSON.stringify(identity));
  const race = RACE_EXPECTATIONS[characterId];
  if (race) assert(profile, `${characterId}:canonical-race`, identity.line.includes(race), identity.line);
}

async function exerciseSearchAndDetails(page, profile, prefix, searchSelector, cardSelector, titleSelector) {
  const search = page.locator(searchSelector);
  const cards = page.locator(`${cardSelector}:not([hidden])`);
  const count = await cards.count();
  record(profile, `${prefix}:cards-present`, count > 0, `visible cards ${count}`, count > 0 ? "error" : "warning");
  if (!count) return;
  const title = (await cards.first().locator(titleSelector).textContent() || "").trim();
  if (title) {
    await search.fill(title);
    await page.waitForTimeout(60);
    const filtered = await page.locator(`${cardSelector}:not([hidden])`).count();
    assert(profile, `${prefix}:search`, filtered >= 1, `query ${title}, visible ${filtered}`);
    await search.fill("");
  }
  const summary = cards.first().locator("summary");
  await summary.click();
  assert(profile, `${prefix}:expand`, await cards.first().getAttribute("open") !== null, "details did not open");
}

async function exerciseRepresentativeInteractions(page, profile) {
  const characterId = "balder";
  await selectTab(page, profile, characterId, "combat");
  const hpText = page.locator(".mcs-hp-value strong");
  const hpBefore = Number(await hpText.textContent());
  if (Number.isFinite(hpBefore) && hpBefore > 0) {
    await page.locator('[data-action="hp-delta"][data-delta="-1"]').click();
    await page.waitForFunction((expected) => Number(document.querySelector(".mcs-hp-value strong")?.textContent) === expected, hpBefore - 1);
    const temp = page.locator("#mcs-temp-hp");
    await temp.fill("3");
    await temp.press("Tab");
    await closeCharacter(page);
    await openCharacter(page, profile, characterId);
    assert(profile, `${characterId}:hp-persistence`, Number(await hpText.textContent()) === hpBefore - 1, `expected ${hpBefore - 1}`);
    assert(profile, `${characterId}:temp-hp-persistence`, await page.locator("#mcs-temp-hp").inputValue() === "3", "temporary HP not restored");
  }

  await selectTab(page, profile, characterId, "spells");
  await exerciseSearchAndDetails(page, profile, `${characterId}:spells`, ".a11-search", ".a11-spell", ".a11-title strong");
  await screenshot(page, profile, `${characterId}-spells`);

  await selectTab(page, profile, characterId, "inventory");
  await exerciseSearchAndDetails(page, profile, `${characterId}:inventory`, ".a12-search", ".a12-item", ".a12-title strong");
  await screenshot(page, profile, `${characterId}-inventory`);

  await selectTab(page, profile, characterId, "features");
  await exerciseSearchAndDetails(page, profile, `${characterId}:features`, ".a13-search", ".a13-feature", ".a13-title strong");
  await screenshot(page, profile, `${characterId}-features`);

  await selectTab(page, profile, characterId, "more");
  const toggle = page.locator(".a14-toggle").first();
  if (await toggle.count()) {
    const before = await toggle.getAttribute("aria-pressed");
    await toggle.click();
    const after = await toggle.getAttribute("aria-pressed");
    assert(profile, `${characterId}:more-toggle`, before !== after, `${before} -> ${after}`);
  }
  const notes = page.locator(".a14-notes");
  if (await notes.count()) {
    await notes.fill("Browser QA session note");
    await notes.press("Tab");
    assert(profile, `${characterId}:more-notes`, (await notes.inputValue()) === "Browser QA session note", "notes did not persist in view");
  }
  await screenshot(page, profile, `${characterId}-more`);

  await page.evaluate(() => window.BANDA_MOBILE_SHELL.resetSession());
  await selectTab(page, profile, characterId, "combat");
  await screenshot(page, profile, `${characterId}-combat-reset`);
}

async function runMobileProfile(profileConfig, profile) {
  const browser = await profileConfig.browserType.launch({ headless: true });
  const context = await browser.newContext(profileConfig.context);
  const page = await context.newPage();
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`console: ${message.text()}`);
  });
  await installNetworkSandbox(page);

  try {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 20_000 });
    await waitForApplication(page);
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "domcontentloaded", timeout: 20_000 });
    await waitForApplication(page);

    for (const characterId of CHARACTERS) {
      await openCharacter(page, profile, characterId);
      await checkIdentity(page, profile, characterId);
      await checkMobileFrame(page, profile, characterId);
      for (const tab of Object.keys(TABS)) await selectTab(page, profile, characterId, tab);
      await selectTab(page, profile, characterId, "combat");
      await screenshot(page, profile, `${characterId}-combat`);
      if (characterId === "balder") await exerciseRepresentativeInteractions(page, profile);
      await closeCharacter(page);
    }

    const uniqueErrors = [...new Set(browserErrors)].filter((message) => !/Failed to load resource/i.test(message));
    assert(profile, "browser-console-clean", uniqueErrors.length === 0, JSON.stringify(uniqueErrors));
  } finally {
    await context.close();
    await browser.close();
  }
}

async function runDesktopProfile(profileConfig, profile) {
  const browser = await profileConfig.browserType.launch({ headless: true });
  const context = await browser.newContext(profileConfig.context);
  const page = await context.newPage();
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`console: ${message.text()}`);
  });
  await installNetworkSandbox(page);

  try {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 20_000 });
    await waitForApplication(page);
    const desktop = await page.evaluate(() => ({
      terminalVisible: document.querySelector(".terminal-shell")?.getClientRects().length > 0,
      mobileHidden: document.querySelector(".mcs-root")?.hidden === true,
      mobileDisplay: getComputedStyle(document.querySelector(".mcs-root")).display,
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth
    }));
    assert(profile, "desktop:terminal-visible", desktop.terminalVisible, JSON.stringify(desktop));
    assert(profile, "desktop:mobile-shell-hidden", desktop.mobileHidden && desktop.mobileDisplay === "none", JSON.stringify(desktop));
    record(profile, "desktop:no-horizontal-overflow", desktop.documentWidth <= desktop.viewport.width + 1, JSON.stringify(desktop), "warning");
    const openResult = await page.evaluate(() => window.BANDA_MOBILE_SHELL.open("balder"));
    assert(profile, "desktop:mobile-open-blocked", openResult === false, `open returned ${openResult}`);
    await screenshot(page, profile, "desktop-home");
    const uniqueErrors = [...new Set(browserErrors)].filter((message) => !/Failed to load resource/i.test(message));
    assert(profile, "desktop:console-clean", uniqueErrors.length === 0, JSON.stringify(uniqueErrors));
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
    stdio: ["ignore", "pipe", "pipe"]
  });
  let serverError = "";
  server.stderr.on("data", (chunk) => { serverError += chunk.toString(); });

  try {
    await waitForServer();
    for (const profileConfig of PROFILES) {
      const profile = {
        name: profileConfig.name,
        viewport: profileConfig.context.viewport,
        checks: [],
        failures: [],
        warnings: [],
        screenshots: []
      };
      report.profiles.push(profile);
      try {
        if (profileConfig.desktop) await runDesktopProfile(profileConfig, profile);
        else await runMobileProfile(profileConfig, profile);
      } catch (error) {
        record(profile, "profile-exception", false, error.stack || error.message, "error");
      }
    }
  } finally {
    server.kill("SIGTERM");
  }

  report.status = report.totals.failures ? "BROWSER_MOBILE_QA_FAILED" : "BROWSER_MOBILE_QA_PASSED";
  report.generatedAt = new Date().toISOString();
  if (serverError && !/Serving HTTP/.test(serverError)) report.serverLog = serverError.trim();
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
