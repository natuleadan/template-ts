# Security Policy

## Supply-Chain & Hygiene Controls

This template enforces automated defense-in-depth across local hooks and GitHub Actions:

1. **Three-Day Dependency Cooldown**: `minimumReleaseAge: 4320` in `pnpm-workspace.yaml` and `.github/dependabot.yml` (`cooldown: default-days: 3`) prevent immediate adoption of newly published or compromised package versions.
2. **Static Analysis (CodeQL)**: `.github/workflows/security.yml` runs GitHub CodeQL analysis for JavaScript/TypeScript on every push, pull request, and weekly schedule.
3. **Dependency Audit & SBOM**: `pnpm audit` and dependency inventories are exported as CI build artifacts on every security run.
4. **Anti-Leak Hygiene Gate**: `tools/validate.mjs` blocks hardcoded user paths, restricted tokens, and oversized files before code can be pushed.

## Reporting a Vulnerability

Please report suspected security issues privately using GitHub Security Advisories for this repository rather than opening public issues.
