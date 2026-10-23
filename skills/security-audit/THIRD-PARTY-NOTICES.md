# Third-party notices and provenance

This repository uses the MIT License. Preserve the copyright notices and full permission and disclaimer text in LICENSE when redistributing this material. The same notices accompany the installable skill folder.

## Independent project and separate sources

This fork is maintained independently by Franz Bruckhoff (Stratington Systems). Each section below acknowledges a separate upstream project and its own license. The integration and changes in this fork were made independently by its maintainer.

The source references and copyright notices are provenance and licensing acknowledgments. They do not present this fork as a joint product of the upstream organizations, imply that those organizations collaborated on it, or attribute the fork's independent additions to them. Neither upstream organization maintains, sponsors, approves, or endorses this fork, and neither is affiliated with it. These statements concern this fork and make no claim about the upstream organizations' other business relationships.

## Cloudflare security-audit-skill

- Source: https://github.com/cloudflare/security-audit-skill
- Copyright notice: Copyright (c) 2025-2026 Cloudflare, Inc.
- Upstream license: [MIT](https://github.com/cloudflare/security-audit-skill/blob/c1c8a8c1471069fb0e188eeaff69b8e8db6564a8/LICENSE); its copyright notice and the full permission and disclaimer text are retained in LICENSE.
- Last identified upstream ancestor of this fork: c1c8a8c1471069fb0e188eeaff69b8e8db6564a8.
- Scope: base audit workflow, attack-class companions, schemas, validators, tests, and supporting documentation; many files have since been modified.

## Anthropic claude-code-security-review

- Source: https://github.com/anthropics/claude-code-security-review
- Copyright notice: Copyright (c) 2025 Anthropic
- Upstream license: [MIT](https://github.com/anthropics/claude-code-security-review/blob/0c6a49f1fa56a1d472575da86a94dbc1edb78eda/LICENSE). Its original copyright notice is retained conservatively in LICENSE alongside the full MIT permission and disclaimer text, acknowledging the review guidance used as a reference and reworked in this fork. This does not assert Anthropic authorship of the fork's independent additions.
- Scope: change-review methodology, project-context comparison, and false-positive filtering criteria, reworked into this fork's CHANGE-REVIEW.md and FALSE-POSITIVE-PRECEDENTS.md and integrated with its audit workflow. This identifies a review-guidance reference, not the import of the upstream application. The upstream Python application and GitHub Action are not shipped here.
- Reference version of the upstream prompts and MIT license: [0c6a49f1fa56a1d472575da86a94dbc1edb78eda](https://github.com/anthropics/claude-code-security-review/tree/0c6a49f1fa56a1d472575da86a94dbc1edb78eda). The original import revision was not recorded; this reference is not a claim that every adaptation came from that exact revision.

## Other credited ideas

The repository's README credits Pieter Levels for self-hosted origin-exposure guidance and andi (@Nexuist) for the decoy-notice idea. The decoy notice uses independently written wording rather than the unlicensed e14tech/flag.txt notice. Attribution of an idea is not permission to copy someone else's protected wording. Do not copy additional text or assets without checking their license.

These notices identify the separate sources and their respective copyright holders; they do not state joint ownership of the entire repository. Additional contributions are copyright their respective authors. Names are used for identification and attribution; no trademark license or endorsement is claimed.
