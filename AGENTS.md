# AGENTS.md

Technical operating rules for this TypeScript repository template.

## 1. Repository Scope

- Public TypeScript workspace template using `pnpm` and native Node.js validation scripts (`tools/`).
- Update template placeholders (`CHANGE_ME`) in `package.json`, `LICENSE`, `NOTICE`, `README.md`, and `.github/CODEOWNERS` before production use.

## 2. Toolchain & Validation

- Runtime & package manager: Node.js `24+` and `pnpm` (`npm` and `npx` are forbidden).
- Enable hooks locally with `git config core.hooksPath .githooks` and run `pnpm validate` (`TOTAL PASS=8 FAIL=0`) before opening or updating any pull request.
- Do not run `prettier` or automated code formatters in hooks, CI, or pre-commit steps.

## 3. Code Layout & Architecture

- Organize domain logic under `src/modules/<domain>/` as a six-file layered modular layout (`entity.ts`, `dto.ts`, `repository.ts`, `service.ts`, `controller.ts`, `module.ts`).
- Enforce unidirectional imports: `controller` calls `service` and `dto` (never `repository`); `entity` and `dto` must not import `service`, `repository`, or `controller`.
- Keep every source and documentation file at or below **500 lines**.

## 4. Commit, Dependency & License Policy

- Set Git Author and Committer identically to your maintainer handle and GitHub noreply email (`<id>+<handle>@users.noreply.github.com`).
- Format commits as `type(scope): description` (3 to 6 lowercase words, no trailing period, max 100 chars), a single blank line, and 3+ consecutive `- **Label**: text` bullets (3 to 10 words each) without trailers.
- External dependencies must pass the 3-day publish cooldown (`minimumReleaseAge: 4320` in `pnpm-workspace.yaml`; never use `@latest`); run `pnpm notices` after dependency edits.
- Code and documentation are released under the Apache License 2.0 (`Copyright (c) 2026 CHANGE_ME`).
