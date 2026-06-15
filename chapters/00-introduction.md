# Introduction

You have opened a repository called **the-reallocation-engine**. Before you read a chapter or run a command, it is worth saying plainly what you are looking at, because it is two things at once.

It is a **book**. The chapters in `chapters/` teach a method for using AI in a high-stakes search — specifically, the job search of an international student on an F-1 visa with a clock running — without surrendering the judgment the search depends on.

It is also a **working machine**. The same repository contains the scripts, data, and operating recipes that *run* that method. You can clone it, open a terminal, type a command, and get a sourced Apply / Consider / Skip decision about a real role. The book is not a description of a system that lives somewhere else. The book *is* the system, explained.

That is unusual, and it is deliberate. This introduction tells you what each part is, the principles the whole thing runs on, and four small things you can do in the next ten minutes to see it work.

## The argument, in one breath

The first sign of trouble is usually not failure. It is fluency.

A draft looks clean. An answer sounds reasonable. A chart has labels, the code runs, the plan has phases. Nothing on the surface announces that a human still has work to do. AI has made that surface cheap to produce — and in making *execution* cheap, it has left *judgment* scarce and more valuable, not less.

The Reallocation Engine takes that general claim and points it at one concrete problem. A student with sixty to ninety days to find a sponsoring employer cannot afford to spend judgment evenly. The engine's whole purpose is to **reallocate scarce effort** — away from polished-looking cold applications that the evidence says will go nowhere, and toward the few roles where a record, not a feeling, says effort can matter. The machine does the parts that can be grounded in records and audits. You do the part that cannot be delegated: deciding whether a role is worth a day of your life.

## The principles it runs on

Everything in the repository is an expression of a short list of rules. If you understand these, the rest is detail.

1. **Run the script and read the audit before you prompt.** Verified local data comes before an AI's guess, every time. The engine reads records; it does not improvise them.
2. **Never invent a count, a rate, a match quality, or a confidence.** Every number traces to a source. A figure with no record behind it is not evidence — it is decoration, and it is labeled as such.
3. **Liveness and timeline are gates, not votes.** A dead posting or an impossible visa timeline zeroes a role no matter how good it looks. Some facts veto; they do not merely lower a score.
4. **Skip is a successful outcome.** A healthy run skips at least half of the roles it evaluates. The engine's value is in the applications it talks you *out of*.
5. **Machines verify conformance; humans verify adequacy.** A script can prove a file parses. Only you can decide whether the decision it produced is one you should act on. Judgment is the point, not the bottleneck.

These five are the operating spirit of the book. They are also, not coincidentally, a domain-specific reading of a more general framework.

## What governs the repository: Snickerdoodle

Open `SNICKERDOODLE.md` and you will find the constitution this repository is built on — an agent-operating-system that treats a project as a contract between human judgment and AI execution. It names principles, defines hard gates cleared by a named human and logged, sets a lifecycle for every recipe from `DRAFT` to `VERIFIED`, and insists that provenance, never deletion, and honest logging are not optional. The Reallocation Engine is one *domain* governed by it; `DOMAIN.md` is where everything specific to this repository lives.

Snickerdoodle is treated lightly here — named, leaned on, but not fully unpacked, because this is a book about a job search, not a book about the framework. I have written that detailed treatment of the **Snickerdoodle principles** separately. If, after using this engine, you want the strict, general version — the one that makes these rules enforceable across any project, not just this one — that is where to go. This repository is a worked example; Snickerdoodle is the system behind it.

## What you are looking at, folder by folder

When you `ls` the repository, here is what each part is for:

