const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const { SCOPES, TYPES, checkMessage } = require("./check-commit-message.cjs");

const checkerPath = path.join(__dirname, "check-commit-message.cjs");
const contributingPath = path.join(__dirname, "..", "CONTRIBUTING.md");
const CLI_TIMEOUT_MS = 5000;

function runCli(args) {
  return spawnSync(process.execPath, [checkerPath, ...args], { encoding: "utf8", timeout: CLI_TIMEOUT_MS });
}

// Reads the backticked names that open each bullet under one CONTRIBUTING.md heading.
function listedNames(heading) {
  const text = fs.readFileSync(contributingPath, "utf8");
  const start = text.indexOf(`\n### ${heading}\n`);
  assert.notEqual(start, -1, `CONTRIBUTING.md has no "### ${heading}" section`);
  const section = text.slice(start + 1).split(/\n#{2,3} /)[0];
  return [...section.matchAll(/^- `([^`]+)`/gm)].map((match) => match[1]);
}

test("accepts headers with and without a scope, body, footer, or breaking marker", () => {
  for (const message of [
    "feat: add a decoy notice",
    "fix(validators): reject a trace step that cites a missing file",
    "docs(readme): describe the skill's origins\n\nCredit both source projects.\n",
    "refactor(schema)!: rename the evidence field\n\nBREAKING CHANGE: findings.json uses evidence_basis.",
    "security(safety): stop following symlinks",
  ]) {
    assert.deepEqual(checkMessage(message), [], message);
  }
});

test("accepts every allowed type and scope", () => {
  for (const type of TYPES) assert.deepEqual(checkMessage(`${type}: change something`), [], type);
  for (const scope of SCOPES) assert.deepEqual(checkMessage(`fix(${scope}): change something`), [], scope);
});

test("rejects unknown types and scopes and names the allowed values", () => {
  const [typeError] = checkMessage("feature: add a check");
  assert.match(typeError, /"feature" is not an allowed type; use one of: feat, fix/);
  const [scopeError] = checkMessage("fix(parser): handle empty input");
  assert.match(scopeError, /"parser" is not an allowed scope; omit the scope or use one of: attack-classes/);
});

test("rejects headers that break the format", () => {
  for (const message of [
    "Add change review",
    "Fix: uppercase type",
    "fix(Skill): uppercase scope",
    "fix(): empty scope",
    "fix:missing space",
    "fix:  two spaces",
    "fix: ",
    "fix(skill) : space before colon",
  ]) {
    assert.notDeepEqual(checkMessage(message), [], message);
  }
});

test("requires a blank line between the header and the body", () => {
  assert.deepEqual(checkMessage("fix: header\nbody right below"), ["a blank line must separate the header from the body"]);
});

test("ignores comments and everything below the scissors line, as Git does", () => {
  const message = [
    "",
    "# Please enter the commit message for your changes.",
    "feat(decoy): add a placement guide   ",
    "",
    "# On branch main",
    "# ------------------------ >8 ------------------------",
    "diff --git a/x b/x",
  ].join("\n");
  assert.deepEqual(checkMessage(message), []);
  assert.deepEqual(checkMessage("# only a comment\n\n"), ["the commit message is empty"]);
});

test("lets Git's own merge, revert, and autosquash messages pass", () => {
  for (const message of [
    "Merge branch 'main' into feature",
    "Merge pull request #12 from example/branch",
    "Revert \"feat: add a decoy notice\"",
    "fixup! fix(validators): reject empty steps",
    "squash! feat: add a check",
    "amend! docs: fix a typo",
  ]) {
    assert.deepEqual(checkMessage(message), [], message);
  }
});

test("CONTRIBUTING.md lists exactly the types and scopes the checker allows", () => {
  assert.deepEqual(listedNames("Allowed types"), TYPES);
  assert.deepEqual(listedNames("Allowed scopes"), SCOPES);
});

test("CLI checks a message file and a --message argument", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "check-commit-message-"));
  try {
    const good = path.join(directory, "COMMIT_EDITMSG");
    fs.writeFileSync(good, "fix(skill): tighten the setup step\n\n# comment\n");
    assert.equal(runCli([good]).status, 0);

    const bad = runCli(["--message", "Update stuff"]);
    assert.equal(bad.status, 1);
    assert.match(bad.stderr, /FAIL: the commit message does not follow the commit conventions in CONTRIBUTING\.md/);

    assert.equal(runCli(["--message", "docs: explain the hook"]).status, 0);
    assert.equal(runCli([path.join(directory, "missing")]).status, 1);
    assert.equal(runCli([]).status, 1);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
