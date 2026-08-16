# The Honest Run — Gate-Behavior Harness

**By:** Zhiyuan Yang · 2026-07-28 · Chapter 16 discipline.

## Plausibility audit (before trusting the output)
Before running, I sanity-checked the arithmetic the harness assumes. With weights sponsorship 0.35,
fit 0.30, role_quality 0.0, a role with sponsorship=fit=1 has vote sum 0.65. If liveness=0, then
`0.65 × 0 × 1 = 0` — the composite must be exactly 0 and the row must read Skip(gated). If instead a
role scored anything above 0 with a dead gate, the gate would be behaving as a vote. That single
check — *does a zero gate collapse a perfect-vote role?* — is the whole test, and it is the failure
"that ran, looked reasonable, and was wrong in exactly the way fluency hides."

## Real terminal output (pasted, not described)
```
$ npm run score:gate-test
GATE-BEHAVIOR HARNESS — scorer under test: scripts\score\role-scorer.mjs

  PASS  ghost_perfect    ✓ gate closes → Skip (gated) | ✓ composite === 0
  PASS  expired_perfect  ✓ gate closes → Skip (gated) | ✓ composite === 0
  PASS  healthy_strong   ✓ gate open → not gated | ✓ composite ≥ 0.0001
  PASS  boundary_closed  ✓ gate closes → Skip (gated)
  PASS  boundary_open    ✓ gate open → not gated
  PASS  mult_full        ✓ (ratio base — verified via its paired half)
  PASS  mult_half        ✓ multiplicative: composite(mult_half)/composite(mult_full) === 0.5 (got 0.5000)

✓ ALL PASS — 7 gate-behavior cases          (exit 0)
```

## Deliberate break attempt
I built a deliberately buggy scorer (`scripts/score/test/gate-as-vote-scorer.mjs`) that folds the
gates into the vote sum additively and drops the closed-gate short-circuit — the exact "gate-as-vote"
regression. I pointed the harness at it (the real scorer untouched):
```
$ node scripts/score/gate-behavior-test.mjs --scorer scripts/score/test/gate-as-vote-scorer.mjs
  FAIL  ghost_perfect    ✗ gate closes → Skip (gated) | ✗ composite === 0
  FAIL  expired_perfect  ✗ gate closes → Skip (gated) | ✗ composite === 0
  FAIL  boundary_closed  ✗ gate closes → Skip (gated)
  FAIL  mult_half        ✗ multiplicative … === 0.5 (got 0.9153)
✗ 4 FAILED — 7 gate-behavior cases          (exit 1)
```
The harness catches the bug: the ghost and expired postings are no longer zeroed (they'd be scored
and could reach Apply), and the gate ratio is 0.9153, not 0.5.

**A second break — on my own harness.** My first run FAILed `mult_full` with an *empty* reason. That
was a bug in the **harness**, not the scorer: a ratio-base case had no assertion of its own, so my
`pass = checks.length > 0 && …` marked it failed. I fixed the harness (added an explicit base check)
and re-ran to the green above. A test harness that miscounts is itself a gate-as-decoration risk — I
found mine by looking, not by trusting the first green-ish output.

## Metric readout
- Real scorer: **7/7** gate-behavior cases pass (exit 0).
- Buggy fixture: **4/7 fail** (exit 1) — the harness's true-positive catch rate on the target bug is
  the 4 dangerous cases (both ghost/expired zeroing checks, the closed boundary, the multiplier ratio).

## What the machine could not know
The harness proves the scorer *combines* gates correctly. It cannot know whether the liveness factor
fed in was itself right — whether the ATS liveness check actually detected a dead posting, or whether
the OPT-timeline math produced the right factor. If an upstream feed reports a ghost posting as
`liveness=1`, every gate-behavior test still passes and the student still gets sent to a dead job.
That is the human call this contribution hands back: verifying the *inputs* to the gate, not just the
*algebra* of the gate.
