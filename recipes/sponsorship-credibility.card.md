# Card — Sample-Size-Aware Sponsorship Credibility (human-facing)

**Purpose.** Stop the engine from treating a 2-of-2 employer as the equal of a 610-of-610 employer.
It converts each employer's raw H-1B approval rate into a credibility score that accounts for how many
filings stand behind it, so the sponsorship signal reflects the weight of the record and not just its
surface.

**The defect it addresses (measured, not asserted).** On the real mapped H-1B file,
**1262 of 1557 employers sit at exactly 100%**. Ranking by raw rate produces a 1262-way tie broken by
row order — the raw top-10 comes out alphabetical (`1LIFE HEALTHCARE`, `1UPHEALTH`, `24M TECHNOLOGIES`,
`317 LABS`, …), median sample size **10 filings**. After adjustment the top-10 is
`CONFLUENT 610/610`, `DATADOG 340/340`, …, median sample size **240 filings**. Overlap: **0/10**.

**What it CAN verify.**
- That an employer's approval counts, as recorded in the source file, support a given credibility score
  (the arithmetic is a Beta posterior mean and is reproducible).
- That the ranking is ordered by weight of evidence: at an equal raw rate, more filings rank higher.
- That an employer with no usable record is reported EMPTY, never scored 0.
- That its own score is prior-borrowed when it is (it flags this itself, with the size of the lift).

**What it CANNOT verify.**
- **Whether the source counts are true.** It reads the DOL/USCIS-mapped file as given. If that file
  is stale, mis-joined, or missing an employer's filings, every downstream number is confidently wrong.
- **Whether an employer will sponsor *you*, for *this* role, *this* year.** Past filings are past.
- **Whether an employer absent from the file doesn't sponsor.** Absence is `Unknown`, and that is all
  it can honestly be.
- **The right prior for a subgroup.** The prior is fitted across all scored employers pooled; a
  biotech-only or startup-only prior would differ, and this component does not model that.

**Dependencies.** Node ≥ 20 (no external packages). Source record:
`data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped.csv` (columns `company_name`, `Total Approvals`,
`Total Denials`). Downstream consumer: `scripts/score/role-scorer.mjs` (`sponsorship.p`, Ch.11).

**Annotated commands.**
- `npm run score:sponsor-credibility` → fit the prior; print scored / EMPTY / ERROR counts.
- `npm run score:sponsor-credibility:test` → the invariants (expect 10/10, exit 0).
- `… --compare` → raw top-10 vs adjusted top-10, overlap, median sample size. **This is the claim.**
- `… --cautions` → the employers whose score is mostly borrowed from the prior. **Read this.**
- `… --company "NAME"` → one employer against its record.
- `… --emit output/sponsorship-credibility.json` → generated artifact (not a source of truth).

**What it produces.** Ranked stdout tables plus an optional JSON artifact under `output/`. It writes
nothing into `data/`, modifies no scorer, and commits nothing.

**Failure modes (≥4, including drift and contract-violation).**

1. **Drift — source schema or vintage changes.** If the CSV renames `Total Approvals`/`Total Denials`,
   the tool exits 2 rather than guessing column positions. The *silent* version of this drift is worse:
   the file is **replaced with a newer vintage** while the audit doc still describes the old one, and
   every score shifts with no error at all. *Mitigation:* the emitted JSON records `_source_record`;
   re-read the source audit on any data refresh. Nothing here detects a stale file.

2. **Contract-violation — EMPTY silently becoming 0.** The single most dangerous edit to this component
   would be scoring an employer with no record as `0` "to keep the table rectangular". That converts
   *absence of evidence* into *evidence of denial* — a fabricated fact, and by the book's definition
   the exact failure the engine exists to prevent. *Mitigation:* EMPTY employers are excluded from the
   scored list, and an invariant asserts `tier(null) === "Unknown"`.

3. **The prior rescuing a bad record (found by this component's own break attempt).** Shrinkage borrows
   strength from a population whose fitted rate is ~98%. `FEEDMOB INC` (0 approvals, 2 denials) shrinks
   to **0.879** — a number that reads as a strong sponsor while the record says the opposite. 25
   employers are lifted more than 0.20 above their own rate. *Mitigation (added after the break):* an
   adverse raw record is never promoted above `Thin`, and the lift is surfaced as a `caution` string
   rather than hidden inside one number. *Residual risk:* the posterior mean itself is still 0.879; a
   downstream consumer that reads `credibility` and ignores `tier` and `caution` will be misled.

4. **False precision — six decimal places on a thin record.** `0.982066` for a 2-of-2 employer looks
   like a measurement. It is a posterior mean whose spread is enormous; the point estimate hides that.
   *Mitigation:* `tier` and `caution` carry the uncertainty. This component does **not** emit a credible
   interval — that is not implemented yet, and is the honest next step.

5. **Selection bias in the fitted prior.** The prior is fitted only on employers that *have* H-1B
   filings — i.e. employers that already sponsor. An employer that has never sponsored is not in the
   pool, so the fitted ~98% describes "how sponsors fare once they file", not "how likely a company is
   to sponsor". *Mitigation:* the recipe's stop conditions forbid claiming labor-market coverage. This
   is a boundary of the source, not a bug in the arithmetic.

**Where human judgment still matters.** Whether an employer's *past* filings say anything about *your*
application; whether an `Unknown` is worth a direct ask; and whether a `caution`-flagged employer
belongs in a shortlist at all. The component ranks records. It does not know your case.
