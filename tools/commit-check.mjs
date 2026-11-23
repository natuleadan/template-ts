#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const TYPES = new Set([
  "feat", "fix", "upgrade", "docs", "style", "refactor", "perf", "test", "chore", "ci", "revert",
]);
const SCOPES = new Set([
  "core", "api", "cli", "domain", "math", "tools", "ui", "config", "docs", "ci", "workflow", "hooks", "release", "license", "deps", "security",
]);
// CHANGE ME: optionally pin your organization noreply email domain or handle.
const NOREPLY_SUFFIX = "@users.noreply.github.com";

function fail(msg) {
  console.error(`FAIL commit-check: ${msg}`);
  process.exit(1);
}

function validateMessage(raw) {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  const header = lines[0] ?? "";
  if (!header) fail("empty commit message");
  if (header.startsWith("Merge ") || header.startsWith("Revert ") || raw.includes("dependabot[bot]")) return;
  if (header.length > 100) fail(`header exceeds 100 chars (${header.length})`);
  if (header.endsWith(".")) fail("header must not end with a period");

  const match = /^([a-z]+)\(([a-z0-9-]+)\): (.+)$/.exec(header);
  if (!match) fail(`header must match type(scope): description -> ${header}`);
  const [, type, scope, desc] = match;
  if (!TYPES.has(type)) fail(`invalid commit type '${type}'`);
  if (!SCOPES.has(scope)) fail(`invalid commit scope '${scope}'`);

  const descWords = desc.trim().split(/\s+/).filter(Boolean).length;
  if (descWords < 3 || descWords > 6) {
    fail(`description has ${descWords} words (expected 3..6)`);
  }

  const lower = raw.toLowerCase();
  for (const forbidden of ["co-authored-by:", "signed-off-by:", "generated-by:", "assisted-by:"]) {
    if (lower.includes(forbidden)) fail(`forbidden trailer '${forbidden}' present`);
  }

  if (lines.length < 2 || lines[1] !== "") {
    fail("expected a single blank line after header");
  }
  const bodyLines = lines.slice(2).filter((line) => !line.startsWith("#"));
  if (bodyLines.some((line) => line === "")) {
    fail("body bullets must not contain blank lines");
  }
  if (bodyLines.length < 3) {
    fail(`body has ${bodyLines.length} bullets (minimum 3)`);
  }
  for (const line of bodyLines) {
    const bmatch = /^- \*\*[^*]+\*\*: (\S.*)$/.exec(line);
    if (!bmatch) fail(`bullet must match '- **Label**: text' -> ${line}`);
    const words = bmatch[1].trim().split(/\s+/).filter(Boolean).length;
    if (words < 3 || words > 10) {
      fail(`bullet has ${words} words (expected 3..10): ${line}`);
    }
  }
}

const args = process.argv.slice(2);
const rangeIdx = args.indexOf("--range");
if (rangeIdx !== -1) {
  const range = args[rangeIdx + 1];
  if (!range) fail("missing range argument");
  const shas = execFileSync("git", ["rev-list", range], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
  for (const sha of shas) {
    const msg = execFileSync("git", ["log", "-1", "--format=%B", sha], { encoding: "utf8" });
    validateMessage(msg);
  }
  console.log("PASS commit-check");
  process.exit(0);
}

const file = args[0];
if (!file) fail("pass <msg-file> or --range <rev-range>");
const name = execFileSync("git", ["config", "user.name"], { encoding: "utf8" }).trim();
const email = execFileSync("git", ["config", "user.email"], { encoding: "utf8" }).trim();
if (!name) fail("git user.name must be configured");
if (!email.endsWith(NOREPLY_SUFFIX)) fail(`git user.email must end with '${NOREPLY_SUFFIX}', got '${email}'`);

validateMessage(readFileSync(file, "utf8"));
console.log("PASS commit-check");
