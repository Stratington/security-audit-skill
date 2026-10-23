# Validation, Structured Output, Verification, and Reporting

### Phase 3: Independently validate every candidate

After the clean coverage-critic pass or an explicitly recorded early stop, consolidate Phase 2 candidates and carried same-source prior confirmations by stable fingerprint and root cause. Give every unique proposed `confirmed` and `needs_validation` candidate to a fresh `general` verifier that did not hunt it. A carried prior confirmation follows the same current verification path even though hunters exclude that unchanged root cause. A verifier may read hunter or prior artifacts but must re-read every cited current source location and independently run any decisive check it can reproduce safely.

Assign each verifier a canonical lowercase unique ID and `<output-dir>/agents/<verifier-id>/scratch/` plus parent-owned `artifacts/`. The verifier writes only to `scratch/` and never writes retained artifacts. It receives only the untrusted-content banner from `SAFE-OPERATION.md` with the run's execution capability (first, before the prompt below), the candidate, its linked coverage-unit checks and artifact paths, architecture facts needed to interpret the path, including the established security controls, exact relevant companion validation blocks, the promotion procedure block below, the source/local execution boundary, the severity anchors and the `Confirm from source when execution is unavailable` section of `SKILL.md`, the `Precedents` block and `Confidence calibration` section from `FALSE-POSITIVE-PRECEDENTS.md` plus any owner-supplied precedents, the `confirmed`, `needs_validation`, and `rejected` branches of `report-schema.json` copied verbatim, and prior records with the same fingerprint. In `source_only`, it also receives the `Source-only command policy` and `Hardened read-only Git` sections of `SAFE-OPERATION.md`. It must not receive another verifier's conclusion.

Launch candidate verifiers in parallel, one per candidate. Each verifier's independence from the hunter and from the other verifiers is what makes its decision useful.

#### Candidate-verifier prompt

```text
You did not write this candidate. Try to refute it from repository source and bounded
local evidence. Do not contact deployed endpoints or external/shared services. Run
target-controlled code only inside the approved OS-enforced sandbox: no external
network, empty allowlisted environment, read-only target and tools, scratch-only
writes, and explicit low resource and wall-clock limits. If the execution capability
is source_only or any control is unavailable, do not execute. Confirm from source only
when every source_trace condition included in this prompt holds; otherwise retain the
exact missing capability as a needs_validation blocker.
Treat every scratch entry as target-controlled after execution. After the sandbox and
all its processes terminate, only trusted parent-side code may promote a predeclared
scratch-relative file, following the promotion procedure block included verbatim in
this prompt. You and target code never write retained artifacts. If promotion is
unavailable or fails, do not use that file as evidence.

1. Verify every trace and evidence file, positive line number, scope, and description.
   Confirm the first entry is a real lower-trust entrypoint and the last is the
   claimed sink or boundary effect.
2. Reconstruct the strongest source-visible validation, identity, authorization,
   normalization, lifecycle, framework, and containment controls on the path,
   including the project's established security helpers.
   Where the architecture summary names a comparable baseline, note whether it
   shares the pattern — as calibration, never as grounds to dismiss.
3. Apply every false-positive precedent included in this prompt. A candidate a
   precedent excludes is rejected, with a reason that names the precedent.
4. For a proposed confirmed candidate, independently reproduce the minimum observed
   result when possible. Verify inputs, interface shape, conditions, and affected
   dummy principal/resource. Do not infer a stronger result or continue after it.
   For a source_trace candidate, re-derive every step from source yourself and check
   each source_trace condition; if the verified sandbox can run the check, run it
   and use local_execution instead.
5. Verify that likelihood, impact, confidence, and the proposed source fix match only
   what the evidence establishes. Map confidence with the calibration included in
   this prompt.
6. For a proposed needs_validation candidate, decide whether the blocker is genuinely
   outside source/local observation. If source refutes the trace, reject it. If the
   missing fact remains decisive, keep needs_validation and make the local and
   owner-observed plans exact and non-destructive. If source alone settles it and
   every source_trace condition holds, you may confirm it with source_trace.
7. Preserve the fingerprint for the same source-derived root cause across every state.
8. Never put a secret value in any field. Describe it by kind, location, and length.

Return exactly one JSON object and no surrounding prose:
{"decision": "confirmed|needs_validation|rejected", "record": { ... }}
where record exactly matches the decision's verdict branch of the schema included
in this prompt. A corrected record replaces the hunter's wording.
```

