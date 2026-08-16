# Explainer Video Script — Sponsorship Credibility (3–6 min)

Screen recording. **Section ③ must be one uncut take** — real commands, real output appearing live.
No PII on screen (employer names only, from a public-derived file).

---

**ON SCREEN:** `portfolio.md` (rendered), then the terminal for ③. Section numbers below match the
portfolio's section numbers, so you can scroll to the matching heading as you speak.

| Script section | Scroll portfolio to |
|---|---|
| ① domain | The problem |
| ② the gap | The gap (the rank table) |
| ③ uncut live run | *switch to terminal* — then What I built / The measurable improvement after |
| ④ what breaking it taught me | Failure modes — first bullet |
| ⑤ honest limitation | Failure modes — last bullet |
| ⑥ close | Demo |

---

### ① The domain and the asymmetry (~45s) — portfolio: The problem

> "I contribute to The Reallocation Engine. It's a job-search tool for international students on OPT —
> people who only get a limited number of applications before their clock runs out. So the tool has to
> tell them where to spend those applications.
>
> One of the strongest signals it uses is how reliably a company gets its H-1B petitions approved."

### ② The gap I'm filling (~45s) — portfolio: The gap, rank table on screen

*(Optional but strong: run this live so the ranks on screen are real, not asserted —*
*`node scripts/score/sponsorship-credibility.mjs --rank "DATABRICKS INC"`, same for `"1LIFE"`.)*

> "Here's the gap. The engine reads that signal as an approval rate — and a rate on its own doesn't
> carry how much evidence is behind it. Two out of two is a hundred percent. Six hundred and ten out of
> six hundred and ten is also a hundred percent. On the real file, twelve hundred and sixty-two
> companies out of fifteen fifty-seven are all sitting at exactly a hundred percent.
>
> So look what that does. 1Life Healthcare — two filings, both approved — ranks number one. Databricks,
> sixteen hundred and forty approvals out of sixteen forty-eight, ranks twelve hundred and sixty-fifth.
> LinkedIn, with nearly five thousand filings, is right behind it. Eight denials out of sixteen hundred
> pushes you below a company we know almost nothing about.
>
> Nothing upstream of the scorer weighed evidence. That's the piece I built: a component that turns
> approvals and denials into a credibility score that knows how much record is behind it, and feeds
> that to the scorer instead of the bare rate. After it runs, Databricks is eleventh and 1Life is
> twelve hundred and sixth."

### ③ THE UNCUT LIVE RUN (~2 min) — do not cut inside this take

> "The rule is one line: approvals plus one, over total plus two. Every company starts with one win and
> one loss, then its own record gets added. Two out of two becomes point seven five, not one. Seven
> hundred out of a thousand stays at point seven — a deep record barely moves. Credibility gets earned."

```
npm run score:sponsor-credibility
```

> "Fifteen fifty-seven companies scored, twenty-eight thousand with no usable record. Those come back
> 'Unknown', not zero — never zero. No record is not the same thing as a denial."

```
npm run score:sponsor-credibility:test
```

> "Ten invariants. A thin perfect record has to lose to a deep one. A thin perfect record still has to
> beat a mediocre big one. And denials count too — zero out of two scores higher than zero out of
> forty, because forty filings is real evidence and two isn't. All ten pass."

```
node scripts/score/sponsorship-credibility.mjs --compare
```

> "And here's what it buys. Old list on top — median ten filings. New list underneath — Confluent with
> six hundred and ten, Juniper with twelve hundred, Datadog with three hundred and forty. Median two
> hundred and seventy-six filings. Overlap between the two lists: zero out of ten. The entire shortlist
> a student would act on is different, and every name on it is backed by real volume."

```
node scripts/score/sponsorship-credibility.mjs --movers
```

> "And this shows the biggest adjustments in both directions — what lost an unearned hundred percent,
> and what got pulled up off a zero."

*(If anything errors on camera, leave it in and narrate the fix — that's the most honest footage.)*

### ④ One thing I learned (~35s) — portfolio: Failure modes, first bullet

> "One thing I learned. My first version anchored the adjustment to the population average, which is
> ninety-eight percent — and when I tried to break it, it broke: FeedMob, zero approvals out of two,
> came back at point eight eight. Shrinking toward a high average doesn't just pull good small samples
> down, it pulls bad ones up.
>
> I tried to fix that with a warning label, and that's the part worth keeping: a true label wrapped
> around a wrong number is decoration. So I changed the anchor instead of labeling the symptom.
> FeedMob is point two five now."

### ⑤ One honest limitation (~30s) — portfolio: Failure modes, last bullet

> "And the limitation I can't get around: this checks *sample size*. It does not check whether the data
> is true. If the upstream join dropped a company's filings, I compute a clean score off a wrong
> number, all ten tests still pass, and nothing anywhere flags it.
>
> Auditing sample size and auditing data quality are two different jobs. I did one of them. That's the
> honest boundary."

### ⑥ Close (~15s) — portfolio: Demo

> "It runs on the real file, it gives the scorer an evidence-weighted signal where there wasn't one, it
> leaves companies with identical records tied instead of faking an order, and it never scores a
> missing record as a zero. That's the contribution."

---
**Total ≈ 4 min.** Graded core is the uncut ③. If something goes wrong on camera, keep it.
