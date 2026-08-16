# Ranking 1,557 Employers When 1,262 of Them Are Tied at 100%

**Zhiyuan Yang** · contribution to *The Reallocation Engine* (open-source, evidence-first job search)

## The problem

An international student on OPT has a fixed number of applications and a running clock. The Reallocation
Engine tells them where to spend that budget, and one of its strongest signals is how reliably an
employer's H-1B petitions get approved.

The engine read that signal as a raw **approval rate**. On the real DOL/USCIS-mapped file, that rate is
close to useless: **1,262 of 1,557 employers sit at exactly 100%** — most of them on a handful of
filings. A company with 2 approvals out of 2 is indistinguishable from Confluent's 610 out of 610.
Ranking by that rate produces a 1,262-way tie broken by row order, so the "top sponsors" come out
**alphabetical**:

```
| 1 | 1LIFE HEALTHCARE INC   | 2/2   | 100.0% |
| 2 | 1UPHEALTH INC          | 12/12 | 100.0% |
| 3 | 24M TECHNOLOGIES INC   | 12/12 | 100.0% |
| 4 | 317 LABS INC           | 2/2   | 100.0% |
```

A rate reported without its sample size is a confidence claim the record does not support. A student
spends real applications on that ordering.

## What I built

`scripts/score/sponsorship-credibility.mjs` — an upstream feed for the engine's Bayesian Role Scorer.
It fits a Beta prior to the observed (approvals, denials) counts by **beta-binomial maximum likelihood
at run time** — the prior is estimated from the data on every run, never hardcoded — and reports each
employer's posterior mean:

```
credibility = (α + approvals) / (α + β + total)          α=17.0132, β=0.3472 (fitted, this run)
```

Thin records are pulled toward the fitted population rate; deep records keep their own evidence. It
ships with an AI recipe and a human card, and it does not modify the scorer it feeds.

```
H-1B record ──▶ [fit prior by MLE] ──▶ [posterior mean per employer] ──▶ sponsorship.p ──▶ Role Scorer
                        │                          │
                   EMPTY ≠ 0             caution when the score is
              (no record → Unknown)      mostly borrowed from the prior
```

## The measurable improvement

| | Ranked by raw rate | Ranked by credibility |
|---|---|---|
| #1 | 1LIFE HEALTHCARE (2 filings) | CONFLUENT (610 filings) |
| Median sample size in the top 10 | **10 filings** | **240 filings** |
| Overlap between the two lists | — | **0 of 10** |

**The top-10 list a student would act on changes completely, and the evidence behind it goes up 24×.**

## Verified vs. inferred

Every number the component emits is either a **record** value (the approval and denial counts) or
**script-output** computed from those counts in that run — including the fitted prior, which is
re-estimated each time rather than carried as a constant. The only **authored** values are the tier
thresholds and the caution cut-off, labeled as such rather than presented as derived. An employer with
no usable record is reported `Unknown`, never `0`: absence of evidence is not evidence of denial, and
collapsing the two would be exactly the fabrication this system exists to prevent.

## Failure modes, and the one limitation it cannot verify

- **The prior can rescue a bad record — found by breaking my own component.** Shrinkage borrows
  strength from a population whose fitted rate is 98%. `FEEDMOB INC`, with **0 approvals in 2
  filings**, scored **0.879** — a number that reads as a strong sponsor while the record says the
  opposite; 25 employers were lifted more than 0.20 above their own rate. I now refuse to promote an
  adverse record above `Thin` and print how much of each score is borrowed rather than earned. The
  posterior mean itself is unchanged, because it is arithmetically correct and quietly editing it
  would be its own dishonesty — so a consumer that reads only `credibility` can still be misled. That
  is on the card as a live failure mode.
- **Silent data drift.** A newer vintage of the source file changes every score with no error raised.
  A renamed column exits 2 rather than guessing — but a swapped file is invisible.
- **False precision.** `0.982066` for a 2-of-2 employer looks like a measurement. The point estimate
  hides an enormous spread; credible intervals are not implemented yet, and I say so rather than
  approximating one.
- **Selection bias in the prior.** It is fitted only on employers that already file H-1Bs, so 98%
  describes "how sponsors fare once they file", not "how likely a company is to sponsor".
- **The limitation it cannot verify (the important one):** the component audits **sample size**, not
  **data quality**. It has no way to know whether the source counts are true. If an upstream join
  dropped an employer's filings, the credibility score is computed correctly and is confidently wrong,
  and every invariant still passes. Verifying the record itself is the human call this hands back.

## Demo

```bash
npm run score:sponsor-credibility          # fit the prior, report scored / EMPTY / ERROR
npm run score:sponsor-credibility:test     # 10/10 invariants, exit 0
node scripts/score/sponsorship-credibility.mjs --compare    # the two rankings, side by side
node scripts/score/sponsorship-credibility.mjs --cautions   # the component flagging its own weakest output
```

PR + full diff: _[PR link]_