Copy this promotion procedure verbatim into every candidate-verifier prompt:

```text
Artifact promotion procedure (trusted parent-side code only):
Reference only for you: the parent performs these steps; you never perform them.

Before execution, the parent opens and retains trusted, non-inheritable directory
descriptors for the agent's scratch/ and artifacts/ roots, and records an allowlist
of expected scratch-relative artifact files plus explicit per-file and cumulative
byte limits. Never pass those descriptors to the agent or sandbox. After the sandbox
and all its processes terminate, trusted parent-side code promotes each allowlisted
file separately:

1. Validate the declared relative path: reject absolute, empty, `.`, `..`, or
   symlinked components.
2. Walk each parent component from the retained scratch-root descriptor with
   no-follow directory-relative operations; never reopen by path.
3. Open the leaf no-follow and nonblocking.
4. Verify with `fstat` that it is a regular file with link count exactly one and
   within the recorded per-file and cumulative byte limits.
5. Enforce those limits again while reading from that descriptor.
6. Copy exactly the verified size, repeat `fstat`, and reject a changed identity,
   type, link count, or size.
7. For the destination, walk every parent component from the retained
   artifacts-root descriptor with no-follow directory-relative operations; require
   each existing component to be a real directory, and create any missing directory
   exclusively before reopening and verifying it no-follow.
8. Create the leaf exclusively without following links, verify that the opened
   destination is a regular file with link count exactly one, and copy from the
   verified source descriptor without reopening either path.
9. Use equivalent race-safe APIs on non-POSIX systems.
10. Never recursively copy or glob scratch, extract an archive into artifacts, or
    open or promote a symlink, FIFO, socket, device, directory, hard-linked file,
    changing file, or file that exceeds its bound.
11. If any check is unavailable, cannot be enforced, or fails, discard the scratch
    entry; if it is decisive evidence, retain `needs_validation` with the exact
    promotion blocker.
```

A verifier can promote `needs_validation` to `confirmed` only after independently establishing the complete path and either a bounded observed result or every `source_trace` condition. Demote proposed confirmation to `needs_validation` when a specific deployment or runtime fact remains unknown. Use `rejected` when source, local behavior, a visible control, missing meaningful impact, or an impossible prerequisite refutes the claim. `needs_validation` is never a parking place for a speculative idea.

The parent checks that each verifier returned the same fingerprint unless it identified a genuinely different root cause. Merge corrections, record the decision in every linked coverage unit, and ensure there is one final record per fingerprint. In the ledger, only `status: "candidate"` may carry `result_fingerprints`: keep a unit with any validated `confirmed`, `needs_validation`, or retained `rejected` fingerprint at `status: "candidate"` with `unresolved: []` (or, when every candidate on a fully checked unit was `rejected` and you remove the refuted fingerprints from `result_fingerprints`, transition the unit to `status: "covered"` with `result_fingerprints: []` and `unresolved: []`). An unvalidated candidate in an incomplete run stays `status: "candidate"` with the incomplete reason in `unresolved`. Discard a malformed or prose-wrapped verifier result without repairing it; re-run that candidate with a fresh verifier when the budget permits, otherwise it remains an unvalidated ledger candidate under the incomplete-run rule.

When verifier evidence updates a ledger check, set that check's `agent_id` to the verifier's canonical ID and list its nonempty repository-relative `reviewed_paths`. Keep the unit-level `reviewed_paths` equal to the union across checks. Use `method: "source"` with `artifact: null` for source-only review. Use `method: "local"` only with a file successfully promoted by trusted parent-side code below `agents/<check.agent_id>/artifacts/`. The unit retains its original assignment owner, so independently owned hunter and verifier checks can coexist. For a carried prior record's seeded `planned` unit there is no prior owner: the verifier that re-checks it becomes the unit's assignment owner, and its re-check is the unit's first check, moving the unit to `candidate` with the carried fingerprint.

If a strict total-agent budget cannot cover every candidate, set the run status to incomplete and follow the deterministic budget rule in `SKILL.md`. An unvalidated candidate remains only in the ledger. It does not enter `findings.json` under any verdict.

### Phase 4: Write and validate `findings.json`

The parent writes all independently decided records to `<output-dir>/findings.json`, sorted by fingerprint. Include:

