import assert from "node:assert/strict";
import test from "node:test";
import { createMathModule, greet } from "../src/index.ts";

test("unit: greet formats greeting cleanly", () => {
  assert.equal(greet("Template"), "Hello, Template");
});

test("unit: math module adds operands and tracks history", () => {
  const mod = createMathModule();
  const res = mod.controller.handleAdd(15, 27);
  assert.equal(res.sum, 42);
  assert.equal(res.historyCount, 1);
  assert.throws(() => mod.controller.handleAdd(2_000_000_000, 1));
});
