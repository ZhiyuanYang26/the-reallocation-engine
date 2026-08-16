# Explainer Video Script — Gate-Behavior Harness (3–6 min)

Record your screen. The **live run segment must be one uncut take** — real command, real output.
No real PII on screen (the harness uses synthetic cases only).

---

### ① The domain & the asymmetry (~45s) — on your report/portfolio
> "I contribute to The Reallocation Engine — a job-search tool for international students on OPT.
> It scores each job Apply, Consider, or Skip. Two signals are supposed to be hard vetoes: if a
> posting is dead, or the start date is past your visa window, the job must be killed no matter how
> good the company is. The scorer does that by multiplying — a zero gate zeroes the score."

### ② The risk (~30s) — show the composite line in role-scorer.mjs
> "The danger the book names is the 'gate-as-vote' bug: if someone edits a gate into a regular
> additive score, a dead job with strong sponsorship starts scoring Apply — and a student wastes one
> of their few applications on a job that doesn't exist. Nothing tested for that. So I built a harness
> that does."

### ③ THE UNCUT LIVE RUN (~90s) — screen capture, do not cut inside this take
Type and run, letting output appear live:
```
npm run score:gate-test
```
> "Seven crafted cases. A ghost posting with perfect votes — composite has to be zero, and it is.
> An expired timeline — zero. Both gates open — not gated. And halving the gate halves the score,
> which proves it's a multiplier, not a vote. All seven pass, exit zero."

Then, still uncut, prove the harness can actually fail:
```
node scripts/score/gate-behavior-test.mjs --scorer scripts/score/test/gate-as-vote-scorer.mjs
```
> "Here's the same harness against a deliberately broken scorer where the gates were turned into
> votes. Four cases fail — the ghost and expired postings are no longer zeroed, and the ratio is
> 0.91 instead of 0.5. The harness catches exactly the bug it exists for. Exit one."

*(If anything errors on camera, leave it in and narrate the fix — that's the most honest footage.)*

### ④ One thing I learned + one honest limitation (~45s)
> "One thing I learned: my first run actually failed — not the scorer, my own harness had a bug where
> a case with no assertion counted as a failure. A test harness that miscounts is itself decoration,
> so I fixed it and re-ran.
> And the honest limitation: this proves the scorer *combines* the gates correctly. It cannot tell
> whether the liveness value fed in was right in the first place. If the upstream check calls a dead
> job 'live', every test still passes and the student still gets sent there. Checking the gate's
> inputs is the human call I hand back."

### ⑤ Close (~15s)
> "The harness runs green on the real scorer, catches the regression on a broken one, and never
> touches the code it tests. That's the contribution."

---
**Total ≈ 3.5–4 min.** Graded core = the uncut ③. Keep it real.
