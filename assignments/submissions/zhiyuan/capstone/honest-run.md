# The Honest Run — Sample-Size-Aware Sponsorship Credibility

**Component:** `scripts/score/sponsorship-credibility.mjs` · **Run date:** 2026-08-16
All output below is pasted from the terminal, not described.

---

## 1. Plausibility audit — before trusting anything

I checked five things a wrong-but-fluent version would fail:

| Check | Expected | Actual | |
|---|---|---|---|
| Deep near-perfect beats thin perfect | DATABRICKS > 2/2 | 0.994988 > 0.982066 | ✔ |
| A bad record stays bad | 1/40 well below 0.5 | 0.314035 | ✔ |
| Large n converges to its own rate | Δ < 0.002 at n=4990 | Δ = 0.00005 | ✔ |
| "No record" ≠ "denied" | EMPTY, not 0 | `tier Unknown — NOT zero` | ✔ |
| Tier labels track evidence | a 1648-filing employer is not demoted | **FAILED** — see §4 | ✘→fixed |

## 2. The run

```
$ npm run score:sponsor-credibility

> the-reallocation-engine@1.0.0 score:sponsor-credibility
> node scripts/score/sponsorship-credibility.mjs

source        : data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped.csv
employers     : 1557 scored · 28812 EMPTY (no usable record) · 0 ERROR (unparseable)
fitted prior  : alpha=17.0132  beta=0.3472  (mu=0.9800, M=17.360, logLik=-11561.09)
                ^ estimated from these 1557 records by beta-binomial MLE at run time — not a constant
raw-rate ties : 1262 employers sit at exactly 100% on the raw rate (the tie this component breaks)
cautions      : 25 employers carry a prior-borrowed caution (score lifted >0.2 above their own record)
```

```
$ npm run score:sponsor-credibility:test

SELF-TEST (invariants)
  PASS  monotone in sample size at equal raw rate: c(2/2) < c(18/18) < c(610/610)
        0.982066 < 0.990181 < 0.999447
  PASS  a thin perfect record does not outrank a deep near-perfect one: c(2/2) < c(1640/1648)
        0.982066 < 0.994988
  PASS  shrinkage is toward the fitted rate, never above 1 or below 0
        c(0/3)=0.835602 c(3/3)=0.982947
  PASS  a genuinely bad record stays bad: c(1/40) < 0.5
        c(1/40)=0.314035
  PASS  large n converges to the raw rate (|c - raw| < 0.002 at n=4990)
        c=0.994339 raw=0.994389
  PASS  no record is scored 0 (EMPTY is null, not zero)
        tier(null) === "Unknown"
  PASS  an adverse thin record is never promoted above Thin: 0/2 stays Thin
        c(0/2)=0.878762 tier=Thin
  PASS  a prior-borrowed score is flagged, not shipped silently: 0/2 carries a caution
        prior-borrowed: raw record is 0.0% on a thin sample; 0.879 of this score comes from the populati
  PASS  a well-evidenced employer carries no caution: 1640/1648 is unflagged
        no caution on a deep record
  PASS  prior was fitted, not assumed (M is finite and > 0)
        M=17.360 mu=0.9800

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
| 1 | CONFLUENT INC | 610/610 | 1.0000 | 0.999447 | Proven |
| 2 | DATADOG INC | 340/340 | 1.0000 | 0.999028 | Proven |
| 3 | AURIS HEALTH INC | 276/276 | 1.0000 | 0.998816 | Proven |
| 4 | CCC INTELLIGENT SOLUTIONS HOLDINGS INC | 240/240 | 1.0000 | 0.998651 | Proven |
| 5 | ASTERA LABS INC | 208/208 | 1.0000 | 0.998459 | Proven |
| 6 | FUSION SURPLUS SOLUTIONS INC | 204/204 | 1.0000 | 0.998431 | Proven |
| 7 | PROCORE TECHNOLOGIES INC | 190/190 | 1.0000 | 0.998326 | Proven |
| 8 | SOCIAL FINANCE INC | 182/182 | 1.0000 | 0.998258 | Proven |
| 9 | TURO INC | 172/172 | 1.0000 | 0.998166 | Proven |
| 10 | JUNIPER NETWORKS INC | 1244/1246 | 0.9984 | 0.998142 | Proven |

overlap between the two top-10 lists: 0/10
median sample size in the list: raw 10 filings → adjusted 240 filings
```

