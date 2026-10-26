https://github.com/user-attachments/assets/7a42a9ed-d2fe-4460-9f75-14ac9bf616a8

# Structured security reviews with AI agents

Give your coding agent a structured way to review source code for potential security issues. Ask a focused question, review a set of changes, or request a full audit with written reports. Your chosen agent and model perform the review; this repository supplies instructions and local validation utilities.

```text
Help me perform an authorized defensive static review for security improvements; confirm my ownership or permission if unclear.
No live systems, external targeting, target-code execution, or disruption.
Read and follow https://raw.githubusercontent.com/Stratington/security-audit-skill/main/START-PROMPT.md.
Walk me through setup, install the skill if needed, and help me choose and run a review.
Use the project target already clear from our conversation; otherwise ask me which project to review and its location.
If you cannot read the instructions, stop and tell me.
```

**Guided setup:** Start in a trusted directory outside the target with permission prompts enabled, then paste the prompt. The agent will ask for missing details and guide installation, mode selection, and any required restart. The [Start Prompt](START-PROMPT.md) contains the full instructions; [operating precautions](#operating-precautions) explain the launch requirements. Setup may need network access or your approval.

> [!IMPORTANT]
> **No assurance of any kind is provided by Franz Bruckhoff, Stratington Systems, the authors, or contributors.** The skill, documentation, utilities, and outputs are supplied as is, with all faults, without any representation, warranty, guarantee, or promise of results, to the fullest extent permitted by law. Findings, scores, coverage claims, and recommendations may be wrong or incomplete; a clean report does not mean the code is secure. No assurance is given that use, sandboxing, or redaction will be safe or protect data. Independently check conclusions and proposed changes. Use only on code you may lawfully review, and read [Operating precautions](#operating-precautions). Mandatory legal rights and liabilities remain unaffected. See [DISCLAIMER.md](DISCLAIMER.md); it does not add conditions to the MIT License.

**Get started:** [Choose a mode](#choose-a-review-mode) · [Requirements](#requirements) · [Install](#installation) · [Precautions](#operating-precautions) · [Example prompts](#usage) · [Read the results](#understand-the-results)

**Reference:** [Workflow](#intended-workflow) · [Upstream comparison](#improvements-over-the-reviewed-upstream-versions) · [Files](#files) · [Contributing](#contributing) · [Credits](#credits) · [License](#license)

## Choose a review mode

The starter prompt helps you choose the smallest scope that answers your question. Use the table below if you prefer to choose directly. All modes use the same source and execution precautions; a full audit adds the coverage and reporting workflow.

| What you want | Mode | Intended output |
|---|---|---|
| Understand a security question, review one area, or investigate a specific concern | **Guidance** | An answer in chat; no audit files by default. |
| Check what pending changes, a branch, a commit range, or a pull request introduce or newly expose | **Change review** | One Markdown report in chat; no files. A shared false-positive filter and candidate review apply. |
| Review a codebase systematically, or receive report files | **Full audit** | A coverage ledger, structured findings, and written reports, with scope and execution limits recorded. |

Requesting report artifacts selects the full workflow, which can be scoped to a directory, subsystem, or diff. For a full audit without fresh-context sub-agents, plan for [a handoff to a new session](#continue-without-sub-agents) before reports are written.

## Requirements

- A coding agent and model with file-reading and shell capabilities; see [agent compatibility](#agent-compatibility) for delegation requirements.
- Node.js on a POSIX platform (Linux, macOS, or WSL) for the zero-dependency validators and redaction check, which require OS `O_NOFOLLOW` and `O_NONBLOCK` support to avoid following symlinks and blocking on special files
- For the documented `npx skills` installer: **Node.js 22.20 or later**, as specified by the [Skills CLI installation requirements](https://github.com/vercel-labs/skills#install-a-skill). This is the installer's requirement, separate from the local validators' POSIX requirements.
- Optional: an OS-enforced sandbox for target-controlled builds, tests, processes, browsers, emulators, fuzzers, and fixtures. It must disable external networking, use an empty allowlisted environment, enforce resource limits, and allow writes only to assigned scratch paths. `SAFE-OPERATION.md` has Docker, Podman, and Bubblewrap recipes and the preflight used to check specified controls. A passing preflight does not assure containment; without a passing preflight, use [source-only operation](#without-a-sandbox).

### Agent compatibility

The skill uses platform-neutral roles. Compatibility and performance depend on the platform and configuration; not every agent, model, or configuration has been tested. It records which delegation the platform offers: parallel sub-agents, sub-agents one at a time, or none. On a platform without sub-agents, a full audit runs in two sessions, because the session that finds a candidate never confirms it: the first session maps and hunts, and a new session verifies and writes the report. [Operating precautions](#operating-precautions) describes the required precautions, with notes for Claude Code, Codex CLI, and Gemini CLI.

## Installation

The starter prompt guides installation if the skill is missing. For manual installation, run commands from a directory you control outside the codebase to be reviewed. A user-level installation makes the skill available when you start the agent in a separate review directory. With the [Skills CLI](https://skills.sh), select the coding agent you intend to use:

```bash
npx skills add https://github.com/Stratington/security-audit-skill \
  --skill security-audit \
  --global
```

Check that the CLI lists the user-level installation:

```bash
npx skills ls -g
```

For a project-level installation instead, run this from your trusted launch directory outside the target:

```bash
npx skills add https://github.com/Stratington/security-audit-skill \
  --skill security-audit
```

Run `npx skills --help` for agent-selection and non-interactive options, or see the [CLI reference](https://github.com/vercel-labs/skills/blob/main/docs/commands.md). Installation and skill discovery depend on the chosen agent; explicitly name `security-audit` in your request and check that the agent loads the installed skill.

## Operating precautions

Auditing code means reading code that may have been written to attack whoever reads it. A malicious repository can try to run commands through build files, test configuration, or Git settings; steer your agent with instructions hidden in comments or agent configuration files; or link to your credentials so they end up in a report. The following precautions aim to reduce those risks. They do not establish that the skill, agent, tools, or environment will operate safely or keep information confidential:

1. **Start the agent outside the repository you are auditing.** Many coding agents automatically load configuration, hooks, and tool servers from the directory they start in (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.claude/`, `.codex/`, `.gemini/`, `.agents/`, `.mcp.json`, `.cursor/`, `.vscode/`, and others). Start the agent in an empty directory, such as the output directory, and give it the repository as an absolute path.
2. **Keep permission prompts on.** Do not run an untrusted audit with permission checks disabled. If the agent asks to run a build, test, install, or script in the target and no sandbox is verified, decline.
3. **Do not run the project's tooling yourself to "help".** `npm install`, `make`, `pytest`, and opening the folder in an IDE can all execute the repository's code with your permissions.
4. **Treat the output directory as sensitive.** Reports contain exploit-relevant detail. The skill has the agent create the directory owner-only and keep secret values out of reports, but the `agents/` scratch directories hold target-controlled output and are not meant to be shared.

**Provider policies:** Stating defensive intent does not guarantee acceptance or prevent account warnings. Google documents [Gemini Apps enforcement and appeals](https://support.google.com/gemini/answer/18481641?hl=en) and [content security warnings](https://support.google.com/gemini/answer/16188217?hl=en). Follow the [provider-policy and processing rules](skills/security-audit/SAFE-OPERATION.md#provider-policies-and-processing); source-only review does not mean hosted-model processing is offline.

### Without a sandbox

The instructions require **source-only** operation unless a sandbox passes the specified preflight in the current run (no network, empty environment, read-only target, scratch-only writes, and resource limits, each probed). Passing those probes is not proof of containment or safe execution:

- Do not run target-controlled code. That includes tools that look read-only but execute project code: package managers, build systems, test collectors, linters with JavaScript or Python configuration, and Git with repository-supplied configuration.
- A finding can still be `confirmed` with `evidence_basis: "source_trace"` when every step is cited and deterministic from readable source, reachability is source-visible, every preventing control was checked, and the result does not depend on runtime-only behavior. These findings are labeled "AI-assessed finding (source trace, not executed)", require the workflow's high-confidence assessment, and carry the proposed sandboxed reproduction check. The label does not establish that the claim is correct or that the check will succeed.
- Keep candidates that require unavailable execution as `needs_validation`, with a proposed bounded check for an owner-controlled sandbox.

The skill instructs the agent to treat the target as hostile: ignore instructions addressed to agents, avoid symlinks that leave the repository, use hardened read-only Git, and redact secret values from outputs. These are instructions, not enforced controls; models and utilities can fail to follow or implement them. [SAFE-OPERATION.md](skills/security-audit/SAFE-OPERATION.md) has the detailed handling rules.

### Platform launch instructions

**Before starting a review, read the launch instructions for your agent below as well as [SAFE-OPERATION.md](skills/security-audit/SAFE-OPERATION.md). Keep permission prompts enabled and use source-only operation unless every required sandbox preflight passes.**

<details>
<summary>Claude Code launch instructions</summary>

In [Claude Code](https://code.claude.com/docs/en/permissions.md) specifically:

- Create an empty output directory, start `claude` there, and name the repository by its absolute path. Claude Code asks before reading outside its working directory. To grant read access without loading anything from the repository, list the repository under `permissions.additionalDirectories` in the output directory's `.claude/settings.local.json`.
- Do not attach an untrusted repository with `--add-dir` or `/add-dir`. Claude Code loads skills, commands, and subagents from a directory added that way, which lets the repository add its own instructions, and skills can also define hooks and pre-approved tools.
- Do not run `claude -p` inside the repository. Headless runs never show the workspace trust dialog, so the repository's hooks run and its `.mcp.json` servers connect without asking.
- Do not use `--dangerously-skip-permissions` or `bypassPermissions` mode. The Claude Code documentation reserves it for isolated containers or VMs.
- The built-in sandbox (`/sandbox`) is a good layer but not a complete one on its own. It covers shell commands, not Claude Code's own file tools; by default it passes your environment variables, including secrets, to those commands and can still read files such as `~/.ssh`; and it runs commands unsandboxed if it cannot start unless `sandbox.failIfUnavailable` is set. The skill treats it like any other candidate and uses execution only when every preflight probe in `SAFE-OPERATION.md` passes.

</details>

<details>
<summary>Codex CLI launch instructions</summary>

In [Codex CLI](https://learn.chatgpt.com/docs/agent-approvals-security):

- Create an empty output directory, start `codex` there, and name the repository by its absolute path. The read-only sandbox can already read any path, so the audit needs no extra flag. Do not use `--add-dir` for the repository, because it grants write access.
- Before you start, mark the repository untrusted in `~/.codex/config.toml` with a `[projects."/absolute/path/to/repo"]` table that sets `trust_level = "untrusted"`. Codex then skips the repository's `.codex/` configuration, MCP servers, hooks, and rules. Its documentation does not say that this also skips `AGENTS.md` or skills in `.agents/skills`, which is one more reason to start outside the repository.
- Do not run `codex exec` inside the repository, and do not use `--yolo`, `--dangerously-bypass-approvals-and-sandbox`, `--sandbox danger-full-access`, or `--dangerously-bypass-hook-trust`.
- Commands Codex runs inherit your whole environment by default, secrets included, and its sandbox does not hide files such as `~/.ssh`. Setting `inherit = "core"` under `[shell_environment_policy]` narrows the environment. The skill treats the sandbox like any other candidate and uses execution only when the preflight passes.

</details>

<details>
<summary>Gemini CLI launch instructions</summary>

In [Gemini CLI](https://geminicli.com/docs/cli/trusted-folders/):

- Create an empty output directory, start `gemini` there, and name the repository by its absolute path. Do not add the repository with `--include-directories` or `/directory add`, which can load its `GEMINI.md` files. If the file tools refuse paths outside the workspace, the skill reads through its read-only shell commands instead.
- Keep folder trust on (`security.folderTrust.enabled`) and answer "Don't trust" if Gemini CLI asks about the repository. Never use `--skip-trust` or `GEMINI_CLI_TRUST_WORKSPACE`. An untrusted folder skips the repository's `.gemini/settings.json` (MCP servers, hooks, and tool-discovery commands), its `.env` files, and custom commands. The documentation does not say that it skips `GEMINI.md` or skills in `.gemini/skills` and `.agents/skills`, and a workspace skill with this skill's name overrides yours when Gemini CLI starts inside the repository.
- Use release 0.39.1 or later, because earlier releases trusted the workspace automatically in headless mode, and do not run `gemini -p` inside the repository.
- Do not use `--yolo`, `--approval-mode=yolo`, `tools.allowed`, or `trust: true` on an MCP server. Sandboxing is off by default; `--sandbox` turns it on, and the skill still uses execution only when the preflight passes.
- These notes follow the Gemini CLI documentation. Google has moved free-tier and Google One users to Antigravity CLI, which they do not cover.

</details>

## Usage

Start your coding agent in a directory you control **outside the target repository**, after following the [operating precautions](#operating-precautions). Give it the target's absolute path. The examples below are prompts to paste into the agent, not shell commands; replace the example paths with your own.

### Review pending changes

```text
Use the security-audit skill to review the pending changes in /absolute/path/to/project.
Run source-only and return the change review here in chat.
Include uncommitted and untracked files when the read-only Git policy permits;
state any changes or files you cannot review.
Do not execute target code or modify target files.
```

For a branch comparison, replace "pending changes" with "this branch against main", or give the exact base and head refs. The agent must report what the change introduces or newly exposes, with pre-existing issues kept separate.

### Ask a focused question

```text
Use the security-audit skill in guidance mode to review the authentication code
in /absolute/path/to/project/src for access-control concerns.
Run source-only, answer here, and explain the evidence and remaining uncertainties.
Do not create audit artifacts, execute target code, or modify target files.
```

### Request a full audit and reports

For a concise request that selects full audit mode and the default `standard` profile directly (instead of the guided setup prompt at the top of this file):

```text
Use the security-audit skill for a full source-only audit of /absolute/path/to/project.
Use the standard profile and write reports to /absolute/path/to/review-output.
State the scope, execution capability, delegation capability, and coverage limits.
Do not execute target code or modify target files.
```

Keep the output directory outside the target. If none is specified, a full audit defaults to `~/security-audit-skill/<repo-name>/run-<N>`. If you explicitly request an in-target directory, the skill requires the parent to verify that version control ignores the whole directory. Sensitive scratch output still needs separate handling.

### Choose audit size and budget

Profiles change coverage breadth and review redundancy; they do not lower the evidence rules or provide assurance of completeness.

| Full-audit profile | Intended use | Scope and effort |
|---|---|---|
| `quick` | A bounded first look, small target, or repeat pass | One hunter wave and a coverage-critic pass; additional work is recorded as deferred. It is partial coverage. |
| `standard` | The default full workflow | Coverage-led hunting, candidate validation, and final record verification. |
| `deep` | A more granular review of a large or high-stakes target | Finer coverage units and additional independent review; potentially more model calls. |

You can also name paths or a subsystem to limit scope. For a fixed invocation budget, add: `Use at most <N> agent invocations across all phases.` The skill counts reconnaissance, hunters, critics, and verifiers; role passes also count when delegation is unavailable. This is an invocation cap, not a currency or runtime estimate. If the cap cannot fund required checks, the agent must ask for a feasible scope or budget before starting; it must not silently thin the evidence rules. If validation later exhausts the budget, the run remains incomplete. See [budget rules](skills/security-audit/SKILL.md#cost-budget).

### Continue without sub-agents

A full audit without fresh-context delegation ends its first session after hunting, with pending candidates and no final report files. Start a **new session outside the target** and point it at the same output directory and target path (since `run-metadata.json` stores `<target>` rather than the host path):

```text
Continue the security-audit run in /absolute/path/to/review-output
for target /absolute/path/to/project.
Read its run metadata, coverage ledger, and existing candidate results.
Perform the pending verification and reporting; do not hunt new candidates.
Keep the review source-only and do not execute target code or modify target files.
```

The new session supplies a separate review context; it does not provide human security review or an assurance of correctness. The [handoff rules](skills/security-audit/SKILL.md#delegation-capability) keep the hunting session from validating its own full-audit candidates.

### Supply deployment context

You can give the audit facts that source cannot show, such as "all traffic goes through an authenticating gateway" or "this tool only runs on the operator VPN", in chat or in a file outside the repository. The skill treats them as unverified owner precedents: anything they suppress is recorded as rejected with that reason and listed in the report. Files inside the repository can never suppress a finding.

## Understand the results

Change review returns one Markdown report in chat. After full-audit verification, open the prose reports in your chosen output directory:

| Output | What to read it for |
|---|---|
| `REPORT.md` | Start here: scope, execution limits, AI-assessed findings, unresolved leads, and coverage gaps. |
| `FINDINGS-DETAIL.md` | Detailed traces and bounded reproduction instructions for retained medium, high, and critical records. |
| `NEEDS-VALIDATION.md` | Unresolved leads, exact blockers, and proposed local or owner-observed checks. |
| `findings.json` | Structured records for `confirmed`, `needs_validation`, and `rejected` assessments. |
| `coverage-ledger.json` | Recorded review units and their covered, candidate, blocked, or deferred states. |
| `run-metadata.json` | Source reference, profile, scope, execution/delegation capabilities, and run status. |

The verdicts are workflow assessments: `confirmed` requires a complete source trace and either a bounded observed result or, without a sandbox, a source trace meeting the source-only evidence rules; `needs_validation` requires an exact unresolved fact and no severity; and `rejected` records a candidate assessed as disproved. All labels remain fallible AI judgments. Confidence scores are subjective, not measured probabilities; `complete`, `covered`, and `verified_sandbox` describe workflow status, not assurance of completeness, security, or containment.

Read the **evidence basis** as well as the verdict. `local_execution` records a bounded observed result, not a guarantee about a deployed system. `source_trace` records an AI source assessment and expected result; no runtime result was observed. `needs_validation` leaves a decisive fact unresolved and carries no severity. Rejected records and covered areas can still contain real vulnerabilities.

Before acting, check the cited source, assumptions, affected boundary, and any excluded coverage. Independently validate findings and review and test proposed changes in an owner-controlled environment with the required precautions. The review instructions describe fixes and prohibit editing target source; implementation is a separate task. Use qualified security review where the consequences require that expertise.

Keep reports and transcripts access-limited. The redaction check only recognizes specified patterns; it cannot establish that every secret was removed. The `agents/` scratch directories contain target-controlled material and are not meant to be shared.

### If the result is not what you expected

| What you see | What to check |
|---|---|
| The agent does not load the skill | Check the selected agent and installation scope, then explicitly request `security-audit` using that agent's skill-selection mechanism. |
| No sandbox is available | Continue source-only under the evidence rules. Missing execution capability does not authorize running target tools on the host. |
| No report files appear | Guidance and change review return answers in chat. A full audit awaiting a separate verification session has not reached reporting yet. Read the run status. |
| No findings or an incomplete run | Read exclusions, deferred units, and unresolved candidates. Neither outcome establishes that the code is secure. |

## Intended workflow

The skill instructs an agent to follow six phases. This describes the intended process, without assuring that the agent will follow it or produce correct or complete results:

1. **Reconnaissance** -- map architecture, trust boundaries, input surfaces, prior evidence, and deterministic coverage in `architecture.md` and `coverage-ledger.json`.
2. **Coverage-led hunting** -- assign isolated hunters from ledger units, record their checks, and use coverage critics to find gaps.
3. **Candidate validation** -- give every unique candidate to a fresh verifier that tries to disprove it.
4. **Structured output** -- write `confirmed`, `needs_validation`, and `rejected` records to `findings.json` and validate them against `report-schema.json`.
5. **Independent record verification** -- fresh agents verify final source claims. Material replacements receive another independent verifier.
6. **Target-neutral reporting** -- derive `REPORT.md`, `FINDINGS-DETAIL.md`, and `NEEDS-VALIDATION.md` from the verified records and coverage ledger.

The workflow requires the parent to run `validate-coverage-ledger.cjs` after creating the ledger and after each later ledger update. It runs `validate-findings.cjs` in Phase 4 and again after every Phase 5 replacement, and `check-redaction.cjs` on every output file before the run ends.

For repeated runs, the workflow uses prior ledgers and findings to target gaps, revalidate changed source, and carry forward current-source evidence. Repetition does not establish complete coverage or correct results.

### Optional decoy notice

After a full audit, the skill offers one optional extra: a **decoy notice** for intruding AI agents. It is a `flag.txt` for the root of your servers or container images that tells an agent sent to break in that nobody authorized its task, and asks it to stop, touch nothing more, disconnect, and tell whoever sent it. The skill explains what the notice can and cannot do and writes nothing until you say yes.

Even then it only drafts the notice and a placement guide in the output directory: it never deploys anything, and you place the file yourself. The guide includes an example read-audit rule; logging and alert delivery depend on the platform and configuration. There is no assurance an agent will read or obey the notice, that an intrusion will stop, or that monitoring will detect or report it.

## Design principles

These are procedural instructions, not assurances that an agent will follow them or achieve security.

- **Only confirm established boundary failures.** Keep a source-grounded blocked lead as `needs_validation` with its exact unresolved fact.
- **Source-only is a mode, not a failure.** Without a passing sandbox preflight, apply the source-trace evidence requirements and label the resulting AI assessments as not executed. They remain fallible.
- **The target is hostile.** Target content is data. It never changes scope, verdicts, or commands, and tools that execute project code never run outside a verified sandbox.
- **Shared precedents, independent filters.** Each candidate gets a fresh verifier that applies the same false-positive precedents, so recurring non-issues are rejected consistently.
- **Adversarial validation.** The agent that checks a finding is never the agent that found it. Without sub-agents, a separate session takes that role.
- **Severity requires impact.** Likelihood x impact, not deviation from a checklist.
- **Defense-in-depth gaps are not vulnerabilities.** If Layer A prevents the attack, the absence of Layer B is a hardening note.
- **Multiple runs can broaden coverage.** Repeated passes can revisit gaps, but they do not guarantee completeness or correct results.

## Improvements over the reviewed upstream versions

The tables compare this fork with the reviewed versions of Cloudflare's security-audit-skill and Anthropic's claude-code-security-review. See [Credits](#credits) for each project's role, licensing, and attribution.

Reviewed snapshots:

- **Cloudflare:** [c1c8a8c1471069fb0e188eeaff69b8e8db6564a8](https://github.com/cloudflare/security-audit-skill/tree/c1c8a8c1471069fb0e188eeaff69b8e8db6564a8), the last Cloudflare ancestor incorporated into this fork.
- **Anthropic:** [0c6a49f1fa56a1d472575da86a94dbc1edb78eda](https://github.com/anthropics/claude-code-security-review/tree/0c6a49f1fa56a1d472575da86a94dbc1edb78eda), the inspected comparison reference. The original Anthropic import revision was not recorded.

Later upstream changes are outside this comparison. These are additions to instructions, workflows, and utilities; no comparative benchmark establishes better detection or fewer false positives. The no-assurance notice above applies throughout.

### Compared with Cloudflare's skill

Cloudflare already supplies the six-phase workflow, coverage ledger, audit profiles, attack-class companions, independent verification, agent-neutral roles, and sandbox requirements. This fork builds on those features:

| Area | Cloudflare at the pinned revision | What this fork adds |
|---|---|---|
| Focused change review | Guidance and full-audit modes, including scoped audits. | A dedicated [change-review mode](skills/security-audit/CHANGE-REVIEW.md) for pending changes, branches, or commit ranges, returning one report without the full audit's artifact workflow. |
| Findings without execution | Confirmation requires a bounded local observed result. | An explicit default `source_only` mode and strict [`source_trace` evidence rules](skills/security-audit/SKILL.md#confirm-from-source-when-execution-is-unavailable), with expected results distinguished from observed results. Runtime-dependent claims remain unresolved. |
| Operating precautions | Defines OS sandbox controls and artifact isolation. | [Preflight probes and sandbox recipes](skills/security-audit/SAFE-OPERATION.md), hardened read-only Git, hostile-content and symlink rules, and a [credential-pattern checker](skills/security-audit/check-redaction.cjs). These controls and checks provide no assurance of containment or complete redaction. |
| Delegation | Defines delegated roles and independence requirements. | Explicit parallel, sequential, and no-delegation paths, including a [two-session handoff](skills/security-audit/SKILL.md#delegation-capability) when sub-agents are unavailable. |
| Candidate filtering | Uses source, impact, and evidence gates. | [Shared false-positive precedents](skills/security-audit/FALSE-POSITIVE-PRECEDENTS.md) passed to hunters and verifiers, with explicit exceptions and recorded treatment of unverified owner-supplied context. |
| Operational guidance | Includes cloud and deployment attack classes. | [Self-hosted origin-exposure guidance](skills/security-audit/CLOUD-AND-DEPLOYMENT.md#self-hosted-host-exposure-attack-classes-subagent_type-general) and an optional, consent-gated [decoy-notice draft](skills/security-audit/DECOY-NOTICE.md). The notice has no assured deterrent or detection effect. |

### Compared with Anthropic's security reviewer

Anthropic's [GitHub Action](https://github.com/anthropics/claude-code-security-review/blob/0c6a49f1fa56a1d472575da86a94dbc1edb78eda/README.md) and [Claude Code command](https://github.com/anthropics/claude-code-security-review/blob/0c6a49f1fa56a1d472575da86a94dbc1edb78eda/.claude/commands/security-review.md) focus on vulnerabilities introduced by changes and already include context research and false-positive review.

| Area | Anthropic at the pinned revision | What this fork adds or adapts |
|---|---|---|
| Review scope | PR and branch-change review. | Full-codebase audits and focused guidance alongside change review, with domain companions, coverage critics, budgets, and prior-run revalidation inherited from Cloudflare. |
| Evidence handoff | Findings, confidence assessments, JSON results, and PR comments. | Full-audit `confirmed`, `needs_validation`, and `rejected` records, stable fingerprints, explicit blockers, evidence-basis labels, coverage accounting, and local validators. Passing validation does not establish that a conclusion is correct. |
| Filter exceptions | Shipped command/filter defaults broadly exclude availability findings and memory-safety findings in memory-safe languages. | [Evidence-based exceptions](skills/security-audit/FALSE-POSITIVE-PRECEDENTS.md#precedents-include-verbatim-in-every-verifier-and-change-review-filter-prompt) for shared-resource impact, unsafe code/FFI, privileged CI, and prompt-driven authority crossings. Generic concerns still fail the evidence gate; upstream instructions can also be customized. |
| Agent and output choices | Claude Code command plus a Python-backed GitHub Action with optional automatic PR comments. | Agent-neutral Markdown instructions, explicit delegation fallbacks, local Node.js validators, and reports whose publication requires the user's request. Agent/model compatibility remains unassured. |
| Untrusted repositories | The Action's README limits use to trusted PRs because it is not hardened against prompt injection. | Explicit instructions for hostile repository content, read-only command selection, sandbox preflight, and output handling. These are procedural precautions, not proof that reviewing hostile code is safe. |

The broader workflow can require more model calls and setup. Source-trace findings remain unexecuted AI assessments.

## Files

The [Start Prompt](START-PROMPT.md) lives at the repository root and provides guided setup. The installable skill and its companion files live in [`skills/security-audit/`](skills/security-audit). Expand the inventory for skill instructions, validators, and tests.

<details>
<summary>Installable skill file inventory</summary>

| File | Purpose |
|------|---------|
| [SKILL.md](skills/security-audit/SKILL.md) | Operating modes, execution safety, setup, core principles, workflow overview, and audit anti-patterns |
| [LICENSE](skills/security-audit/LICENSE) | MIT license and copyright notices, included in the installable skill folder |
| [DISCLAIMER.md](skills/security-audit/DISCLAIMER.md) | Scope, AI limitations, warranty disclaimer, and limits imposed by applicable law |
| [THIRD-PARTY-NOTICES.md](skills/security-audit/THIRD-PARTY-NOTICES.md) | Upstream attribution and license provenance, included in the installable skill folder |
| [SAFE-OPERATION.md](skills/security-audit/SAFE-OPERATION.md) | Execution capability, source-only command policy, hardened read-only Git, hostile-content and prompt-injection handling, per-agent launch rules, secret hygiene, sandbox preflight, and sandbox recipes |
| [FALSE-POSITIVE-PRECEDENTS.md](skills/security-audit/FALSE-POSITIVE-PRECEDENTS.md) | Shared false-positive precedents, owner-supplied precedents, and confidence calibration for every verifier |
| [CHANGE-REVIEW.md](skills/security-audit/CHANGE-REVIEW.md) | Diff, branch, and pull-request security review with per-candidate false-positive filtering |
| [DECOY-NOTICE.md](skills/security-audit/DECOY-NOTICE.md) | Optional, consent-gated decoy notice for intruding AI agents, with a placement and detection guide |
| [RECONNAISSANCE.md](skills/security-audit/RECONNAISSANCE.md) | Phase 1 reconnaissance prompts and synthesis instructions |
| [HUNTING.md](skills/security-audit/HUNTING.md) | Phase 2 orchestration, hunting methodology, and validation rules |
| [ATTACK-CLASSES.md](skills/security-audit/ATTACK-CLASSES.md) | Core, wildcard, and obvious-things attack prompts |
| [MEMORY-SAFETY-AND-BINARY.md](skills/security-audit/MEMORY-SAFETY-AND-BINARY.md) | Memory-safety, binary, and kernel hunting classes for native targets |
| [AI-AND-LLM.md](skills/security-audit/AI-AND-LLM.md) | Prompt-injection, agent/tool, and output-handling hunting classes for LLM-backed targets |
| [WEB-PROTOCOL-AND-AUTH.md](skills/security-audit/WEB-PROTOCOL-AND-AUTH.md) | HTTP request-framing, cache, and authentication-protocol hunting classes for HTTP-protocol and auth targets |
| [CLIENT-SIDE.md](skills/security-audit/CLIENT-SIDE.md) | DOM-injection, messaging-trust, UI-redress, and prototype-pollution hunting classes for client-side/browser targets |
| [SUPPLY-CHAIN-AND-RELEASE.md](skills/security-audit/SUPPLY-CHAIN-AND-RELEASE.md) | Dependency, CI, release, signing, update, plugin, and extension hunting classes |
| [CLOUD-AND-DEPLOYMENT.md](skills/security-audit/CLOUD-AND-DEPLOYMENT.md) | IAM, infrastructure-as-code, container, serverless, ingress, runtime-configuration, and self-hosted server exposure hunting classes |
| [PROTOCOLS-RPC-AND-MESSAGING.md](skills/security-audit/PROTOCOLS-RPC-AND-MESSAGING.md) | RPC, serialization, queue, broker, webhook, and streaming-protocol hunting classes |
| [RESOURCE-EXHAUSTION-AND-AVAILABILITY.md](skills/security-audit/RESOURCE-EXHAUSTION-AND-AVAILABILITY.md) | Shared resource, quota, queue, worker, and operator-spend hunting classes |
| [DATA-ISOLATION-AND-LIFECYCLE.md](skills/security-audit/DATA-ISOLATION-AND-LIFECYCLE.md) | Tenant isolation, cache, search, export, backup, migration, deletion, and restore hunting classes |
| [DESKTOP-MOBILE-AND-LOCAL-IPC.md](skills/security-audit/DESKTOP-MOBILE-AND-LOCAL-IPC.md) | Native app, deep-link, webview, exported-component, helper, daemon, and local-IPC hunting classes |
| [VALIDATION-AND-REPORTING.md](skills/security-audit/VALIDATION-AND-REPORTING.md) | Phases 3–6 candidate validation, structured output, record verification, and reporting |
| [report-schema.json](skills/security-audit/report-schema.json) | JSON schema for all three `findings.json` verdicts, including the `local_execution` and `source_trace` evidence bases |
| [validate-findings.cjs](skills/security-audit/validate-findings.cjs) | Zero-dependency validator for `findings.json` in Phases 4 and 5 |
| [validate-findings.test.cjs](skills/security-audit/validate-findings.test.cjs) | Findings-validator tests and producer-compatible fixture checks |
| [validate-coverage-ledger.cjs](skills/security-audit/validate-coverage-ledger.cjs) | Zero-dependency validator for `coverage-ledger.json` in Phases 1–5 |
| [validate-coverage-ledger.test.cjs](skills/security-audit/validate-coverage-ledger.test.cjs) | Coverage-ledger validator tests |
| [check-redaction.cjs](skills/security-audit/check-redaction.cjs) | Zero-dependency check for common credential patterns in report files; it cannot prove that every secret was removed |
| [check-redaction.test.cjs](skills/security-audit/check-redaction.test.cjs) | Redaction-check tests |

</details>

## Contributing

Commit messages follow Conventional Commits with a fixed set of types and scopes, enforced by a commit-msg hook. [CONTRIBUTING.md](CONTRIBUTING.md) has the setup, the rules, and the workflow.

## Sponsoring

If the skill is useful to you, you can sponsor its development through [GitHub Sponsors](https://github.com/sponsors/fbruckhoff). Sponsorship does not purchase support, a warranty, priority, features, early access, or another service unless separately agreed. The legal and tax treatment depends on the actual arrangement. Public releases remain available under the MIT License.

## Contact

Questions, feedback, or comparing notes on AI-driven security tooling: franz@stratington.com

For suspected security problems in the skill itself, follow [SECURITY.md](SECURITY.md). Keep credentials and confidential client code out of public reports.

## Credits

**Maintainer:** [Franz Bruckhoff](https://fbx.io), [Stratington Systems](https://stratington.com). This fork is maintained independently.

### Upstream projects

- **Base audit framework:** [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill), under its [MIT License](https://github.com/cloudflare/security-audit-skill/blob/c1c8a8c1471069fb0e188eeaff69b8e8db6564a8/LICENSE). The six-phase audit, coverage ledger, attack-class companions, and validators derive from this project. Its background is described in [Build your own vulnerability harness](https://blog.cloudflare.com/build-your-own-vulnerability-harness).
- **Review-guidance reference:** [anthropics/claude-code-security-review](https://github.com/anthropics/claude-code-security-review), under its [MIT License](https://github.com/anthropics/claude-code-security-review/blob/0c6a49f1fa56a1d472575da86a94dbc1edb78eda/LICENSE). Its change-review approach and false-positive filtering rules were reworked into this fork's Markdown instructions. Its Python application and GitHub Action are not shipped here.

Neither upstream organization maintains, sponsors, endorses, or is affiliated with this fork. The source credits and copyright notices identify separate sources; they do not imply collaboration or a joint product, or attribute this fork's independent additions to either organization. See [third-party notices](THIRD-PARTY-NOTICES.md) for scope and provenance.

### Other inspirations

- **Decoy notice:** andi ([@Nexuist](https://x.com/Nexuist/status/2113677652531761661)) proposed the `flag.txt` idea for intruding AI agents. Ekco ([@Ekco_The_Wizard](https://x.com/Ekco_The_Wizard/status/2113703470381294045)) shared a notice in reply, later published at [e14tech/flag.txt](https://github.com/e14tech/flag.txt). That text has no license, so this skill uses independently written wording and asks the agent to stop rather than repair anything. See [the decoy-notice guide](skills/security-audit/DECOY-NOTICE.md).
- **Self-hosted origin exposure:** Pieter Levels ([@levelsio](https://x.com/levelsio/status/2113587042185576853)) described serving a site through an outbound tunnel behind a web application firewall, using a private network for administration, and blocking inbound connections at the provider firewall. This informed the [self-hosted exposure guidance](skills/security-audit/CLOUD-AND-DEPLOYMENT.md#self-hosted-host-exposure-attack-classes-subagent_type-general).

## License

The [MIT License](LICENSE) permits use, modification, redistribution, and commercial use. Keep the required copyright and permission notices with copies or substantial portions of the software.

Read the [scope and liability notice](DISCLAIMER.md) before use. It describes the intended use, warranty disclaimer, and limits imposed by applicable law; it does not add conditions to the MIT permissions. [Third-party notices](THIRD-PARTY-NOTICES.md) identify the upstream sources and their licenses. The installable skill directory includes all three notices.
