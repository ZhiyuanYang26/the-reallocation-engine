# The Honest Run — Sample-Size-Aware Sponsorship Credibility

**Component:** `scripts/score/sponsorship-credibility.mjs` · **Run date:** 2026-08-16
All output below is pasted from the terminal, not described.

---

## 1. Plausibility audit — before trusting anything

| Check | Expected | Actual | |
|---|---|---|---|
| A deep near-perfect record beats a thin perfect one | 995/1000 > 2/2 | 0.9940 > 0.7500 | ✔ |
| A thin perfect record still beats a deep mediocre one | 5/5 > 700/1000 | 0.8571 > 0.6996 | ✔ |
| More evidence of denial scores lower | 0/2 > 0/10 > 0/40 | 0.2500 > 0.0833 > 0.0238 | ✔ |
| A deep record keeps its own rate | 700/1000 ≈ 0.700 | 0.699601 | ✔ |
| "No record" ≠ "denied" | EMPTY, not 0 | `tier Unknown — NOT zero` | ✔ |
| Employers with identical records are not falsely ordered | tie | 313 employers at `2/2` tie | ✔ |

## 2. The run

```
$ npm run score:sponsor-credibility

> the-reallocation-engine@1.0.0 score:sponsor-credibility
> node scripts/score/sponsorship-credibility.mjs

source        : data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped.csv
employers     : 1557 scored · 28812 EMPTY (no usable record) · 0 ERROR (unparseable)
rule          : credibility = (approvals + 1) / (total + 2)  — Laplace's rule of succession
                anchored at 0.5, NOT at the pooled rate — the population cannot vouch for an employer's own record
raw-rate ties : 1262 employers sit at exactly 100% on the raw rate (the tie this component breaks)
distinct scores: 215 (employers with identical records stay tied — the data cannot separate them)
```

```
$ npm run score:sponsor-credibility:test

SELF-TEST (invariants)
  PASS  more evidence of denial scores lower: c(0/2) > c(0/10) > c(0/40)
        0.2500 > 0.0833 > 0.0238
  PASS  monotone in sample size at equal raw rate: c(2/2) < c(18/18) < c(610/610)
        0.7500 < 0.9500 < 0.9984
  PASS  a thin perfect record does not outrank a deep near-perfect one: c(2/2) < c(995/1000)
        0.7500 < 0.9940
  PASS  a thin perfect record still beats a deep mediocre one: c(5/5) > c(700/1000)
        0.8571 > 0.6996
  PASS  a deep record keeps its own rate (|c - raw| < 0.001 at n=1000)
        c(700/1000)=0.699601 raw=0.700000
  PASS  an all-denied record is not rescued: c(0/2) < 0.30
        c(0/2)=0.2500
  PASS  a genuinely bad deep record stays bad: c(1/40) < 0.10
        c(1/40)=0.0476
  PASS  the score never reaches 0 or 1 (no record proves certainty)
        c(0/10000)=1.00e-4 c(10000/10000)=0.999900
  PASS  no record is scored 0 (EMPTY is null, not zero)
        tier(null) === "Unknown"
  PASS  identical records rank equal (no invented order)
        byRank(2/2, 2/2) === 0

10/10 invariants hold.
```

## 3. The metric readout — the claim, measured

