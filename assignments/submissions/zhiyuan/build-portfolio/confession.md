# The Confession — where I let the mistake in

## The mistake
I ranked companies by **`Approval_Rate`** — a percentage — as if it measured "the best place to
spend application effort." It does not. Among the 1,557 H-1B companies the **median approval rate is
100.0%** and the **median sample is 10 filings** (repo audit, 2026-05-28). So the metric is pinned
against a ceiling almost everyone touches, and the "winners" are simply the companies that haven't
hit a denial in a small sample. My tool put `6SENSE INSIGHTS` (100%, n=62) above `DATABRICKS`
(99.5%, n=1,648) — a firm with 26× the evidence — and called that a recommendation.

## The fluency I was defending
A clean **100%** *feels* like the strongest possible signal. It made the tool produce a crisp,
confident #1 with a tidy uncertainty margin, and it looked finished. I wanted the artifact to look
done more than I wanted to ask "100% of *what*, and out of how many?" That is the exact fluency this
course warns about — the output looked most trustworthy at the moment it was least examined.

## How an instrument caught it
The **robustness probe** (Instrument 1) forced it into the open: ranking by rate vs by volume gave a
**0/10 top-10 overlap**, and the #1 pick moved with every threshold and slice — because dozens of
firms tie at 100% and the "winner" is decided by file order. The **data-frame audit** (Instrument 2)
supplied the mechanism: median rate 100%, median n=10. I did not discover this gently; the probe I
wrote to confirm my build embarrassed it.

## What I changed, and the residual risk
- **Changed (partial):** I had already bolted on an n≥20 GIGO gate and ±margins — a patch that
  *reduces* the tiniest-sample noise but does not fix the metric.
- **Not fixed (honest):** rate still near-ceilings; even gated, it cannot finely rank. The real fix
  is to stop ranking on raw rate — rank on **volume**, or on a sample-size-aware lower bound (e.g.
  a Wilson lower bound on the approval proportion) so a 100%-on-62 cannot outrank a 99.5%-on-1,648.
  I have **not** implemented that; the tool as shipped still ranks on rate.
- **Residual risk:** anyone reading the current output would over-trust a small-sample 100% and
  under-rank the largest, most reliable sponsors — the precise inversion the confession describes.
