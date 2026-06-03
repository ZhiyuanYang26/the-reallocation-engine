# Chapter 9 — The Bayesian Role Scorer
*The constraint unique to you dominates the factor everyone told you was supreme.*

Start with the sentence. "Google is a great company, so I should apply." It is the most natural sentence in a job search, and it is wrong in a specific, costly way. Great by what measure, and for whom? For a candidate who needs visa sponsorship, "great company" and "good target" are two different questions, and conflating them is how the eight-hour applicant from Chapter 2 spent a month applying to firms that would never sponsor the role. This chapter replaces that sentence with arithmetic. And the arithmetic, for a non-sponsor, says no — however great the company.

I want to be honest about what that arithmetic is going to cost you emotionally, because it will fight your instincts in a specific place. The chapter demotes *fit* — the thing you have been told your entire life is what matters in a job search — below a constraint most candidates never put in the equation at all. The demotion is not an error in the math. It is the math doing exactly what it should.

## What the scorer is and what it takes as input

The Bayesian Role Scorer is the decision core of the pipeline. Everything built in the preceding chapters converges here. Sponsorship probability and tier (Chapter 5), liveness (Chapter 6), role quality and occupation code (Chapter 7), your timeline and the start-date clock (Chapter 8) — each of those chapters produced a number. This chapter combines them.

The new ingredient is fit: the probability that you are actually a match for this specific role, estimated by comparing your CV against the job description. I want to name this clearly before we go further: fit is a model judgment. It is not a record. It is not a verified fact from a government database. It is a language model comparing two documents and returning a probability. That label — *model judgment* — matters, and it will appear attached to fit throughout this chapter, because a composite that hides where its components came from is exactly the fluent-but-ungrounded artifact Chapter 1 taught you to distrust.

With all four inputs in hand, the composite takes this form:

**Composite ≈ P(sponsorship) × 0.35 + P(fit | CV, JD) × 0.30 + [other weighted factors]**

— the whole expression multiplied by a liveness factor and by a timeline factor, with a decision threshold near 0.3 that maps the composite to one of three recommendations: **Apply**, **Consider**, or **Skip**.[^weights]

There are three design decisions baked into this expression that are worth understanding from first principles, because each one will produce a recommendation that surprises you until you see the reasoning underneath it.

## Why sponsorship is weighted highest

Sponsorship carries a weight of 0.35 — above fit at 0.30. The question is why.

Weights in a scoring system should reflect which constraint is most binding for the specific person the system is built for. For a domestic applicant, sponsorship isn't a question. Fit dominates, because fit is the thing that will determine whether you get the offer. But for an international student, sponsorship is the constraint that silently kills the most applications — not because the candidate was unqualified, but because the company never sponsored in the first place and the candidate never knew to check. The application went in, the résumé cleared the ATS, and then something in the process stopped moving. Sponsorship was the reason. It is never written on a rejection email.

So the weighting is not a claim that sponsorship matters more than competence in the world. It is a claim that, for you, it is the factor most likely to cause an invisible rejection — and invisible rejections are the ones most worth preventing at the top of the funnel, before time is spent.

## Why liveness and timeline are multipliers, not addends

Fit and sponsorship are *votes*. They contribute proportionally to the composite. A higher sponsorship probability raises the score; a lower one lowers it. The contribution is graduated.

Liveness and timeline are different in kind. They are *gates*. A ghost posting — liveness approaching zero — makes the composite approach zero regardless of how strong the sponsorship and fit scores are. A timeline you cannot meet — start date constraints that make the role impossible — does the same. No amount of fit or sponsorship can carry a role through a gate that is closed.

This is the math expressing a truth about the job search, not imposing a rule on top of it. A perfect role at a sponsoring company is worth nothing if the posting is fiction or you cannot start in time. The multiplicative structure is the honest description of that reality.

## The worked case — one posting, all four factors traced

Let me make the composite concrete. A live posting at the Cambridge biotech from Chapter 5 — Proven tier, data role, our STEM-eligible graduate.

P(sponsorship) ≈ 0.9. *Source: LCA and H-1B records from Chapter 5.* This is a record, not a judgment.

P(fit | CV, JD) ≈ 0.7. *Source: model judgment, CV compared to the job description.* This is a judgment, labeled as such.

