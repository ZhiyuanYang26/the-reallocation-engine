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
It scores every employer by **Laplace's rule of succession**:

```
credibility = (approvals + 1) / (total + 2)
```

Each employer starts with one notional success and one notional failure, then its own record is added.
Thin records are pulled toward the middle **in both directions** — `2/2 → 0.750`, `0/2 → 0.250` — while
`700/1000 → 0.6996` keeps essentially its own rate. Credibility is earned by evidence, and the
adjustment vanishes as the record grows. It ships with an AI recipe and a human card, and it does not
modify the scorer it feeds.

```
H-1B record ──▶ [(k+1)/(n+2), anchor 0.5] ──▶ ranked employers ──▶ sponsorship.p ──▶ Role Scorer
                          │                            │
                    EMPTY ≠ 0                identical records stay tied
             (no record → Unknown)          (the tool invents no order)
```

## The measurable improvement

| | Ranked by raw rate | Ranked by credibility |
|---|---|---|
| #1 | 1LIFE HEALTHCARE (2 filings) | CONFLUENT (610 filings) |
| Median sample size in the top 10 | **10 filings** | **276 filings** |
| Overlap between the two lists | — | **0 of 10** |

**The top-10 list a student would act on changes completely, and the evidence behind it goes up 28×.**

## Verified vs. inferred

Every number the component emits is either a **record** value (the approval and denial counts) or
**script-output** computed from those counts. The only **authored** values are the rule's two
pseudo-counts and the tier bands, labeled as modeling choices rather than presented as derived. An
employer with no usable record is reported `Unknown`, never `0`: absence of evidence is not evidence of
denial, and collapsing the two would be exactly the fabrication this system exists to prevent. Where
two employers have identical records — 313 of them are all `2/2` — they tie, because the data cannot
separate them and the tool will not pretend otherwise.

## Failure modes, and the one limitation it cannot verify

- **My first method was wrong, and breaking it is what found out.** Version 1 shrank each employer
  toward the fitted population rate (98.1%). `FEEDMOB INC`, with **0 approvals in 2 filings**, scored
  **0.879** — a number that reads as a strong sponsor while the record says the opposite; 25 employers
  were lifted more than 0.20 above their own rate. I first patched it with a label saying the score was
  borrowed, then threw the patch away: a label that contradicts the number it labels is decoration.
  Moving the anchor from 98.1% to 0.5 fixed the cause. `FEEDMOB` now scores **0.250**, held there by
  two regression invariants. It is still not 0 — two filings cannot prove an employer never sponsors —
  and the tool surfaces that adjustment rather than hiding it.
- **Precision at the top is not decision-relevant.** CONFLUENT 0.998366 vs JUNIPER 0.997596 is eight
  ten-thousandths. The ordering follows evidence; the gap does not mean #1 beats #4, and the output
  says so.
- **Among perfect records, the ranking is sample size alone.** For the 1,262 employers at 100%, the
  score reduces to `n/(n+2)`. That is intended — evidence is all that is left to rank on — but it
  systematically favours employers that file often, i.e. large ones, while this engine's own Form D
  detector exists to surface early-stage companies.
- **Silent data drift.** A renamed column exits 2 rather than guessing; a *replaced* source file
  changes every score with no error raised.
- **The limitation it cannot verify (the important one):** the component audits **sample size**, not
  **data quality**. It has no way to know whether the source counts are true. If an upstream join
  dropped an employer's filings, the credibility is computed correctly, is confidently wrong, and every
  invariant still passes. Verifying the record itself is the human call this hands back.

## Demo

```bash
npm run score:sponsor-credibility          # score everything; scored / EMPTY / ERROR
npm run score:sponsor-credibility:test     # 10/10 invariants, exit 0
node scripts/score/sponsorship-credibility.mjs --compare   # the two rankings, side by side
node scripts/score/sponsorship-credibility.mjs --movers    # the biggest adjustments, both directions
```

PR + full diff: _[PR link]_