The raw list is **alphabetical**. That is not a coincidence and it is the whole finding: with 1262
employers tied at 1.0000, the "ranking" was row order wearing a percentage.

## 4. The plausibility failure I found in my own component

The tier labels are authored thresholds. On the first pass DATABRICKS (1640/1648) came back:

```
| DATABRICKS INC | 1640/1648 | 0.9951 | 0.994988 | Likely |
```

`Likely` — below employers with 240 filings — because 0.994988 fell **1.2 × 10⁻⁵** short of an
authored 0.995 cut. A knife-edge constant was silently outranking 1648 records. I widened the bands
(Proven: n ≥ 100 ∧ c ≥ 0.99) and re-ran:

```
| DATABRICKS INC | 1640/1648 | 0.9951 | 0.994988 | Proven |
```

The thresholds are still authored. They are labeled `your-input` in the attestation rather than
presented as derived, because that is what they are.

## 5. The deliberate break attempt — I made it produce a wrong answer

**The attack:** shrinkage borrows strength from a population whose fitted rate is 98%. So feed it an
employer whose record is *adverse* and thin, and see whether the prior manufactures a good score.

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

**`FEEDMOB INC` has never had an H-1B approval on this record — 0 for 2 — and my component scored it
0.879.** Read off a table, that is a strong sponsor. The arithmetic was right; the output was wrong in
exactly the way fluency hides. This is the same class of failure as the raw-rate defect I built the
component to fix, pointing the other direction: the first version over-trusted thin *good* records,
and my fix made it over-trust thin *bad* ones.

**What I changed:** an adverse raw record (< 0.75) can no longer be promoted above `Thin`, and the
borrowed portion is now printed as a caution naming how much of the score is not the employer's:

```
$ node scripts/score/sponsorship-credibility.mjs --cautions

PRIOR-BORROWED SCORES (the component flagging its own weakest output)
| Employer | approvals/total | raw rate | credibility | lift | tier |
|---|---|---|---|---|---|
| FEEDMOB INC | 0/2 | 0.0000 | 0.878762 | +0.879 | Thin |
| UPLIFT LABS INC | 0/4 | 0.0000 | 0.796483 | +0.796 | Thin |
| PRIME ARTIFICIAL INTELLIGENCE INC | 2/6 | 0.3333 | 0.813907 | +0.481 | Thin |
| ANSA BIOTECHNOLOGIES INC | 2/4 | 0.5000 | 0.890114 | +0.390 | Thin |
```

Two regression invariants were added so this cannot come back silently. Self-test went 7/7 → 10/10.

**The residual risk I did not fix:** `FEEDMOB INC`'s credibility is still 0.878762. I chose not to
overwrite the posterior mean, because the number is arithmetically correct and quietly altering it
would be its own dishonesty. A downstream consumer that reads `credibility` and ignores `tier` and
`caution` will still be misled. That is written on the card as a live failure mode, not resolved.

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
  My component audits *sample size*, not *data quality* — and those are different doubts.
- **Whether an employer will sponsor *you*.** 610 past approvals at Confluent describe Confluent's
  past, not your case, your year, or your cap-exempt status.
- **What `Unknown` means for a specific company.** 28812 employers have no usable counts. Some do not
  sponsor. Some sponsor and were not mapped. The component reports `Unknown` for all of them and
  refuses to guess, which means a real sponsor can sit invisible in that pile. Finding out is a phone
  call or an email to a recruiter — a human action, outside this system.
- **Whether the fitted 98% prior is the right population for a given employer.** It is fitted across
  all scored employers pooled — companies that already file. A biotech-only or seed-stage-only prior
  would differ. Choosing the right comparison group is a judgment I hand back.
