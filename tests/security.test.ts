import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("security: privacy and anti-leak", () => {
  it("contains no cookie or storage calls in src", () => {
    const src = readFileSync("src/index.ts", "utf8");
    assert.equal(src.includes("document.cookie"), false);
    assert.equal(src.includes("localStorage"), false);
    assert.equal(src.includes("sessionStorage"), false);
  });
});
