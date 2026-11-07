import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync, writeFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { renderPixelReport } from '../src/report.mjs';
import { PixelFault } from '../src/p3-diff.mjs';
const base = readFileSync(new URL('../examples/original.ppm', import.meta.url), 'utf8');
const current = readFileSync(new URL('../examples/modified.ppm', import.meta.url), 'utf8');
const run = (...args) => spawnSync(process.execPath, ['bin/report.mjs', ...args], {cwd:new URL('../',import.meta.url), encoding:'utf8', timeout:5000});

test('deterministic standalone report reveals actual pixel changes without raw input injection', () => {
  const a = renderPixelReport(base, current);
  const b = renderPixelReport(base, current);
  assert.deepEqual(a, b);
  assert.equal(a.result.verdict,'REVIEW');
  assert.match(a.html, /Column 2, row 2: 0, 0, 255 → 0, 12, 255/);
  assert.match(a.html, /Baseline/);
  assert.match(a.html, /Candidate/);
  assert.doesNotMatch(a.html, /<script|<img|https?:\/\//i);
  assert.equal((a.html.match(/class="pixel/g) || []).length, 8);
  assert.equal((a.html.match(/class="pixel changed"/g) || []).length, 2);
});

test('tolerance, mismatch and preview bounds are fail-closed', () => {
  assert.equal(renderPixelReport(base, current, {tolerance:12}).result.verdict,'PASS');
  assert.match(renderPixelReport(base, base).html, /No pixels changed/);
  assert.throws(() => renderPixelReport(base, 'P3\n1 1\n255\n0 0 0\n'), PixelFault);
  assert.throws(() => renderPixelReport(base, current, {tolerance:-1}), PixelFault);
  const large = 'P3\n33 1\n255\n' + '0 0 0\n'.repeat(33);
  assert.throws(() => renderPixelReport(large,large), /32 by 32/);
});

test('CLI writes a new report and refuses overwrite or symlink target', () => {
  const dir = mkdtempSync(join(tmpdir(), 'p3-html-'));
  try {
    const report = join(dir,'report.html');
    const first = run('examples/original.ppm','examples/modified.ppm',report);
    assert.equal(first.status,1, first.stderr);
    assert.match(readFileSync(report,'utf8'), /Offline pixel comparison/);
    const prior = readFileSync(report,'utf8');
    assert.equal(run('examples/original.ppm','examples/modified.ppm',report).status,2);
    assert.equal(readFileSync(report,'utf8'), prior);
    const link = join(dir,'link.html');
    symlinkSync(report,link);
    assert.equal(run('examples/original.ppm','examples/modified.ppm',link).status,2);
    const pass = run('examples/original.ppm','examples/original.ppm',join(dir,'pass.html'));
    assert.equal(pass.status,0,pass.stderr);
    assert.equal(run('examples/original.ppm','examples/modified.ppm',join(dir,'bad.txt')).status,2);
    assert.equal(run('examples/original.ppm','examples/modified.ppm',join(dir,'bad.html'),'-1').status,2);
    assert.equal(run().status,2);
  } finally { rmSync(dir,{recursive:true,force:true}); }
});

test('malformed untrusted input is rejected without leaking its contents', () => {
  const dir = mkdtempSync(join(tmpdir(),'p3-html-negative-'));
  try {
    const payload = join(dir,'bad.ppm'), report = join(dir,'out.html');
    const marker = 'SECRET_DO_NOT_PRINT';
    writeFileSync(payload, 'P3\n1 1\n255\n'+marker);
    const v = run('examples/original.ppm',payload,report);
    assert.equal(v.status,2);
    assert.doesNotMatch(v.stderr, /SECRET_DO_NOT_PRINT/);
    assert.throws(() => readFileSync(report,'utf8'));
  } finally { rmSync(dir,{recursive:true,force:true}); }
});