- **`chapters/`** — the manuscript. This is the book. Start at `01-the-fluency-trap.md`.
- **`_MANIFEST.md`** — read this first. The portable map of what is canonical, what is task-relevant, and what to ignore (a thin index over the files below; its machine-readable twin is `.ai/manifest.yaml`).
- **`SNICKERDOODLE.md`** — the constitution. The rules above, in full. Read it first if you intend to run anything.
- **`DOMAIN.md`** — the index. What this repository's data and scripts are, and *what is runnable today* versus what is still planned.
- **`scripts/`** — the maintained automation (SEC funding, sponsorship, ATS liveness, BLS/O\*NET role quality, résumé rendering, the role scorer).
- **`recipes/`** — the operating recipes an agent follows (`scan`, `pipeline`, `oferta`, `tracker`, `pdf`). Each declares the scripts it calls, the data it reads, and what it logs.
- **`data/`** — the verified source data; audits sit beside the data they inspect. Private job-search state lives in `data/ats/` and is reviewed before commit.
- **`logs/RUN_LOG.md`** — the ground-truth history of what has actually been run.

`_MANIFEST.md` is the read-first map; from there, two files tell you what the project *is* (`DOMAIN.md`) and what governs it (`SNICKERDOODLE.md`); one file tells you what has *happened* (`logs/RUN_LOG.md`); `status.md` tells you where things stand right now. Between them you can orient in a couple of minutes without reading the whole tree.

## How the book is organized

- **Chapters 1–3 — the core method.** Fluency is not correctness (Ch.1); effort must be reallocated by expected return (Ch.2); factual claims must obey the verified-data contract (Ch.3).
- **Chapters 4–5 — the discipline.** Recipes are written for two customers, the agent and the human (Ch.4); verified records still need epistemic interrogation (Ch.5).
- **Chapters 6–13 — the evidence components.** Funding (Ch.6), sponsorship (Ch.7), liveness (Ch.8), role quality (Ch.9), visa timing (Ch.10), the composite Bayesian scorer (Ch.11), OPT framing (Ch.12), and ATS-safe résumés (Ch.13).
- **Chapters 14–16 — operating the engine.** Running the recipes (Ch.14), maintaining the tracker and watching the skip rate (Ch.15), and the first honest, gated run (Ch.16).
- **Chapter 97 — synthesis.** The load-bearing themes, gathered.

## Getting started: four things to try now

You do not have to read the book front to back before touching the machine. In fact, the fastest way to understand the argument is to watch the engine make one decision and trace it. With the repository open in a terminal:

1. **Read the orientation files.** Open `_MANIFEST.md` (the read-first map), then `SNICKERDOODLE.md` (the rules) and `DOMAIN.md` (what is runnable today). Five minutes. You now know what to read, what governs the engine, and what actually works.
2. **Check the environment.** Run `npm run doctor`. It reports what tools are installed and which commands have real scripts behind them — an honest map of the runnable surface.
3. **Run the decision core and trace it.** Run `npm run score data/examples/ch11-roles.json`, then open the audit it writes to `data/examples/role-scores.md`. Pick one row and read it term by term: sponsorship, fit, liveness, timeline — each labeled *record*, *model-judgment*, or *your-input*. If you cannot explain a recommendation from its sources, the book argues, distrust the recommendation before you distrust your confusion.
4. **Read Chapter 1.** Now open `chapters/01-the-fluency-trap.md`. The idea you just watched the scorer enforce — that a confident output is not a correct one — is the idea the whole engine exists to defend.

## A note on what stays human

AI can draft, summarize, transform, compare, and generate alternatives. Those are execution tasks, and this engine automates them without apology. Its deeper concern is the work that remains after execution becomes cheap: deciding which role is worth your scarce time, what evidence counts, what an honest output looks like, and who is responsible when a decision leaves the screen. These chapters are also designed to integrate with **Medhavy** (also **Medhavi**), an AI-powered intelligent-textbook system, where they can become adaptive practice — hints, worked examples, feedback loops. Even there, the learning target remains human.

So: open the repository. Do not ask first whether the engine looks impressive. Ask what would have to be true for one of its decisions to be trusted, what the machine could not know, and what you are now responsible for. Then run the script, read the audit, and begin.