- `confirmed`: source-grounded vulnerabilities with complete local execution evidence or a qualifying source trace, conditions, specific remediation, likelihood/impact/overall severity, and confidence.
- `needs_validation`: source-grounded candidates with an exact unresolved blocker and at least one applicable local or owner-observed deployment plan.
- `rejected`: source-grounded candidates disproved during validation, retained so future runs do not repeat the unsupported claim without changed evidence.

Read `report-schema.json` immediately before writing. It uses `additionalProperties: false`; do not carry hunter wrapper fields into a record. Keep these verdict contracts distinct:

- A `confirmed` record uses `root_cause`, `intended_behavior`, `conditions`, `execution`, `remediation`, `severity`, and `confidence`. It must not use `claimed_root_cause`, `blockers`, `validation_plan`, or `reason`. `execution` is target-neutral and uses the target's native interface: API/HTTP input, CLI call, library call, message, file fixture, browser action, rendered policy, or local harness as applicable. With `evidence_basis` absent or `"local_execution"`, `observed_result` is nonempty and factual and `expected_result` is absent. With `"source_trace"`, `expected_result` replaces `observed_result`, `confidence.score` is `"high"`, and the record meets every condition in `Confirm from source when execution is unavailable` in `SKILL.md`. `category` (lowercase snake_case) and `cwe` (`CWE-<n>`, only when certain of the most specific applicable entry) are optional labels on every branch.
- A `needs_validation` record uses `claimed_root_cause`, `trace`, `evidence`, `blockers`, and at least one nonempty `validation_plan.local` or `validation_plan.deployment` field. Include both only when both contexts can resolve distinct facts. It must not use severity, execution, remediation, reason, or confirmed root cause.
- A `rejected` record uses `claimed_root_cause`, `trace`, `evidence`, and `reason`. It must not use severity, execution, remediation, blockers, validation plan, or confirmed root cause. When a false-positive or owner-supplied precedent decided the rejection, `reason` names it.

Every record has a stable fingerprint, title, description, and repository-relative source paths. A multi-step trace begins with `entrypoint`, ends with `sink`, and uses `propagation` only between them. One-entry traces use `entrypoint` or `sink`. Overall severity cannot exceed demonstrated impact.

Run:

```sh
node <skill-dir>/validate-findings.cjs <output-dir>/findings.json
node <skill-dir>/validate-coverage-ledger.cjs <output-dir>/coverage-ledger.json
```

Fix every structural and semantic error before continuing. The findings validator rejects input beyond 5 MiB, 1,000 top-level findings, or 64 nesting levels, and caps reported error output at 100 messages. It also rejects common credential formats anywhere in a record and never echoes the matched value. Validator success means only that the implemented checks passed on the supplied files. It does not prove the validators are error-free, the evidence is true, the ledger is complete, secrets are absent, or the conclusions are correct.

### Phase 5: Verify the final records with fresh eyes

Launch one fresh `research` verifier per final `confirmed` and `needs_validation` record, in parallel. This verifier checks the structured record, not the hunter write-up, and remains inside source/local boundaries.

In a `quick` run, Phase 3 and Phase 5 merge: the Phase 3 verifier also performs these record checks and returns the final schema-shaped record, so each candidate gets one fresh independent reviewer instead of two. The exception is a `source_trace` confirmation: with no execution result to anchor it, it keeps a separate fresh Phase 5 verifier in every profile. Every other profile keeps the two passes separate. The one exception is a continuing session with delegation `none`, which merges both passes for every record, `source_trace` included, as `Delegation capability` in `SKILL.md` defines, and the report says so. Never skip independent review of a `confirmed` record in any profile.

For `confirmed`, require it to check:

1. Every repository-relative trace/evidence path, line, scope, and described operation.
2. Real entry interface and exact local input shape.
3. Every condition, parser/policy step, source-visible preventing layer, and observed local result. For `source_trace`, re-derive the trace from source and check every qualification condition and the stated expected result.
4. Affected principal/resource and demonstrated impact.
5. Severity separation: realistic likelihood, demonstrated impact, overall no greater than impact.
6. Remediation strategy and any `code_changes`, including whether the fix enforces the invariant without merely moving trust.

For `needs_validation`, require it to check:

