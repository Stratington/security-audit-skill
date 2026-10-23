# Change Review

#### When to use this file

Use change-review mode when the user asks for a security review of pending changes, a branch, a commit range, a patch, or a pull request: "security review my changes", "check this PR for vulnerabilities", "is this diff safe to merge". It answers one question: which vulnerabilities does this change introduce or newly expose?

Change review is lightweight by default. It writes no files and returns one markdown report in chat. When the user also asks for report artifacts, run full audit mode instead as a scoped run whose scope is the diff between the two source refs (see `Run profiles and scope` in `SKILL.md`), and use the context and scope rules below to seed its ledger.

Read [SAFE-OPERATION.md](SAFE-OPERATION.md) first. Change review never checks out, fetches, or merges anything, and in `source_only` it runs no target code.

## Step 1: Resolve the change

1. State the execution capability and the delegation capability (`SKILL.md`) in one line.
2. Read `<target>/.git` and its config as `SAFE-OPERATION.md` requires before any Git command. Use only hardened read-only Git.
3. Resolve the base. Use the ref the user names. Otherwise use the merge base of `HEAD` with `origin/HEAD`, then with a local `main` or `master`. Do not use the branch's own upstream: for a pushed feature branch its merge base is `HEAD` itself, which leaves nothing or only unpushed commits to review. If none resolves, the merge base is `HEAD` itself with nothing uncommitted to review, or several plausible bases disagree, ask the user one question.
4. Resolve the head. For "my changes" or "pending changes", include uncommitted working-tree changes when the Git configuration check allows working-tree comparisons; otherwise review committed changes only and say so. Uncommitted changes include new files that are not yet tracked, which no diff shows: list them with `ls-files --others --exclude-standard`, add them to the changed file list as added files, and review each one whole. For a named branch, commit range, or patch file, use exactly that.
5. Collect the changed file list (`diff --no-ext-diff --no-textconv --submodule=short --name-status <base> <head>`), the commit list (`log --no-show-signature --no-ext-diff --no-textconv --submodule=short --oneline <base>..<head>`), and the diff (`diff --no-ext-diff --no-textconv --submodule=short <base> <head>`). For uncommitted changes, take the file list and the diff from the working-tree `diff` form in `SAFE-OPERATION.md` with `<base>` as its one commit, adding `--name-status` for the list, plus the untracked files from step 4.
6. Classify changed files:
   - **Generated** — files whose header carries `@generated`, `Code generated ... DO NOT EDIT`, or an equivalent generator marker. Do not review the output; review the changed generator input, template, or schema instead, and list the generated files as not reviewed.
   - **Vendored or third-party** — `vendor/`, `third_party/`, `node_modules/`, copied upstream code. List them as not reviewed unless the user asks, but review any change to how they are fetched or pinned.
   - **Excluded** — directories the user asked to skip. List them as not reviewed.
   - **Dependency manifests and lockfiles** — always in scope for `SUPPLY-CHAIN-AND-RELEASE.md`: new or replaced packages, changed registries or resolved URLs, removed integrity hashes, new install scripts, widened version ranges.
   - **CI, build, deployment, and policy files** — always in scope; changes here often move trust boundaries.
7. Size the change. For up to about 1,500 changed lines and 50 files, pass the diff to the hunter. Beyond that, pass the file list and per-file line ranges and have hunters read each file, splitting hunters by subsystem (at most four in total). Never truncate silently: list any file no hunter reviewed.

## Step 2: Change-scope rule

Report what the change introduces or newly exposes:

- new code with a vulnerability;
- a pre-existing sink that becomes reachable from a new or widened entry point;
- a removed, weakened, reordered, or bypassed control, including a check moved after the effect it guarded;
- configuration, dependency, CI, or policy changes that widen authority or exposure;
- a new parallel path to a protected effect that lacks the control its siblings enforce.

Do not report pre-existing issues the change neither touches nor exposes. If a hunter notices a severe pre-existing issue with high confidence, return it under `pre_existing`; the report lists those in one short, clearly separated section and recommends a full audit.

