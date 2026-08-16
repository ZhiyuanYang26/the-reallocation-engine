# Verified-Data Attestation — Gate-Behavior Harness

**Contribution:** `scripts/score/gate-behavior-test.mjs` (+ cases, buggy fixture, recipe, card).
**By:** Zhiyuan Yang · **Date:** 2026-07-28

## Verified-vs-inferred boundary (every value this component emits)
| Value it emits | Where it comes from | Label |
|---|---|---|
| Per-case `PASS`/`FAIL` | comparison of the scorer's output to the case's `_expect` | **script-output** (deterministic) |
| `composite === 0` (ghost/expired) | read from the scorer's `role-scores.json` | **script-output** (from the scorer, from the case record) |
| Exit code 0 / 1 | count of failed assertions | **script-output** |
| The multiplier ratio (0.5000 / 0.9153) | `composite(half) / composite(full)`, both from scorer output | **script-output** |
| The case inputs (liveness=0, etc.) | `scripts/score/test/gate-behavior-cases.json` (authored fixtures) | **your-input** (crafted test cases, labeled as such — not real postings) |
| "gates behave as gates on the current scorer" | the 7/7 pass result | **local-evidence** (true of this scorer version, this run) |

**No coverage rate, liveness call, or calibration figure is invented.** The harness emits only
pass/fail and an exit code, each derived from a real run. The only authored numbers are the test-case
inputs, explicitly labeled `your-input` (synthetic cases, not real job postings).

## Every number traces
- `composite === 0` for `ghost_perfect` / `expired_perfect` → produced by `role-scorer.mjs` reading
  `gate-behavior-cases.json` (liveness/timeline factor 0). Re-run: `npm run score:gate-test`.
- ratio `0.5000` → `role-scorer.mjs` output for `mult_half` ÷ `mult_full`.
- `4 FAILED` under the mutant → `gate-behavior-test.mjs --scorer …/gate-as-vote-scorer.mjs`.

## Ethics gate (shown passing)
- **Privacy:** no `data/ats/` or private file is staged; the harness writes only to an OS temp dir and
  deletes it. `npm run doctor` privacy check re-run below.
- **Honesty:** the component emits only pass/fail + exit code from real runs; it invents no metric and
  cannot misrepresent status (a failing gate exits non-zero, loudly).

## Sign-off (a human, not the tool — SNICKERDOODLE: no self-certified honesty)
I have reviewed this contribution against the verified-data contract. Every number it emits is
script-output or a labeled `your-input` test case; none is fabricated. The privacy and honesty gates
pass.

Signed: **Zhiyuan Yang**  ·  Date: **2026-07-28**