1. The source path is real and supports only the `claimed_root_cause` stated.
2. Every listed blocker is decisive and not already answerable locally.
3. The candidate names a boundary and a possible concrete result rather than a generic concern.
4. At least one validation-plan field is present and exact. `local` uses a bounded fixture; `deployment` asks an owner to observe a configuration, identity, route, policy, or runtime fact. Do not invent a plan for an inapplicable context, and never send audit traffic to a deployment.
5. The fingerprint matches prior/current records for the same root cause.

Each verifier returns exactly one JSON object: `{"decision":"verified","fingerprint":"..."}` or `{"decision":"replace","reason":"...","record":{...}}`, with no surrounding prose. A replacement record must match its `confirmed`, `needs_validation`, or `rejected` schema branch. Treat a malformed or prose-wrapped Phase 5 result the same way as in Phase 3: discard it without repairing it and re-run with a fresh verifier when the budget permits.

Do not apply a Phase 5 replacement as final when it promotes a record to a stronger verdict, including any promotion to `confirmed`, or materially changes the root cause, trace, evidence basis, execution input, observed or expected result, demonstrated impact, or severity. Give that complete replacement to a new independent verifier that did not hunt, perform Phase 3 validation, or propose the Phase 5 replacement. The new verifier rechecks the current source and independently reproduces any decisive local result under the execution boundary, then returns `verified` or another replacement. Apply a material replacement only after this fresh verification. If another material replacement results, repeat with a fresh verifier. If budget or independence is unavailable, remove the disputed record from `findings.json`, keep its ledger unit as an unresolved candidate, and set `run_status: "incomplete"` with an exact `incomplete_reason`. Non-material wording or repository-line corrections may be applied directly when they do not change meaning or evidence.

After every applied replacement, rerun both validators and update linked ledger decisions. If a final verifier identifies a separate root cause, assign a new fingerprint and send it through independent candidate validation before inclusion. Set `run_status: "complete"` only when every ledger candidate has an independent final disposition and every retained record passes Phase 5.

Do not verify only `confirmed` records. A misleading `needs_validation` handoff wastes owner time and can preserve a false premise.

### Phase 6: Produce target-neutral reports from final records

Only after Phase 5 passes for every record retained in `findings.json`, derive prose from the final records, the ledger, and the hunter `hardening` notes and `observations` retained in ledger bookkeeping. An incomplete run may report independently verified records, but it must identify each unresolved ledger candidate and must not present it as a finding. The prose files never change a verdict, severity, blocker, or demonstrated impact.

#### `REPORT.md`

Write:

1. Run profile, scope, budget (if set) with agents spent versus planned, source ref, execution capability statement, prior-run use, and explicit deferred and out-of-scope coverage. For `source_only`, state: "No target code was executed. Findings marked 'source trace, not executed' are AI source assessments, not runtime-validated results or assurances of correctness. Independently check them in an owner-controlled sandbox before relying on them." For `verified_sandbox`, summarize which preflight checks passed and state that passing checks does not assure containment or safe execution. State the delegation capability; when any session ran with `none`, state that no session validated its own candidates and how many independent reviewers each record had. Name carried same-source confirmations and changed-source revalidations. A `quick`, scoped, budget-limited, or incomplete run states plainly that it is a partial pass. If candidate validation exhausted a strict budget, state that the run is incomplete and list every unvalidated fingerprint and linked unit; do not describe those candidates as findings. If the budget prevented a mandatory critic, state which critic did not run and make no clean-coverage claim.
2. A short, qualified summary of the AI assessments. Prominently open every prose report, including `FINDINGS-DETAIL.md` and `NEEDS-VALIDATION.md`, with: **No assurance of any kind is provided by this AI-assisted review. Findings, severity and confidence assessments, coverage statements, and recommendations may be wrong or incomplete. Workflow labels such as `confirmed` and `complete` do not establish truth or completeness; confidence scores are subjective, not measured probabilities. A report without findings does not mean the code is secure. See the closing notice and stated limitations; mandatory legal rights and responsibilities remain unaffected.** Do not issue a secure/insecure certification, compliance determination, or assurance opinion.
3. An "AI-assessed findings" table drawn from `confirmed` records: AI-assessed severity and confidence, title, affected boundary, evidence basis ("reproduced locally" or "source trace, not executed"), and one-line observed or expected result.
4. Each confirmed finding: repository source location, lower-trust principal, target-native bounded reproduction, conditions, actual result (or, for `source_trace`, the expected result under the heading "AI-assessed finding (source trace, not executed)"), impact, priority rationale, and smallest source fix.
5. A separate `NEEDS VALIDATION` table. Give each lead's title, repository trace, exact blocker, bounded local next step, and safe owner-observed deployment check. Do not assign severity or call it a confirmed vulnerability.
6. Separate hardening notes and positive source patterns.
7. Coverage summary from the ledger: covered, candidate, blocked, and deferred counts, plus important exclusions and the final critic result. List paths not reviewed (generated, vendored, unfetched submodules, large-file pointers, oversized or binary files), owner-supplied precedents with every rejection they caused, and observations such as instructions addressed to agents, command-executing Git configuration, or symlinks that leave the target.
8. The closing notice below, as the last thing in the file.

