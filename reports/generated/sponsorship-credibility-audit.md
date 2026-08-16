# Audit — Sample-Size-Aware Sponsorship Credibility

**Component:** `scripts/score/sponsorship-credibility.mjs`
**Source record:** `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped.csv`
**Run date:** 2026-08-16 · **Recipe:** `recipes/sponsorship-credibility.md` v2.0.0

## What was measured

| Figure | Value | Provenance |
|---|---|---|
| Employers scored | 1557 | script-output |
| Employers EMPTY (no usable record) | 28812 | script-output — reported, **not scored 0** |
| Employers ERROR (present, unparseable) | 0 | script-output |
| Scoring rule | `(approvals + 1) / (total + 2)` — Laplace's rule of succession, anchor 0.5 | your-input (modeling choice) |
| Employers tied at exactly 100% raw rate | **1262 of 1557** | script-output — the defect |
| Distinct credibility values | 215 | script-output |
| Raw top-10 median sample size | 10 filings | script-output |
| Adjusted top-10 median sample size | 276 filings | script-output |
| Overlap between the two top-10 lists | **0/10** | script-output |
| Self-test invariants | 10/10 pass, exit 0 | script-output |

## The defect, shown

Ranking 1557 employers by raw approval rate puts 1262 of them in a single tie at 1.0000. The tie is
broken by row order, so the "best sponsors" come out alphabetical:

```
| 1 | 1LIFE HEALTHCARE INC    | 2/2   | 1.0000 |
| 2 | 1UPHEALTH INC           | 12/12 | 1.0000 |
| 3 | 24M TECHNOLOGIES INC    | 12/12 | 1.0000 |
| 4 | 317 LABS INC            | 2/2   | 1.0000 |
```

After adjustment the list is ordered by weight of evidence:

```
| 1 | CONFLUENT INC        | 610/610   | 0.998366 | Proven |
| 2 | JUNIPER NETWORKS INC | 1244/1246 | 0.997596 | Proven |
| 3 | DATADOG INC          | 340/340   | 0.997076 | Proven |
```

## Plausibility audit

1. **Deep near-perfect beats thin perfect.** 995/1000 → 0.9940 > 2/2 → 0.7500. ✔
2. **Thin perfect still beats deep mediocre.** 5/5 → 0.8571 > 700/1000 → 0.6996. ✔
3. **Uncertainty cuts both ways.** 0/2 → 0.2500 > 0/10 → 0.0833 > 0/40 → 0.0238. ✔
4. **Deep records keep their own rate.** 700/1000 → 0.699601 (Δ 0.0004 from 0.700). ✔
5. **"No record" stays distinct from "denied".** `0XCORD INC` → `EMPTY … NOT zero`. ✔
6. **Identical records are not falsely ordered.** 313 employers are all `2/2` and tie. ✔

## Deliberate break attempt — it cost the original method

**Version 1** used beta-binomial empirical Bayes with the prior fitted at run time (α=17.0132,
β=0.3472 — anchored at the 98.1% pooled rate). Feeding it adverse thin records broke it:
`FEEDMOB INC` (0 approvals, 2 denials) scored **0.878762**, and 25 employers were lifted more than
0.20 above their own rate. A number that reads as a strong sponsor, on a record that says the opposite.

The first response was a patch — refuse to promote an adverse record above tier `Thin`, and attach a
caution string. Both statements were true, and both were wrapped around a number that was still 0.879.
A label contradicting the number it labels is decoration, so the **method was replaced**: the anchor
moved from the fitted population rate to 0.5. `FEEDMOB INC` now scores **0.250**, and two invariants
(`0/2 > 0/10 > 0/40`, `c(0/2) < 0.30`) prevent a silent return.

**Residual risk:** 0.250 is not 0. Two filings cannot establish that an employer never sponsors, so
the tool declines to say so — the mirror of why `2/2` is not 1.000. Gate G5 (`--movers`) requires a
human to read both directions before the output drives a decision.

## Known limitations of the current rule

- **Precision at the top is not decision-relevant.** CONFLUENT 0.998366 vs JUNIPER 0.997596 is eight
  ten-thousandths. `--compare` prints this caveat in-line; it is a caption, not a fix.
- **Among the 1262 perfect records, the ranking is sample size alone** (`n/(n+2)`), because the rate
  carries no information when it is identical. Intended, but it systematically favours employers that
  file often — i.e. large ones — while this engine's Form D detector exists to surface early-stage
  companies.
- **The score is not a rate.** `2/2 → 0.750` does not mean 75% approval; only 1.8% of employers in the
  file are actually below 75%. `raw_rate` is emitted alongside so the two can be compared.
- **The anchor and the tier bands are authored.** A different anchor reorders thin records.

## Ethics gate

- **Privacy:** reads one public-derived CSV under `data/80-days-to-stay/`; touches no `data/ats/`
  file, no `private/` path, no résumé. Writes only to `output/`. `npm run doctor`:
  `✓ no private/PII paths are tracked`.
- **Honesty:** every printed number is a count from the record or one division over those counts. The
  authored values are labeled. EMPTY is never rendered as 0. Identical records are never falsely
  ordered.

## What this run does not establish

That the source counts are correct; that any employer will sponsor a given applicant; that employers
absent from the file do not sponsor. The component ranks records. The judgment stays with the person.
