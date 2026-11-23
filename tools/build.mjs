#!/usr/bin/env node
import { mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");
mkdirSync(dist, { recursive: true });
copyFileSync(join(root, "src/index.ts"), join(dist, "index.ts"));
console.log("PASS build");