```
$ node scripts/score/sponsorship-credibility.mjs --compare

TOP 10 BY RAW APPROVAL RATE (ties broken by file order — the defect)
| # | Employer | approvals/total | raw rate |
|---|---|---|---|
| 1 | 1LIFE HEALTHCARE INC | 2/2 | 1.0000 |
| 2 | 1UPHEALTH INC | 12/12 | 1.0000 |
| 3 | 24M TECHNOLOGIES INC | 12/12 | 1.0000 |
| 4 | 317 LABS INC | 2/2 | 1.0000 |
| 5 | 3DEO INC | 4/4 | 1.0000 |
| 6 | 6SENSE INSIGHTS INC | 62/62 | 1.0000 |
| 7 | 98POINT6 TECHNOLOGIES INC | 2/2 | 1.0000 |
| 8 | ABACUS INSIGHTS INC | 22/22 | 1.0000 |
| 9 | ACADEMIA INC | 10/10 | 1.0000 |
| 10 | ACCELA INC | 4/4 | 1.0000 |

TOP 10 BY SAMPLE-SIZE-AWARE CREDIBILITY
| # | Employer | approvals/total | raw rate | credibility | tier |
|---|---|---|---|---|---|
| 1 | CONFLUENT INC | 610/610 | 1.0000 | 0.998366 | Proven |
| 2 | JUNIPER NETWORKS INC | 1244/1246 | 0.9984 | 0.997596 | Proven |
| 3 | DATADOG INC | 340/340 | 1.0000 | 0.997076 | Proven |
| 4 | AURIS HEALTH INC | 276/276 | 1.0000 | 0.996403 | Proven |
| 5 | CCC INTELLIGENT SOLUTIONS HOLDINGS INC | 240/240 | 1.0000 | 0.995868 | Proven |
| 6 | ASTERA LABS INC | 208/208 | 1.0000 | 0.995238 | Proven |
| 7 | FUSION SURPLUS SOLUTIONS INC | 204/204 | 1.0000 | 0.995146 | Proven |
| 8 | CHIME FINANCIAL INC | 580/582 | 0.9966 | 0.994863 | Proven |
| 9 | PROCORE TECHNOLOGIES INC | 190/190 | 1.0000 | 0.994792 | Proven |
| 10 | SOCIAL FINANCE INC | 182/182 | 1.0000 | 0.994565 | Proven |

overlap between the two top-10 lists: 0/10
median sample size in the list: raw 10 filings → adjusted 276 filings
note: near the top the gaps are small (thousandths). The ordering is by weight of evidence,
      not a claim that #1 is meaningfully better than #4.
```

The raw list is **alphabetical**. That is not a coincidence and it is the whole finding: with 1262
employers tied at 1.0000, the "ranking" was row order wearing a percentage.

## 4. The deliberate break attempt — I made my own component produce a wrong answer, and it cost me the method

**Version 1 of this component was a different statistical method**: beta-binomial empirical Bayes,
with the prior fitted to the data by maximum likelihood at run time (α=17.0132, β=0.3472 — an anchor
at the 98.1% pooled approval rate). It passed a 7-invariant self-test and produced a clean top-10.

**The attack:** shrinkage borrows strength from the population. So feed it employers whose records are
*adverse* and thin, and see whether a 98% population rate manufactures a good score.

It did.

```
BREAK ATTEMPT — does a BAD small-sample record get rescued by the 98% prior?
   FEEDMOB INC              0/2   raw=0.000 -> cred=0.8788
   GLIMPSE ENGINEERING INC  0/2   raw=0.000 -> cred=0.8788
   MEASURABL INC            0/2   raw=0.000 -> cred=0.8788
   UPLIFT LABS INC          0/4   raw=0.000 -> cred=0.7965
   PRIME ARTIFICIAL INTELLIGENCE INC  2/6  raw=0.333 -> cred=0.8139
   25 employers rescued upward by >0.20
```

**`FEEDMOB INC` has never had an H-1B approval on this record — 0 for 2 — and version 1 scored it
0.879.** Read off a table, that is a strong sponsor. The arithmetic was correct and the output was
wrong in exactly the way fluency hides. It is the same class of failure as the raw-rate defect I built
the component to fix, pointing the other way: the raw rate over-trusted thin *good* records, and my
first fix over-trusted thin *bad* ones.

**My first response was a patch, and the patch was not honest enough.** I added a rule that an adverse
record could not be promoted above tier `Thin`, plus a `caution` string disclosing that the score was
mostly borrowed from the prior. Both were true statements wrapped around a number that was still 0.879.
A label that contradicts the number it labels is a decoration.

**So the method was replaced, not patched.** The anchor moved from the fitted population rate to 0.5 —
Laplace's rule of succession — because the population cannot vouch for an employer that has not earned
it. Under the current rule the same employers read:

