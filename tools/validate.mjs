#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const MAX_LINES = 500;
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".astro", ".turbo"]);
const CHECK_EXT = /\.(ts|tsx|mjs|js|astro|md|yml|yaml|json)$/;
const FORBIDDEN_FILES = [
  "package-lock.json",
  ".prettierrc",
  ".prettierrc.json",
  "prettier.config.mjs",
  "biome.json",
  "biome.jsonc",
  ".oxfmtrc.json",
];

function run(name, cmd, args) {
  const res = spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8" });
  if (res.status === 0) {
    console.log(`PASS ${name}`);
    return true;
  }
  console.log(`FAIL ${name}`);
  const out = `${res.stdout ?? ""}\n${res.stderr ?? ""}`.trim();
  if (out) console.log(out);
  return false;
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(name)) walk(full, out);
    } else if (CHECK_EXT.test(name)) {
      out.push(full);
    }
  }
  return out;
}

function checkHygiene() {
  const errors = [];
  for (const f of FORBIDDEN_FILES) {
    if (existsSync(join(ROOT, f))) {
      errors.push(`forbidden artifact '${f}' present`);
    }
  }
  const ws = join(ROOT, "pnpm-workspace.yaml");
  try {
    if (!readFileSync(ws, "utf8").includes("minimumReleaseAge: 4320")) {
      errors.push("pnpm-workspace.yaml missing minimumReleaseAge: 4320");
    }
  } catch {
    errors.push("pnpm-workspace.yaml missing minimumReleaseAge: 4320");
  }
  for (const file of walk(ROOT)) {
    const rel = relative(ROOT, file);
    const content = readFileSync(file, "utf8");
    const lines = content.split("\n");
    if (rel !== "pnpm-lock.yaml" && lines.length > MAX_LINES) {
      errors.push(`${rel} has ${lines.length} lines (max ${MAX_LINES})`);
    }
    if (rel !== "tools/validate.mjs" && content.includes("/Users/")) {
      errors.push(`${rel} contains hardcoded '/Users/' path`);
    }
    if (rel.endsWith(".md")) {
      let inCode = false;
      lines.forEach((line, i) => {
        if (line.trimStart().startsWith("```")) {
          inCode = !inCode;
          return;
        }
        if (inCode || line.startsWith("- ") || line.startsWith("|")) return;
        if (line.replace(/2023 - Present/g, "2023PRESENT").includes(" - ")) {
          errors.push(`${rel}:${i + 1} contains spaced hyphen ' - ' in prose`);
        }
      });
    }
  }
  if (errors.length === 0) {
    console.log("PASS hygiene");
    return true;
  }
  console.log("FAIL hygiene");
  for (const e of errors) console.log(`  ${e}`);
  return false;
}

function checkCooldown() {
  const ws = join(ROOT, "pnpm-workspace.yaml");
  try {
    if (readFileSync(ws, "utf8").includes("minimumReleaseAge: 4320")) {
      console.log("PASS cooldown");
      return true;
    }
  } catch {
    // handled below
  }
  console.log("FAIL cooldown: pnpm-workspace.yaml missing minimumReleaseAge: 4320");
  return false;
}

const results = [
  run("lint", "node", ["tools/lint.mjs"]),
  run("typecheck", "node", ["tools/typecheck.mjs"]),
  run("unit tests", "node", ["--test", "tests/unit.test.ts"]),
  run("integration and architecture tests", "node", [
    "--test",
    "tests/architecture.test.ts",
    "tests/security.test.ts",
  ]),
  checkCooldown() && run("build", "node", ["tools/build.mjs"]),
  checkHygiene(),
  run("notices", "node", ["tools/third-party-notices.mjs", "--check"]),
  run("release", "node", ["tools/release-plan.mjs", "--check"]),
];

const passed = results.filter(Boolean).length;
const failed = results.length - passed;
console.log(`TOTAL PASS=${passed} FAIL=${failed}`);
process.exit(failed === 0 ? 0 : 1);
