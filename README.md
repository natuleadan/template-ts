# Project Template (CHANGE ME)

Production-ready TypeScript (`pnpm`) template featuring native Node.js validation scripts, layered modular domain architecture, strict Git hygiene, 3-day dependency cooldown enforcement, and automated GitHub Actions pipelines.

## Key Features

- **Pure `pnpm` + Native TypeScript**: Runs directly on Node 24+ native type stripping (`tools/*.mjs`) backed by strict `tsconfig.json` flags with zero `npm`, `npx`, or external formatter overhead.
- **Real Semantic Analyzers**: `oxlint --deny-warnings` (correctness, suspicious, pedantic, perf) and `tsc --noEmit` run as the `lint` and `typecheck` gates, pinned to exact versions that respect the 3-day cooldown.
- **Strict Static Analysis & Policy Lock**: Forbids explicit `any`, double casts, non-null assertions, `var`, loose equality, `enum`/`namespace`, `console.*` in `src/`, and boolean parameter flags; `tests/architecture.test.ts` locks all compiler and lint policies against weakening.
- **Layered Modular Architecture**: Reference domain module (`src/modules/math/`) separating `entity`, `dto`, `repository`, `service`, `controller`, and `module` layers with automated boundary tests.
- **Eight Standardized Validation Gates**: `lint`, `typecheck`, `unit tests`, `integration and architecture tests`, `cooldown`, `hygiene`, `notices`, and `release`.
- **Supply-Chain Hardening**: 3-day dependency publish-age cooldown (`minimumReleaseAge: 4320`), CodeQL static analysis, and automated SBOM/dependency inventory artifacts.
- **Zero Formatter Drift**: Automated formatters (`prettier`) are intentionally excluded from hooks and CI so diffs stay focused on logic.

## Repository Layout

```text
.
├── .githooks/                   # Versioned commit-msg, pre-commit, and pre-push hooks
├── .github/
│   ├── CODEOWNERS               # Code ownership rules (CHANGE ME)
│   ├── dependabot.yml           # npm/pnpm and GitHub Actions updates with 3-day cooldown
│   └── workflows/               # validate.yml, nightly-tag.yml, security.yml
├── src/
│   ├── index.ts                 # Public module exports
│   └── modules/math/            # Layered domain module (entity, dto, repository, service, controller, module)
├── tests/                       # Unit, architecture, and security tripwire tests
├── tools/                       # Native validation, notices, commit-check, and release scripts
├── ARCHITECTURE.md              # Modular architecture and dependency boundary guide
├── AGENTS.md                    # Autonomous agent operating rules
├── CONTRIBUTING.md              # Contributor workflow and commit grammar
├── SECURITY.md                  # Supply-chain controls and vulnerability reporting
├── LICENSE                      # Apache-2.0 License (Copyright (c) 2026 CHANGE_ME)
└── ThirdPartyNotices.txt        # Generated dependency notice inventory
```

## Quickstart

Enable repository hooks and run the full validation suite:

```sh
git config core.hooksPath .githooks
pnpm validate
```

Other scripts:

```sh
pnpm notices        # Regenerate ThirdPartyNotices.txt
pnpm release:check  # Verify package.json version matches CHANGELOG.md
```

## Validation Gates

| Gate | Implementation | Purpose |
| :--- | :--- | :--- |
| `lint` | `node tools/lint.mjs` | `oxlint --deny-warnings` plus JSDoc, import-extension, and cast rules |
| `typecheck` | `node tools/typecheck.mjs` | `tsc --noEmit`, type-stripping, explicit signatures, strict `tsconfig.json` lock |
| `unit tests` | `node --test tests/unit.test.ts` | Fast unit test execution |
| `integration and architecture tests` | `node --test tests/architecture.test.ts tests/security.test.ts` | Boundary and security tripwires |
| `cooldown` | `pnpm-workspace.yaml` (`minimumReleaseAge: 4320`) | 3-day package release cooldown |
| `hygiene` | `tools/validate.mjs` | 500-line limit, anti-leak, markdown hygiene |
| `notices` | `tools/third-party-notices.mjs` | License inventory parity |
| `release` | `tools/release-plan.mjs` | SemVer and `CHANGELOG.md` consistency |

## Branching & Release Workflow

- **`dev`**: Active integration branch protected against deletion. Every push updates the rolling `dev` tag, `dev-<short_sha>` tag, and `dev` pre-release snapshot.
- **`main`**: Protected release branch. Accepts rebase-only pull requests from `dev` after all status checks pass. Merging triggers automatic `vX.Y.Z` tagging, GitHub Release creation, and `dev` fast-forward sync.

## Template Customization (CHANGE ME)

When bootstrapping a new repository from this template, update the following placeholders:

- **`README.md`**: Replace `# Project Template (CHANGE ME)` with your project title and description.
- **`LICENSE` and `NOTICE`**: Replace `Copyright (c) 2026 CHANGE_ME` with your copyright holder.
- **`.github/CODEOWNERS`**: Uncomment and set your GitHub handle or team (`* @your-handle`, CHANGE ME).
- **Package Manifest**: Update `"name"` in `package.json` (`CHANGE ME`).
- **Git Identity**: Configure `git config user.name` and a GitHub noreply address (`<id>+<handle>@users.noreply.github.com`) locally before committing.

## License

Licensed under the [Apache-2.0 License](LICENSE). Copyright (c) 2026 CHANGE_ME.
