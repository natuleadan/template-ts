#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const require = createRequire(import.meta.url);
const { stripTypeScriptTypes } = require("node:module");

const TRUE_FLAGS = [
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
const FALSE_FLAGS = ["allowUnreachableCode", "allowUnusedLabels"];

function walkTs(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (!["node_modules", ".git", "dist"].includes(name)) walkTs(full, out);
    } else if (/\.tsx?$/u.test(name)) {
      out.push(full);
    }
  }
  return out;
}

function checkTsconfig(errors) {
  const path = join(ROOT, "tsconfig.json");
  if (!existsSync(path)) {
    errors.push("tsconfig.json is missing");
    return;
  }
  const opts = JSON.parse(readFileSync(path, "utf8")).compilerOptions ?? {};
  for (const flag of TRUE_FLAGS) {
    if (opts[flag] !== true) errors.push(`tsconfig.json compilerOptions.${flag} must be true`);
  }
  for (const flag of FALSE_FLAGS) {
    if (opts[flag] !== false) errors.push(`tsconfig.json compilerOptions.${flag} must be false`);
  }
  if (!Array.isArray(opts.types) || !opts.types.includes("node")) {
    errors.push("tsconfig.json compilerOptions.types must include 'node'");
  }
}

function runTsc(errors) {
  const bin = join(ROOT, "node_modules", "typescript", "bin", "tsc");
  if (!existsSync(bin)) {
    errors.push("typescript is not installed; run pnpm install");
    return;
  }
  const args = [bin, "--noEmit", "--pretty", "false", "--project", "tsconfig.json"];
  const res = spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8" });
  if (res.status !== 0) {
    const out = `${res.stdout}\n${res.stderr}`.trim();
    errors.push(...(out ? out.split("\n") : ["tsc --noEmit failed"]));
  }
}

function checkExportedSignatures(rel, source, errors) {
  const exportFn = /^\s*export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*([^{;]*)/gmu;
  for (const [, name, params, ret] of source.matchAll(exportFn)) {
    if (!ret.trim().startsWith(":")) {
      errors.push(`${rel}: exported function '${name}' missing explicit return type annotation`);
    }
    const untyped = params
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p && !p.includes(":"));
    for (const param of untyped) {
      errors.push(`${rel}: parameter '${param}' in '${name}' missing type annotation`);
    }
  }
}

const errors = [];
checkTsconfig(errors);
runTsc(errors);

const files = walkTs(ROOT);
for (const file of files) {
  const rel = relative(ROOT, file);
  const source = readFileSync(file, "utf8");
  try {
    stripTypeScriptTypes(source, { mode: "strip" });
  } catch (err) {
    errors.push(`${rel}: ${err.message}`);
  }
  if (rel.startsWith("src/")) checkExportedSignatures(rel, source, errors);
}

if (errors.length > 0) {
  console.error("FAIL typecheck");
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`PASS typecheck (${files.length} TypeScript files verified)`);
