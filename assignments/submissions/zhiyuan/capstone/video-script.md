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

> "So I built a scorer that takes sample size into account. The rule is one line: approvals plus one,
> over total plus two. Every company starts with one win and one loss, then its own record gets added.
> Two out of two becomes point seven five, not one. Seven hundred out of a thousand stays at point
> seven — a big record barely moves."

```
npm run score:sponsor-credibility
```

> "Fifteen fifty-seven companies scored, twenty-eight thousand with no usable record. Those get
> 'Unknown', not zero — never zero. No record is not the same thing as a denial."

```
npm run score:sponsor-credibility:test
```

> "Ten invariants. A thin perfect record has to lose to a deep one. A thin perfect record still has to
> beat a mediocre big one. And denials have to count too — zero out of two scores higher than zero out
> of forty, because forty is real evidence and two isn't. All ten pass."

```
node scripts/score/sponsorship-credibility.mjs --compare
```

> "And here's the payoff. Old list on top — alphabetical, median ten filings. New list underneath —
> Confluent with six hundred and ten, Juniper with twelve hundred, Datadog with three hundred and
> forty. Median two hundred and seventy-six filings. Overlap between the two lists: zero out of ten.
> The entire list a student would act on is different."

```
node scripts/score/sponsorship-credibility.mjs --movers
```

> "And this shows the biggest adjustments both ways. I'll explain the second table in a second."

*(If anything errors on camera, leave it in and narrate the fix — that's the most honest footage.)*

### ④ One thing I learned (~60s)

> "Here's what I actually learned, and it cost me my first version.
>
> Version one used a fancier method — it fit a prior to the data and shrank every company toward the
> population average, which is ninety-eight percent. Passed all its tests. Then I tried to break it: I
> fed it companies with *bad* records instead of good ones.
>
> FeedMob has zero approvals out of two filings. Zero. My scorer gave it point eight eight — because
> shrinking toward a ninety-eight percent average doesn't just pull good small samples down, it pulls
> bad ones *up*. Twenty-five companies got rescued like that.
>
> My first fix was a label. I tagged the score 'mostly borrowed from the prior' and refused to promote
> it. Both true. But it was a true sentence wrapped around a number that still said point eight eight —
> and a label that contradicts its own number is decoration, not a fix.
>
> So I threw out the method, not the symptom. The anchor moved from ninety-eight percent to fifty
> percent. FeedMob is now point two five. And it's not zero — because two filings can't prove a company
> never sponsors, the same reason two filings can't prove it always does."

### ⑤ One honest limitation (~30s)

> "And the limitation I can't get around: this checks *sample size*. It does not check whether the data
> is true. If the upstream join dropped a company's filings, I compute a clean score off a wrong
> number, all ten tests still pass, and nothing anywhere flags it.
>
> Auditing sample size and auditing data quality are two different jobs. I did one of them. That's the
> honest boundary."

### ⑥ Close (~15s)

> "It runs on the real file, it breaks the twelve-hundred-way tie in the direction the record supports,
> it leaves companies with identical records tied instead of faking an order, and it never scores a
> missing record as a zero. That's the contribution."

---
**Total ≈ 4–4.5 min.** Graded core is the uncut ③. If something goes wrong on camera, keep it.
