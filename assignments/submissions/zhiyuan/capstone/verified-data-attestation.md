# Verified-Data Attestation — Sample-Size-Aware Sponsorship Credibility

**Contribution:** `scripts/score/sponsorship-credibility.mjs` (+ recipe, card, audit)
**By:** Zhiyuan Yang · **Date:** 2026-08-16
**Source record:** `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped.csv`

## 1. The verified-vs-inferred boundary — every value this component emits

| Value emitted | Where it comes from | Label |
|---|---|---|
| `approvals`, `total` | `Total Approvals` / `Total Denials` columns of the source CSV | **record** |
| `raw_rate` | `approvals / total` | **script-output** |
| Fitted prior α=17.0132, β=0.3472 (μ=0.9800, M=17.360) | beta-binomial MLE over the 1557 scored records, computed **at run time** | **script-output** (not a constant; re-fits if the data changes) |
| `logLik = −11561.09` | value of the fitted log-likelihood | **script-output** |
| `credibility` | `(α + approvals) / (α + β + total)` | **script-output** |
| `caution` string and its lift figure | `credibility − raw_rate`, compared to an authored 0.20 cut | **script-output** over an **authored threshold** |
| `tier` (`Proven`/`Likely`/`Possible`/`Thin`/`Unknown`) | authored bands (n≥100 ∧ c≥0.99; n≥20 ∧ c≥0.98; n≥5; else Thin; adverse raw < 0.75 → Thin) | **your-input** — a reading convenience over a computed number, not derived from data |
| `1557 scored · 28812 EMPTY · 0 ERROR` | row-by-row classification during the load | **script-output** |
| `1262 employers tied at exactly 100%` | count of `raw_rate === 1` | **script-output** |
| top-10 overlap `0/10`; median sample size `10 → 240` | comparison of two sorts of the same scored list | **script-output** |
| `10/10 invariants` and the exit code | count of failed assertions in `--self-test` | **script-output** |
| An employer with no counts | reported `EMPTY`, `credibility: null`, `tier: Unknown` | **missing** — explicitly *not* 0 |
| Whether an employer will sponsor the reader | — | **not emitted.** The component makes no such claim. |

**No coverage rate, liveness call, or calibration figure is invented.** The only authored values are
the five tier thresholds and the 0.20 caution cut, labeled `your-input` above and in the card.

## 2. Every number traces

- `1557 / 28812 / 0` → printed by `npm run score:sponsor-credibility`, from the row loop in
  `load()` classifying each CSV row as scored / EMPTY / ERROR.
- `α=17.0132, β=0.3472, logLik=−11561.09` → `fitPrior()` grid search + coordinate refine over the
  beta-binomial likelihood of the 1557 scored records. Re-run to reproduce; independently reproduced
  in Python (`mu=0.9800, M=18.322` on a coarser grid) before the JS fit was written.
- `1262` → count of employers whose `approvals === total` in the source file.
- `DATABRICKS INC 1640/1648 → 0.994988` → `--company "DATABRICKS INC"`; the counts are the CSV's.
- `FEEDMOB INC 0/2 → 0.878762` → `--cautions`; this is the break-attempt finding, not a claim of quality.
- `overlap 0/10`, `median 10 → 240` → `--compare`.
- `10/10` → `npm run score:sponsor-credibility:test`, exit 0.

## 3. Ethics gate, shown passing

**(a) Privacy.** The component reads one CSV under `data/80-days-to-stay/`. It touches no `data/ats/`
file, no `private/` path, and no résumé or personal document. It writes only to `output/`
(a generated artifact, not committed as a source of truth) and modifies nothing in `data/`. No PII
appears in its output — employer names only. `npm run doctor` privacy check: clean (see RUN_LOG).

**(b) Honesty.** Every printed number is either a count read from the record or a value computed from
those counts during the run. The component cannot misrepresent status: a missing source exits 2 rather
than estimating, a changed schema exits 2 rather than guessing columns, an employer with no record is
`Unknown` rather than 0, and a score that is mostly borrowed from the prior is printed with a caution
saying so. A failing invariant exits 1.

Both gates pass, so the run happened.

## 4. What this attestation does **not** certify

That the source counts are accurate; that any employer will sponsor a specific applicant; that the
28812 `Unknown` employers do not sponsor. It certifies provenance and labeling, not truth about the
world.

## 5. Sign-off — a human, not the tool (SNICKERDOODLE: no self-certified honesty)

I have reviewed this contribution against the verified-data contract. Every number it emits is a
record value, a value computed from records in this run, or an authored threshold labeled `your-input`.
None is fabricated. I have read the prior-borrowed caution list (gate G5) and the break-attempt
finding, including the residual risk that `FEEDMOB INC` still carries a posterior mean of 0.878762.
The privacy and honesty gates pass.

Signed: **Zhiyuan Yang**  ·  Date: **2026-08-16**
