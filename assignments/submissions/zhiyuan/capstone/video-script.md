# Explainer Video Script — Sponsorship Credibility (3–6 min)

Talk, don't read. If a line feels awkward in your mouth, say it your own way — the facts and the
numbers are what matter.

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

> "I work on a project called The Reallocation Engine. It helps international students on OPT figure
> out where to apply.
>
> The whole problem is that you only get so many applications before your clock runs out, so the tool
> has to pick for you. And one of the biggest things it looks at is whether a company actually gets
> H-1Bs approved."

### ② The gap (~45s)

*Run this live if you want the ranks on screen to be real:*
`node scripts/score/sponsorship-credibility.mjs --rank "DATABRICKS INC"`

> "The way it did that was just the approval rate. But a rate on its own doesn't tell you how much data
> is behind it.
>
> Two out of two is a hundred percent. Six hundred and ten out of six hundred and ten is also a hundred
> percent. Same number, completely different situation.
>
> And on the real file, twelve hundred and sixty-two companies are sitting at exactly a hundred percent.
> So there's nothing left to sort them by.
>
> Here's what that actually does. A company with two filings comes out number one. Databricks — sixteen
> hundred and forty approvals out of sixteen forty-eight — comes out twelve hundred and sixty-fifth.
> Eight rejections out of sixteen hundred, and it lands below a company we know basically nothing about.
>
> Nothing in the pipeline was weighing the evidence. That's the piece I built."

### ③ THE UNCUT LIVE RUN (~90s) — don't cut inside this

> "The rule itself is one line: approvals plus one, over total plus two.
>
> The idea is that every company starts out with one win and one loss, and then you add its real record
> on top. So two out of two comes out at point seven five instead of one. But seven hundred out of a
> thousand stays right around point seven, because a big record barely moves. You have to earn the
> score."

```
npm run score:sponsor-credibility
```

> "Fifteen hundred and fifty-seven companies get scored, and twenty-eight thousand have no record at
> all. Those come back as Unknown, not zero — because not having a record isn't the same thing as being
> rejected."

```
npm run score:sponsor-credibility:test
```

> "These are the ten checks. A small perfect record has to lose to a big one, but it should still beat a
> big mediocre one. And rejections have to count too — zero out of two scores higher than zero out of
> forty, because forty filings is real evidence and two isn't.
>
> All ten pass."

```
node scripts/score/sponsorship-credibility.mjs --compare
```

> "And this is the payoff. The old list is on top, the new one underneath.
>
> Now it's Confluent with six hundred and ten filings, Juniper with twelve hundred, Datadog with three
> hundred and forty. The median goes from ten filings to two hundred and seventy-six, and the overlap
> between the two lists is zero out of ten. It's a completely different shortlist."

```
node scripts/score/sponsorship-credibility.mjs --movers
```

> "And this one shows what moved the most, in both directions."

*(If something errors on camera, keep rolling and fix it out loud — that's the best footage you can get.)*

### ④ What I learned (~40s)

> "The thing I actually took away from this is that a correct label on a wrong number isn't a fix, it's
> decoration. And I learned that the hard way.
>
> My first version pulled every company toward the average, which is ninety-eight percent. All the tests
> passed. Then I tried to break it — I looked up a company called FeedMob, zero approvals and two
> rejections, and my scorer gave it point eight eight. Because pulling everything toward a high average
> doesn't just drag the good small samples down, it drags the bad ones up.
>
> My first instinct was to slap a warning on it saying the score was borrowed. Which was true, and
> useless, because the number still said point eight eight. So I changed the math instead. FeedMob is
> point two five now."

### ⑤ What it can't do (~25s)

> "And here's the one thing this can't do.
>
> It checks how much data there is. It doesn't check whether that data is correct. So if the source file
> is missing some of a company's filings, I'll still hand you a nice clean score — it'll just be wrong.
> All ten checks still pass, and nothing tells you anything's off.
>
> Checking sample size and checking data quality are two different problems. I only solved one of them."

### ⑥ Close (~15s)

> "So — it runs on the real file, it ranks companies by how much evidence there is instead of by row
> order, companies with identical records stay tied, and nothing that's missing ever gets scored a zero.
> That's the contribution."

---
**≈ 4 min.** The graded part is ③, uncut. If you make a mistake, leave it in.
