import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const ROOT = process.cwd();

test("architecture: workspace enforces three-day pnpm cooldown", () => {
  const ws = readFileSync(join(ROOT, "pnpm-workspace.yaml"), "utf8");
  assert.ok(ws.includes("minimumReleaseAge: 4320"));
});

test("architecture: forbids prettier and npm lockfiles", () => {
  for (const forbidden of ["package-lock.json", ".prettierrc"]) {
    assert.throws(() => readFileSync(join(ROOT, forbidden), "utf8"));
  }
});

test("architecture: enforces layered modular layer boundaries", () => {
  const mathDir = join(ROOT, "src", "modules", "math");
  const entity = readFileSync(join(mathDir, "entity.ts"), "utf8");
  const dto = readFileSync(join(mathDir, "dto.ts"), "utf8");
  const repo = readFileSync(join(mathDir, "repository.ts"), "utf8");
  const service = readFileSync(join(mathDir, "service.ts"), "utf8");
  const controller = readFileSync(join(mathDir, "controller.ts"), "utf8");

  for (const forbidden of ["service", "controller", "repository"]) {
    assert.ok(!entity.includes(forbidden), `entity.ts leaked ${forbidden}`);
    assert.ok(!dto.includes(forbidden), `dto.ts leaked ${forbidden}`);
  }
  assert.ok(!repo.includes("service") && !repo.includes("controller"));
  assert.ok(!service.includes("controller"));
  assert.ok(!controller.includes("repository"));
});
