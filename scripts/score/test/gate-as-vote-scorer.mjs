#!/usr/bin/env node
// gate-as-vote-scorer.mjs — a DELIBERATELY BROKEN scorer. TEST FIXTURE ONLY.
//
// This is NOT the engine's scorer. It exists so the gate-behavior harness has a
// known-buggy target to catch. It reproduces the capstone's named build failure:
// the "gate-as-vote" bug — liveness and timeline are folded into the vote sum as
// ADDITIVE terms, and the closed-gate short-circuit is dropped. The result: a
// ghost posting (liveness=0) with strong votes still scores high and is NOT
// gated. A correct harness must FAIL against this file. Never import or ship it.

import fs from 'node:fs';
import path from 'node:path';

const W = { sponsorship: 0.35, fit: 0.30, role_quality: 0.0 };
const GATE_AS_VOTE_WEIGHT = 0.15; // THE BUG: a gate treated as just another weighted vote
const APPLY = 0.30, CONSIDER = 0.20;

const src = process.argv.slice(2).find((a) => !a.startsWith('--'));
const oi = process.argv.indexOf('--out-dir');
const outDir = oi >= 0 ? process.argv[oi + 1] : path.dirname(src);
const p = (o) => (o && typeof o.p === 'number' ? o.p : 0);
const f = (o) => (o && typeof o.factor === 'number' ? o.factor : 1);

const roles = JSON.parse(fs.readFileSync(src, 'utf8'));
const scored = roles.map((r) => {
  const voteSum = p(r.sponsorship) * W.sponsorship + p(r.fit) * W.fit + p(r.role_quality) * W.role_quality;
  // BUG: gates added as votes instead of multiplied — and no closed-gate check
  const composite = Number((voteSum + f(r.liveness) * GATE_AS_VOTE_WEIGHT + f(r.timeline) * GATE_AS_VOTE_WEIGHT).toFixed(4));
  const rec = composite >= APPLY ? 'Apply' : composite >= CONSIDER ? 'Consider' : 'Skip';
  return { role_id: r.role_id, company: r.company, title: r.title, composite, recommendation: rec,
    reason: `gate-as-vote build: composite ${composite} (gates added, not multiplied; no gate short-circuit)` };
});

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'role-scores.json'),
  JSON.stringify({ _scorer: 'BROKEN-gate-as-vote-fixture', roles: scored }, null, 2));
console.log(`(buggy fixture) scored ${scored.length} roles`);
