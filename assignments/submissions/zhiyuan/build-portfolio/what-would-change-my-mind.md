# What would change my mind / still puzzling

**What would change my mind:** if I re-ranked on a sample-size-aware lower bound (Wilson) and the
top companies came out roughly the same as the raw-rate ranking, then my "rate is a bad metric"
claim would weaken — the ceiling and small samples would not, in practice, be distorting the order.
I predict they would *not* come out the same (the 0/10 rate-vs-volume overlap says otherwise), but I
have not run it, so the claim stands as tested-on-two-instruments, not proven.

**Still puzzling:** the join-validation audit says the match's false-positive rate cannot be checked
without the raw DOL/USCIS records. So I cannot tell how many of the 1,557 "H-1B companies" are join
errors rather than real sponsors. Every ranking I produce sits on top of that unmeasured error, and
nothing in my build surfaces it to the user.

**Three-layer reproducibility:**
- *Plain:* my tool ranks companies by H-1B approval rate; that metric is near-100% for almost
  everyone and rewards small samples, so the ranking is fragile and I would not trust its fine order.
- *Technical:* median rate 100% / median n=10 among 1,557 H-1B rows (repo audit); rate-vs-volume
  top-10 overlap 0/10; #1 pick unstable across GIGO thresholds and CA/non-CA slices (`robustness_probe.py`).
- *Reproduce:* `python reallocate.py` (the ranking) and `python robustness_probe.py` (the probes),
  both against `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped.csv`. Verbs here are pitched to the
  evidence — "observed," "the probe shows," not "proves."
