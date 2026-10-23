const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const { checkText } = require("./check-redaction.cjs");
const { LIMITS } = require("./validate-findings.cjs");

const checkerPath = path.join(__dirname, "check-redaction.cjs");
const CLI_TIMEOUT_MS = 5000;
const HAS_SAFE_INPUT_OPEN = Number.isInteger(fs.constants.O_NOFOLLOW) &&
  fs.constants.O_NOFOLLOW !== 0 &&
  Number.isInteger(fs.constants.O_NONBLOCK) &&
  fs.constants.O_NONBLOCK !== 0;

// Credential-shaped test values are assembled at runtime so repository secret scanners do not flag this file.
const AWS_KEY_ID = ["AKIA", "Z7QX4MRT", "2LWN8PVB"].join("");
const PRIVATE_KEY = ["-----BEGIN", " OPENSSH PRIVATE KEY-----\n", "b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW"].join("");
const PRIVATE_KEY_64COL = ["-----BEGIN", " OPENSSH PRIVATE KEY-----\n", "b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtz\n", "c2gtZWQyNTUxOQAAACB8\n"].join("");
const ASN1_ZERO_TAIL_KEY = ["-----BEGIN", " PRIVATE KEY-----\n", "MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQAAAAAAAAAAAAAA\n"].join("");
const ENCRYPTED_KEY = ["-----BEGIN", " RSA PRIVATE KEY-----\n", "Proc-Type: 4,ENCRYPTED\n", "DEK-Info: AES-128-CBC,8D9F0C6A1B2E3F40\n\n",
  "MIIEowIBAAKCAQEA3Tz2mr7SZiAMfQyuvBjM9Oi+H8bK2fLQ\n"].join("");
const GITHUB_TOKEN = ["ghp", "_Zq8Xw2Lm4Nv6Bt1Rk3Ps5Hd7Jf9Gc0Ya2Ue4"].join("");
const ANTHROPIC_KEY = ["sk", "-ant-api03-", "Zq8Xw2Lm4Nv6Bt1Rk3Ps5Hd7Jf9Gc0Ya2Ue4"].join("");
const AWS_SECRET = ["Zq7Xk3Lm9Qp2", "Rt7Vw4Yz8Bn1Cd6Fg5Hj0Ks3+Lm"].join("/");

