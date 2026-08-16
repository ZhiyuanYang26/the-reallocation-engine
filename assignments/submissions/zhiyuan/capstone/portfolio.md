# A Test Harness That Keeps Dead Jobs Out of "Apply"

**Zhiyuan Yang** · contribution to *The Reallocation Engine* (open-source, evidence-first job search)

## The problem
The engine scores each job for an international student on the OPT clock and recommends
**Apply / Consider / Skip**. Two of its signals are meant to be **hard gates**, not soft factors:
a **ghost posting** (the job is dead) and a **timeline miss** (the start date is past the visa
window) must kill the recommendation outright. The scorer implements this as a multiplication —
`composite = (Σ vote·weight) × liveness × timeline` — so a zero gate zeroes everything.

That design has a specific, expensive failure mode, and the book names it: the **gate-as-vote bug**.
If a future edit folds a gate into the additive vote sum, a dead posting with strong sponsorship
stops being zeroed and starts scoring **Apply** — and a student burns one of their few applications
on a job that no longer exists. Nothing in the repo tested for this.

## What I built
A **gate-behavior unit-test harness** (`scripts/score/gate-behavior-test.mjs`, `npm run score:gate-test`).
It runs the real scorer as a black box against seven crafted cases and asserts, from the scorer's own
output, that gates behave as gates: a ghost posting zeroes to Skip, an expired timeline zeroes to
Skip, the closed-gate boundary is where the config claims, and halving a gate halves the composite
(proving multiplication, not addition). It ships with an AI recipe and a human card, and it never
modifies the scorer it tests.

```
scan → score → [GATE HARNESS asserts liveness & timeline still zero the composite] → Apply/Skip
```

## The measurable improvement
- On the current scorer: **7/7 gate-behavior cases pass** (exit 0) — the gates are proven correct,
  not assumed.
- Against a deliberately planted gate-as-vote regression: the harness **catches 4 of the 7** cases
  (both zeroing cases, the closed boundary, and the multiplier ratio: 0.9153 instead of 0.5), exiting
  non-zero. Before this, that regression would have shipped silently.

One honest number: **a bug that previously had zero automated coverage now fails the build.**

## Verified vs. inferred
Everything the harness emits is **script-output** — pass/fail and an exit code derived from a real
run of the scorer. The only authored values are the **test-case inputs** (e.g. `liveness=0`), labeled
as synthetic cases, not real postings. No coverage rate, liveness call, or calibration figure is
invented.

## Failure modes, and the one limitation it cannot verify
- **Schema drift:** if the scorer renames `liveness.factor` or its output fields, the harness could
  read stale fields — re-review on any scorer change.
- **A test that cannot fail:** mitigated by a mandatory step that runs the harness against a known-buggy
  scorer and requires it to fail.
- **Coverage gap:** it tests gating and one ratio, not overrides or malformed factors.
- **The limitation it cannot verify (the important one):** the harness proves the scorer *combines*
  the gate values correctly. It **cannot** tell whether the liveness or timeline value fed in was
  itself right. If the upstream ATS check reports a dead posting as `liveness=1`, every test still
  passes and the student is still sent to a dead job. Verifying the *inputs* to the gate is the human
  call this contribution hands back.

## Demo
- Run: `npm run score:gate-test` (expect `✓ ALL PASS`, exit 0).
- Prove it can fail: `node scripts/score/gate-behavior-test.mjs --scorer scripts/score/test/gate-as-vote-scorer.mjs` (exit 1).
- PR + full diff: _[PR link here after push]_.