Liveness ≈ 1. *Source: ATS signals from Chapter 6.* The posting passed all five checks.

Timeline factor ≈ 0.85. *Source: the reader's OPT expiration and estimated processing window from Chapter 8.*

High sponsorship — the dominant term — multiplied by reasonable fit, with a live posting and comfortable timeline. The composite lands well above threshold. The recommendation is **Apply**.

Now the contrast. The same graduate. The same fit of 0.7. The same liveness and timeline. Applied to the household-name non-sponsor: P(sponsorship) ≈ 0. The dominant term — sponsorship at 0.35 weight — contributes almost nothing. No amount of fit rescues it. The composite falls below threshold. The recommendation is **Skip**.

The candidate did not get worse. The company did not get less impressive. The binding constraint changed, and the weighting surfaced it. That is the scorer's job.

<!-- → [TABLE: Two-role comparison showing Cambridge biotech vs. household-name non-sponsor across all four factors: sponsorship probability, fit score, liveness, timeline factor. Final rows: composite score, recommendation. Caption: "Same candidate, same fit — the dominant term (sponsorship) determines the outcome."] -->

## The three-way recommendation and when to override

**Apply** means the composite is above threshold and sponsorship and timeline are both healthy. This is the role that earns the targeted two hours of focused application work from Chapter 2.

**Consider** means the composite is near threshold, or strong on most factors with one soft spot — a Likely sponsorship tier rather than Proven, for instance. Apply only if this role beats your other Considers and you have buffer in your timeline.

**Skip** means the composite is below threshold, or zeroed by liveness or timeline. The recommendation is not that the company is bad. It is that your time, on a finite clock, is better spent elsewhere.

And then there is **Override** — the recommendation the system will not give you, but that you can give yourself. If you hold private information the data cannot — the hiring manager is a contact who told you directly they're actively interviewing, or the company just quietly started sponsoring last month and the LCA record hasn't caught up — you can override the scorer. But the discipline is this: write down what you knew that the scorer didn't. An override with a documented reason is a legitimate correction. An override without one is just ignoring the math because you like the company.

<!-- → [INFOGRAPHIC: Four-quadrant grid. X-axis: sponsorship probability (low → high). Y-axis: fit score (low → high). Regions labeled: top-right = Apply, top-left and bottom-right = Consider, bottom-left = Skip. Overlay: two data points for the worked example (Cambridge biotech = Apply zone, non-sponsor = Skip zone despite identical Y position). Caption: "The Apply/Consider/Skip regions show why fit alone doesn't determine the recommendation — the sponsorship axis moves you horizontally, not vertically."] -->

## The cautionary mirror — when scoring goes wrong

A different company built a hiring-match score by training on real managers' past decisions. The system learned to replicate those decisions, including the biases embedded in them — treating "what we did before" as "what is correct." A lawsuit (*Kistler v. Eightfold*) now asks a court to require what good scoring should have demanded from the start: disclose the score, allow disputes, fix the audit.[^eightfold]

Notice what separates that system from this one. The Eightfold scorer learned from opaque history; its weights are unknown even to the company that built it. This scorer's weights are stated — sponsorship 0.35, fit 0.30 — and each factor traces back to a named source. You can look at a recommendation and see exactly why it said what it said.

A composite score is a powerful tool and a dangerous one. The safety is not the math. It is the auditability. If you ever cannot explain why a role scored what it did — tracing each term to its source — distrust the recommendation before you distrust your confusion.

<!-- → [TABLE: Two-column comparison: "This scorer" vs. "Eightfold-style scorer." Rows: weight source (stated vs. learned from history), factor sourcing (explicit vs. opaque), auditability (can trace each term vs. cannot), failure mode (bad input laundered into confident output vs. bias laundered into confident output). Caption: "The safety of a composite score is not the math — it's whether you can see why it said what it said."] -->

## What the machine could not know

The composite knows four numbers. It cannot know that the "0.7 fit" undersells you because your one unusual project is exactly what this team needs and no keyword in the job description captured it. It cannot know that a company scored Skip just began sponsoring last month. It cannot know that you would thrive at a lower-scored role and burn out at a higher one.

