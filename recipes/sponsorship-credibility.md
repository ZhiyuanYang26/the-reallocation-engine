---
status: RUNNABLE-LIVE
todos_open: 0
last_gate: G5
attestation: human-signed 2026-08-16 (Zhiyuan Yang)
recipe_version: 2.0.0
---

# Recipe — Sample-Size-Aware Sponsorship Credibility

## 1. Executive Summary

Turn each employer's raw H-1B approval **rate** into a **credibility** score that accounts for how
many filings the rate is based on. On the real DOL/USCIS-mapped file, **1262 of 1557 employers sit at
exactly 100%** — a 2-of-2 employer and a 610-of-610 employer are indistinguishable, and the ranking is
a 1262-way tie broken by row order (the raw top-10 comes out alphabetical).

The rule is Laplace's rule of succession: `credibility = (approvals + 1) / (total + 2)`. Every
employer starts with one notional success and one notional failure, then its own record is added.
Thin records are pulled toward the middle **in both directions** — `2/2 → 0.750`, `0/2 → 0.250` — while
`700/1000 → 0.6996` keeps essentially its own rate. Credibility is earned by evidence.

It feeds `sponsorship.p` for the Ch.11 Role Scorer. It **does not** modify the scorer.

It refuses two things: it never scores an employer with no record as `0` (no record ≠ denial — that is
EMPTY, tier `Unknown`), and it never invents an order between employers whose records are identical.

## 2. Required Reads (read before running — read-first order)

1. `DATA_CONTRACT.md` — the verified-data contract ("never invent a count, a rate, or a coverage number").
2. `recipes/_shared.md` — frontmatter, phase gates, logging rules, prime directive.
3. `recipes/sponsorship-credibility.card.md` — the human card: what this can and cannot verify.
4. `scripts/score/role-scorer.mjs` header — how `sponsorship.p` is consumed downstream (Ch.11).
5. `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md` — the provenance of the source file.

## 3. Phase Gates (each with a failure path — a gate with no failure path is decoration)

| Gate | Condition | Test | Failure path |
|---|---|---|---|
| **G1 — source present** | The H-1B record file exists at the configured path | `test -f data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped.csv` | **STOP.** Exit 2 with `ERROR: H-1B source not found`. Do not estimate, do not substitute a default rate. |
| **G2 — schema intact** | Columns `company_name`, `Total Approvals`, `Total Denials` are present by name | run the tool; it exits 2 on missing columns | **STOP.** Exit 2, `refusing to guess column positions`. Schema drift is reported, never worked around. |
| **G3 — EMPTY separated from ERROR** | Employers with no usable counts are reported EMPTY (not scored, not 0); unparseable rows are counted ERROR | `npm run score:sponsor-credibility` → header line shows both counts | If EMPTY collapses into `0`, **STOP** — that is a fabricated denial. Fix before shipping. |
| **G4 — invariants hold** | All self-test invariants pass, including the both-directions guard (`0/2 > 0/10 > 0/40`) and the no-rescue guard (`0/2 < 0.30`) | `npm run score:sponsor-credibility:test` (exit 0) | **STOP** on exit 1. A failing invariant means the score is not ordered the way the record is. Do not emit. |
| **G5 — human read the adjustments** | The largest upward and downward adjustments have been reviewed by a person | `node scripts/score/sponsorship-credibility.mjs --movers` | If unreviewed, the run is **SAMPLE**, not LIVE. A thin adverse record adjusted upward must not reach a decision unread. |

## 4. Primary Stored Tools

- `scripts/score/sponsorship-credibility.mjs` — the component (Node ≥ 20, no external dependencies).
- `npm run score:sponsor-credibility` · `npm run score:sponsor-credibility:test`.
- No stored script exists for joining this output into a live posting feed — that join is **not
  implemented yet** and is not claimed.

## 5. Workflow (verbatim commands, in order)

```bash
# 1. G1/G2/G3 — score, report scored / EMPTY / ERROR and the distinct-score count
npm run score:sponsor-credibility

# 2. G4 — invariants (must exit 0)
npm run score:sponsor-credibility:test

# 3. The measurable claim: raw ranking vs sample-size-aware ranking
node scripts/score/sponsorship-credibility.mjs --compare

# 4. G5 — the largest adjustments in both directions; a human reads this
node scripts/score/sponsorship-credibility.mjs --movers

# 5. Emit for downstream use (generated artifact, not a source of truth)
node scripts/score/sponsorship-credibility.mjs --emit output/sponsorship-credibility.json

# 6. Spot-check a named employer against the record
node scripts/score/sponsorship-credibility.mjs --company "DATABRICKS INC"

# 7. Where an employer sits under each ranking (raw rank vs credibility rank)
node scripts/score/sponsorship-credibility.mjs --rank "DATABRICKS INC"
```

## 6. Output Contract

**Machine (`--emit`, JSON):** `_component`, `_chapter`, `_source_record`, `_rule` (the formula in
words), `_counts` (scored / empty / error / distinct_scores), and per employer:
`company · approvals · total · raw_rate · credibility · tier · source:"record"`, ranked.
EMPTY employers are listed separately and are **absent** from `employers` — they are not scored 0.

**Human (stdout):** the source path, the scored/EMPTY/ERROR counts, the rule and its anchor, the
raw-rate tie count, the distinct-score count, and — under `--compare` — the two ranked tables plus
overlap, median sample size, and a note that gaps near the top are thousandths.

Every emitted number is `record` (the counts) or `script-output` (everything derived). The rule's two
pseudo-counts and the four tier bands are `your-input`. Nothing is `model-inference`.

## 7. Verification Checks

1. `npm run score:sponsor-credibility:test` → **10/10 invariants**, exit 0.
2. Both directions: `c(0/2) > c(0/10) > c(0/40)` — more evidence of denial scores lower.
3. Monotone in evidence: at an identical raw rate, credibility rises with sample size.
4. No rescue: `c(0/2) = 0.25 < 0.30`; `c(1/40) = 0.048 < 0.10`.
5. Deep records keep their rate: `c(700/1000) = 0.6996`, within 0.001 of 0.700.
6. EMPTY ≠ 0: `--company` on an employer with no counts prints `EMPTY … NOT zero`.
7. `npm run verify` (conformance + manifest) and `npm run doctor` are clean.

## 8. Logging Rules

Append one entry to `logs/RUN_LOG.md` per meaningful run: date, source file, scored/EMPTY/ERROR counts,
the rule in force, the distinct-score count, the `--compare` overlap and median-sample-size shift, the
largest adjustment in each direction, and any invariant that failed. Generated artifacts go to
`output/` and are **never** committed as a source of truth. If a run is stopped by a gate, log the gate
and the reason — a stopped run is a successful outcome, not a gap in the record.

## 9. Stop Conditions

- **Stop** if the source file is missing or its columns changed (G1/G2) — exit 2, never substitute.
- **Stop** if any invariant fails (G4) — the ordering is not trustworthy; do not emit.
- **Stop** before letting a thin adverse record adjusted upward (e.g. `0/2 → 0.25`) drive an
  Apply/Skip decision without a human reading `--movers` (G5).
- **Stop** and label the run SAMPLE rather than claiming coverage the source does not have: this file
  covers employers with SEC-mapped H-1B filings only, not the labor market.
- **Never** infer a rate for an employer with no record. Prefer `Unknown` over a number.
- **Never** break a tie between employers with identical records. If the data cannot separate them,
  neither may the tool.
