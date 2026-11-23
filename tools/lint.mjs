#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".astro", ".turbo"]);
const SRC_RULES = [
  { pattern: /\bas\s+unknown\s+as\b/u, reason: "double cast escape hatch (as unknown as)" },
  { pattern: /\benum\s+/u, reason: "non-erasable enum declaration (enum )" },
];
const BOOLEAN_PARAM = /\(.*:\s*boolean\b/u;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(name)) walk(full, out);
    } else if (/\.(ts|tsx|mjs|js|astro)$/u.test(name)) {
      out.push(full);
    }
  }
  return out;
}

function maskCommentsAndStrings(source) {
  const chars = [...source];
  const n = chars.length;
  const out = chars.slice();
  let i = 0;
  const blank = (k) => {
    if (chars[k] !== "\n") out[k] = " ";
  };
  while (i < n) {
    const ch = chars[i];
    const next = chars[i + 1];
    if (ch === "/" && next === "/") {
      while (i < n && chars[i] !== "\n") blank(i++);
    } else if (ch === "/" && next === "*") {
      blank(i++);
      blank(i++);
      while (i < n && !(chars[i] === "*" && chars[i + 1] === "/")) blank(i++);
      if (i < n) {
        blank(i++);
        blank(i++);
      }
    } else if (ch === '"' || ch === "'" || ch === "`") {
      blank(i++);
      while (i < n && chars[i] !== ch) {
        if (chars[i] === "\\" && i + 1 < n) blank(i++);
        blank(i++);
      }
      if (i < n) blank(i++);
    } else {
      i++;
    }
  }
  return out.join("");
}

function hasPrecedingJsdoc(lines, idx) {
  let j = idx - 1;
  while (j >= 0 && lines[j].trim() === "") j--;
  if (j < 0 || !lines[j].trimEnd().endsWith("*/")) return false;
  for (; j >= 0; j--) {
    const trimmed = lines[j].trimStart();
    if (trimmed.startsWith("/**")) return true;
    if (trimmed.startsWith("/*")) return false;
  }
  return false;
}

function lintSrcFile(rel, content, errors) {
  const lines = content.split("\n");
  const codeLines = maskCommentsAndStrings(content).split("\n");
  lines.forEach((rawLine, idx) => {
    const lineNo = idx + 1;
    const marker = rawLine.indexOf("@ts-expect-error");
    if (marker !== -1) {
      const rest = rawLine.slice(marker + "@ts-expect-error".length).trim();
      if (!rest.startsWith(":") || rest.slice(1).trim().length < 10) {
        errors.push(`${rel}:${lineNo} @ts-expect-error requires ': <reason>' (>= 10 chars)`);
      }
    }
    const codeLine = codeLines[idx] ?? "";
    for (const rule of SRC_RULES) {
      if (rule.pattern.test(codeLine)) errors.push(`${rel}:${lineNo} ${rule.reason}`);
    }
    if (BOOLEAN_PARAM.test(codeLine)) {
      errors.push(`${rel}:${lineNo} boolean parameter (: boolean); use options or unions`);
    }
    const exported = /^\s*export\s+(?:async\s+)?(?:function|class|interface|type\s+\w+\s*=)/u;
    if (exported.test(rawLine) && !hasPrecedingJsdoc(lines, idx)) {
      errors.push(`${rel}:${lineNo} exported declaration missing JSDoc comment`);
    }
  });
}

function runOxlint(errors) {
  const bin = join(ROOT, "node_modules", "oxlint", "bin", "oxlint");
  if (!existsSync(bin)) {
    errors.push("oxlint is not installed; run pnpm install");
    return;
  }
  const args = [bin, "--config", ".oxlintrc.json", "--deny-warnings", "src", "tests", "tools"];
  const res = spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8" });
  if (res.status !== 0) {
    const out = `${res.stdout}\n${res.stderr}`.trim();
    errors.push(...(out ? out.split("\n") : ["oxlint failed"]));
  }
}

const errors = [];
runOxlint(errors);

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
for (const [dep, ver] of Object.entries(allDeps)) {
  if (ver === "latest" || ver === "*") {
    errors.push(`package.json: dependency '${dep}' uses unpinned version '${ver}'`);
  }
}

for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file);
  const content = readFileSync(file, "utf8");
  if (rel.startsWith("src/")) lintSrcFile(rel, content, errors);
  if (/\.(ts|mjs)$/u.test(rel)) {
    for (const m of content.matchAll(/from\s+["'](\.[^"']+)["']/gu)) {
      if (!/\.(ts|mjs|js|json)$/u.test(m[1])) {
        errors.push(`${rel}: relative import '${m[1]}' must include an explicit file extension`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error("FAIL lint");
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log("PASS lint");