The scorer's gift is that it makes the usual case explicit and defensible. Its danger is that a single confident number invites you to stop thinking. The discipline from Chapter 1 returns here in full: don't ask whether the score is impressive. Ask what it could not know, and whether you hold any of that knowledge. The score reduces uncertainty. It does not eliminate it — and pretending otherwise is the specific error that makes composite scores harmful rather than useful.

## Where this leaves you

The score says Apply. You know why it says Apply, term by term, source by source. The posting is real, the company sponsors, the fit is reasonable, and the clock is not against you.

What the scorer cannot do is write the application. And for an international candidate, how you frame your work authorization is where strong candidates get rejected for reasons that have nothing to do with their ability. The chapter that follows is about that problem. You earned the application. Now you have to write it.

---

## Exercises

**Warm-up**

1. *(Recall, easy)* Name the four inputs to the Bayesian Role Scorer and identify the source type for each — record, model judgment, or your own input. Why does labeling the source type matter for trusting the recommendation?
   *Tests whether you understand the auditability requirement as a design principle, not a paperwork step.*

2. *(Recall, easy)* Explain the difference between a weighted vote and a multiplier gate in the composite formula. Give one example of each from the scorer's four factors and explain what it means in practice when a gate approaches zero.
   *Tests the structural distinction between how sponsorship/fit contribute versus how liveness/timeline contribute.*

3. *(Identify, easy)* Why is sponsorship weighted at 0.35 — above fit at 0.30 — for an international student? Write the reasoning in one paragraph. Then explain whether the same weighting would be correct for a domestic applicant.
   *Tests whether you understand the weights as context-specific design decisions, not universal claims about what matters.*

**Application**

4. *(Apply, moderate)* Score five real postings from your target list using the four factors. For each posting, label every factor by source type (record, model judgment, your input) and write the recommendation. For at least one posting, show the arithmetic that drove the recommendation.
   *Tests the transition from understanding the framework to running it on real data.*

5. *(Analyze, moderate)* Take one posting where the scorer recommends Skip but your instinct says Apply. Work through the composite term by term and identify which factor is driving the gap between the score and your intuition. If you override, write down exactly what you know that the data does not.
   *Tests the override discipline and forces explicit reasoning about the conflict between score and instinct.*

6. *(Analyze, moderate)* Find a posting that would score well on fit (P(fit | CV, JD) ≥ 0.7) but poorly on sponsorship (P(sponsorship) ≤ 0.2). Compute the composite and explain, term by term, why the recommendation is what it is. Then explain this result to the version of yourself that said "Google is a great company, so I should apply."
   *Tests the central inversion of the chapter — fit cannot rescue a non-sponsor.*

**Synthesis**

7. *(Synthesize, harder)* The chapter argues that auditability — being able to trace every factor to its source — is the actual safety property of a composite scorer. Construct a concrete scenario in which a non-auditable composite score could harm a candidate. Then describe one specific design change to the scorer that would improve auditability without changing the weights.
   *Tests whether you can reason about the failure modes of composite scoring, not just the happy path.*

8. *(Synthesize, harder)* The fit factor is explicitly labeled a model judgment. Describe two specific ways the fit score could be systematically wrong — not just noisy, but biased in a consistent direction — and explain what the downstream effect on the Apply/Consider/Skip recommendation would be in each case. What check could you run to detect the error?
   *Tests adversarial reasoning about the weakest term in the composite.*

**Challenge**

9. *(Evaluate, open-ended)* The scorer uses fixed weights (sponsorship 0.35, fit 0.30). Design a calibration study — using only data you could collect during an actual job search — that would tell you whether those weights are correctly specified for your situation, and describe how you would update them if the study showed they were off. What would "correctly specified" even mean, given that you can't observe counterfactuals?
   *Tests whether you can think about the scorer's own calibration as an empirical question.*

[^weights]: Composite form and weights (sponsorship ×0.35, fit ×0.30, liveness and timeline as multipliers, decision threshold ≈0.3) from the system design document (Component 3, Bayesian Role Scorer). **[verify]** — confirm the exact composite expression and per-tier thresholds before publication.

[^eightfold]: Eightfold AI's match score learning manager bias, and *Kistler v. Eightfold* (FCRA: disclose the score, allow disputes, fix the audit), from "The Eightfold AI Match Score" (N. Bear Brown). **[verify]** the litigation specifics before publication.
