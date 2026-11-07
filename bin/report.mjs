#!/usr/bin/env node
import { lstatSync, readFileSync, writeFileSync } from 'node:fs';
import { PixelFault } from '../src/p3-diff.mjs';
import { renderPixelReport } from '../src/report.mjs';

const usage = 'Usage: node bin/report.mjs <baseline.ppm> <candidate.ppm> <new-report.html> [tolerance=0] [allowedPercentage=0]';
function readLocal(path) {
  try {
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 300_000)
      throw new PixelFault('Input must be a regular local P3 file at most 300 KB');
    return readFileSync(path, 'utf8');
  } catch (error) {
    if (error instanceof PixelFault) throw error;
    throw new PixelFault('Cannot read a local fixture');
  }
}
const args = process.argv.slice(2);
if (args.length < 3 || args.length > 5 || args.some(x => !x)) {
  process.stderr.write(usage + '\n');
  process.exitCode = 2;
} else {
  try {
    if (!args[2].endsWith('.html')) throw new PixelFault('Output must end in .html');
    const tolerance = args[3] === undefined ? 0 : Number(args[3]);
    const allowedPercentage = args[4] === undefined ? 0 : Number(args[4]);
    const {result, html} = renderPixelReport(readLocal(args[0]), readLocal(args[1]), {tolerance, allowedPercentage});
    writeFileSync(args[2], html, {flag:'wx', encoding:'utf8', mode:0o600});
    process.stdout.write(JSON.stringify({verdict:result.verdict, differentPixels:result.differentPixels, report:args[2]}) + '\n');
    process.exitCode = result.verdict === 'PASS' ? 0 : 1;
  } catch (error) {
    process.stderr.write(error instanceof PixelFault ? error.message + '\n' : 'Cannot write new HTML report\n');
    process.exitCode = 2;
  }
}
