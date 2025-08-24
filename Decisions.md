# Decisions & Rationale

This document explains **what** we built, **why** we built it that way, and the **trade‑offs** we accepted.

---

## 1) Problem framing

- Goal: pick a **founding team of 5** from hundreds of noisy inbound applicants.  
- Constraints: frontend assessment; many candidates; data quality varies; time‑boxed.  
- Requirements from prompt:
  - UI to sift applicants; **choose 5**; communicate **why** they were chosen.  
  - Emphasis on **usability**, **engineering quality**, **creativity**, **ownership**.

---

## 2) High‑level approach

- **Scoring + role coverage**: compute a robust score per candidate using skills, experience, degree tier, salary friendliness, and availability. Then ensure the final 5 **cover essential roles**: FE, BE, Data(ML/Eng), DevOps/Infra, PM/Design/Full‑stack.  
- **Diversity preference**: where possible, prefer unique regions (APAC, EU, NA, LATAM, MEA).  
- **Budget target**: respect a target **average salary** by swapping within role groups.

Why this works: early teams are assembled for **coverage first**, then we optimize quality with guardrails (diversity & budget).

---

## 3) UX decisions

- **Simple, visible controls**: search, sliders, toggles, and a clearly labeled **Auto‑pick** button.  
- **Inline “Why”**: rationale inside the card (no modals) to keep context.  
- **Pagination**: avoids long scrolling and keeps performance predictable.  
- **Blind mode**: quick toggle for fair screening.  
- **Presets**: switch weighting to Product‑Led or Infra‑Heavy in one click.  
- **Snapshot panel**: totals, shortlist size, regional distribution, avg shortlist salary.

**Alternatives considered**  
- Infinite scroll → rejected (discoverability & demo clarity).  
- Complex query builders → rejected (cognitive load vs. value).  
- Tailwind/design system → kept plain CSS to remove setup friction.

---

## 4) Architecture

- **Create React App** (zero config, easy local run).  
- **Componentized UI**: `Header`, `Controls`, `CandidateCard`, `Pager`, `Snapshot`, `SidebarShortlist`, `UI` primitives.  
- **State**: local React state; no external store needed for this scope.  
- **Persistence**: `localStorage` for weights, diversity toggle, budget, page size.  
- **Utilities**: `lib/scoring.js` encapsulates keywords, categorization, region mapping, scoring, diversity logic, budget‑aware `autoPick`, and `explain`.

*Trade‑off:* No backend for now (simplicity). Future phases can add an API for persistence and collaboration.

---

## 5) Scoring model (details)

```
score =
  Σ(prioScore[category] × userWeight[category] if candidate hits category)
+ skill bonuses (React, TS, Cloud, Node, Python, ML)
+ min(yearsExperience, 8)
+ degreeTierBonus (Top25=+2, Top50=+1)
+ salary friendliness bonus (≤80k:+5, ≤110k:+3, ≤140k:+1, else −1)
+ availability bonus (full-time:+2)
± small adjustments (missing name, etc.)
```

- **Categorization**: keyword match across skills, roles, education.  
- **Salary parsing**: tolerant numeric extraction (e.g., `$95,000` → `95000`).

*Limitations:* keywords are heuristic; a real NLP pipeline would be stronger. Degree tier relies on a flag in the data.

---

## 6) Auto‑pick algorithm

**Step 1 — Greedy role coverage**  
For each role group (FE, BE, Data, DevOps, PM/Design/FS), sort eligible candidates by:
1. **Diversity novelty** (unused region first)  
2. **Score** (desc)  
3. **Salary** (asc)

Pick the top one and mark the region as used.

**Step 2 — Budget swaps (optional)**  
If a **target avg. salary** is set and we have known salaries:
- Order chosen candidates by price (desc).
- For each, look for **cheaper alternatives** in the same role group that keep score quality reasonable.
- If a swap reduces the **avg ≤ target**, keep it and stop early.

*Why within‑group swaps?* Keeps **role coverage** intact while reducing budget.

*Edge cases:* Missing salaries are excluded from averages; if the target is unattainable, we keep the best feasible set and display the average.

---

## 7) Diversity strategy

- Regions: APAC, EU, NA, LATAM, MEA, Unknown.  
- Greedy selection gives a **novelty bonus** for first‑time regions.  
- We never down‑rank on protected attributes—region is only used to **prefer breadth**, not to exclude.

---

## 8) Fairness guardrails

- **Blind mode** hides name/email during screening.  
- Scoring uses **skills, experience, salary signals, availability** only.  
- Region is used only for slate diversity preference (configurable).

Future: add fairness dashboards (distribution across seniority, salary bands, time‑to‑shortlist).

---

## 9) Performance

- Pagination keeps the DOM manageable.  
- `useMemo` across scoring and sorting.  
- Future: **virtualized list** (react‑window) for 10k+ rows.

---

## 10) Accessibility

- Labels/`aria-` on inputs and buttons.  
- Contrast + Safari text visibility fixes (`-webkit-text-fill-color`).  
- Keyboard‑navigable; consistent hit areas.

---

## 11) Error handling

- JSON parsing with `try/catch`.  
- Invalid file → alert; app state remains stable.  
- Missing fields → treated as null/empty; UI shows “—”.

---

## 12) Security & privacy

- All data is local in the browser.  
- Only network call is fetching the optional demo JSON.  
- Export is a local download (no server).

---

## 13) Alternatives considered

- **Vite + Tailwind**: faster builds, but CRA keeps setup trivial for reviewers.  
- **Redux/Zustand**: unnecessary at this scope.  
- **Server‑side search/scoring**: overkill for hundreds of rows.

---

## 14) Ownership: roadmap & next steps

See README **Roadmap**. Priorities:
1. Must‑have filters (skills include/exclude, min years).  
2. Duplicate detection + CSV/Greenhouse export.  
3. Virtualized list.  
4. Role templates & interview pipeline.  
5. Score snapshots & fairness reports.