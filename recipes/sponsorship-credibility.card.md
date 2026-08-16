# Card — Sample-Size-Aware Sponsorship Credibility (human-facing)

**Purpose.** Stop the engine from treating a 2-of-2 employer as the equal of a 610-of-610 employer.
It converts each employer's raw H-1B approval rate into a credibility score that accounts for how many
filings stand behind it, so the sponsorship signal reflects the weight of the record and not just its
surface.

**The rule.** `credibility = (approvals + 1) / (total + 2)` — Laplace's rule of succession. One
notional success and one notional failure, then the employer's own record. The anchor is **0.5, not
the 98.1% pooled rate**, deliberately: anchoring at the population rate lets the crowd vouch for an
employer that has not earned it (see failure mode 3).

**The defect it addresses (measured, not asserted).** On the real mapped H-1B file,
**1262 of 1557 employers sit at exactly 100%**. Ranking by raw rate produces a 1262-way tie broken by
row order — the raw top-10 comes out alphabetical (`1LIFE HEALTHCARE`, `1UPHEALTH`, `24M TECHNOLOGIES`,
`317 LABS`, …), median sample size **10 filings**. After adjustment the top-10 is
`CONFLUENT 610/610`, `JUNIPER 1244/1246`, `DATADOG 340/340`, …, median sample size **276 filings**.
Overlap: **0/10**.

**What it CAN verify.**
- That an employer's approval counts, as recorded in the source file, support a given credibility score
  (the arithmetic is one division and is reproducible by hand).
- That the ranking is ordered by weight of evidence: at an equal raw rate, more filings ranks higher.
- That uncertainty cuts both ways: `0/2 → 0.250` but `0/10 → 0.083` and `0/40 → 0.024`.
- That an employer with no usable record is reported EMPTY, never scored 0.

**What it CANNOT verify.**
- **Whether the source counts are true.** It reads the DOL/USCIS-mapped file as given. If that file
  is stale, mis-joined, or missing an employer's filings, every downstream number is confidently wrong.
- **Whether an employer will sponsor *you*, for *this* role, *this* year.** Past filings are past.
- **Whether an employer absent from the file doesn't sponsor.** Absence is `Unknown`, and that is all
  it can honestly be.
- **Which of two employers with identical records is better.** 313 employers in this file are all
  exactly `2/2`. They tie, and the tool will not invent an order.

**Dependencies.** Node ≥ 20 (no external packages). Source record:
`data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped.csv` (columns `company_name`, `Total Approvals`,
`Total Denials`). Downstream consumer: `scripts/score/role-scorer.mjs` (`sponsorship.p`, Ch.11).

**Annotated commands.**
- `npm run score:sponsor-credibility` → score everything; print scored / EMPTY / ERROR + distinct scores.
- `npm run score:sponsor-credibility:test` → the invariants (expect 10/10, exit 0).
- `… --compare` → raw top-10 vs adjusted top-10, overlap, median sample size. **This is the claim.**
- `… --movers` → the biggest adjustments in both directions. **Read this before acting.**
- `… --rank "NAME"` → where an employer sits under each ranking (raw vs credibility).
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

3. **The anchor choice — and the version of this component that got it wrong.** An earlier
   implementation used beta-binomial empirical Bayes with the prior fitted to the data
   (α=17.0132, β=0.3472, i.e. anchored at the 98.1% pooled rate). It scored `FEEDMOB INC` — **0
   approvals, 2 denials** — at **0.879**, a number that reads as a strong sponsor while the record says
   the opposite; 25 employers were lifted more than 0.20 above their own rate. The whole method was
   replaced, not patched. *Residual risk:* the current anchor of 0.5 still lifts `0/2` to `0.250`, and
   `--movers` exists precisely so a human sees that. Uncertainty genuinely cuts both ways; the tool
   cannot resolve two filings into a verdict, and neither can anyone else.

4. **False precision at the top.** `CONFLUENT 0.998366` vs `JUNIPER 0.997596` is a gap of eight
   ten-thousandths. The ordering is real (it follows evidence weight) but the difference is not
   decision-relevant, and a ranked table invites the reader to treat #1 as better than #4. *Mitigation:*
   `--compare` prints an explicit note that near-top gaps are thousandths. It is a caption, not a fix.

5. **The score is not a rate, and will be read as one.** `2/2 → 0.750` does not mean "75% of this
   employer's petitions are approved" — no employer in the file is near 75%; only 1.8% are below it.
   The field is named `credibility` and `raw_rate` is emitted alongside it so the two can be compared,
   but a consumer that plots `credibility` as an approval rate will mislead its reader.

6. **Among perfect records, the ranking is sample size and nothing else.** For the 1262 employers at
   100%, `credibility = n/(n+2)` — the rate contributes no information because it is identical. This is
   intended (evidence is the only thing left to rank on), but it means the tool systematically favours
   employers that file a lot, i.e. large ones — while this engine's own SEC Form D detector exists to
   surface early-stage companies. Ranking by credibility alone will bury a startup that genuinely
   sponsors.

**Where human judgment still matters.** Whether an employer's *past* filings say anything about *your*
application; whether an `Unknown` is worth a direct ask; whether a `2/2` startup is worth the risk that
this component cannot price. The component ranks records. It does not know your case.
