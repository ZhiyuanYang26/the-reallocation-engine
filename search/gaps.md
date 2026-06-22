# search/gaps.md — Gap Analysis

Target: Software Engineer (New Graduate) at large technology company (Google, Meta, Amazon, Microsoft, Apple)
Generated: 2026-06-21
Status: Agent-drafted. One row killed, one row rewritten in student's own words (see below).

---

## Gap Table

| Gap | Evidence the target demands it | What I have | Plan to close it |
|-----|-------------------------------|-------------|-----------------|
| **Data Structures & Algorithms (DSA) interview readiness** | Google, Meta, and Amazon SWE job postings explicitly state "strong foundation in CS fundamentals including algorithms and data structures"; Leetcode-style coding screens are a documented gate at all five target companies; O*NET SOC 15-1252 lists "analyzing user needs and software requirements" as core task requiring algorithmic thinking | No evidence of competitive programming, algorithmic problem solving practice, or DSA-focused projects in resume; internship work is infrastructure and full-stack, not algorithm-heavy | Solve 150+ LeetCode problems (easy/medium/hard ratio 20/60/20); reach consistent acceptance on medium-difficulty problems. Gap closes when: two mock interviews with a peer result in passing scores on 3/4 problems within time limit |
| **System design at scale** | Google L3/L4 postings require "ability to design scalable systems"; Meta SWE new grad job descriptions list "design and implement complex systems"; Amazon SWE posting states "design systems that scale to millions of requests"; pattern consistent across 5+ postings reviewed on LinkedIn June 2026 | AWS experience at Mass Robotics serves 5–6 concurrent users — not population-scale; no evidence of designing systems handling >1000 concurrent users or distributed consensus problems | Study system design patterns (consistent hashing, sharding, load balancing, caching layers); complete one system design project with documented architecture handling simulated high load. Gap closes when: can walk through a design for "URL shortener" or "feed ranking" end-to-end in a 45-minute mock session |
| **CS fundamentals depth (OS, networking, database internals)** | Big tech SWE interviews routinely test OS concepts (memory management, concurrency, processes/threads), networking (TCP/IP, HTTP/HTTPS), and database internals (B-trees, indexing); this pattern observed across Google, Meta, Amazon interview prep guides and confirmed in O*NET 15-1252 knowledge requirements | Undergraduate degree is Mathematics and Economics, not Computer Science; MS is Software Engineering — coursework likely covers some but not all fundamentals; no evidence of OS or networking coursework on resume | Review OSTEP (Operating Systems: Three Easy Pieces) for OS fundamentals; review Computer Networking: A Top-Down Approach chapters 1–4; review database internals (indexing, transactions). Gap closes when: can answer OS and networking questions in a simulated technical screen without referencing materials |
| ~~**No open-source contributions**~~ | ~~GitHub activity and open-source contributions listed as differentiator in some big tech postings~~ | ~~GitHub listed on resume but no public contributions mentioned~~ | ~~Contribute to an open-source project~~ |

---

## Required Edits (per assignment instructions)

### Killed row — "No open-source contributions"

**Reason this row was wrong:** The agent generated this gap based on the absence of open-source mentions on the resume, but the evidence column was weak — big tech SWE new grad postings do not list open-source contributions as a requirement, only occasionally as a "nice to have." The O*NET entry for SOC 15-1252 does not mention it. More importantly, my current internship at Mass Robotics involves real production code on a cloud platform, which is stronger evidence of engineering ability than open-source contributions. The agent inferred a gap from an absence of a signal, not from a confirmed demand signal. That is exactly the error the course warns about.

---

### Rewritten row — System design at scale (in my own words)

The real issue here is that everything I've built has been for small teams — the annotation platform at Mass Robotics was designed for 5 or 6 people using it at the same time, not millions. Big tech cares a lot about whether you can reason through what happens when a system needs to handle traffic at a completely different order of magnitude. I haven't had to think about that at work yet. To actually close this gap, I need to be able to sit down in an interview and walk through a full system design — not just name the components, but explain the tradeoffs of each choice. I'll know it's closed when I can do that in a 45-minute mock without getting stuck on the scaling questions.
