# Skeptic's Portfolio — Build It, Then Break It

**Zhiyuan Yang · INFO 7375 · 2026-07-28**

I built a small reallocation tool, then turned two of the course's instruments on **my own** work
and found where I let a mistake in.

## Artifact
`../reallocation-audit/reallocate.py` — ranks companies by H-1B approval reliability and recommends
moving a unit of application effort, with an uncertainty margin and a hard stop.
Probe harness: `robustness_probe.py` (this folder).

## Run / reproduce
```bash
# the build
python ../reallocation-audit/reallocate.py

# instrument 1's probes
python robustness_probe.py
```
No dependencies (stdlib). Both read `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped.csv`.

## Contents
| File | Step |
|---|---|
| `build-note.md` | Step 1 — what it does + the pre-registered suspect decision |
| `robustness_probe.py` | the Instrument 1 harness |
| `instrument-1-robustness.md` | Step 3 — robustness probe (prediction-lock, profile, moves) |
| `instrument-2-dataframe-audit.md` | Step 3 — data-frame audit (datasheet, assumptions, moves) |
| `confession.md` | Step 4 — the real mistake I let in (rank by rate) |
| `what-would-change-my-mind.md` | Step 5 — closing + three-layer repro |

## The one-line result
My tool ranks on `Approval_Rate`; that metric is ~100% for almost everyone (median rate 100%, median
n=10), so the ranking is fragile (rate-vs-volume top-10 overlap: **0/10**) and inverts big reliable
sponsors below small-sample 100%s. The fix (rank on volume or a Wilson lower bound) is named, not yet
shipped — see the confession.
