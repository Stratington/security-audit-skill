#!/usr/bin/env node
"use strict";

/**
 * Zero-dependency check that a commit message follows Conventional Commits 1.0.0
 * with the types and scopes that CONTRIBUTING.md allows.
 *
 * Usage: node scripts/check-commit-message.cjs <commit-message-file>
 *        node scripts/check-commit-message.cjs --message "<message>"
 *
 * `.githooks/commit-msg` runs the first form. The message is cleaned the way Git
 * cleans it (comment lines and everything below a scissors line are dropped)
 * before the header is checked.
 */

const fs = require("node:fs");

// CONTRIBUTING.md lists these under "Allowed types" and "Allowed scopes"; keep both in sync.
const TYPES = ["feat", "fix", "docs", "refactor", "test", "security", "chore", "build", "style", "perf", "ci", "revert"];
const SCOPES = [
  "attack-classes",
  "change-review",
  "contributing",
  "decoy",
  "hunting",
  "precedents",
  "readme",
  "recon",
  "safety",
  "schema",
  "skill",
  "validation",
  "validators",
];

// Messages Git writes itself for merges, reverts, and autosquash commits.
const GIT_GENERATED_PREFIXES = ["Merge ", "Revert \"", "fixup! ", "squash! ", "amend! "];

const HEADER_PATTERN = /^(?<type>[a-z]+)(?:\((?<scope>[^()]*)\))?(?<breaking>!)?: (?<description>\S.*)$/;
const SCISSORS = /^# -+ >8 -+$/;
const FORMAT = "<type>(<optional-scope>): <description>";

function cleanMessage(raw) {
  const lines = [];
  for (const line of raw.replace(/\r\n/g, "\n").split("\n")) {
    if (SCISSORS.test(line)) break;
    if (line.startsWith("#")) continue;
    lines.push(line.trimEnd());
  }
  while (lines.length > 0 && lines[0] === "") lines.shift();
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

function checkMessage(raw) {
  const lines = cleanMessage(raw);
  if (lines.length === 0) return ["the commit message is empty"];

  const header = lines[0];
  if (GIT_GENERATED_PREFIXES.some((prefix) => header.startsWith(prefix))) return [];

  const errors = [];
  const match = HEADER_PATTERN.exec(header);
  if (!match) {
    errors.push(`the header must be "${FORMAT}", with one space after the colon and a non-empty description`);
  } else {
    const { type, scope } = match.groups;
    if (!TYPES.includes(type)) errors.push(`"${type}" is not an allowed type; use one of: ${TYPES.join(", ")}`);
    if (scope !== undefined && !SCOPES.includes(scope)) {
      errors.push(`"${scope}" is not an allowed scope; omit the scope or use one of: ${SCOPES.join(", ")}`);
    }
  }
  if (lines.length > 1 && lines[1] !== "") errors.push("a blank line must separate the header from the body");
  return errors;
}

function run(args) {
  let raw;
  if (args.length === 2 && args[0] === "--message") {
    raw = args[1];
  } else if (args.length === 1 && !args[0].startsWith("--")) {
    try {
      raw = fs.readFileSync(args[0], "utf8");
    } catch {
      console.error(`ERROR: could not read the commit message file ${JSON.stringify(args[0])}`);
      return 1;
    }
  } else {
    console.error("Usage: node scripts/check-commit-message.cjs <commit-message-file>");
    console.error("       node scripts/check-commit-message.cjs --message \"<message>\"");
    return 1;
  }

  const errors = checkMessage(raw);
  if (errors.length > 0) {
    for (const error of errors) console.error("ERROR:", error);
    console.error("FAIL: the commit message does not follow the commit conventions in CONTRIBUTING.md");
    return 1;
  }
  return 0;
}

module.exports = { SCOPES, TYPES, checkMessage };

if (require.main === module) process.exit(run(process.argv.slice(2)));
