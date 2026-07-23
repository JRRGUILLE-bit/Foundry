#!/usr/bin/env node
"use strict";

import { spawn } from "node:child_process";

const maxAttempts = Number(process.env.BROWSER_QA_ATTEMPTS || 3);
const runner = "audit/browser-mobile-qa-runner.mjs";

function runAttempt(attempt) {
  return new Promise((resolve) => {
    console.log(`BROWSER_MOBILE_QA_ATTEMPT ${attempt}/${maxAttempts}`);
    const child = spawn(process.execPath, [runner], {
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
for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  exitCode = await runAttempt(attempt);
  if (exitCode === 0) {
    if (attempt > 1) console.log(`BROWSER_MOBILE_QA_RECOVERED_ON_ATTEMPT ${attempt}`);
    process.exit(0);
  }
  if (attempt < maxAttempts) console.warn(`Browser QA attempt ${attempt} failed; retrying the full isolated run.`);
}

console.error(`BROWSER_MOBILE_QA_FAILED_AFTER_${maxAttempts}_ATTEMPTS`);
process.exit(exitCode || 1);
