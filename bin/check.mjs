#!/usr/bin/env node
import { lstatSync, readFileSync } from "node:fs";
import { assessPixels, PixelFault } from "../src/p3-diff.mjs";
const help = "Usage: node bin/check.mjs <baseline.ppm> <candidate.ppm> [tolerance=0] [allowedPercentage=0]";
function load(path) {
  let value;
  try {
    const meta = lstatSync(path);
    if (!meta.isFile() || meta.isSymbolicLink() || meta.size > 300_000)
      throw new PixelFault("Expected a regular P3 file at most 300 KB");
    value = readFileSync(path, "utf8");
  } catch (error) {
    if (error instanceof PixelFault) throw error;
    throw new PixelFault("Cannot read a local fixture file");
  }
  return value;
}
const args = process.argv.slice(2);
if (args.length < 2 || args.length > 4 || args.some(x => !x)) {
  process.stderr.write(help + "\n");
  process.exitCode = 2;
} else {
  try {
    const tolerance = args[2] === undefined ? 0 : Number(args[2]);
    const allowedPercentage = args[3] === undefined ? 0 : Number(args[3]);
    const verdict = assessPixels(load(args[0]), load(args[1]), { tolerance, allowedPercentage });
    process.stdout.write(JSON.stringify(verdict, null, 2) + "\n");
    process.exitCode = verdict.verdict === "PASS" ? 0 : verdict.verdict === "REVIEW" ? 1 : 2;
  } catch (error) {
    process.stderr.write(error instanceof PixelFault ? error.message + "\n" : "Comparison failed\n");
    process.exitCode = 2;
  }
}
