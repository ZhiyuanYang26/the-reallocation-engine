# Gate-Behavior Harness — Audit

**Date:** 2026-07-28 · **Harness:** `scripts/score/gate-behavior-test.mjs` · **Scorer under test:**
`scripts/score/role-scorer.mjs` (unmodified).

## What was tested
7 crafted cases asserting the scorer treats liveness/timeline as multiplicative gates, not votes.
Each assertion is checked against the scorer's own emitted `composite`/`recommendation`/`reason`.

## Result on the real scorer — `npm run score:gate-test`
```
PASS  ghost_perfect    ✓ gate closes → Skip (gated) | ✓ composite === 0
PASS  expired_perfect  ✓ gate closes → Skip (gated) | ✓ composite === 0
PASS  healthy_strong   ✓ gate open → not gated | ✓ composite ≥ 0.0001
PASS  boundary_closed  ✓ gate closes → Skip (gated)
PASS  boundary_open    ✓ gate open → not gated
PASS  mult_full        ✓ (ratio base — verified via its paired half)
PASS  mult_half        ✓ multiplicative: composite(mult_half)/composite(mult_full) === 0.5 (got 0.5000)

✓ ALL PASS — 7 gate-behavior cases   (exit 0)
```

## Break demo — harness vs a known-buggy "gate-as-vote" scorer
`node scripts/score/gate-behavior-test.mjs --scorer scripts/score/test/gate-as-vote-scorer.mjs`
```
FAIL  ghost_perfect    ✗ gate closes → Skip (gated) | ✗ composite === 0
FAIL  expired_perfect  ✗ gate closes → Skip (gated) | ✗ composite === 0
PASS  healthy_strong
FAIL  boundary_closed  ✗ gate closes → Skip (gated)
PASS  boundary_open
PASS  mult_full
FAIL  mult_half        ✗ multiplicative … === 0.5 (got 0.9153)

✗ 4 FAILED — 7 gate-behavior cases   (exit 1)
```
The harness catches the bug it exists to catch: under gate-as-vote, the ghost and expired postings
are no longer zeroed, and the multiplier ratio is 0.9153 instead of 0.5.

## Finding
On the current scorer, liveness and timeline behave as gates (all 7 pass). The harness is proven able
to fail (4 fail on the buggy fixture). This audit reports what it found; the adequacy call is the
human attestation.
