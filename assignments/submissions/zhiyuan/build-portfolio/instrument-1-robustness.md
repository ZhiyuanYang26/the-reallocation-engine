# Instrument 1 — Robustness probe (Ch 4), turned on my own build

**Target:** `reallocate.py`'s ranking (companies by `Approval_Rate`, gated at n≥20).
**Probe script:** `robustness_probe.py` (reproduces everything below).

## Prediction-lock (dated 2026-07-28, BEFORE running)
I predicted the ranking is fragile: (1) the #1 pick moves with the GIGO threshold; (2) ranking by
rate and ranking by volume give near-disjoint top-10 lists; (3) the top pick changes on a
geographic slice. I expected fragility because the metric near-ceilings — a lot of ties at 100%.

## Method & results (real output, 2026-07-28)
```
PROBE 1 - perturbation: vary GIGO threshold
  n>=5  : #1 = 1UPHEALTH INC        rate=100.0% n=12
  n>=20 : #1 = 6SENSE INSIGHTS INC  rate=100.0% n=62
  n>=50 : #1 = 6SENSE INSIGHTS INC  rate=100.0% n=62
  n>=100: #1 = ADDEPAR INC          rate=100.0% n=150

PROBE 2 - proxy-feature: rank by RATE vs by VOLUME (n>=20)
  top-10 by rate   : ['6SENSE INSIGHTS INC', 'ABACUS INSIGHTS INC', 'ACCOLADE INC'] ...
  top-10 by volume : ['INTEL CORP', 'MICROSOFT CORP', 'DELOITTE CONSULTING LLP'] ...
  overlap of the two top-10 lists: 0 / 10

PROBE 3 - distribution-shift: CA-only vs non-CA (n>=20)
  CA     : #1 = 6SENSE INSIGHTS INC   rate=100.0% n=62
  non-CA : #1 = ABACUS INSIGHTS INC   rate=100.0% n=22
```
Every prediction held. All four "winners" are tied at 100.0% — the metric cannot separate them, so
the identity of "#1" is decided by the threshold, the slice, or (in `reallocate.py`'s rate-only,
stable sort) **file order**.

## Features-not-bugs framing
- **The proxy my build learned:** "high `Approval_Rate` = a good company to spend effort on."
- **The human-relevant feature it should track:** a company that sponsors *reliably and at scale* —
  which is far closer to approval **volume** than to rate. Probe 2's **0/10 overlap** is the gap
  made visible: rate surfaces obscure small firms; volume surfaces Intel/Microsoft/Deloitte.
- **What the gap says:** the rate is a proxy for "hasn't hit a denial in a small sample," not for
  "sponsors dependably." The build optimized the proxy.

## Robustness profile
| Dimension | Robust against what? | Residual risk | Monitoring |
|---|---|---|---|
| GIGO threshold | Nothing — #1 changes at n≥5 / 20 / 100 | User picks a threshold and gets a different "best" | Report the pick's n; flag if #1 flips within ±1 threshold step |
| Metric choice (rate vs volume) | Nothing — 0/10 overlap | Rate systematically hides big reliable sponsors | Show both rankings side by side; never rate alone |
| Geographic slice | Nothing — CA vs non-CA #1 differs | Sub-population ranking ≠ global ranking | Re-run per region; report ties-at-ceiling count |

## Classical moves
- **Popper (labeled):** falsification condition set in advance — *if the #1 pick were stable across
  all three probes, my "fragile" claim fails.* It was not stable; the claim stands.
- **Descartes (labeled):** how "the #1 company is the best place to spend effort" could be false —
  (a) it's #1 only at this threshold; (b) it's #1 only in this slice; (c) it's tied with dozens of
  others at 100% and won on file order; (d) "rate" isn't the feature that matters. Probes 1–3
  showed (a)–(c) true and (d) plausible.
