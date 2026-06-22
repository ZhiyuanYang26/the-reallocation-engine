# RUN_LOG.md

---

## Entry: Search Setup Exercise — Personal Data Layer
**Date:** 2026-06-21
**Assignment:** INFO 7375 Setup Exercise — search/ folder

---

### What Was Built

Three files created in the `search/` folder:
- `search/resume.json` — structured record of experience, education, skills, and projects, attested after correction
- `search/profile.yml` — target role, visa constraints, geography, sponsorship requirement
- `search/gaps.md` — delta between current evidence and target role requirements

`search/private-notes.md` created and confirmed gitignored via `.gitignore` entry.

---

### Three Attestation Errors Caught in resume.json

1. **Scikit-learn added to skills incorrectly** — The agent inferred Scikit-learn from experience bullets (it appears in the Master of Class internship description) and added it to the top-level skills section. It was not listed on the original resume's skills section and was therefore removed.

2. **Vue.js, GraphQL, D3.js, Chart.js omitted from skills** — These four technologies appeared explicitly in project and experience bullets but were not carried over into the skills section during extraction. They were added.

3. **Back-End title at Master of Class verified** — The agent's extracted title of "Back-End Software Engineer Intern" was questioned because the bullet points included front-end work (D3.js, Chart.js, data visualization). The original resume title was confirmed to be Back-End, so the title was kept as-is. This was an extraction decision that required verification against the source document.

---

### Top Gap from gaps.md

**Data Structures & Algorithms (DSA) interview readiness** — All five target companies (Google, Meta, Amazon, Microsoft, Apple) use Leetcode-style coding screens as a documented gate. Current resume shows infrastructure and full-stack engineering work but no evidence of algorithmic problem-solving practice. This gap must be closed before any application to these companies is credible.

---

### Killed Row and Why

**Killed:** "No open-source contributions"

**Why it was wrong:** The agent generated this gap because no open-source contributions appeared on the resume. But the evidence column could not be grounded in a real demand signal — big tech new grad SWE postings do not list open-source contributions as a requirement, and O*NET SOC 15-1252 does not either. The agent inferred a gap from an absence of a signal, which is the verified-data contract violation the course warns against. Current production engineering work at Mass Robotics is stronger evidence than open-source activity anyway.

---

### Field in profile.yml Corrected from Agent's First Draft

**Field:** `stem_eligible`

The agent's first draft set this to `"uncertain"` with a note to confirm with DSO. This was corrected to `true` after the student confirmed STEM eligibility. The agent defaulted to uncertain as a conservative assumption; the student provided the actual verified status.

---

### Verification Check

**resume.json — Is every job entry traceable to something verifiable?**
Yes. Every entry maps directly to the uploaded resume document. Dates, titles, and bullet points were extracted from source and corrected where the extraction deviated. The three corrections are documented in the attestation note.

**profile.yml — Does the visa constraint section reflect actual documents?**
The OPT dates (2026-09-01 to 2027-08-31) were provided by the student. STEM eligibility is marked true based on student confirmation. These should be verified against the actual OPT card and I-20 when the card arrives.

**gaps.md — Does every gap in the evidence column cite something real?**
Yes. Each gap cites either a specific pattern observed across LinkedIn job postings for the five target companies, or O*NET SOC 15-1252 requirements. The killed row was removed precisely because its evidence column could not be grounded in a checkable source.
