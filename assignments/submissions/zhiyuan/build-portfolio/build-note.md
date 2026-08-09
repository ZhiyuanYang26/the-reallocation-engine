# Build Note

**Artifact:** `reallocate.py` (in `../reallocation-audit/`) — a small tool that ranks companies by
their H-1B approval reliability and recommends moving one unit of an OPT student's application
effort from a weak company to a strong one, with an uncertainty margin and a hard stop before it
"commits."

**What it does:** reads `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped.csv` (30,369 companies),
keeps the 1,557 with H-1B fields, gates out any with fewer than 20 filings, scores the rest by
`Approval_Rate`, and prints a FROM→TO recommendation + `--approve` gate.

**Data:** the mapped SEC (Form D funded startups) × DOL LCA × USCIS H-1B Employer Data Hub join
shipped in this repo.

**The one decision I was least sure about (pre-registered suspect):**
**Ranking by `Approval_Rate` (a percentage) rather than by approval *volume* (a count).** At build
time I told myself a high approval rate is the cleanest signal of "a company that sponsors and
wins." I was uneasy because a rate hides its sample size — a 100% on 5 filings and a 100% on 1,600
look identical to the sort. I gated at n≥20 to paper over it and moved on. That gate is a patch on
a metric choice I never actually validated — so that is where I expect the mistake to be.
