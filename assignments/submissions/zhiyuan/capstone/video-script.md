# Explainer Video Script — Sponsorship Credibility (3–6 min)

Short sentences. One idea each. Say it, don't read it.

**Setup.** Run `cd ~/Desktop/the-reallocation-engine` **before** you hit record, so the prompt already
shows the repo. Two windows: `portfolio.md` rendered on the left, terminal on the right.
**Section ③ is one uncut take.** No PII on screen.

| Script | Portfolio heading on screen |
|---|---|
| ① | The problem |
| ② | The gap |
| ③ | *terminal* |
| ④ ⑤ | Failure modes |
| ⑥ | Demo |

---

### ① Who this is for (~30s)

> "I work on The Reallocation Engine. It helps international students on OPT decide where to apply.
>
> You only get so many applications before your clock runs out. So the tool has to pick.
>
> One of the biggest signals is: does this company actually get H-1Bs approved."

### ② The gap (~45s)

*Run this live if you want the ranks to be real:*
`node scripts/score/sponsorship-credibility.mjs --rank "DATABRICKS INC"`

> "The tool used the approval rate. But a rate doesn't tell you how much data is behind it.
>
> Two out of two is a hundred percent. Six hundred and ten out of six ten is also a hundred percent.
> Same number. Totally different thing.
>
> On the real file, twelve hundred and sixty-two companies are all at exactly a hundred percent.
>
> So look what happens. A company with two filings ranks first. Databricks — sixteen forty out of
> sixteen forty-eight — ranks twelve hundred and sixty-fifth. Eight rejections out of sixteen hundred,
> and it drops below a company we know nothing about.
>
> Nothing was weighing the evidence. That's what I built."

### ③ THE UNCUT LIVE RUN (~90s) — don't cut inside this

> "The rule is one line. Approvals plus one, over total plus two.
>
> Every company starts with one win and one loss. Then you add its real record.
>
> Two out of two becomes point seven five. Not one. Seven hundred out of a thousand stays at point
> seven — a big record barely moves. You earn the score."

```
npm run score:sponsor-credibility
```

> "Fifteen hundred companies scored. Twenty-eight thousand have no record at all.
>
> Those come back Unknown. Not zero. No record is not a rejection."

```
npm run score:sponsor-credibility:test
```

> "Ten checks. A small perfect record has to lose to a big one. But it should still beat a big mediocre
> one. And rejections count — zero out of two scores higher than zero out of forty, because forty is
> real evidence and two isn't.
>
> All ten pass."

```
node scripts/score/sponsorship-credibility.mjs --compare
```

> "Old list on top. New list below.
>
> Confluent, six hundred and ten. Juniper, twelve hundred. Datadog, three forty.
>
> Median went from ten filings to two hundred and seventy-six. Overlap between the two lists: zero out
> of ten. Completely different shortlist."

```
node scripts/score/sponsorship-credibility.mjs --movers
```

> "And this is what moved, both directions."

*(If it errors on camera, keep rolling and fix it out loud. That's the best footage you can get.)*

### ④ What I got wrong (~40s)

> "My first version did this differently. It pulled every company toward the average, which is
> ninety-eight percent. All the tests passed.
>
> Then I tried to break it. I fed it a company called FeedMob. Zero approvals, two rejections.
>
> It gave it point eight eight.
>
> Because pulling toward a high average doesn't just drag good small samples down. It drags bad ones up.
>
> My first fix was a warning label saying the score was borrowed. That's the part I actually learned
> from — a true label on a wrong number is decoration. So I changed the math instead. FeedMob is point
> two five now."

### ⑤ What it can't do (~25s)

> "One honest limit. This checks how much data you have. It does not check if the data is right.
>
> If the source dropped a company's filings, I compute a clean score off a wrong number. All ten
> checks still pass. Nothing warns you.
>
> Those are two different jobs. I did one."

### ⑥ Close (~15s)

> "It runs on the real file. It ranks by evidence instead of by row order. Companies with the same
> record stay tied. And nothing missing ever gets a zero."

---
**≈ 4 min.** The graded part is ③, uncut. Keep the mistakes in.