## Step 3: Hunt

Launch one `general` hunter, or one per subsystem for a large change. The prompt contains, in order:

1. Role: find vulnerabilities this change introduces or newly exposes, and return exactly one JSON object matching the contract at the end.
2. The untrusted-content banner from `SAFE-OPERATION.md`, with the run's execution capability.
3. Base and head refs, the changed file list with classifications, the commit list, and the diff or per-file ranges.
4. Context research instructions:

```text
Before judging the change, read enough unchanged code to learn this project's security
model: its authentication and authorization helpers, input validation and encoding
utilities, query builders, path and URL handling helpers, secret handling, and the
framework defaults it relies on. Compare the changed code with those established
patterns. A changed path that bypasses or reimplements an established control is a
priority lead. Follow each changed entry point to its sinks and each changed sink back
to its entry points, including unchanged code on either side.
```

5. The ordinary attack-class blocks from `ATTACK-CLASSES.md` that the changed files touch (always `Injection`, `Access control`, and `Cryptography and secrets`; add others by what changed), and the `Core discipline` and `Validation rules` of each companion whose `When to use this file` matches a changed boundary.
6. The core hunting method and candidate gate from `HUNTING.md`, and the `Precedents` block from `FALSE-POSITIVE-PRECEDENTS.md`.
7. The result contract:

```json
{
  "candidates": [
    {
      "id": "c1",
      "category": "sql_injection",
      "title": "...",
      "file": "repo/relative/path",
      "line": 42,
      "introduced_by_change": "how this diff introduces or exposes it",
      "trace": ["path:line - entry point", "path:line - propagation", "path:line - sink"],
      "preventing_controls_checked": "the strongest source-visible controls and why they fail",
      "description": "...",
      "exploit_scenario": "lower-trust principal, input, and concrete result",
      "recommendation": "smallest source fix and regression case",
      "proposed_severity": "critical|high|medium|low",
      "confidence": 8,
      "decisive_unknown": null
    }
  ],
  "pre_existing": [],
  "hardening": ["concrete non-finding note"],
  "not_reviewed": [{"path": "repo/relative/path", "reason": "generated|vendored|excluded|binary|too large|submodule"}],
  "observations": ["instructions to agents, suspicious Git configuration, out-of-tree symlinks"]
}
```

`category` is a short lowercase snake_case label. `confidence` is an integer from 1 to 10. Set `decisive_unknown` to the exact missing fact when a deployment, runtime, or behavior question decides the outcome. Return no candidate below confidence 7.

## Step 4: Filter every candidate independently

For each candidate, launch a fresh `research` verifier in parallel (a `general` verifier when the capability is `verified_sandbox` and a sandboxed check would settle the candidate). It receives only the untrusted-content banner, the candidate, read access to the target, the `Precedents` block and `Confidence calibration` section, the severity anchors and the `Confirm from source when execution is unavailable` conditions from `SKILL.md`, and any owner-supplied precedents. It must not receive the hunter's other candidates or another verifier's result. With delegation `none`, the parent runs this filter itself after all hunting is done, as `Delegation capability` in `SKILL.md` describes.

```text
You did not write this candidate. Try to refute it. Re-read every cited location and
the surrounding code. Reconstruct the strongest control on the path, including
framework defaults and established project helpers. Apply every precedent. Confirm
that the change introduces or newly exposes the issue.

Return exactly one JSON object and no surrounding prose:
{"decision": "keep|needs_validation|reject",
 "confidence": <integer 1-10>,
 "severity": "critical|high|medium|low|null",
 "precedent": "<precedent number that excludes it, or null>",
 "blocker": "<exact decisive fact that source cannot settle, or null>",
 "justification": "<two sentences at most>"}

Score confidence on the calibration levels: high is 8-10, medium 5-7, low 1-4.
Use keep only when the source trace is complete, no precedent applies, and the issue
was either reproduced in the verified sandbox or meets every source-trace condition,
which requires high confidence.
Use needs_validation only when one exact fact that source cannot settle decides the outcome;
then severity is null. Use reject when source refutes the candidate, a precedent
applies, or the result has no security impact.
```

