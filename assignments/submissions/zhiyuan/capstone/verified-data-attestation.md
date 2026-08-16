# Verified-Data Attestation — Sample-Size-Aware Sponsorship Credibility

**Contribution:** `scripts/score/sponsorship-credibility.mjs` (+ recipe, card, audit)
**By:** Zhiyuan Yang · **Date:** 2026-08-16
**Source record:** `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped.csv`

## 1. The verified-vs-inferred boundary — every value this component emits

| Value emitted | Where it comes from | Label |
|---|---|---|
| `approvals`, `total` | `Total Approvals` / `Total Denials` columns of the source CSV | **record** |
| `raw_rate` | `approvals / total` | **script-output** |
| `credibility` | `(approvals + 1) / (total + 2)` | **script-output** |
| The two pseudo-counts (+1 success, +2 total) | Laplace's rule of succession — a named classical rule, chosen by me for this domain | **your-input** (modeling choice, not derived from this data) |
| `tier` (`Proven`/`Likely`/`Possible`/`Thin`/`Unknown`) | authored bands (n≥100 ∧ c≥0.95; n≥20 ∧ c≥0.90; n≥5 ∧ c≥0.70; else Thin) | **your-input** — a reading convenience over a computed number |
| `1557 scored · 28812 EMPTY · 0 ERROR` | row-by-row classification during the load | **script-output** |
| `1262 employers tied at exactly 100%` | count of `raw_rate === 1` | **script-output** |
| `215 distinct scores` | size of the set of computed credibility values | **script-output** |
| top-10 overlap `0/10`; median sample size `10 → 276` | comparison of two sorts of the same scored list | **script-output** |
| `10/10 invariants` and the exit code | count of failed assertions in `--self-test` | **script-output** |
| The `--movers` adjustment figures | `credibility − raw_rate` per employer | **script-output** |
| An employer with no counts | reported `EMPTY`, `credibility: null`, `tier: Unknown` | **missing** — explicitly *not* 0 |
| Which of two identically-recorded employers is better | — | **not emitted.** They tie; the tool invents no order. |
| Whether an employer will sponsor the reader | — | **not emitted.** The component makes no such claim. |

**No coverage rate, liveness call, or calibration figure is invented.** The only authored values are
the rule's two pseudo-counts and the four tier bands, labeled `your-input` above and on the card.

## 2. Every number traces

- `1557 / 28812 / 0` → printed by `npm run score:sponsor-credibility`, from the row loop in `load()`
  classifying each CSV row as scored / EMPTY / ERROR.
- `1262` → count of employers whose `approvals === total` in the source file.
- `215` → distinct values of `(k+1)/(n+2)` across the scored employers.
- `DATABRICKS INC 1640/1648 → 0.994545` and `TURO INC 172/172 → 0.994253` → `--company`; the counts
  are the CSV's, the scores are one division each and reproducible by hand.
- `FEEDMOB INC 0/2 → 0.250000` → `--movers`; this is the break-attempt employer, reported at its
  current value, not a claim of quality.
- `overlap 0/10`, `median 10 → 276` → `--compare`.
- `10/10` → `npm run score:sponsor-credibility:test`, exit 0.
- The superseded figures quoted in the honest run (α=17.0132, β=0.3472, `FEEDMOB 0.878762`,
  "25 employers lifted >0.20") are **script-output of version 1** of this component, recorded because
  the break attempt is part of the account. They are labeled as the previous method throughout and are
  not produced by the code being submitted.

## 3. Ethics gate, shown passing

**(a) Privacy.** The component reads one CSV under `data/80-days-to-stay/`. It touches no `data/ats/`
file, no `private/` path, and no résumé or personal document. It writes only to `output/` (a generated
artifact, not committed as a source of truth) and modifies nothing in `data/`. No PII appears in its
output — employer names only. `npm run doctor` privacy check: `✓ no private/PII paths are tracked`.

**(b) Honesty.** Every printed number is either a count read from the record or one division over
those counts. The component cannot misrepresent status: a missing source exits 2 rather than
estimating, a changed schema exits 2 rather than guessing columns, an employer with no record is
`Unknown` rather than 0, employers with identical records are left tied rather than ordered, and the
`--compare` output states in-line that near-top gaps are thousandths. A failing invariant exits 1.

Both gates pass, so the run happened.

## 4. What this attestation does **not** certify

That the source counts are accurate; that any employer will sponsor a specific applicant; that the
28812 `Unknown` employers do not sponsor; that the 0.5 anchor is the right modeling choice for every
use. It certifies provenance and labeling, not truth about the world.

## 5. Sign-off — a human, not the tool (SNICKERDOODLE: no self-certified honesty)

I have reviewed this contribution against the verified-data contract. Every number it emits is a
record value, a value computed from records in this run, or an authored modeling choice labeled
`your-input`. None is fabricated. I have read the `--movers` output in both directions (gate G5) and
the break-attempt account, including the residual risk that `FEEDMOB INC` scores 0.250 rather than 0
because two filings cannot establish that an employer never sponsors. The privacy and honesty gates
pass.

Signed: **Zhiyuan Yang**  ·  Date: **2026-08-16**
