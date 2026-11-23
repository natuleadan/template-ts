#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".astro", ".turbo"]);
const FORBIDDEN_TOKENS = [
  { token: "debugger", reason: "debugger statement" },
  { token: "eval(", reason: "unsafe eval()" },
  { token: "@ts-ignore", reason: "suppressed type check" },
  { token: ": any", reason: "explicit any type" },
  { token: "document.cookie", reason: "cookie access forbidden" },
  { token: "localStorage", reason: "localStorage forbidden" },
  { token: "sessionStorage", reason: "sessionStorage forbidden" },
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(name)) walk(full, out);
    } else if (/\.(ts|tsx|mjs|js|astro)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

const errors = [];
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const allDeps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
for (const [dep, ver] of Object.entries(allDeps)) {
  if (ver === "latest" || ver === "*") {
    errors.push(`package.json: dependency '${dep}' uses unpinned version '${ver}'`);
  }
}

for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file);
  const content = readFileSync(file, "utf8");
  const lines = content.split("\n");
  if (rel !== "tools/lint.mjs" && !rel.startsWith("tests/")) {
    lines.forEach((line, idx) => {
      for (const rule of FORBIDDEN_TOKENS) {
        if (line.includes(rule.token)) {
          errors.push(`${rel}:${idx + 1} ${rule.reason} ('${rule.token}')`);
        }
      }
    });
  }
  if (/\.(ts|mjs)$/.test(rel)) {
    const importMatches = content.matchAll(/from\s+["'](\.[^"']+)["']/g);
    for (const m of importMatches) {
      if (!/\.(ts|mjs|js|json)$/.test(m[1])) {
        errors.push(`${rel}: relative import '${m[1]}' must include explicit file extension`);
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
