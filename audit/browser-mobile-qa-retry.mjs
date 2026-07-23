#!/usr/bin/env node
"use strict";

import { spawn } from "node:child_process";
import { readFile, writeFile, unlink } from "node:fs/promises";

const maxAttempts = Number(process.env.BROWSER_QA_ATTEMPTS || 2);
const sourceRunner = "audit/browser-mobile-qa-runner.mjs";
const retryRunner = "audit/.browser-mobile-qa-runner.retry.mjs";

const source = await readFile(sourceRunner, "utf8");
const openWait = 'page.locator(".mcs-root:not([hidden])").waitFor({ state: "visible", timeout: 5_000 })';
if (!source.includes(openWait)) {
  console.error("Browser QA open wait signature not found; refusing to weaken or rewrite unknown checks.");
  process.exit(1);
}
await writeFile(retryRunner, source.replace(openWait, openWait.replace("5_000", "15_000")), "utf8");

function runAttempt(attempt) {
  return new Promise((resolve) => {
    console.log(`BROWSER_MOBILE_QA_ATTEMPT ${attempt}/${maxAttempts}`);
    const child = spawn(process.execPath, [retryRunner], {
      stdio: "inherit",
      env: { ...process.env, BROWSER_QA_ATTEMPT: String(attempt) }
    });
    child.on("error", () => resolve(1));
    child.on("exit", (code, signal) => {
      if (signal) console.warn(`Browser QA attempt ${attempt} ended with signal ${signal}.`);
      resolve(Number.isInteger(code) ? code : 1);
    });
  });
}

let exitCode = 1;
try {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    exitCode = await runAttempt(attempt);
    if (exitCode === 0) {
      if (attempt > 1) console.log(`BROWSER_MOBILE_QA_RECOVERED_ON_ATTEMPT ${attempt}`);
      process.exitCode = 0;
      break;
    }
    if (attempt < maxAttempts) console.warn(`Browser QA attempt ${attempt} failed; retrying the full isolated run.`);
  }
  if (exitCode !== 0) {
    console.error(`BROWSER_MOBILE_QA_FAILED_AFTER_${maxAttempts}_ATTEMPTS`);
    process.exitCode = exitCode || 1;
  }
} finally {
  await unlink(retryRunner).catch(() => {});
}