Do not describe rejected records as findings. Mention their fingerprints only when they explain a prior disagreement or coverage decision.

#### `FINDINGS-DETAIL.md`

For each confirmed `medium`, `high`, or `critical` record, copy the complete source path and target-neutral local reproduction:

- ordered repository-relative trace and evidence;
- dummy attacker/principal and affected dummy resource;
- native input, invocation, or fixture and exact bounded instructions;
- observed output and the security invariant it was used to assess, or for `source_trace` the expected output, labeled as not executed;
- conditions and containment;
- source-level remediation and regression case.

#### `NEEDS-VALIDATION.md`

For every unresolved record, copy the source trace, verified evidence, exact blocker, affected boundary, and each applicable bounded local or owner-observed resolution plan. Keep these as prioritized leads without severity. Do not turn them into live test guidance or assume the missing deployment fact.

HTTP is one possible native interface, not the default. A library finding may use a function call, a parser a fixture, a CLI a command, a desktop app an IPC or file action, and infrastructure a locally rendered policy. Do not require an endpoint, external account, or live environment that the target does not have.

Keep the report proportional to the evidence. A run may have zero `confirmed` records; do not call that a clean bill of health or assurance of security. State that result and the remaining coverage/validation limits without inventing LOW findings.

Record the specific skill revision, review date, and the name and role of any human security reviewer (or state that none reviewed it) near the scope statement in each prose report.

#### Closing notice

End `REPORT.md`, `FINDINGS-DETAIL.md`, and `NEEDS-VALIDATION.md` with this notice, unchanged. Recipients may not have seen the skill's limitations. Include those limitations in each file; a notice alone does not establish contractual acceptance. Record the skill revision and supply a copy of its notice when sharing offline:

```markdown
---

*No assurance of any kind is provided by Franz Bruckhoff (Stratington Systems), the authors, or contributors about this skill or its outputs. The skill, documentation, utilities, findings, scores, coverage statements, and recommendations are supplied as is, with all faults, without any representation, warranty, guarantee, certification, or promise of correctness, completeness, security, safety, confidentiality, fitness, or results, express or implied, to the fullest extent permitted by law. AI assessments may be wrong or incomplete; workflow labels and confidence scores are not proof or measured probabilities. A report without findings does not mean a system is secure. Independently validate conclusions and proposed changes. Mandatory legal rights, responsibilities, and any separate professional's undertakings remain unaffected. This notice does not make the recipient a party to a contract. See the notice accompanying skill revision <skill-revision>: <notice-reference>.*
```

Fill `<skill-revision>` with the installed skill's actual revision, or `not recorded` if unavailable. Use a commit-pinned disclaimer link when that revision is known; otherwise refer to the installed `DISCLAIMER.md` and supply a copy when sharing the report offline. Do not invent a revision or replace it with a mutable `main` link.

#### Redaction check

After writing every output file, run:

```sh
node <skill-dir>/check-redaction.cjs <output-dir>/run-metadata.json <output-dir>/architecture.md \
  <output-dir>/coverage-ledger.json <output-dir>/findings.json <output-dir>/REPORT.md \
  <output-dir>/FINDINGS-DETAIL.md <output-dir>/NEEDS-VALIDATION.md
```

A failure means a credential-shaped value reached an output. Replace it with a kind, location, and length description, rerun the validators if a JSON file changed, and rerun the check. The checker recognizes common credential formats only and cannot prove that no secret remains, so the parent still applies the redaction rule from `SAFE-OPERATION.md` to every value it writes. Tell the user that the `agents/` directories hold target-controlled scratch output and are not meant to be shared.
