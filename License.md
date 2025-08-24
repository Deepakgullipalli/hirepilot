
---

## `DECISIONS.md`

```markdown
# Decisions & Rationale

This document explains **what** we built, **why** we built it that way, and the **trade-offs** we accepted.

---

## 1) Problem framing

- Goal: pick a **founding team of 5** from hundreds of noisy inbound applicants.
- Constraints: frontend assessment; many candidates; data quality varies; time-boxed.
- Requirements from prompt:
  - UI to sift applicants; **choose 5**; communicate **why** they were chosen.
  - Emphasis on **usability**, **engineering quality**, **creativity**, **ownership**.

---

## 2) High-level approach

- **Scoring + role coverage**: compute a robust score per candidate using skills, experience, degree tier, salary friendliness, and availability. Then ensure the final 5 **cover essential roles**:
  - Frontend, Backend, Data(ML/Eng), DevOps/Infra, PM/Design/Full-stack.
- **Diversity preference**: where possible, prefer unique regions (APAC, EU, NA, LATAM, MEA).
- **Budget target**: respect a target **average salary** by swapping within role groups.

Why this works: it reflects how early teams are actually assembled—coverage first, then optimize quality and guardrails (diversity & budget).

---

## 3) UX decisions

- **Plain, opinionated controls**: search, sliders, toggles, and a visible **Auto-pick** button.
- **Inline “Why”**: rationale appears in the card (no modals) to keep context.
- **Pagination**: avoids long scrolling and keeps performance predictable.
- **Blind mode**: toggles identity hiding for fair screening.
- **Presets**: one click to change weighting towards Product-Led or Infra-Heavy teams.
- **Snapshot panel**: totals, shortlist size, regional distribution, avg shortlist salary.

Alternatives considered:
- Infinite scroll (rejected for discoverability and demo clarity).
- Complex query builders (rejected for time and cognitive load).
- Tailwind/Design system (stayed with plain CSS to keep install friction zero).

---

## 4) Architecture

- **Create React App** (zero config, easy local run).
- **Componentized UI**:
  - `Header`, `Controls`, `CandidateCard`, `Pager`, `Snapshot`, `SidebarShortlist`, `UI` primitives.
- **State**: local React state; no external store needed for this scope.
- **Persistence**: `localStorage` for weights, diversity toggle, budget, page size.
- **Utilities**:
  - `lib/scoring.js` encapsulates keywords, categorization, region mapping, scoring, diversity logic, budget-aware `autoPick`, and `explain`.

Trade-off: For simplicity we kept **no backend**. Future phases can add an API for persistence and collaboration.

---

## 5) Scoring model (details)

Computed as:


---

## `DECISIONS.md`

```markdown
# Decisions & Rationale

This document explains **what** we built, **why** we built it that way, and the **trade-offs** we accepted.

---

## 1) Problem framing

- Goal: pick a **founding team of 5** from hundreds of noisy inbound applicants.
- Constraints: frontend assessment; many candidates; data quality varies; time-boxed.
- Requirements from prompt:
  - UI to sift applicants; **choose 5**; communicate **why** they were chosen.
  - Emphasis on **usability**, **engineering quality**, **creativity**, **ownership**.

---

## 2) High-level approach

- **Scoring + role coverage**: compute a robust score per candidate using skills, experience, degree tier, salary friendliness, and availability. Then ensure the final 5 **cover essential roles**:
  - Frontend, Backend, Data(ML/Eng), DevOps/Infra, PM/Design/Full-stack.
- **Diversity preference**: where possible, prefer unique regions (APAC, EU, NA, LATAM, MEA).
- **Budget target**: respect a target **average salary** by swapping within role groups.

Why this works: it reflects how early teams are actually assembled—coverage first, then optimize quality and guardrails (diversity & budget).

---

## 3) UX decisions

- **Plain, opinionated controls**: search, sliders, toggles, and a visible **Auto-pick** button.
- **Inline “Why”**: rationale appears in the card (no modals) to keep context.
- **Pagination**: avoids long scrolling and keeps performance predictable.
- **Blind mode**: toggles identity hiding for fair screening.
- **Presets**: one click to change weighting towards Product-Led or Infra-Heavy teams.
- **Snapshot panel**: totals, shortlist size, regional distribution, avg shortlist salary.

Alternatives considered:
- Infinite scroll (rejected for discoverability and demo clarity).
- Complex query builders (rejected for time and cognitive load).
- Tailwind/Design system (stayed with plain CSS to keep install friction zero).

