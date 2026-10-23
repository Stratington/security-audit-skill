#!/usr/bin/env node
"use strict";

/**
 * Zero-dependency check that audit output files carry no usable credential values.
 *
 * Usage: node check-redaction.cjs <file> [file...]
 *
 * Reads each file with the same no-follow, regular-file, size-bounded, strict UTF-8
 * procedure as validate-findings.cjs and reports credential-format matches by file,
 * line, and kind. It never prints the matched value.
 */

const {
  LIMITS,
  SafeInputError,
  escapeUnsafeDiagnosticCharacters,
  findUnredactedSecrets,
  readFileWithinLimit,
} = require("./validate-findings.cjs");

// Matches arrive sorted by index, so one forward scan numbers every line.
function checkText(text, label) {
  let line = 1;
  let scanned = 0;
  return findUnredactedSecrets(text).map(({ kind, index }) => {
    for (let newline = text.indexOf("\n", scanned); newline !== -1 && newline < index; newline = text.indexOf("\n", scanned)) {
      line++;
      scanned = newline + 1;
    }
    return `${label}:${line}: appears to contain an unredacted ${kind}`;
  });
}

function run(files) {
  if (files.length === 0) {
    console.error("Usage: node check-redaction.cjs <file> [file...]");
    return 1;
  }

  const messages = [];
  for (const file of files) {
    const label = escapeUnsafeDiagnosticCharacters(file);
    let contents;
    try {
      contents = readFileWithinLimit(file);
    } catch (error) {
      const reason = error instanceof SafeInputError ? error.message : "input could not be opened or read safely";
      messages.push(`${label}: could not be checked: ${reason}`);
      continue;
    }
    messages.push(...checkText(contents, label));
  }

  const shown = messages.slice(0, LIMITS.validationErrors);
  for (const message of shown) console.error("ERROR:", message);
  if (messages.length > 0) {
    const cap = messages.length > shown.length ? `; output capped at ${LIMITS.validationErrors}` : "";
    console.error(`FAIL: ${messages.length} redaction problem(s)${cap}`);
    return 1;
  }
  console.log(`PASS: no unredacted credentials detected in ${files.length} file(s)`);
  return 0;
}

module.exports = { checkText };

if (require.main === module) process.exit(run(process.argv.slice(2)));
