# Explainer Video Script — Sponsorship Credibility (3–6 min)

Screen recording. **Section ③ must be one uncut take** — real commands, real output appearing live.
No PII on screen (employer names only, from a public-derived file).

---

### ① The domain and the asymmetry (~45s) — on the portfolio page

> "I contribute to The Reallocation Engine. It's a job-search tool for international students on OPT —
> people who only get a limited number of applications before their clock runs out. So the tool has to
> tell them where to spend those applications.
>
> One of the biggest signals is: how reliably does this company get its H-1B petitions approved. The
> engine was reading that straight off the approval rate. And that turns out to be broken."

### ② The defect (~40s) — show the raw top-10

> "Here's the real data. Fifteen hundred and fifty-seven companies. Twelve hundred and sixty-two of
> them are at exactly one hundred percent — because most of them have two, or four, or twelve filings
> total. Two out of two is a hundred percent. Six hundred and ten out of six hundred and ten is also a
> hundred percent.
>
> So when you sort by rate, twelve hundred companies tie, and the tie gets broken by whatever order the
> rows are in. Look at the top ten — 1Life, 1UpHealth, 24M, 317 Labs. That's alphabetical. That's not a
> ranking, that's the file order wearing a percent sign. And a student would apply based on it."

### ③ THE UNCUT LIVE RUN (~2 min) — do not cut inside this take

> "So I built a scorer that takes sample size into account."

```
npm run score:sponsor-credibility
```

> "It fits a prior to the actual data — every run, not hardcoded — and you can see it: alpha seventeen,
> beta point three four. Fifteen fifty-seven companies scored, twenty-eight thousand with no usable
> record. Those get 'Unknown', not zero — never zero. No record is not the same thing as a denial."

```
npm run score:sponsor-credibility:test
```

> "Ten invariants. A small perfect record has to rank below a big one. A bad record has to stay bad.
> A huge sample has to converge back to its own rate. All ten pass."

```
node scripts/score/sponsorship-credibility.mjs --compare
```

> "And here's the payoff. Old list on top — alphabetical, median ten filings. New list underneath —
> Confluent with six hundred and ten, Datadog with three hundred and forty, median two hundred and
> forty filings. Overlap between the two lists: zero out of ten. The entire list a student would act on
> is different."

```
node scripts/score/sponsorship-credibility.mjs --cautions
```

> "And this last one is the component reporting its own weakest output — I'll explain why in a second."

*(If anything errors on camera, leave it in and narrate the fix — that's the most honest footage.)*

### ④ One thing I learned (~50s)

> "Here's what I actually learned, and it's the part I didn't expect.
>
> I built this thing to stop the tool from over-trusting small samples. Then I tried to break it — I fed
> it companies with *bad* records instead of good ones. And it broke.
>
> FeedMob has zero approvals out of two filings. Zero. My scorer gave it point eight eight. Because
> shrinking toward a ninety-eight percent population average doesn't just pull the good small samples
> down — it pulls the bad ones *up*. I'd fixed over-trusting thin good records by building something
> that over-trusted thin bad ones. Twenty-five companies got lifted like that.
>
> So now a bad record can't be promoted no matter how the math shrinks it, and the tool prints how much
> of each score is borrowed from the prior instead of earned. But I left the number itself at point
> eight eight — because it's arithmetically correct, and quietly changing it to look better would be
> its own kind of lying."

### ⑤ One honest limitation (~30s)

> "And the limitation I can't get around: this checks *sample size*. It does not check whether the data
> is true. If the upstream join dropped a company's filings, I compute a beautiful score off a wrong
> number, all ten tests still pass, and nothing anywhere flags it.
>
> Auditing sample size and auditing data quality are two different jobs. I did one of them. That's the
> honest boundary."

### ⑥ Close (~15s)

> "It runs on the real file, it breaks the twelve-hundred-way tie in the direction the record supports,
> it flags its own weakest output, and it never scores a missing record as a zero. That's the
> contribution."

---
**Total ≈ 4–4.5 min.** Graded core is the uncut ③. If something goes wrong on camera, keep it.
