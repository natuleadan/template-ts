import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const read = (...parts: string[]): string => readFileSync(join(ROOT, ...parts), "utf8");
const isErrorRule = (value: unknown): boolean =>
  value === "error" || (Array.isArray(value) && value[0] === "error");

test("architecture: workspace enforces three-day pnpm cooldown", () => {
  assert.ok(read("pnpm-workspace.yaml").includes("minimumReleaseAge: 4320"));
});

test("architecture: forbids formatters, npm lockfiles, and unpinned analyzers", () => {
  const forbiddenFiles = [
    "package-lock.json",
    ".prettierrc",
    ".prettierrc.json",
    "prettier.config.mjs",
    "biome.json",
    "biome.jsonc",
    ".oxfmtrc.json",
  ];
  for (const file of forbiddenFiles) {
    assert.ok(!existsSync(join(ROOT, file)), `forbidden artifact '${file}'`);
  }

  const pkg = JSON.parse(read("package.json"));
  const dev = pkg.devDependencies ?? {};
  for (const name of ["typescript", "oxlint", "@types/node"]) {
    assert.ok(typeof dev[name] === "string", `devDependency '${name}' must exist`);
    assert.ok(/^\d+\.\d+\.\d+$/u.test(dev[name]), `devDependency '${name}' must be an exact pin`);
  }
  const all = { ...pkg.dependencies, ...dev };
  for (const name of ["prettier", "@biomejs/biome", "oxfmt", "husky", "lint-staged"]) {
    assert.ok(!(name in all), `forbidden dependency '${name}'`);
  }
});

test("architecture: locks strict tsconfig policy", () => {
  const opts = JSON.parse(read("tsconfig.json")).compilerOptions;
  assert.ok(opts && typeof opts === "object");
  const trueFlags = [
    "noEmit",
    "strict",
    "noUncheckedIndexedAccess",
    "exactOptionalPropertyTypes",
    "noImplicitOverride",
    "noImplicitReturns",
    "noFallthroughCasesInSwitch",
    "noUnusedLocals",
    "noUnusedParameters",
    "noPropertyAccessFromIndexSignature",
    "noUncheckedSideEffectImports",
    "useUnknownInCatchVariables",
    "verbatimModuleSyntax",
    "erasableSyntaxOnly",
    "allowImportingTsExtensions",
    "forceConsistentCasingInFileNames",
    "isolatedModules",
  ];
  for (const flag of trueFlags) {
    assert.equal(opts[flag], true, `tsconfig compilerOptions.${flag} must remain true`);
  }
  assert.equal(opts.allowUnreachableCode, false);
  assert.equal(opts.allowUnusedLabels, false);
  assert.ok(Array.isArray(opts.types) && opts.types.includes("node"));
});

test("architecture: locks immutable oxlint policy", () => {
  const cfg = JSON.parse(read(".oxlintrc.json"));
  assert.equal(cfg.categories.correctness, "error");
  assert.equal(cfg.categories.suspicious, "error");
  assert.equal(cfg.categories.pedantic, "warn");
  assert.equal(cfg.categories.perf, "warn");
  assert.equal(cfg.categories.style, "off");
  for (const plugin of ["eslint", "typescript", "oxc", "unicorn", "import", "node", "promise"]) {
    assert.ok(cfg.plugins.includes(plugin), `oxlint plugin '${plugin}' must stay enabled`);
  }

  const requiredErrors = [
    "eslint/eqeqeq",
    "eslint/max-lines",
    "eslint/no-console",
    "eslint/no-debugger",
    "eslint/no-eval",
    "eslint/no-new-func",
    "eslint/no-restricted-globals",
    "eslint/no-restricted-properties",
    "eslint/no-throw-literal",
    "eslint/no-var",
    "eslint/no-warning-comments",
    "import/no-cycle",
    "import/no-default-export",
    "oxc/no-const-enum",
    "typescript/ban-ts-comment",
    "typescript/consistent-type-imports",
    "typescript/explicit-function-return-type",
    "typescript/no-explicit-any",
    "typescript/no-namespace",
    "typescript/no-non-null-asserted-optional-chain",
    "typescript/no-non-null-assertion",
  ];
  for (const rule of requiredErrors) {
    assert.ok(isErrorRule(cfg.rules[rule]), `oxlint rule '${rule}' must stay at error`);
  }
  const banTs = cfg.rules["typescript/ban-ts-comment"][1];
  assert.equal(banTs["ts-ignore"], true);
  assert.equal(banTs["ts-nocheck"], true);
  assert.equal(banTs["ts-expect-error"], "allow-with-description");
  assert.ok(banTs.minimumDescriptionLength >= 10);
});

test("architecture: locks lint and typecheck runners", () => {
  const lint = read("tools", "lint.mjs");
  for (const token of [
    "oxlint",
    "--config",
    ".oxlintrc.json",
    "--deny-warnings",
    "as unknown as",
    "enum ",
    ": boolean",
    "hasPrecedingJsdoc",
    "explicit file extension",
  ]) {
    assert.ok(lint.includes(token), `tools/lint.mjs missing immutable rule: ${token}`);
  }
  const typecheck = read("tools", "typecheck.mjs");
  for (const token of [
    "typescript",
    "tsc",
    "--noEmit",
    "tsconfig.json",
    "stripTypeScriptTypes",
    "noPropertyAccessFromIndexSignature",
    "noUncheckedSideEffectImports",
    "allowUnreachableCode",
    "allowUnusedLabels",
  ]) {
    assert.ok(typecheck.includes(token), `tools/typecheck.mjs missing immutable rule: ${token}`);
  }
});

test("architecture: enforces layered modular layer boundaries", () => {
  const dir = ["src", "modules", "math"];
  const entity = read(...dir, "entity.ts");
  const dto = read(...dir, "dto.ts");
  const repo = read(...dir, "repository.ts");
  const service = read(...dir, "service.ts");
  const controller = read(...dir, "controller.ts");

  for (const forbidden of ["service", "controller", "repository"]) {
    assert.ok(!entity.includes(forbidden), `entity.ts leaked ${forbidden}`);
    assert.ok(!dto.includes(forbidden), `dto.ts leaked ${forbidden}`);
  }
  assert.ok(!repo.includes("service") && !repo.includes("controller"));
  assert.ok(!service.includes("controller"));
  assert.ok(!controller.includes("repository"));
});
