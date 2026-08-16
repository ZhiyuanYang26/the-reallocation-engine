---
status: RUNNABLE-SAMPLE
todos_open: 0
last_gate: "sample-run, 2026-07-28, logs/RUN_LOG.md#2026-07-28--gate-behavior-harness"
attestation: null
recipe_version: 0.1.0
---

# Gate-Behavior Harness — prove liveness & timeline are gates, not votes

## 1. Executive summary
The Bayesian Role Scorer computes `composite = (Σ vote·weight) × liveness × timeline`.
Liveness and timeline are **gates** — multipliers — so a ghost posting (`liveness=0`) or an
impossible start date (`timeline=0`) must **zero** the composite and force **Skip**, no matter how
strong the sponsorship/fit votes are. The named build failure this guards against is the
**gate-as-vote bug**: a refactor folds a gate into the additive vote sum, and a dead posting with
strong sponsorship starts scoring **Apply** — sending a student to apply to a job that no longer
exists. This harness runs the real scorer as a black box against crafted cases and **fails loudly**
if a gate ever behaves like a vote.

## 2. Required reads (read-first order)
1. `scripts/score/role-scorer.mjs` — the scorer under test (the `composite` formula, §"gates").
2. `scripts/score/test/gate-behavior-cases.json` — the cases + their expected behavior.
3. `recipes/gate-behavior-harness.card.md` — the human card (what it can/can't verify).
4. Chapter 11 §"Why liveness and timeline are multipliers"; Chapter 16 §"The build and the honest run".

## 3. Phase gates (each with a failure path)
- **G1 — scorer present.** `test -f scripts/score/role-scorer.mjs`. *Fail path:* if absent, stop —
  there is nothing to test; do not report PASS.
- **G2 — cases parse.** `node -e "JSON.parse(require('fs').readFileSync('scripts/score/test/gate-behavior-cases.json'))"`.
  *Fail path:* invalid JSON halts the run (conformance failure, not a warning).
- **G3 — harness green on the real scorer.** `npm run score:gate-test` exits 0. *Fail path:* a
  non-zero exit means a gate is misbehaving in the live scorer — **do not merge**; open a defect in
  `logs/RUN_LOG.md` and treat it as a P4 gate stop.
- **G4 — harness proven able to fail.** `node scripts/score/gate-behavior-test.mjs --scorer scripts/score/test/gate-as-vote-scorer.mjs`
  exits **1**. *Fail path:* if the harness passes the known-buggy mutant, the harness itself is
  broken (a test that cannot fail is decoration) — fix the harness before trusting a green run.

## 4. Primary stored tools
- `scripts/score/gate-behavior-test.mjs` (this contribution) — the harness. `npm run score:gate-test`.
- `scripts/score/role-scorer.mjs` (existing) — the system under test; **never modified by this recipe**.
- `scripts/score/test/gate-as-vote-scorer.mjs` (this contribution) — a deliberately buggy fixture
  used only to prove the harness can fail. Not shipped, not imported anywhere.

## 5. Workflow
1. Confirm G1–G2.
2. Run `npm run score:gate-test` → the harness writes crafted roles to a temp dir, runs the real
   scorer on them, reads `role-scores.json`, and asserts per case (G3).
3. Run the harness against the buggy fixture to confirm it fails on the target bug (G4).
4. Record both runs in `logs/RUN_LOG.md`; write/refresh the audit.
5. A human reviews and signs the attestation before any VERIFIED claim.

## 6. Output contract
- **Agent-facing:** the harness exits `0` (all gate-behavior cases pass) or `1` (a gate misbehaved),
  and prints one `PASS/FAIL` line per case with the exact assertion checked. No files are left
  behind (the temp scoring dir is removed).
- **Human-facing:** `reports/generated/gate-behavior-harness-audit.md` — what was tested, the real
  PASS/FAIL table, and the break-demo result.

## 7. Verification checks
- The harness asserts, from the scorer's **own output** (never asserted, always checked):
  ghost posting → `composite === 0` and Skip(gated); expired timeline → same; both gates open →
  not gated; `liveness = 0.05` closes, `liveness = 0.06` does not; and halving liveness halves the
  composite (proves multiplicative, not additive).
- Machine half: `node scripts/conformance.mjs` on the new files; `npm run doctor` clean.

## 8. Logging rules
Append to `logs/RUN_LOG.md` on every run against the real scorer, every break demo, and any harness
change: date, command, real result (exit code + pass/fail counts), and open issues. Never log PII.

## 9. Stop conditions
- Stop and do not report PASS if G1 or G2 fails (nothing tested).
- Stop and open a defect if G3 fails on the real scorer (a live gate is behaving as a vote).
- Stop and fix the harness if G4 does not fail on the buggy fixture (the test cannot fail).
- Do not claim VERIFIED without a human-signed attestation (a harness may not self-certify).
