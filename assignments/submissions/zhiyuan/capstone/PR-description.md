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

Laplace's rule of succession: `credibility = (approvals + 1) / (total + 2)`. One notional success and
one notional failure, then the employer's own record. Thin records are pulled toward the middle in
**both** directions (`2/2 → 0.750`, `0/2 → 0.250`); deep records keep their own rate
(`700/1000 → 0.6996`).

The anchor is **0.5, not the 98.1% pooled rate**, and that choice is the substance of the PR — see the
break attempt below.

## What's in the diff

- `scripts/score/sponsorship-credibility.mjs` — the component (Node ≥ 20, no external deps).
- `recipes/sponsorship-credibility.md` + `.card.md` — the two-customer pair (nine sections; six named
  failure modes including drift and contract-violation).
- `reports/generated/sponsorship-credibility-audit.md` — the audit.
- `package.json` — adds `score:sponsor-credibility` and `score:sponsor-credibility:test`.
- `logs/RUN_LOG.md` — the run entry.

Nothing generated is committed as a source of truth (`--emit` writes to `output/`).

## Result

- `npm run score:sponsor-credibility:test` → **10/10 invariants, exit 0**.
- `--compare` → raw top-10 vs credibility top-10: **overlap 0/10**; median sample size in the list
  **10 → 276 filings**.
- Missing source → exit 2 (`does not estimate`). Changed schema → exit 2 (`refusing to guess column
  positions`). Employer with no counts → `EMPTY … NOT zero`. Identical records → tied, no invented order.

## Verified vs. inferred boundary

**record:** the approval and denial counts. **script-output:** every credibility value, all counts and
comparisons, the invariant results and exit codes. **your-input (authored):** the rule's two
pseudo-counts and the four tier bands — labeled as modeling choices, not derived quantities.
**missing:** employers with no usable record, reported `Unknown`, explicitly never `0` — absence of
evidence is not evidence of denial. No coverage rate, liveness call, or calibration figure is invented.

## The break attempt (it cost the original method)

Version 1 used beta-binomial empirical Bayes with the prior fitted at run time (α=17.0132, β=0.3472 —
anchored at the 98.1% pooled rate). Shrinking toward a 98% population does not only pull thin *good*
records down; it pulls thin *bad* records up. `FEEDMOB INC`, 0 approvals in 2 filings, scored
**0.878762**; 25 employers were lifted more than 0.20 above their own rate.

The first response was a patch — refuse to promote an adverse record above tier `Thin`, plus a caution
string disclosing that the score was mostly borrowed. Both statements were true and both were wrapped
around a number that was still 0.879. A label that contradicts the number it labels is decoration, so
the **method was replaced rather than patched**: the anchor moved to 0.5. `FEEDMOB INC` now scores
**0.250**, and two invariants (`c(0/2) > c(0/10) > c(0/40)` and `c(0/2) < 0.30`) prevent a silent
return.

**Residual risk, disclosed:** 0.250 is not 0. Two filings cannot establish that an employer never
sponsors, so the tool declines to say so — the mirror of why `2/2` is not 1.000. Gate G5 (`--movers`)
requires a human to read both directions before the output drives a decision.

## Known limitations of the shipped rule

- Near the top, gaps are thousandths (CONFLUENT 0.998366 vs JUNIPER 0.997596). The ordering follows
  evidence weight; the output prints in-line that it is not a claim that #1 beats #4.
- Among the 1262 perfect records the score reduces to `n/(n+2)` — sample size alone. Intended, but it
  systematically favours employers that file often, i.e. large ones.
- The score is not a rate and should not be plotted as one; `raw_rate` is emitted alongside.

## The one limitation it cannot verify

It audits **sample size**, not **data quality**. It cannot tell whether the source counts are true. If
an upstream join dropped an employer's filings, the credibility is computed correctly, is confidently
wrong, and every invariant still passes. Verifying the record itself is out of scope and is handed
back to a human.

## Conformance

`npm run verify` (conformance + manifest-check) and `npm run doctor` both run clean on this branch
before push. No PII; no `data/ats/` or `private/` content is staged.
