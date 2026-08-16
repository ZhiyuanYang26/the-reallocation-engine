# Card — Gate-Behavior Harness (human-facing)

**Purpose.** Prove that the Role Scorer treats liveness and timeline as **gates** (multipliers that
can zero the score), not as votes (additive terms that can be outweighed). Catch the "gate-as-vote"
regression before it ships a dead posting as an Apply.

**What it CAN verify.**
- That a ghost posting (`liveness=0`) or an impossible start date (`timeline=0`) zeroes the composite
  and yields Skip, even with perfect sponsorship and fit.
- That the closed-gate boundary is where the config claims (`0.05` closes, `0.06` does not).
- That the gate is genuinely multiplicative (halving liveness halves the composite).
- That the harness itself can fail (it fails on a known-buggy scorer).

**What it CANNOT verify.**
- Whether the *upstream* liveness/timeline **factors are correct** — it tests how the scorer combines
  them, not whether the ATS liveness check or the OPT-timeline calc produced the right number.
- Whether the weights or the threshold are the right *values* (those are `[VERIFY]` in the scorer).
- Anything about roles it wasn't given — it tests crafted cases, not a real pipeline run.

**Dependencies.** Node ≥ 20; `scripts/score/role-scorer.mjs`; `scripts/score/test/gate-behavior-cases.json`;
the buggy fixture `scripts/score/test/gate-as-vote-scorer.mjs` (for the fail-demo only).

**Annotated commands.**
- `npm run score:gate-test` → test the real scorer (expect `✓ ALL PASS`, exit 0).
- `node scripts/score/gate-behavior-test.mjs --scorer scripts/score/test/gate-as-vote-scorer.mjs`
  → prove the harness can fail (expect FAILs, exit 1).

**What it produces.** A PASS/FAIL line per case on stdout + an exit code; the audit report at
`reports/generated/gate-behavior-harness-audit.md`. No persistent scoring files (temp dir removed).

**Failure modes (≥4, incl. drift and contract-violation).**
1. **Drift — scorer schema changes.** If `role-scorer.mjs` renames `liveness.factor`/`timeline.factor`
   or changes the output shape (`composite`, `reason`), the harness reads stale fields and may report
   PASS on cases it no longer actually checks. *Mitigation:* the harness asserts `composite === 0`
   (a value, not just a label); a schema rename would surface as a missing-role/failed assertion, not
   a silent pass — but a field **rename that still parses** is the real drift risk. Re-review on any
   scorer change.
2. **Contract-violation — a test that cannot fail.** If the buggy-fixture path breaks or is deleted,
   G4 can't run and a green G3 would be trusted blindly. *Mitigation:* G4 is mandatory; a harness that
   never fails is decoration (SNICKERDOODLE P4).
3. **False confidence — coverage gap.** The cases cover liveness/timeline gating and one ratio; they
   do **not** cover override interactions, multi-gate simultaneous closure weighting, or NaN/negative
   factors. A gate bug outside the covered cases would pass. *Mitigation:* the card states the coverage
   boundary; expand cases before claiming general correctness.
4. **Environment drift.** The harness shells out to `node` and writes to the OS temp dir; a locked-down
   temp or a `node` not on PATH fails the run for reasons unrelated to gate behavior. *Mitigation:* read
   the error — a harness error is not a scorer failure; do not report either as the other.

**Contract note.** This harness never edits `role-scorer.mjs`. It reads the scorer's own output and
checks it against reality (the arithmetic that must hold), never against the scorer's self-report.
