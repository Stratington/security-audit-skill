# Use, scope, and liability notice

## No assurance of any kind

**Franz Bruckhoff (Stratington Systems), the authors, and contributors provide no assurance of any kind about this skill, its documentation and utilities, or any resulting finding, report, score, coverage statement, recommendation, or other output. All are supplied "as is" and "as available", with all faults, without any representation, warranty, guarantee, certification, or promise of results, express or implied, to the fullest extent permitted by applicable law.**

No assurance is given of correctness, accuracy, completeness, currency, reliability, security, safety, confidentiality, availability, compatibility, merchantability, fitness for a particular purpose, non-infringement, or any particular outcome. Instructions, examples, tests, review passes, and operating precautions do not establish that an agent will follow them, that a review is complete, that a recommendation works, or that use will avoid loss, disclosure, damage, or a security incident. Following the precautions or obtaining further review does not create an assurance from the publisher. Mandatory legal rights and responsibilities remain unaffected.

## License and publisher

The repository is maintained by Franz Bruckhoff under the Stratington Systems name, in Madeira, Portugal. A trading name does not by itself create a separate legal entity. Contributors retain rights in their respective contributions.

The software and documentation are licensed under the accompanying [MIT License](LICENSE). This notice explains the project's scope and limitations. It does not add conditions to, restrict, or require separate acceptance for the permissions granted by that license. In particular, the license permits commercial use, modification, redistribution, and sale, subject to its notice requirements. Applicable mandatory law takes precedence over any disclaimer.

The project includes material from Cloudflare's security-audit-skill and uses review guidance from Anthropic's claude-code-security-review as a separately acknowledged reference, reworked in this fork. See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) for the scope and individual upstream MIT licenses. This fork's maintainer made the integration and changes independently. Neither upstream organization maintains, sponsors, endorses, or operates this fork, and neither is affiliated with it. Naming both projects and retaining their respective copyright notices does not imply that the organizations collaborated on this fork or that it is their joint product. These acknowledgments do not attribute the fork's independent additions to either upstream organization.

## Free project and sponsorship

The public repository is available without a license fee. This describes the publisher's distribution of this copy, not a restriction on what licensees may do. The repository does not promise support, updates, vulnerability remediation, response times, or continued availability, except for obligations imposed by applicable law or a separate agreement.

A voluntary sponsorship for which no goods, services, preferential access, or other benefits are promised does not purchase support or a warranty. Calling a payment a gift does not determine its legal or tax treatment. Public releases remain available under the MIT License.

## Intended use and authorization

This is a defensive source-review workflow. Review only code you may lawfully access and assess. Before reviewing a client's code, obtain the permission of a person with authority to grant it and agree the scope, permitted processing, and disclosure. An organization may not have authority to authorize testing of a hosting provider's, supplier's, or other third party's infrastructure.

The skill instructs an agent to review source and to use local fixtures only after the documented sandbox preflight passes. It does not authorize testing of deployed or third-party systems. Its instructions are guidance to the chosen agent, not an enforced security boundary. The operator remains responsible for deciding and controlling what the agent can access and execute.

## Accuracy, completeness, and reliance

AI-generated work can miss vulnerabilities, report issues that do not exist, assign incorrect severity, or suggest changes that break functionality or introduce vulnerabilities. Results can differ across runs, models, settings, and code revisions. A report without findings is not evidence that a system is secure. A validator checks specified structural and consistency rules; it cannot establish that a security conclusion is correct. Multiple AI reviewers may make correlated mistakes.

The skill does not provide a professional security engagement, penetration test, certification, attestation, legal opinion, or compliance determination. `confirmed`, `verified`, `complete`, `covered`, and `verified_sandbox` are internal workflow labels based on fallible agent assessments or specified checks. They are not proof of truth, completeness, exploitability, security, containment, or safe operation. Severity and confidence labels or numeric scores are subjective assessments, not measured or statistically calibrated probabilities. A rejected candidate can still be a real issue, and covered code can still contain vulnerabilities. Independently check findings, identify unresolved assumptions, and review and test proposed changes before relying on them. Use qualified security professionals where the consequences require that expertise.

Publication or use of the skill does not itself create a professional engagement or a promise to the operator or any report recipient. No representation is made that results are accurate, complete, current, suitable for a particular purpose, or free from error. Scope statements and warnings should accompany reports when shared. A report recipient is not bound to contractual terms merely because a report links to this notice.

## Execution, data, and third-party tools

The repository consists of instructions and local utilities for an agent chosen and controlled by the operator. Its maintainer does not operate a hosted assessment service through the skill. The behavior of an agent, installer, extension, dependency, or model provider depends on the tools and settings chosen. Source code, prompts, personal data, secrets, or report content may leave the operator's environment. A local model and a hosted service can have different data flows.

Review provider terms, confidentiality, processing agreements, subprocessors, retention, and transfers before using confidential or personal data. Do not include live credentials or production datasets merely to obtain a review. Keep access limited, retain backups, and treat vulnerability reports and agent transcripts as sensitive. Permission to assess code does not automatically authorize disclosure to an AI provider. Do not send sensitive reports through public issues.

The optional decoy notice is an experimental deterrent. It does not prevent access, establish legal consent, or prove that monitoring exists. It should never be described as protection against intrusion. Deploy it only with authority and only after checking the impact on legitimate tools.

## Warranty and liability

The [MIT License](LICENSE) supplies the authors' and copyright holders' warranty disclaimer and limitation of liability, including for Franz Bruckhoff's contributions. **The skill and any output supplied by the maintainer without a separate undertaking are offered "as is" and "as available", with all faults and without warranty of accuracy, completeness, correctness, fitness, security, reliability, non-infringement, or results, to the extent applicable law permits.** Franz Bruckhoff (Stratington Systems) and contributors make no additional promise that the skill will find any particular vulnerability, prevent an incident, or operate safely, without interruption, or without error. Documentation does not create a promise of a particular result or an agreement to perform professional services. This notice does not extend the license's exclusions beyond applicable law.

Neither that license nor this notice excludes or limits any responsibility that cannot lawfully be excluded or limited. This includes, where applicable, responsibility for intentional misconduct or gross negligence, death or injury and other legally protected personal interests, non-contractual property damage where exclusion is prohibited, mandatory consumer remedies, data-protection duties and claims, and other mandatory statutory liabilities. The nature of a claim and the law applicable to it determine whether a particular exclusion is effective. A general saving clause does not make a prohibited term enforceable.

This notice is not an indemnity, a release by third parties, or a waiver of public-law obligations. It does not displace duties assumed in a separate agreement. Rights in a client's source code, third-party material, personal data, or other content in an output remain governed by their applicable rights and terms; the project does not claim to relicense all generated output.

## Notices and versions

Keep the applicable copyright and permission notices with copies or substantial portions of the software and documentation. The version of this notice accompanying the copy obtained describes that copy; later edits do not retroactively amend a separate contract. When sharing a report, identify the source revision, scope, execution limits, date, and role of any human reviewer, and include its limitations prominently.

Product and organization names are used for identification and attribution. No trademark license or endorsement is claimed. Questions about this project: franz@stratington.com.
