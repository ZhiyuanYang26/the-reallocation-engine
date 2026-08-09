#!/usr/bin/env python3
"""Robustness probe suite for reallocate.py (BUILD assignment, Instrument 1).

Three probes against my own build's ranking (companies by H-1B approval rate):
  1. perturbation      - vary the GIGO threshold; watch the #1 pick move
  2. proxy-feature     - rank by rate vs by volume; measure top-10 overlap
  3. distribution-shift— re-rank on a geographic slice (CA vs non-CA)

Reads the same CSV reallocate.py reads. Stdlib only.
"""
import csv, os, math

CSV = os.path.join(os.path.dirname(__file__),
                   "../../../../data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped.csv")


def load():
    rows = []
    with open(CSV, encoding="utf-8") as f:
        for r in csv.reader(f):
            if not r or r[0] == "company_name":
                continue
            try:
                app, den, rate = float(r[15]), float(r[16]), float(r[17])
            except (ValueError, IndexError):
                continue
            if app + den <= 0:
                continue
            rows.append({"name": r[0], "n": app + den, "rate": rate,
                         "app": app, "state": r[4]})
    return rows


def top_by_rate(rows, min_n):
    elig = [c for c in rows if c["n"] >= min_n]
    # this mirrors reallocate.py: sort by rate only (stable -> file order breaks ties)
    elig.sort(key=lambda c: c["rate"], reverse=True)
    return elig[0] if elig else None


rows = load()
print(f"H-1B companies with filings: {len(rows)}\n")

print("PROBE 1 - perturbation: vary GIGO threshold")
for t in (5, 20, 50, 100):
    top = top_by_rate(rows, t)
    print(f"  n>={t:<3}: #1 = {top['name']:<28} rate={top['rate']:.1f}% n={int(top['n'])}")

print("\nPROBE 2 - proxy-feature: rank by RATE vs by VOLUME (n>=20)")
elig = [c for c in rows if c["n"] >= 20]
by_rate = sorted(elig, key=lambda c: c["rate"], reverse=True)[:10]
by_vol = sorted(elig, key=lambda c: c["app"], reverse=True)[:10]
overlap = {c["name"] for c in by_rate} & {c["name"] for c in by_vol}
print(f"  top-10 by rate   : {[c['name'] for c in by_rate][:3]} ...")
print(f"  top-10 by volume : {[c['name'] for c in by_vol][:3]} ...")
print(f"  overlap of the two top-10 lists: {len(overlap)} / 10")

print("\nPROBE 3 - distribution-shift: CA-only vs non-CA (n>=20)")
for label, slc in (("CA", [c for c in rows if c["state"] == "CA"]),
                   ("non-CA", [c for c in rows if c["state"] != "CA"])):
    top = top_by_rate(slc, 20)
    print(f"  {label:<7}: #1 = {top['name']:<28} rate={top['rate']:.1f}% n={int(top['n'])}")