function withFiles(files, callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "check-redaction-"));
  try {
    const paths = Object.entries(files).map(([name, contents]) => {
      const filePath = path.join(directory, name);
      fs.writeFileSync(filePath, contents);
      return filePath;
    });
    return callback(paths, directory);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

function runCli(args) {
  return spawnSync(process.execPath, [checkerPath, ...args], { encoding: "utf8", timeout: CLI_TIMEOUT_MS });
}

function cliOutput(result) {
  return `${result.stdout}${result.stderr}`;
}

test("reports the line and kind of each credential without the value", () => {
  const messages = checkText(`# Report\n\nThe key ${AWS_KEY_ID} is committed.\n\n${PRIVATE_KEY}\n`, "REPORT.md");
  assert.deepEqual(messages, [
    "REPORT.md:3: appears to contain an unredacted AWS access key ID",
    "REPORT.md:5: appears to contain an unredacted private key block",
  ]);
  for (const message of messages) assert(!message.includes(AWS_KEY_ID));
});

test("finds a private key copied into a JSON string", () => {
  assert.deepEqual(checkText(`[\n  ${JSON.stringify({ evidence: PRIVATE_KEY })}\n]\n`, "findings.json"), [
    "findings.json:2: appears to contain an unredacted private key block",
  ]);
  assert.equal(checkText(JSON.stringify({ log: JSON.stringify({ evidence: PRIVATE_KEY }) }), "run.json").length, 1);
});

test("finds an encrypted PEM key with header lines, raw or in JSON", () => {
  for (const text of [ENCRYPTED_KEY, ENCRYPTED_KEY.replace(/\n/g, "\r\n"), JSON.stringify(ENCRYPTED_KEY), JSON.stringify(JSON.stringify(ENCRYPTED_KEY))]) {
    assert.deepEqual(checkText(text, "F"), ["F:1: appears to contain an unredacted private key block"], JSON.stringify(text));
  }
});

test("finds 64-column OpenSSH and ASN.1 zero-tail private keys", () => {
  for (const key of [PRIVATE_KEY_64COL, ASN1_ZERO_TAIL_KEY, JSON.stringify(PRIVATE_KEY_64COL)]) {
    assert.deepEqual(checkText(key, "F"), ["F:1: appears to contain an unredacted private key block"], JSON.stringify(key));
  }
});

test("finds host user and temp paths without flagging relative routes", () => {
  for (const sample of [
    ["/", "Users", "/auditor/repo/src/index.js"].join(""),
    ["/private/var/folders/", "ab/cd/T/scratch"].join(""),
    ["/home/", "auditor/repo"].join(""),
    ["C:\\Users\\", "auditor\\repo"].join(""),
  ]) {
    assert.deepEqual(checkText(sample, "F"), ["F:1: appears to contain an unredacted host user or temp path"], sample);
  }
  assert.deepEqual(checkText("POST /users/:id and src/Users/model.ts are repository-relative.", "F"), []);
});

test("finds a token that starts a line inside a JSON string", () => {
  assert.deepEqual(checkText(JSON.stringify({ evidence: `keys.txt:\n${AWS_KEY_ID}\n` }), "findings.json"), [
    "findings.json:1: appears to contain an unredacted AWS access key ID",
  ]);
  assert.equal(checkText(JSON.stringify(`id\t${GITHUB_TOKEN}`), "F").length, 1);
  assert.equal(checkText(JSON.stringify(JSON.stringify(`x\n${AWS_KEY_ID}`)), "F").length, 1);
});

test("finds a token followed by an underscore or a run of dashes", () => {
  for (const [text, kind] of [[`${AWS_KEY_ID}_x`, "AWS access key ID"], [`${GITHUB_TOKEN}_x`, "GitHub token"], [`${ANTHROPIC_KEY}----------------`, "Anthropic API key"]]) {
    assert.deepEqual(checkText(text, "F"), [`F:1: appears to contain an unredacted ${kind}`], text);
  }
});

test("finds a named AWS secret access key", () => {
  for (const text of [`AWS_SECRET_ACCESS_KEY=${AWS_SECRET}`, `aws_secret_access_key = ${AWS_SECRET}`, JSON.stringify({ SecretAccessKey: AWS_SECRET }), JSON.stringify(JSON.stringify({ SecretAccessKey: AWS_SECRET }))]) {
    assert.deepEqual(checkText(text, "F"), ["F:1: appears to contain an unredacted AWS secret access key"], text);
  }
  assert.deepEqual(checkText(`AWS_SECRET_ACCESS_KEY=${AWS_SECRET}Q`, "F"), []);
});

test("stays linear on long whitespace runs after a key header", () => {
  const text = `${PRIVATE_KEY.split("\n")[0]}${" \\n".repeat(100000)}!`;
  const start = Date.now();
  assert.deepEqual(checkText(text, "F"), []);
  // A quadratic pattern takes minutes on this input; the linear one takes milliseconds.
  assert(Date.now() - start < 2000, `took ${Date.now() - start} ms`);
});

test("numbers lines correctly across many matches", () => {
  const messages = checkText(Array.from({ length: 5000 }, () => AWS_KEY_ID).join("\n\n"), "REPORT.md");
  assert.equal(messages.length, 5000);
  assert.equal(messages[0], "REPORT.md:1: appears to contain an unredacted AWS access key ID");
  assert.equal(messages[4999], "REPORT.md:9999: appears to contain an unredacted AWS access key ID");
});

test("accepts redacted descriptions and placeholders", () => {
  assert.deepEqual(checkText("An AWS access key ID beginning AKIA, 20 characters, is at config/prod.env:3.\n", "REPORT.md"), []);
  assert.deepEqual(checkText(`Example: ${["AKIA", "IOSFODNN7", "EXAMPLE"].join("")}\n`, "REPORT.md"), []);
  assert.deepEqual(checkText(`aws_secret_access_key = ${["wJalrXUtnFEMI", "K7MDENG", "bPxRfiCYEXAMPLEKEY"].join("/")}\n`, "REPORT.md"), []);
  assert.deepEqual(checkText(`sk-ant-${"x".repeat(24)}----------------\nAWS_SECRET_ACCESS_KEY=${"x".repeat(40)}\n`, "REPORT.md"), []);
  assert.deepEqual(checkText(`${ENCRYPTED_KEY.split("\n\n")[0]}\n\n-----END RSA PRIVATE KEY-----\n`, "REPORT.md"), []);
  assert.deepEqual(checkText(`-----BEGIN RSA PRIVATE KEY-----\n${"X".repeat(64)}\n-----END RSA PRIVATE KEY-----\n`, "REPORT.md"), []);
});

test("CLI passes clean output files", () => {
  withFiles({ "REPORT.md": "# Report\n\nNo secrets here.\n", "findings.json": "[]\n" }, (paths) => {
    const result = runCli(paths);
    assert.equal(result.status, 0, cliOutput(result));
    assert.match(result.stdout, /PASS: no unredacted credentials detected in 2 file\(s\)/);
  });
});

test("CLI fails on any credential and never prints the value", () => {
  withFiles({ "REPORT.md": "# Report\n", "FINDINGS-DETAIL.md": `Line one\nKey: ${AWS_KEY_ID}\n` }, (paths) => {
    const result = runCli(paths);
    const output = cliOutput(result);
    assert.equal(result.status, 1, output);
    assert.match(output, /FINDINGS-DETAIL\.md:2: appears to contain an unredacted AWS access key ID/);
    assert.match(output, /FAIL: 1 redaction problem\(s\)/);
    assert(!output.includes(AWS_KEY_ID));
  });
});

test("CLI requires at least one file", () => {
  const result = runCli([]);
  assert.equal(result.status, 1, cliOutput(result));
  assert.match(result.stderr, /Usage:/);
});

test("CLI fails closed on a missing file", () => {
  withFiles({}, (paths, directory) => {
    const result = runCli([path.join(directory, "missing.md")]);
    const output = cliOutput(result);
    assert.equal(result.status, 1, output);
    assert.match(output, /could not be checked/);
    assert.doesNotMatch(output, /stack|ENOENT/i);
  });
});

test("CLI does not follow symlinks", { skip: process.platform === "win32" || !HAS_SAFE_INPUT_OPEN }, () => {
  withFiles({ "outside.txt": `${AWS_KEY_ID}\n` }, ([outsidePath], directory) => {
    const linkPath = path.join(directory, "REPORT.md");
    fs.symlinkSync(outsidePath, linkPath);
    const result = runCli([linkPath]);
    const output = cliOutput(result);
    assert.equal(result.status, 1, output);
    assert.match(output, /input must not be a symlink/);
  });
});

test("CLI escapes control characters in reported paths", { skip: process.platform === "win32" }, () => {
  withFiles({ "report\u001b[31m.md": `${AWS_KEY_ID}\n` }, (paths) => {
    const result = runCli(paths);
    const output = cliOutput(result);
    assert.equal(result.status, 1, output);
    assert(!output.includes("\u001b"), JSON.stringify(output));
    assert.match(output, /report\\u001b\[31m\.md:1:/);
  });
});

test("CLI caps output", () => {
  const lines = Array.from({ length: LIMITS.validationErrors + 5 }, () => AWS_KEY_ID).join("\n");
  withFiles({ "REPORT.md": `${lines}\n` }, (paths) => {
    const result = runCli(paths);
    const output = cliOutput(result);
    assert.equal(result.status, 1, output);
    assert.equal(output.match(/^ERROR:/gm).length, LIMITS.validationErrors);
    assert.match(output, new RegExp(`output capped at ${LIMITS.validationErrors}`));
  });
});
