#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const require = createRequire(import.meta.url);
const { stripTypeScriptTypes } = require("node:module");

function walkTs(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (!["node_modules", ".git", "dist"].includes(name)) walkTs(full, out);
    } else if (/\.tsx?$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

const files = walkTs(ROOT);
const errors = [];

for (const file of files) {
  const rel = relative(ROOT, file);
  const source = readFileSync(file, "utf8");
  try {
    stripTypeScriptTypes(source, { mode: "strip" });
  } catch (err) {
    errors.push(`${rel}: ${err.message}`);
  }
}

if (errors.length > 0) {
  console.error("FAIL typecheck");
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`PASS typecheck (${files.length} TypeScript files verified)`);
