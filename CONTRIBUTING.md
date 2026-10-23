# Contributing to security-audit-skill

Thanks for contributing. This guide is the source of truth for setup, the contribution workflow, and commit conventions.

## Prerequisites

- Git
- Node.js, for the validators, their tests, and the commit-message check. Nothing needs to be installed from a package registry.

## Development setup

From the repository root, turn on the commit-message hook:

```bash
git config core.hooksPath .githooks
```

Git then runs `.githooks/commit-msg` on every commit and rejects a message that does not follow the [commit conventions](#commit-conventions). To check a message without committing:

```bash
node scripts/check-commit-message.cjs --message "fix(validators): reject a trace step that cites a missing file"
```

## Workflow

1. Create a focused branch.
2. Keep each change to one purpose.
3. Run the tests from the repository root before you open a pull request:

   ```bash
   node --test
   ```

4. Update `README.md` when you add, rename, or remove a skill file, or when what the skill does changes.
5. In the pull request description, explain what changed and why.

Keep the root and `skills/security-audit/` copies of `LICENSE`, `DISCLAIMER.md`, and `THIRD-PARTY-NOTICES.md` identical. The installable folder must carry its own notices. Preserve upstream attribution and the no-assurance wording in the README, skill instructions, and report templates. Do not describe workflow labels, scores, tests, precautions, or outputs as guarantees of correctness, completeness, security, safety, confidentiality, or results.

Credit each upstream project separately and identify the scope of any reused material or guidance. Do not present this fork's integration as a joint project, partnership, sponsorship, or endorsement by the upstream organizations.

## Commit conventions

Every commit message must follow [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/). The `commit-msg` hook enforces the rules below.

```text
<type>(<optional-scope>): <description>

[optional body]

[optional footer(s)]
```

- The type, and the scope if present, are lowercase and come from the lists below.
- Exactly one space follows the colon, and the description is not empty.
- A body or footers start after one blank line.
- Mark a breaking change, such as an incompatible change to `report-schema.json` or the coverage-ledger format, with `!` before the colon, a `BREAKING CHANGE:` footer, or both.
- Messages that Git writes itself for merges, reverts, and `fixup!`, `squash!`, or `amend!` commits pass unchanged.

Examples:

```text
feat(decoy): add a placement guide for container images
fix(validators): reject a trace step that cites a missing file
docs(readme): describe the skill's origins
security(safety): stop reading through symlinks that leave the target
```

### Allowed types

- `feat`: a new capability, mode, attack class, or check
- `fix`: corrects wrong behavior or wrong guidance
- `docs`: documentation that does not change how the skill behaves
- `refactor`: restructures files or code without changing behavior
- `test`: adds or changes tests only
- `security`: hardens the skill itself, for example against hostile targets
- `chore`: maintenance that fits no other type
- `build`: packaging and installation
- `style`: formatting and wording that change no meaning
- `perf`: makes audits or validators faster or cheaper
- `ci`: continuous integration
- `revert`: reverts an earlier commit

### Allowed scopes

Scopes are optional. If you use one, it must be one of these:

- `attack-classes`: `ATTACK-CLASSES.md` and the domain hunting companions, such as `AI-AND-LLM.md` and `CLOUD-AND-DEPLOYMENT.md`
- `change-review`: `CHANGE-REVIEW.md`
- `contributing`: `CONTRIBUTING.md`, the commit-message hook, and `scripts/`
- `decoy`: `DECOY-NOTICE.md`
- `hunting`: `HUNTING.md`
- `precedents`: `FALSE-POSITIVE-PRECEDENTS.md`
- `readme`: `README.md`
- `recon`: `RECONNAISSANCE.md`
- `safety`: `SAFE-OPERATION.md`
- `schema`: `report-schema.json`
- `skill`: `SKILL.md`
- `validation`: `VALIDATION-AND-REPORTING.md`
- `validators`: the `.cjs` validators and redaction check, and their tests

Leave the scope out when a commit spans several of these areas.

### Keeping the lists in sync

The type and scope lists above must match `TYPES` and `SCOPES` in `scripts/check-commit-message.cjs`. Change both in the same commit; `node --test` fails when they differ.

### Commit order

When several commits are pending, commit fixes first, then infrastructure, then structural changes, then documentation, then build changes. A fix then stays available even if a later commit has to be reverted.

## Security reminders

- Never commit secrets, credentials, or personal data. Tests that need credential-shaped values assemble them at runtime, as `check-redaction.test.cjs` does.
- Never commit audit output from a real target. Reports contain exploit-relevant detail.
- Keep ad-hoc review scripts, research notes, downloaded comparison repositories, and scratch output outside this checkout. Ship only reusable project tooling and synthetic tests.
- Use generic examples or placeholders such as `<target>` and `<output-dir>` for filesystem locations. Do not commit machine-specific home or temporary paths, hostnames, or private review material.
- Check both tracked and untracked files before publication. The root `.gitignore` covers common local artifacts, but it does not remove already tracked files or erase earlier Git history.

## Contribution licensing and provenance

Submit only material you have the right to share and license. By intentionally submitting a contribution for inclusion, you license your contribution under this repository's MIT License, without transferring your copyright. Identify third-party material, its source and exact revision where available, and its license; retain required notices. Do not submit proprietary client code, live audit reports, personal data, or material subject to confidentiality restrictions. Disclose AI assistance when it affects provenance or verification, and check that generated material can lawfully be shared. A contribution is not a request or agreement for professional support.

For suspected vulnerabilities in the skill, see [SECURITY.md](SECURITY.md).
