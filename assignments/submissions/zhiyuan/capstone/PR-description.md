# PR: Gate-behavior unit-test harness for the Bayesian Role Scorer

## The gap it closes
The scorer's `composite = (Σ vote·weight) × liveness × timeline` treats liveness and timeline as
multiplicative **gates**, but nothing tested that they stay gates. The capstone's named build failure
— the **gate-as-vote bug** — would let a ghost posting with strong votes score **Apply**. This adds a
harness that proves the gates behave as gates and fails loudly if they ever behave as votes.

## Chapters satisfied
Ch 11 (the scorer; "why liveness and timeline are multipliers") · Ch 16 (the build and the honest run:
a real run + a deliberate break).

## What's in the diff
- `scripts/score/gate-behavior-test.mjs` — the harness (`npm run score:gate-test`).
- `scripts/score/test/gate-behavior-cases.json` — 7 crafted cases with expected behavior.
- `scripts/score/test/gate-as-vote-scorer.mjs` — a deliberately buggy fixture (fail-demo only; never imported/shipped).
- `recipes/gate-behavior-harness.md` + `.card.md` — the two-customer pair.
- `reports/generated/gate-behavior-harness-audit.md` — the audit.
- `package.json` — adds the `score:gate-test` script.
- **Removes `search/resume.json` from tracking** — it was committed PII (name/phone/email); untracked
  here so `npm run doctor` passes its privacy check. (Already gitignored by rule; this stops future
  tracking. Purging it from pushed history is a separate rewrite, not in this PR.)

## Result
- `npm run score:gate-test` → **7/7 pass, exit 0** on the real scorer.
- Against the buggy fixture → **4/7 fail, exit 1** (the harness catches the regression).

## Verified vs. inferred boundary
Everything the harness emits is **script-output** (pass/fail + exit code from real runs). The only
authored values are the **synthetic test-case inputs**, labeled as such. No coverage/liveness/
calibration number is invented.

## The one limitation it cannot verify
It proves the scorer *combines* gate values correctly; it **cannot** verify the gate values
themselves are right. If an upstream feed reports a dead posting as `liveness=1`, every test passes
and the student is still sent to a dead job. Verifying the gate's inputs is out of this harness's scope.

## Honesty note on conformance
`node scripts/conformance.mjs` passes on all files in this contribution, and `npm run doctor`'s
privacy check is clean after the `resume.json` untrack. The repo-wide `npm run verify` still reports
**pre-existing** `manifest-check` E3 drift (AGENTS.md/CLAUDE.md/etc. out of sync with `instructions/`)
that exists on `main` and is untouched by this PR.