---

## 4) Architecture

- **Create React App** (zero config, easy local run).
- **Componentized UI**:
  - `Header`, `Controls`, `CandidateCard`, `Pager`, `Snapshot`, `SidebarShortlist`, `UI` primitives.
- **State**: local React state; no external store needed for this scope.
- **Persistence**: `localStorage` for weights, diversity toggle, budget, page size.
- **Utilities**:
  - `lib/scoring.js` encapsulates keywords, categorization, region mapping, scoring, diversity logic, budget-aware `autoPick`, and `explain`.

Trade-off: For simplicity we kept **no backend**. Future phases can add an API for persistence and collaboration.

---

## 5) Scoring model (details)

Computed as:

score =
Σ(prioScore[category] × userWeight[category] if candidate hits category)
skill bonuses (React, TS, Cloud, Node, Python, ML)
min(yearsExperience, 8)
degreeTierBonus (Top25=+2, Top50=+1)
salary friendliness bonus (≤80k:+5, ≤110k:+3, ≤140k:+1, else −1)
availability bonus (full-time:+2)
± small adjustments (missing name, etc.)


- **Categorization**: keyword match across skills, roles, education.
- **Salary parsing**: tolerant numeric extraction (e.g., “$95,000” → `95000`).

Known limitations:
- Keywords are heuristic; a proper NLP pipeline would be better.
- Degree tier relies on a flag in the data (works if present).

---

## 6) Auto-pick algorithm

**Step 1 — Greedy role coverage**
- For each role group (FE, BE, Data, DevOps, PM/Design/FS):
  - Sort eligible candidates by:
    1) **diversity novelty** (unused region first),
    2) **score** (desc),
    3) **salary** (asc).
  - Pick the top one; mark its region as used.

**Step 2 — Budget swaps (optional)**
- If a **target avg. salary** is set and we have known salaries:
  - Order chosen candidates by price (desc).
  - For each, look for **cheaper alternatives** in the same role group that keep score quality reasonable.
  - If a swap reduces the **avg ≤ target**, keep it and stop early.

**Why within-group swaps?**  
It keeps **role coverage** intact while reducing budget.

Edge cases:
- Missing salaries → excluded from average; the constraint becomes soft.
- If target is too low relative to market, we keep the best feasible set and show the average.

---

## 7) Diversity strategy

- Regions: APAC, EU, NA, LATAM, MEA, Unknown.
- In greedy selection we award a **novelty bonus** if the candidate’s region hasn’t been used yet.
- We **never down-rank** a candidate because of protected attributes—only **prefer** breadth across regions when possible.

---

## 8) Fairness guardrails

- **Blind mode** hides name/email during screening.
- Scoring only uses **skills, experience, salary signals, and availability**—no protected attributes.
- Region is used **only** for slate diversity preference in auto-pick (configurable).

Future: add fairness dashboards (distribution across seniority, salary bands, time-to-shortlist).

---

## 9) Performance

- Pagination keeps the DOM manageable.
- Simple memos (`useMemo`) across scoring and sorting.
- Future (Phase 1): add **virtualized list** (react-window) for 10k+ rows.

---

## 10) Accessibility

- Labels/`aria-` on inputs and buttons.
- Sufficient color contrast; Safari text visibility fixes via `-webkit-text-fill-color`.
- Keyboard-navigable controls; buttons have consistent hit areas.

---

## 11) Error handling

- JSON parsing guarded with `try/catch`.
- Invalid file → toast/alert; app state remains stable.
- Missing fields treated as null/empty; UI shows “—”.

---

## 12) Security & privacy

- All data is local in the browser.
- No outbound network calls except loading the local demo JSON.
- Exported shortlist is a local download (no server).

---

## 13) Alternatives considered

- **Vite + Tailwind**: faster builds/style primitives, but CRA is simpler for reviewers (and no Tailwind install hiccups).
- **Redux/Zustand**: overkill for current scope.
- **Server-side search/scoring**: unnecessary for hundreds of rows; would add friction.

---

## 14) Ownership: roadmap & next steps

See README **Roadmap**. Priorities:
1. Must-have filters (skills include/exclude, min years).
2. Duplicate detection + CSV/Greenhouse export.
3. Virtualized list.
4. Role templates & interview pipeline.
5. Score snapshots & fairness reports.