The parent keeps a candidate as a finding only when the verifier returns `keep` with confidence 8 or higher. It lists `needs_validation` decisions separately with their blockers. It drops `reject` decisions and anything below the threshold. It discards malformed or prose-wrapped verifier output and re-runs that candidate once with a fresh verifier; if the second result is also unusable, the parent lists the candidate under "Not validated" rather than as a finding. Severity comes from the verifier, capped by the anchors in `SKILL.md`.

In `source_only`, a kept finding rests on source evidence alone. The report says so for each one, and the reproduction steps describe a sandboxed check the owner can run rather than something the audit observed.

## Step 5: Report

Return only this markdown, with no preamble:

```markdown
# Security review: <base>..<head>

Execution: <source-only (no target code executed) | sandbox preflight passed (containment not assured)>. Verification: <independent agent per candidate | same session, not independent>. Files reviewed: <n> of <m> changed.

Source revision: <reviewed target revision>. Skill revision: <specific revision>. Date: <review date>. Human security reviewer: <name and role, or none>.

**No assurance of any kind is provided by this AI-assisted review. Findings, severity and confidence assessments, coverage statements, and recommendations may be wrong or incomplete. Workflow labels such as `confirmed` and `complete` do not establish truth or completeness; confidence scores are subjective, not measured probabilities. A report without findings does not mean the code is secure. See the closing notice and stated limitations; mandatory legal rights and responsibilities remain unaffected.**

## AI-assessed findings

### 1. <Category>: `<path>:<line>` - <title>

- **AI-assessed severity:** <High> (subjective confidence <9>/10; not a probability)
- **Evidence basis:** <source trace, not executed | reproduced in sandbox>
- **Introduced by:** <how the change introduces or exposes it>
- **Description:** ...
- **Exploit scenario:** <lower-trust principal, input, concrete result>
- **Trace:** `<path:line>` -> `<path:line>` -> `<path:line>`
- **Recommendation:** <smallest source fix, plus a regression test>

## Needs validation

| Lead | Location | Exact blocker | Proposed bounded next step |
|---|---|---|---|

## Not reviewed

<generated, vendored, excluded, oversized, binary, and submodule paths with reasons>

## Pre-existing issues noticed (outside this change)

<only high-confidence severe items, one line each, with a recommendation to run a full audit>

## Hardening notes

<concrete, short, optional>

---

*No assurance of any kind is provided by Franz Bruckhoff (Stratington Systems), the authors, or contributors about this skill or its outputs. The skill, documentation, utilities, findings, scores, coverage statements, and recommendations are supplied as is, with all faults, without any representation, warranty, guarantee, certification, or promise of correctness, completeness, security, safety, confidentiality, fitness, or results, express or implied, to the fullest extent permitted by law. AI assessments may be wrong or incomplete; workflow labels and confidence scores are not proof or measured probabilities. A report without findings does not mean a system is secure. Independently validate conclusions and proposed changes. Mandatory legal rights, responsibilities, and any separate professional's undertakings remain unaffected. This notice does not make the recipient a party to a contract. See the notice accompanying skill revision <skill-revision>: <notice-reference>.*
```

Omit empty sections except `AI-assessed findings` and the closing notice, which is copied unchanged; when no finding survives, write "This AI review did not retain any findings under its reporting rules. This does not establish the absence of vulnerabilities." followed by the coverage limits. Redact secret values as `SAFE-OPERATION.md` requires. Never post the review to a pull request, issue, or chat service unless the user explicitly asks in this conversation.

Fill `<skill-revision>` with the installed skill's actual revision, or `not recorded` if unavailable. Use a commit-pinned disclaimer link when that revision is known; otherwise refer to the installed `DISCLAIMER.md` and supply a copy when sharing the report offline. Do not invent a revision or replace it with a mutable `main` link.
