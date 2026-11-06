import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { readP3, assessPixels, PixelFault } from "../src/p3-diff.mjs";
const base = readFileSync(new URL("../examples/original.ppm", import.meta.url), "utf8");
const candidate = readFileSync(new URL("../examples/modified.ppm", import.meta.url), "utf8");
const cli = (...args) => spawnSync(process.execPath, ["bin/check.mjs", ...args], {
  encoding: "utf8", cwd: new URL("../", import.meta.url), timeout: 5000
});

test("identical samples pass without differences", () => {
  assert.deepEqual(assessPixels(base, base), {
    verdict: "PASS", reason: "IDENTICAL_WITHIN_TOLERANCE", differentPixels: 0,
    totalPixels: 4, percentage: 0, rectangle: null
  });
});

test("one synthetic change produces 25 percent difference and exact rectangle", () => {
  const result = assessPixels(base, candidate);
  assert.equal(result.verdict, "REVIEW");
  assert.equal(result.differentPixels, 1);
  assert.equal(result.percentage, 25);
  assert.deepEqual(result.rectangle, { x1: 1, y1: 1, x2: 1, y2: 1 });
  assert.equal(assessPixels(base, candidate, { tolerance: 12 }).verdict, "PASS");
  assert.equal(assessPixels(base, candidate, { allowedPercentage: 25 }).verdict, "PASS");
  assert.equal(assessPixels(base, candidate, { tolerance: 11 }).verdict, "REVIEW");
});

test("dimension mismatch is blocked rather than accepted", () => {
  const smaller = "P3\n1 1\n255\n0 0 0\n";
  assert.deepEqual(assessPixels(base, smaller), {
    verdict: "BLOCKED", reason: "SIZE_CHANGED", differentPixels: null
  });
});

test("invalid P3 and hostile numeric inputs fail closed", () => {
  for (const text of [
    "P6\n1 1\n255\n0 0 0\n", "P3\n1 1\n255\n0 0\n",
    "P3\n1 1\n255\n256 0 0\n", "P3\n129 1\n255\n0 0 0\n",
    "P3\n1 1\n255\nNaN 0 0\n", "P3\n1 1\n255\n1e9 0 0\n"
  ]) assert.throws(() => readP3(text), PixelFault);
  for (const settings of [
    { tolerance: -1 }, { tolerance: 1.5 }, { allowedPercentage: Infinity },
    { allowedPercentage: 101 }, { allowedPercentage: -0.1 }
  ]) assert.throws(() => assessPixels(base, candidate, settings), PixelFault);
});

test("CLI exits 0 for match, 1 for review, 2 for invalid or blocked", () => {
  const unchanged = cli("examples/original.ppm", "examples/original.ppm");
  assert.equal(unchanged.status, 0, unchanged.stderr);
  const different = cli("examples/original.ppm", "examples/modified.ppm");
  assert.equal(different.status, 1, different.stderr);
  assert.equal(JSON.parse(different.stdout).differentPixels, 1);
  assert.equal(cli("examples/original.ppm", "examples/modified.ppm", "12").status, 0);
  assert.equal(cli("missing.ppm", "examples/modified.ppm").status, 2);
  assert.equal(cli().status, 2);
});

const multiple = readFileSync(new URL("../examples/multiple-changes.ppm", import.meta.url), "utf8");

test("two synthetic changes produce a bounding rectangle spanning both corners", () => {
  const result = assessPixels(base, multiple);
  assert.equal(result.verdict, "REVIEW");
  assert.equal(result.differentPixels, 2);
  assert.equal(result.percentage, 50);
  assert.deepEqual(result.rectangle, { x1: 0, y1: 0, x2: 1, y2: 1 });
  assert.equal(assessPixels(base, multiple, { allowedPercentage: 25 }).verdict, "REVIEW");
});

test("per-pixel channel tolerance differs from allowed changed-pixel percentage", () => {
  const tolerance13 = assessPixels(base, multiple, { tolerance: 13 });
  assert.equal(tolerance13.differentPixels, 1);
  assert.equal(tolerance13.percentage, 25);
  assert.deepEqual(tolerance13.rectangle, { x1: 1, y1: 1, x2: 1, y2: 1 });
  assert.equal(tolerance13.verdict, "REVIEW");
  assert.equal(assessPixels(base, multiple, { tolerance: 13, allowedPercentage: 25 }).verdict, "PASS");
  assert.equal(assessPixels(base, multiple, { tolerance: 20 }).verdict, "PASS");
  assert.equal(cli("examples/original.ppm", "examples/multiple-changes.ppm").status, 1);
  assert.equal(cli("examples/original.ppm", "examples/multiple-changes.ppm", "13", "25").status, 0);
});

test("malformed and oversized local files never disclose input contents", () => {
  const folder = mkdtempSync(join(tmpdir(), "oss-p3-negative-"));
  try {
    const malformed = join(folder, "bad.ppm");
    const oversized = join(folder, "large.ppm");
    const alias = join(folder, "alias.ppm");
    const marker = "VERY_PRIVATE_TEST_SENTINEL_SHOULD_NOT_PRINT";
    writeFileSync(malformed, "P3\\n1 1\\n255\\n" + marker + "\\n");
    writeFileSync(oversized, marker + "X".repeat(300_001));
    symlinkSync(oversized, alias);
    for (const file of [malformed, oversized, alias]) {
      const response = cli("examples/original.ppm", file);
      assert.equal(response.status, 2, response.stderr);
      assert.equal(response.stdout, "");
      assert.doesNotMatch(response.stderr, /VERY_PRIVATE_TEST_SENTINEL_SHOULD_NOT_PRINT/);
    }
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});
