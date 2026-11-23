# Contributing

Thank you for contributing to this repository.

## Local Setup

1. Enable repository git hooks:
   ```sh
   git config core.hooksPath .githooks
   ```
2. Verify your toolchain and baseline checks:
   ```sh
   pnpm validate
   ```

## Commit Message Specification

Every commit is validated locally by `.githooks/commit-msg` and in CI by `Conventional Commits`:

- **Header**: `type(scope): description` (lowercase English, 3 to 6 words, no trailing period).
- **Allowed scopes**: `core`, `api`, `cli`, `domain`, `math`, `tools`, `ui`, `config`, `docs`, `ci`, `workflow`, `hooks`, `release`, `license`, `deps`, `security`.
- **Body**: A single blank line followed by at least 3 consecutive `- **Label**: text` bullets (3 to 10 words each, no blank lines between bullets).

Example:

```text
feat(math): add bounded multiplication domain operation

- **Dto**: validate operand range before multiplication
- **Service**: record multiplication results in repository
- **Tests**: verify boundary rules and integration flow
```

## Pull Request Workflow & Contribution Policy

We do not accept unsolicited external pull requests. Pull request creation is restricted to maintainers and code owners (`collaborators_only`).

If you encounter a bug, have an enhancement request, or want to propose an architectural change, please open an issue using our structured issue templates. Maintainers review issues regularly and incorporate validated solutions directly into the codebase.

For authorized maintainers:
- Branch from `dev` and target `dev` for feature work.
- `main` accepts rebase-only pull requests from `dev` after all CI and CodeQL checks pass.
- Update `ThirdPartyNotices.txt` with `pnpm notices` if you add or update any package dependency.

## Production Setup and Branch Protection

When creating an operational repository from this template:
1. Update `.github/CODEOWNERS` with your GitHub handle or maintainers team.
2. In repository settings, add a `main-protection` ruleset requiring PR from `dev`, code owner review, passing status checks (`validate`), and rebase-only merge.

## Repository Documentation Standards

Every documentation file in this repository fulfills a strict, non-overlapping responsibility:

| File | Audience | Purpose & Content Specification | Max Lines |
| :--- | :--- | :--- | :--- |
| `README.md` | Developers / Evaluators | Scaffolding guide: header badges, template purpose, highlights, quickstart, repository layout, gate table, and license. | 500 |
| `ARCHITECTURE.md` | Architects / Engineers | Technical system design: 6-component domain layout (`entity`, `dto`, `repository`, `service`, `controller`, `module`), unidirectional dependency rules, and layer boundary tripwires. | 500 |
| `CONTRIBUTING.md` | Contributors | Contributor workflow: branch lifecycle (`dev` to `main`), Conventional Commit grammar, documentation hierarchy rules, and validation checklist. | 500 |
| `SECURITY.md` | Security Auditors | Vulnerability disclosure channels, response SLAs (48h triage), and supply-chain security controls (3-day cooldown, automated SBOM inventory, dependency audits). | 500 |
| `AGENTS.md` | Autonomous AI Agents | Machine-facing instructions: zero-formatter prohibition, strict author/committer identity unification, command reference, and hygiene assertions. | 500 |
| `CHANGELOG.md` | Tooling / Humans | SemVer release history generated and maintained automatically by native release tooling from conventional commits. Manual edits forbidden. | Incremental |
| `LICENSE` / `NOTICE` | Legal | Verbatim Apache-2.0 license terms and legal copyright declarations. | Standard |
| `ThirdPartyNotices.txt` | Legal / Compliance | Complete license notice inventory of all compiled/linked third-party dependencies, generated automatically by native tooling (`pnpm notices`). | Automated |
