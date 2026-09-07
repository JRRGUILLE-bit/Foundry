#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const dataIndex = JSON.parse(read("data/characters/index.json"));
const staticIndex = JSON.parse(read("foundry_characters_static/characters.index.json"));
const rosterSource = read("party-roster.js");
const runtimeSource = read("character-static-runtime.js");

const expected = ["artionketh", "balder", "ingwe", "melkor", "sathar"].sort();
const ids = (index) => (index.characters || []).map((entry) => entry.id).sort();
const failures = [];

function check(name, condition, details = "") {
  if (!condition) failures.push(`${name}${details ? `: ${details}` : ""}`);
}

check("data-index-count", ids(dataIndex).length === 5, ids(dataIndex).join(", "));
check("data-index-members", JSON.stringify(ids(dataIndex)) === JSON.stringify(expected), ids(dataIndex).join(", "));
check("static-index-count", ids(staticIndex).length === 5, ids(staticIndex).join(", "));
check("static-index-members", JSON.stringify(ids(staticIndex)) === JSON.stringify(expected), ids(staticIndex).join(", "));
check("party-roster-no-magna", !/\bmagna\b/i.test(rosterSource), "party-roster.js still references Magna");
check("runtime-retirement", /retiredIds\s*=\s*new Set\(\[\"magna\"\]\)/.test(runtimeSource), "runtime retirement guard missing");

const report = {
  status: failures.length ? "ACTIVE_ROSTER_QA_FAILED" : "ACTIVE_ROSTER_QA_PASSED",
  activeCharacters: expected,
  retiredCharacters: ["magna"],
  failures
};

console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