```
$ node scripts/score/sponsorship-credibility.mjs --movers

LARGEST DOWNWARD ADJUSTMENTS (thin records losing their unearned 100%)
| Employer | approvals/total | raw rate | credibility | change |
|---|---|---|---|---|
| 1LIFE HEALTHCARE INC | 2/2 | 1.0000 | 0.750000 | -0.2500 |
| 317 LABS INC | 2/2 | 1.0000 | 0.750000 | -0.2500 |
| 98POINT6 TECHNOLOGIES INC | 2/2 | 1.0000 | 0.750000 | -0.2500 |

LARGEST UPWARD ADJUSTMENTS (thin adverse records — uncertainty cuts both ways)
| Employer | approvals/total | raw rate | credibility | change |
|---|---|---|---|---|
| FEEDMOB INC | 0/2 | 0.0000 | 0.250000 | +0.2500 |
| GLIMPSE ENGINEERING INC | 0/2 | 0.0000 | 0.250000 | +0.2500 |
| UPLIFT LABS INC | 0/4 | 0.0000 | 0.166667 | +0.1667 |
```

`FEEDMOB INC`: **0.879 → 0.250**. Two new invariants pin it there (`0/2 > 0/10 > 0/40` and
`c(0/2) < 0.30`), so the failure cannot return silently.

**The residual risk, stated plainly:** 0.250 is still not 0. Two filings cannot establish that an
employer never sponsors, so the tool declines to say so — the same reason `2/2` is not 1.000.
Uncertainty cuts both ways and `--movers` (gate G5) exists so a human sees both sides before acting.

## 5. A second plausibility failure, found and fixed

Version 1's tier labels were knife-edged: DATABRICKS (1640/1648) was labeled `Likely` because its
score fell **1.2 × 10⁻⁵** short of an authored 0.995 cut, ranking it below 240-filing employers. Under
the current rule it reads:

```
| DATABRICKS INC | 1640/1648 | 0.9951 | 0.994545 | Proven |
| TURO INC       | 172/172   | 1.0000 | 0.994253 | Proven |
```

DATABRICKS ranks just above TURO — 1648 filings at 99.51% outweigh 172 at 100%, which is the intended
behaviour. **But the gap is 0.0003.** The ordering is defensible; the precision is not. `--compare`
now prints that near-top gaps are thousandths, so the table is not read as a claim that #1 beats #4.

## 6. The gates, shown stopping

```
$ node scripts/score/sponsorship-credibility.mjs --csv data/nope.csv
ERROR: H-1B source not found: data/nope.csv
        (this component reads a record or it does not run — it does not estimate)
EXIT=2
```

```
$ node scripts/score/sponsorship-credibility.mjs --company "0XCORD"
0XCORD: EMPTY — no H-1B counts on record (credibility null, tier Unknown — NOT zero)
```

A stopped run is a successful outcome. Both gates refuse rather than substitute.

## 7. What the machine could not know

- **Whether the source counts are true.** The component reads the DOL/USCIS-mapped file as given. If a
  join dropped an employer's filings, the score is confidently wrong and nothing here would notice.
  It audits **sample size**, not **data quality** — those are different doubts, and I did one of them.
- **Whether an employer will sponsor *you*.** 610 past approvals at Confluent describe Confluent's
  past, not your case, your year, or your cap-exempt status.
- **Which of 313 identical `2/2` employers is the better bet.** They score identically because the
  record is identical. The tool refuses to invent an order; choosing among them is research a person
  does — a recruiter email, a LinkedIn search — outside this system.
- **What `Unknown` means for a specific company.** 28812 employers have no usable counts. Some do not
  sponsor. Some sponsor and were not mapped. A real sponsor can sit invisible in that pile.
- **Whether a `2/2` startup is worth the risk.** The component prices evidence, not upside. Ranking by
  credibility systematically favours employers that file often — i.e. large ones — while this engine's
  own Form D detector exists to surface early-stage companies. Weighing that trade-off is the human
  call this hands back.
