#!/usr/bin/env node
// gate-behavior-test.mjs — a gate-behavior unit-test harness for the Bayesian
// Role Scorer (scripts/score/role-scorer.mjs). Chapters 11 + 16.
//
// WHY THIS EXISTS: the scorer's composite is ( Σ vote·weight ) × liveness ×
// timeline. Liveness and timeline are GATES — multipliers, not addends — so a
// ghost posting or an impossible start date must ZERO the composite regardless
// of how strong the other votes are. The named build failure of the capstone is
// the "gate-as-vote" bug: someone refactors a gate into an additive vote, and a
// dead posting with strong sponsorship starts scoring Apply. This harness proves
// the gates behave as gates, and FAILS loudly if they ever behave as votes.
//
// It runs the REAL scorer as a black box (never edits it) against crafted cases
// with known correct behavior, and asserts on the scorer's own output.
//
//   node scripts/score/gate-behavior-test.mjs                    # test the real scorer
//   node scripts/score/gate-behavior-test.mjs --scorer <path>   # test any scorer (used for the break demo)
//
// Exit 0 = all gate-behavior assertions pass. Exit 1 = a gate misbehaved.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const si = args.indexOf('--scorer');
const SCORER = si >= 0 ? path.resolve(args[si + 1]) : path.join(HERE, 'role-scorer.mjs');
const CASES = path.join(HERE, 'test', 'gate-behavior-cases.json');

const cases = JSON.parse(fs.readFileSync(CASES, 'utf8'));
// strip annotation keys (_spec/_expect) before handing roles to the scorer
const roles = cases.map((c) => Object.fromEntries(Object.entries(c).filter(([k]) => !k.startsWith('_'))));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-test-'));
fs.writeFileSync(path.join(tmp, 'roles.json'), JSON.stringify(roles));
execFileSync('node', [SCORER, path.join(tmp, 'roles.json'), '--out-dir', tmp], { stdio: 'pipe' });
const scored = JSON.parse(fs.readFileSync(path.join(tmp, 'role-scores.json'), 'utf8')).roles;
const byId = Object.fromEntries(scored.map((s) => [s.role_id, s]));

const results = [];
const isGated = (s) => s.recommendation === 'Skip' && /gated/.test(s.reason || '');

for (const c of cases) {
  const e = c._expect || {};
  const s = byId[c.role_id];
  const checks = [];
  if (!s) {
    results.push({ id: c.role_id, pass: false, detail: 'no scorer output for this role' });
    continue;
  }
  if (e.skip_gated) {
    checks.push(['gate closes → Skip (gated)', isGated(s)]);
    if (e.composite !== undefined) checks.push([`composite === ${e.composite}`, s.composite === e.composite]);
  }
  if (e.not_gated) {
    checks.push(['gate open → not gated', !isGated(s)]);
    if (e.min_composite !== undefined) checks.push([`composite ≥ ${e.min_composite}`, s.composite >= e.min_composite]);
  }
  if (e.ratio_pair === 'base') {
    checks.push([`(ratio base — verified via its paired half)`, true]);
  }
  if (e.ratio_pair === 'half') {
    const base = byId[e.of];
    const ratio = base && base.composite ? s.composite / base.composite : null;
    const ok = ratio !== null && Math.abs(ratio - e.expect_ratio) < 1e-6;
    checks.push([`multiplicative: composite(${c.role_id})/composite(${e.of}) === ${e.expect_ratio} (got ${ratio == null ? 'n/a' : ratio.toFixed(4)})`, ok]);
  }
  const pass = checks.length > 0 && checks.every(([, ok]) => ok);
  results.push({ id: c.role_id, pass, detail: checks.map(([n, ok]) => `${ok ? '✓' : '✗'} ${n}`).join(' | ') });
}

fs.rmSync(tmp, { recursive: true, force: true });

console.log(`GATE-BEHAVIOR HARNESS — scorer under test: ${path.relative(process.cwd(), SCORER)}\n`);
for (const r of results) console.log(`  ${r.pass ? 'PASS' : 'FAIL'}  ${r.id.padEnd(16)} ${r.detail}`);
const failed = results.filter((r) => !r.pass).length;
console.log(`\n${failed === 0 ? '✓ ALL PASS' : `✗ ${failed} FAILED`} — ${results.length} gate-behavior cases`);
process.exit(failed === 0 ? 0 : 1);
