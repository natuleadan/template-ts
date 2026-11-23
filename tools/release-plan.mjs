#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const pkgPath = join(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const changelogPath = join(root, "CHANGELOG.md");
let changelog = "# Changelog\n\n";
try {
  changelog = readFileSync(changelogPath, "utf8");
} catch {
  changelog = "# Changelog\n\n";
}

function lastTag() {
  try {
    return execFileSync("git", ["describe", "--tags", "--abbrev=0", "--match", "v[0-9]*"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

const tag = lastTag();
const range = tag ? `${tag}..HEAD` : "HEAD";
let commits = [];
try {
  commits = execFileSync("git", ["log", range, "--format=%s"], {
    cwd: root,
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
} catch {
  commits = [];
}

const notesIdx = process.argv.indexOf("--notes");
if (notesIdx !== -1) {
  const outPath = process.argv[notesIdx + 1];
  if (!outPath) process.exit(1);
  const parts = [`# Release v${pkg.version}\n`];
  for (const kind of ["feat", "fix", "perf", "refactor", "docs", "ci", "chore", "upgrade"]) {
    const items = commits.filter((c) => c.startsWith(`${kind}(`));
    if (items.length > 0) {
      parts.push(`## ${kind}\n`);
      for (const item of items) parts.push(`- ${item}`);
      parts.push("");
    }
  }
  writeFileSync(outPath, `${parts.join("\n")}\n`);
  console.log(`PASS release: wrote notes to ${outPath}`);
  process.exit(0);
}

let expected = pkg.version;
if (tag) {
  const base = tag.replace(/^v/, "");
  const [maj, min, pat] = base.split(".").map(Number);
  if (commits.some((s) => s.startsWith("upgrade(") || s.includes("!:"))) {
    expected = `${maj + 1}.0.0`;
  } else if (commits.some((s) => s.startsWith("feat("))) {
    expected = `${maj}.${min + 1}.0`;
  } else if (commits.some((s) => s.startsWith("fix(") || s.startsWith("perf(") || s.startsWith("revert("))) {
    expected = `${maj}.${min}.${pat + 1}`;
  } else {
    expected = base;
  }
}

if (process.argv.includes("--apply") && expected !== pkg.version) {
  pkg.version = expected;
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  if (!changelog.includes(`## ${expected}`)) {
    const bullets = commits.filter((c) => !c.startsWith("Merge ")).map((c) => `- ${c}`).join("\n");
    const entry = `## ${expected}\n\n${bullets || "- Automated release preparation."}\n\n`;
    const body = changelog.replace(/^# Changelog\s*\n+/, "");
    writeFileSync(changelogPath, `# Changelog\n\n${entry}${body}`);
  }
  console.log(`PASS release: prepared ${expected}`);
  process.exit(0);
}

if (process.argv.includes("--check")) {
  if (pkg.version !== expected) {
    console.error(`FAIL release: package.json ${pkg.version} != expected ${expected}`);
    process.exit(1);
  }
  if (!changelog.includes(`## ${pkg.version}`)) {
    console.error(`FAIL release: CHANGELOG.md missing '## ${pkg.version}'`);
    process.exit(1);
  }
  console.log(`PASS release (${pkg.version})`);
  process.exit(0);
}

console.log(`PASS release: current=${pkg.version} expected=${expected}`);
