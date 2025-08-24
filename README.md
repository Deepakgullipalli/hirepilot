# HirePilot — shortlist a founding team of 5

Build a diverse, role‑balanced founding team from a large pool of inbound applicants. Upload JSON (or auto‑load a demo file), score candidates, filter/search, **auto‑pick 5** with role coverage + diversity + budget awareness, and export the shortlist.

> Frontend‑only (Create React App). No backend required.

---

## Table of Contents
- [Features](#-features)
- [Quick start](#-quick-start)
- [How to use (demo flow)](#-how-to-use-demo-flow)
- [Data format](#-data-format)
- [Project structure](#-project-structure)
- [Scoring (overview)](#-scoring-overview)
- [Accessibility & UX](#-accessibility--ux)
- [Scripts](#-scripts)
- [Deploy](#-deploy-vercel-netlify-s3)
- [Privacy](#-privacy)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## ✨ Features

- **Upload JSON** (or open `/?demo=1` to auto‑load `public/Mercor-form-submissions.json`)
- **Search** (tokenized; `react brazil` matches skills **and** location/companies)
- **Scoring sliders** for **frontend / backend / fullstack / data‑ml / data engineer / devops / product / design**
- **Blind mode** (hides name/email)
- **Prefer region diversity** (APAC, EU, NA, LATAM, MEA when possible)
- **Target avg. salary** (guides auto‑pick’s budget swaps)
- **Auto‑pick 5** (greedy by role + diversity; then budget‑aware swaps within role groups)
- **Inline “Why”** per candidate (instant rationale bullets)
- **Pagination** (10/25/50/100 per page)
- **Export shortlist** (download JSON)
- **Presets** for weights (Balanced, Product‑Led, Infra‑Heavy)
- **Persistence** of key settings (localStorage)

---

## 🚀 Quick start

```bash
# 1) Install & run
npm install
npm start

# 2) Load data
#   (a) Click "Upload JSON", or
#   (b) put your dataset at public/Mercor-form-submissions.json and open:
#       http://localhost:3000/?demo=1
```

---

## 🧭 How to use (demo flow)

1. **Upload** your applicant JSON (or visit `/?demo=1`).  
2. Adjust **weights** to fit your needs (or choose a preset).  
3. Optionally set a **Target avg. salary** and enable **Prefer region diversity**.  
4. Click **Auto‑pick 5** → the app selects FE, BE, Data(ML/Eng), DevOps, and PM/Design/Full‑Stack.  
5. Open **Why** on any candidate to see rationale.  
6. **Export** the shortlist (JSON) for investors/ATS.

---

## 📦 Data format

Each candidate object may include:

```json
{
  "name": "Jane Roe",
  "email": "jane@ex.com",
  "location": "Belo Horizonte, Brazil",
  "skills": ["React", "Node", "AWS"],
  "annual_salary_expectation": { "full-time": "$95,000" },
  "work_availability": ["full-time"],
  "work_experiences": [
    { "company": "Raro Labs", "roleName": "Full Stack Developer" },
    { "company": "UDS Technology", "roleName": "Software Engineer" }
  ],
  "education": {
    "degrees": [
      { "originalSchool": "Top University", "isTop25": true, "subject": "Computer Science" }
    ]
  }
}
```

Unknown/missing fields are handled gracefully.

---

## 🧱 Project structure

```
src/
  components/
    CandidateCard.jsx
    Controls.jsx
    Header.jsx
    Pager.jsx
    SidebarShortlist.jsx
    Snapshot.jsx
    UI.jsx
  hooks/
    useDebouncedValue.js
  lib/
    scoring.js          # keywords, scoring, diversity, auto-pick, explain()
  App.js
  index.js
  styles.css
public/
  index.html
  hirepilot-logo.svg
  hirepilot-favicon.svg
  Mercor-form-submissions.json   # (optional demo file)
```

---

## 🧪 Scoring (overview)

- Category weights × base priors (e.g., **FE/BE/Data/DevOps/PM/Design**)
- Skill boosts: **React, TypeScript, Cloud (AWS/Azure/GCP), Node, Python, ML**
- Years of experience (capped), degree tier bump (**Top‑25/50**)
- Salary friendliness bonus
- Availability bonus (full‑time)
- Aggregate to a single **score** per candidate

**Auto‑pick**

1. Greedy selection to **cover role groups** (FE, BE, Data, DevOps, PM/Design/FS) with a **diversity** preference and high score.  
2. **Budget pass**: swap within the same role group for cheaper alternatives until average ≤ target (when feasible).

---

## ♿ Accessibility & UX

- Labels/aria on inputs and actions  
- High‑contrast controls with Safari fixes (`-webkit-text-fill-color`)  
- Blind mode removes identifiers from cards + shortlist  
- Pagination avoids long scrolling lists

---

## 🧰 Scripts

```bash
npm start       # dev server
npm run build   # production build (static)
npm test        # CRA default tests
```

---

## ☁️ Deploy (Vercel, Netlify, S3)

```bash
npm run build
# Deploy the build/ directory as static assets.
```

- On **Vercel**: create a new project → framework “Other” → Output dir: `build`.  
- On **Netlify**: build command `npm run build`, publish directory `build`.

---

## 🔒 Privacy

- All data lives in the browser (no network calls except fetching the local demo JSON).
- No tracking; settings stored in `localStorage`.

---

## 🗺️ Roadmap

### Phase 0 (done)
- Upload/auto‑load JSON, search, sliders, blind mode  
- Diversity preference, target avg salary, budget‑aware auto‑pick  
- Inline “Why”, export JSON, pagination, presets, persistence

### Phase 1
- Must‑have filters (e.g., “must include React”, “min years 3”)  
- Duplicate detection (fuzzy match name/email + company history)  
- CSV/Greenhouse export formats  
- List virtualization (windowing) for 10k+ rows

### Phase 2
- In‑app notes & stages (screen, interview, offer)  
- Email templates + calendar links (mailto:, ICS)  
- LLM résumé summarization & skill extraction (client‑side or API)  
- Role templates (FE/BE/Data/DevOps/PM/Design) with recommended weights

### Phase 3
- Score audit trail (snapshots, diffs)  
- Bias audits (distribution by region, seniority bands, salary vs. score)  
- Team simulator: explore tradeoffs (budget vs. quality vs. diversity)  
- Multi‑user mode + cloud storage (opt‑in backend)

---

## 📝 License

MIT — do whatever you like; attribution appreciated.
