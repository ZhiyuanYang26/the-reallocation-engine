# Instrument 2 — Data-frame audit (Ch 3), on the data behind my build

**Data:** `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped.csv`
(30,369 rows × 20 cols; SHA-256 `eccdee2a…`; repo audit dated 2026-05-28).

## Prediction-lock (dated 2026-07-28, BEFORE auditing)
I predicted the audit would surface a **survivorship/selection structure my tool ignores**: the
file is a *join*, so "no H-1B evidence" silently conflates "company didn't sponsor" with "company
never entered the join." I did not expect it to be as severe as it turned out.

## Datasheet (Gebru, adapted — key questions)
- **Why was it created?** To connect visa holders with funded startups able to sponsor (repo README,
  "80 Days to Stay").
- **What is an instance?** One company, with SEC funding fields + (sometimes) H-1B approval fields.
- **How assembled?** A join: SEC Form D funded-startup list × DOL LCA disclosure × USCIS H-1B
  Employer Data Hub.
- **What is NOT in it?** The repo's own join-validation audit states: **no raw DOL/USCIS records, no
  original employer names, no match scores, no match-method metadata** — so the false-positive rate
  of the join *cannot be estimated locally*. Provenance of the match is undocumented.
- **Time window?** Funding dates run to 2025-09-26; the H-1B window is undocumented in-repo.

## Six-step epistemic-frame reconstruction (compressed)
1. **Question the data answers:** "which SEC-funded startups have an H-1B track record?"
2. **Question my tool asks it:** "where should a student spend effort?" — a different question.
3. **Population:** SEC-funded companies, **not** all employers. Non-funded sponsors are absent by
   construction.
4. **Why exactly N rows?** 30,369 = the SEC funded-startup universe. Only **1,557 (5.1%)** carry any
   H-1B field; **28,812 (94.9%)** are null. My tool silently drops the 94.9%.
5. **Missingness type:** the 94.9% null is **not MCAR.** A company is null if it never filed *or* if
   the join missed it — MNAR tangled with match error. "No evidence" ≠ "no sponsorship."
6. **What the numbers mean:** `Approval_Rate` = USCIS approvals ÷ (approvals+denials) on filed
   petitions; median rate among H-1B rows = **100.0%**, median approvals = **10** — near-ceiling on
   tiny samples.

## Structural-assumptions table
| Assumption | Reality | Risk to my build |
|---|---|---|
| Sampling | SEC-funded startups only | Non-funded sponsors invisible; ranking is over a biased frame |
| Time-window | H-1B window undocumented | Can't tell if a "record" is current |
| Label-proxy | `Approval_Rate` = "good sponsor" | It's approval-given-petition, near-ceiling; poor proxy |
| MNAR | 94.9% null ≠ "doesn't sponsor" | Tool reads absence as evidence of absence |
| Feature-eng | join match undocumented | Can't estimate false-positive matches |
| Boundary | one row = one company | Company-level, never role- or team-level |

## Trace one row end to end
`DATABRICKS INC` → cols 16–18 = `1640, 8, 99.51456…` → my tool reads rate 99.5%, n=1648, computes
±100/√1648 ≈ ±2.5, ranks it **below** any 100%-on-≥62 firm. A row with 26× the evidence loses to
thinner rows — traceable directly to the rate-over-volume choice.

## Plant-and-find (a failure procedural EDA would miss)
A clean `df.describe()` on the 1,557 H-1B rows looks healthy: rates 0–100, no nulls in the scored
columns. **What it hides:** the *denominator*. The 94.9% of companies with null H-1B fields never
reach `describe()` at all, so the tool's world is silently 1/20th of the file — and among the
survivors the median sample is 10 filings. Procedural EDA on the scored subset would never reveal
that the ranking runs on a heavily selected, small-sample slice.

## Classical moves
- **Plato (labeled):** the **artifact** is a company's `Approval_Rate`; the **world** is "will this
  company sponsor a student like me?"; the **relationship** is thin and undocumented — a join whose
  own validation audit says its accuracy can't be checked locally.
- **Hume (labeled):** the 100% rates express confidence about *the petitions in the sample so far*,
  not about the world; with a median of 10 filings, that is confidence about a very short record.
