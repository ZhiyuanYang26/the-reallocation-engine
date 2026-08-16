# Audit — Sample-Size-Aware Sponsorship Credibility

**Component:** `scripts/score/sponsorship-credibility.mjs`
**Source record:** `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped.csv`
**Run date:** 2026-08-16 · **Recipe:** `recipes/sponsorship-credibility.md` v1.0.0

## What was measured

| Figure | Value | Provenance |
|---|---|---|
| Employers scored | 1557 | script-output (rows with usable approvals+denials) |
| Employers EMPTY (no usable record) | 28812 | script-output — reported, **not scored 0** |
| Employers ERROR (present, unparseable) | 0 | script-output |
| Fitted prior | α=17.0132, β=0.3472 (μ=0.9800, M=17.360, logLik=−11561.09) | script-output — beta-binomial MLE at run time, not a constant |
| Employers tied at exactly 100% raw rate | **1262 of 1557** | script-output — the defect |
| Raw top-10 median sample size | 10 filings | script-output |
| Adjusted top-10 median sample size | 240 filings | script-output |
| Overlap between the two top-10 lists | **0/10** | script-output |
| Prior-borrowed cautions raised | 25 | script-output |
| Self-test invariants | 10/10 pass, exit 0 | script-output |

## The defect, shown

Ranking 1557 employers by raw approval rate puts 1262 of them in a single tie at 1.0000. The tie is
broken by row order, so the "best sponsors in the country" come out alphabetical:

```
| # | Employer                | approvals/total | raw rate |
| 1 | 1LIFE HEALTHCARE INC    | 2/2             | 1.0000   |
| 2 | 1UPHEALTH INC           | 12/12           | 1.0000   |
| 3 | 24M TECHNOLOGIES INC    | 12/12           | 1.0000   |
| 4 | 317 LABS INC            | 2/2             | 1.0000   |
```

After adjustment the list is ordered by weight of evidence:

```
| 1 | CONFLUENT INC           | 610/610         | 0.999447 | Proven |
| 2 | DATADOG INC             | 340/340         | 0.999028 | Proven |
| 3 | AURIS HEALTH INC        | 276/276         | 0.998816 | Proven |
```

## Plausibility audit (before trusting the output)

1. **Does a deep near-perfect record beat a thin perfect one?** DATABRICKS 1640/1648 → 0.994988
   ranks above 2/2 → 0.982066. ✔
2. **Does a genuinely bad record stay bad?** 1/40 → 0.314. ✔
3. **Does a large sample converge to its own rate?** LINKEDIN 4962/4990: credibility 0.994339 vs raw
   0.994389 (Δ 0.00005). ✔
4. **Is "no record" kept distinct from "denied"?** `0XCORD INC` → `EMPTY — no H-1B counts on record
   (credibility null, tier Unknown — NOT zero)`. ✔
5. **Knife-edge threshold — FOUND AND FIXED.** DATABRICKS (1648 filings) was initially labeled
   `Likely` because 0.994988 fell 1.2e-5 short of an authored 0.995 cut, ranking it below a
   240-filing employer. The tier bands were widened (Proven: n≥100 ∧ c≥0.99). The thresholds remain
   **authored (`your-input`)** and are labeled as such — they are a reading convenience over the
   computed number, not a derived quantity.

## Deliberate break attempt (and what it found)

**Attempt:** feed the component employers whose records are *adverse* and thin, and see whether
shrinkage toward a ~98% population rate manufactures a good score.

**It broke.** `FEEDMOB INC` — 0 approvals, 2 denials — returned credibility **0.878762**. Three more
employers at 0/2 and one at 0/4 did the same; 25 employers were lifted more than 0.20 above their own
record. A student reading `credibility 0.88` would treat an employer that has never had an approval as
a strong sponsor. The arithmetic was correct and the output was wrong in exactly the way fluency hides.

**Fix applied:** an adverse raw record (< 0.75) is never promoted above `Thin` regardless of the
posterior, and the borrowed portion is surfaced as an explicit `caution` string naming how much of the
score came from the prior rather than from the employer. Two invariants were added as regression
guards (`0/2 stays Thin`, `0/2 carries a caution`), and a third asserts a deep record stays unflagged.
Self-test moved 7/7 → 10/10.

**Residual risk, stated:** the posterior mean for `FEEDMOB INC` is still 0.878762. A downstream
consumer that reads `credibility` and ignores `tier` and `caution` will still be misled. The component
cannot prevent that; the card names it.

## Ethics gate

- **Privacy:** the component reads one public-derived CSV under `data/80-days-to-stay/`; it touches no
  `data/ats/` file, no `private/` path, and no résumé. It writes only to `output/` (gitignored as a
  generated artifact) and commits nothing. `npm run doctor` clean.
- **Honesty:** every printed number is a count from the record or a value computed from those counts in
  this run. The tier thresholds are the only authored values and are labeled. No coverage rate,
  liveness call, or calibration figure is invented. EMPTY is never rendered as 0.

## What this run does not establish

That the source counts are correct; that any employer will sponsor a given applicant; that employers
absent from the file do not sponsor. The component ranks records. The judgment stays with the person.
