# PR: Sample-size-aware sponsorship credibility (upstream feed for the Role Scorer)

## The gap it closes

The engine reads employer sponsorship strength as a raw H-1B approval **rate**. On the real
DOL/USCIS-mapped file that rate is degenerate: **1262 of 1557 employers sit at exactly 100%**, most on
a handful of filings. A 2-of-2 employer is indistinguishable from Confluent's 610-of-610, so the
ranking is a 1262-way tie broken by row order — the raw top-10 comes out **alphabetical**. A rate
reported without its sample size is a confidence claim the record does not support, and a student on
an OPT clock spends real applications on that ordering.

This adds an upstream component that converts (approvals, denials) into a credibility score weighted
by how much evidence stands behind it, and feeds `sponsorship.p`. It does not modify the scorer.

## Chapters satisfied

Ch 5 (the 80-Days sponsorship scorer and its unexamined confidence) · Ch 11 (the Bayesian Role Scorer
this feeds) · Ch 16 (the build and the honest run: a real run plus a deliberate break).

## Approach

A Beta prior is fitted to the observed counts by **beta-binomial maximum likelihood at run time** —
estimated from the data on every run, never hardcoded — and each employer is reported at its posterior
mean `(α + approvals) / (α + β + total)`. This run fitted α=17.0132, β=0.3472 (μ=0.9800, M=17.360,
logLik=−11561.09). Thin records shrink toward the fitted rate; deep records keep their own evidence.

## What's in the diff

- `scripts/score/sponsorship-credibility.mjs` — the component (Node ≥ 20, no external deps).
- `recipes/sponsorship-credibility.md` + `.card.md` — the two-customer pair (nine sections; five named
  failure modes including drift and contract-violation).
- `reports/generated/sponsorship-credibility-audit.md` — the audit.
- `package.json` — adds `score:sponsor-credibility` and `score:sponsor-credibility:test`.
- `logs/RUN_LOG.md` — the run entry.

Nothing generated is committed as a source of truth (`--emit` writes to `output/`).

## Result

- `npm run score:sponsor-credibility:test` → **10/10 invariants, exit 0**.
- `--compare` → raw top-10 vs credibility top-10: **overlap 0/10**; median sample size in the list
  **10 → 240 filings**.
- Missing source → exit 2 (`does not estimate`). Changed schema → exit 2 (`refusing to guess column
  positions`). Employer with no counts → `EMPTY … NOT zero`.

## Verified vs. inferred boundary

**record:** the approval and denial counts. **script-output:** the fitted prior, every credibility
value, all counts and comparisons, the invariant results and exit codes. **your-input (authored):** the
four tier thresholds and the 0.20 caution cut — labeled as reading conveniences over a computed number,
not as derived quantities. **missing:** employers with no usable record, reported `Unknown`, explicitly
never `0` — absence of evidence is not evidence of denial. No coverage rate, liveness call, or
calibration figure is invented.

## The break attempt (it found a real defect, which is fixed here)

Shrinking toward a fitted 98% population rate does not only pull thin *good* records down — it pulls
thin *bad* records up. `FEEDMOB INC`, 0 approvals in 2 filings, scored **0.878762**; 25 employers were
lifted more than 0.20 above their own rate. Fixed by refusing to promote an adverse raw record above
`Thin` and by surfacing the borrowed portion as an explicit caution, with two regression invariants
added (self-test 7/7 → 10/10). **Residual risk, disclosed:** the posterior mean for that employer is
still 0.878762 — arithmetically correct, and deliberately not overwritten — so a consumer that reads
`credibility` while ignoring `tier` and `caution` can still be misled. It is documented on the card as
a live failure mode rather than papered over.

## The one limitation it cannot verify

It audits **sample size**, not **data quality**. It cannot tell whether the source counts are true. If
an upstream join dropped an employer's filings, the credibility is computed correctly, is confidently
wrong, and every invariant still passes. Verifying the record itself is out of scope and is handed
back to a human.

## Conformance

`npm run verify` (conformance + manifest-check) and `npm run doctor` both run clean on this branch
before push. No PII; no `data/ats/` or `private/` content is staged.
