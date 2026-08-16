# Databricks Ranked 1,265th. A Company With Two Filings Ranked 1st.

**Zhiyuan Yang** · contribution to *The Reallocation Engine* (open-source, evidence-first job search)

---

## The problem

An international student on OPT has a fixed number of applications and a running clock. The
Reallocation Engine tells them where to spend that budget, and one of its strongest signals is how
reliably an employer's H-1B petitions get approved.

## The gap

That signal was read as a raw **approval rate** — and a rate on its own carries no sense of how much
evidence is behind it. Two out of two is 100%. Six hundred and ten out of six hundred and ten is also
100%. On the real DOL/USCIS-mapped file, **1,262 of 1,557 employers sit at exactly 100%**, so there is
nothing left to order them by, and the ranking falls back on the order of the rows.

| Employer | record | raw rate | rank by raw rate | **rank by credibility** |
|---|---|---|---|---|
| 1LIFE HEALTHCARE INC | 2/2 | 100.00% | **#1** | #1206 |
| CONFLUENT INC | 610/610 | 100.00% | #299 | **#1** |
| DATABRICKS INC | 1640/1648 | 99.51% | **#1265** | #11 |
| LINKEDIN CORP | 4962/4990 | 99.44% | #1267 | #14 |

Eight denials out of 1,648 pushed Databricks below a company we know almost nothing about. Nothing
upstream of the scorer weighed evidence. That is the piece this contribution adds.

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

**The top-10 shortlist a student would act on changes completely, and the evidence behind it goes up
28×.** Ten invariants pin the behaviour that matters — a thin perfect record must lose to a deep one,
a thin perfect record must still beat a deep mediocre one, and more evidence of denial must score
lower — and they run green on every commit.

## Verified vs. inferred

Every number the component emits is either a **record** value (the approval and denial counts) or
**script-output** computed from those counts. The only **authored** values are the rule's two
pseudo-counts and the tier bands, labeled as modeling choices. An employer with no usable record is
`Unknown`, never `0` — absence of evidence is not evidence of denial. Where two employers have
identical records (313 of them are all `2/2`), they tie, because the data cannot separate them.

## Failure modes, and the one limitation it cannot verify

- **The anchor can rescue an adverse record — observed, not hypothesised.** The first implementation
  shrank each employer toward the fitted population rate of 98.1%. Under it `FEEDMOB INC` — **zero
  approvals in two filings** — scored **0.879**, which reads as a strong sponsor, and 25 employers were
  lifted more than 0.20 above their own record. Shrinking toward a high average does not only pull
  favourable thin records down; it pulls adverse ones up. The first mitigation was a label declaring
  the score mostly borrowed — discarded, because **a true label wrapped around a wrong number is
  decoration, not a fix.** The anchor was moved to 0.5 instead; `FEEDMOB` scores **0.250** and two
  regression invariants hold it there. *Residual:* 0.250 is not 0, because two filings cannot establish
  that an employer never sponsors — the mirror of why 2/2 is not 1.000.
- **Precision at the top is not decision-relevant.** CONFLUENT 0.998366 vs JUNIPER 0.997596 is eight
  ten-thousandths; the output says so rather than implying #1 beats #4.
- **Among perfect records the ranking is sample size alone** (`n/(n+2)`), which systematically favours
  employers that file often — while this engine's own Form D detector exists to surface startups.
- **Contract-violation risk — EMPTY becoming 0.** Scoring an employer with no record as `0` would turn
  absence of evidence into evidence of denial. EMPTY employers are excluded from the scored list and an
  invariant pins `tier(null) === "Unknown"`.
- **Silent data drift.** A renamed column exits 2 rather than guessing; a *replaced* source file
  changes every score with no error raised.
- **The one limitation it cannot verify:** it audits **sample size**, not **data quality**. If an
  upstream join dropped an employer's filings, the credibility is computed correctly, is confidently
  wrong, and every invariant still passes. Verifying the record itself is the human call it hands back.

## Demo

Node ≥ 20; the component itself has no dependencies. From the repo root:

```bash
npm run score:sponsor-credibility                                          # score everything
npm run score:sponsor-credibility:test                                     # 10/10 invariants, exit 0
node scripts/score/sponsorship-credibility.mjs --compare                   # the two rankings
node scripts/score/sponsorship-credibility.mjs --rank "DATABRICKS INC"     # the rank table above
node scripts/score/sponsorship-credibility.mjs --movers                    # biggest adjustments
```

PR + full diff: _[PR link]_
