import React, { useEffect, useMemo, useRef, useState } from "react";

/** HirePilot — CRA version (no Vite/Tailwind)
 * Features:
 *  - Upload JSON (and auto-load with ?demo=1 from /Mercor-form-submissions.json)
 *  - Search (skill/location/company)
 *  - Blind Mode (hide name/email)
 *  - Region-diversity toggle
 *  - Target Avg Salary input
 *  - Scoring sliders (FE/BE/FS/Data-ML/Data Eng/DevOps/Product/Design)
 *  - Candidate cards (region, score, salary, chips, key skills, companies)
 *  - Auto-pick 5 (role coverage + region diversity)
 *  - Why (explain rationale)
 *  - Export shortlist as JSON
 *  - Pagination
 */

const kw = {
  frontend: ["react", "angular", "vue", "javascript", "typescript", "html", "css", "tailwind", "next js", "redux", "bootstrap"],
  backend: ["node", "express", "django", "flask", "spring", "java", "kotlin", "go", "golang", "php", "c#", ".net", "ruby", "rails", "graphql", "microservices"],
  data_ml: ["machine learning", "ml", "data science", "pandas", "numpy", "pytorch", "tensorflow", "scikit", "sql", "spark", "etl", "dbt", "snowflake"],
  devops_cloud: ["aws", "amazon web services", "gcp", "azure", "docker", "kubernetes", "terraform", "ci", "cd", "jenkins"],
  mobile: ["react native", "android", "ios", "swift", "kotlin"],
  product: ["product manager", "product management"],
  design: ["ui/ux", "ux", "ui", "designer", "photoshop", "figma", "illustrator"],
  qa: ["qa", "quality", "test", "testing"],
  data_engineer: ["spark", "kafka", "hadoop", "databricks", "airflow"],
};
const roleMap = {
  frontend: ["frontend engineer", "web developer", "frontend developer"],
  backend: ["backend engineer", "backend developer"],
  fullstack: ["full stack", "fullstack"],
  product: ["product manager", "product"],
  data_ml: ["data scientist", "ml", "machine learning", "data analyst"],
  data_engineer: ["data engineer"],
  devops_cloud: ["devops", "sre", "cloud"],
  qa: ["qa", "quality"],
  design: ["ux", "ui", "designer"],
};
const prioScore = { frontend: 10, backend: 10, fullstack: 9, data_ml: 9, data_engineer: 9, devops_cloud: 8, product: 7, design: 6 };

const norm = (s) => (s || "").toLowerCase();
const parseSalary = (cand) => {
  try {
    const s = cand?.annual_salary_expectation?.["full-time"]; if (!s) return null;
    return Number((s + "").replace(/[^\d]/g, "")) || null;
  } catch { return null; }
};
const yearsExperience = (cand) => (Array.isArray(cand?.work_experiences) ? cand.work_experiences.length : 0);
const gradTier = (cand) => {
  const degs = cand?.education?.degrees || [];
  const top25 = degs.some((d) => d?.isTop25);
  const top50 = degs.some((d) => d?.isTop50);
  return top25 ? 2 : top50 ? 1 : 0;
};
const hasSkill = (cand, key) => {
  const ns = norm(key);
  const skills = (cand?.skills || []).map(norm);
  const skillHit = skills.some((s) => s.includes(ns));
  const roleHit = (cand?.work_experiences || []).some((w) => norm(w?.roleName).includes(ns));
  const eduHit = (cand?.education?.degrees || []).some((d) => norm(d?.subject).includes(ns));
  return skillHit || roleHit || eduHit;
};
const categorize = (cand) => {
  const set = new Set();
  (cand?.skills || []).forEach((s) => {
    const ns = norm(s);
    Object.entries(kw).forEach(([cat, list]) => {
      if (list.some((k) => ns.includes(k))) set.add(cat);
    });
  });
  (cand?.work_experiences || []).forEach((w) => {
    const rn = norm(w?.roleName);
    Object.entries(roleMap).forEach(([cat, arr]) => {
      if (arr.some((t) => rn.includes(t))) set.add(cat);
    });
    if (rn.includes("developer") && rn.includes("full")) set.add("fullstack");
    if (rn.includes("software engineer")) set.add("backend");
  });
  return set;
};

const regionOf = (loc) => {
  const s = norm(loc);
  if (!s) return "Unknown";
  if (/(india|bangladesh|pakistan|nepal|sri lanka|hydrabad|hyderabad)/.test(s)) return "APAC";
  if (/(brazil|rio|salvador|belo horizonte|laguna|pelotas|maceió|maceio)/.test(s)) return "LATAM";
  if (/(argentina|mendoza|rosario|quilmes|caba|posadas|buenos aires)/.test(s)) return "LATAM";
  if (/(colombia|bogotá|medellín|medellin|manizales)/.test(s)) return "LATAM";
  if (/(united states|usa|philadelphia|malvern|san diego|new jersey)/.test(s)) return "NA";
  if (/(canada|toronto|vancouver|montreal)/.test(s)) return "NA";
  if (/(uk|london|england|britain)/.test(s)) return "EU";
  if (/(spain|italy|romania|timisoara|seville)/.test(s)) return "EU";
  if (/(amman|jordan)/.test(s)) return "MEA";
  if (/(jamaica|kingston)/.test(s)) return "LATAM";
  return "Unknown";
};

const computeScore = (cand, weights) => {
  const cats = categorize(cand);
  let base = 0;
  Object.keys(prioScore).forEach((cat) => {
    if (cats.has(cat)) base += (weights?.[cat] ?? 1) * prioScore[cat];
  });
  if (hasSkill(cand, "React")) base += 4;
  if (hasSkill(cand, "TypeScript")) base += 3;
  if (["AWS", "Azure", "GCP"].some((k) => hasSkill(cand, k))) base += 3;
  if (hasSkill(cand, "Node")) base += 2;
  if (hasSkill(cand, "Python")) base += 2;
  if (hasSkill(cand, "Machine Learning")) base += 2;
  base += Math.min(yearsExperience(cand), 8);
  base += gradTier(cand) * 2;
  const sal = parseSalary(cand);
  if (sal != null) {
    if (sal < 80000) base += 5; else if (sal < 110000) base += 3; else if (sal < 140000) base += 1; else base -= 1;
  }
  if ((cand?.skills || []).length) base += 1;
  if (!cand?.name) base -= 1;
  if ((cand?.work_availability || []).includes("full-time")) base += 2;
  return { score: base, cats, salary: sal };
};

const GROUPS = [["frontend"], ["backend"], ["data_ml", "data_engineer"], ["devops_cloud"], ["product", "design", "fullstack"]];

const diversityKey = (cand, usedRegions, scoreObj, preferDiversity) => {
  const region = regionOf(cand.location);
  const novelty = preferDiversity && region !== "Unknown" && !usedRegions.has(region) ? 1 : 0;
  const score = scoreObj.score;
  const salary = scoreObj.salary ?? 9e9;
  return [novelty, score, -salary];
};

function autoPick(cands, weights, { preferDiversity = true, budgetAvg = null } = {}) {
  const scored = cands.map((c) => ({ cand: c, meta: computeScore(c, weights) }));
  const pick = [];
  const usedRegions = new Set();
  for (const group of GROUPS) {
    const eligible = scored.filter(({ cand, meta }) => [...meta.cats].some((g) => group.includes(g)) && !pick.some((p) => p.cand === cand));
    eligible.sort((a, b) => {
      const ka = diversityKey(a.cand, usedRegions, a.meta, preferDiversity);
      const kb = diversityKey(b.cand, usedRegions, b.meta, preferDiversity);
      return kb[0] - ka[0] || kb[1] - ka[1] || kb[2] - ka[2];
    });
    if (eligible[0]) {
      pick.push(eligible[0]);
      usedRegions.add(regionOf(eligible[0].cand.location));
    }
  }
  if (budgetAvg) {
    const avg = pick.reduce((s, p) => s + (p.meta.salary ?? 0), 0) / Math.max(1, pick.length);
    if (avg > budgetAvg) {
      const last = pick[pick.length - 1];
      const cheaper = scored
        .filter(({ meta }) => meta.salary && meta.salary < (last?.meta.salary ?? 9e9))
        .sort((a, b) => (a.meta.salary ?? 9e9) - (b.meta.salary ?? 9e9));
      if (cheaper[0]) pick[pick.length - 1] = cheaper[0];
    }
  }
  return pick.map((p) => p.cand);
}

function explain(c) {
  const cats = Array.from(categorize(c));
  const keySkills = (c.skills || []).slice(0, 8);
  const companies = (c.work_experiences || []).slice(0, 3).map((w) => w.company).filter(Boolean);
  const degs = c?.education?.degrees || [];
  const topUni = degs.find((d) => d?.isTop25)?.originalSchool || degs.find((d) => d?.isTop50)?.originalSchool;
  return {
    roleCats: cats,
    bullets: [
      companies.length ? `Experience at ${companies.join(", ")}` : null,
      keySkills.length ? `Skills: ${keySkills.join(", ")}` : null,
      topUni ? `Pedigree: ${topUni}` : null,
      `Region: ${regionOf(c.location)}  •  Expected salary: ${c?.annual_salary_expectation?.["full-time"] || "—"}`,
    ].filter(Boolean),
  };
}

const Badge = ({ children }) => <span className="badge">{children}</span>;
const Chip = ({ children }) => <span className="chip">{children}</span>;
const Button = ({ children, className = "", ...props }) => <button className={`btn ${className}`} {...props}>{children}</button>;
const Card = ({ children, className = "" }) => <div className={`card ${className}`}>{children}</div>;

export default function App() {
  const [raw, setRaw] = useState([]);
  const [q, setQ] = useState("");
  const [blind, setBlind] = useState(false);
  const [preferDiversity, setPreferDiversity] = useState(true);
  const [budgetAvg, setBudgetAvg] = useState(100000);
  const [weights, setWeights] = useState({ frontend: 1, backend: 1, fullstack: 1, data_ml: 1, data_engineer: 1, devops_cloud: 1, product: 1, design: 1 });
  const [shortlist, setShortlist] = useState([]);
  const fileRef = useRef();

  // pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demo = params.get("demo");
    if (demo) {
      fetch("/Mercor-form-submissions.json").then((r) => r.json()).then(setRaw).catch(() => { });
    }
  }, []);

  const onUpload = async (evt) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    const txt = await file.text();
    try { setRaw(JSON.parse(txt)); } catch { alert("Invalid JSON"); }
  };

  const candidates = useMemo(() => {
    if (!Array.isArray(raw)) return [];
    const text = norm(q);
    return raw.filter((c) => {
      if (!text) return true;
      const hay = [c.name, c.email, c.location, ...(c.skills || []), ...(c.work_experiences || []).map(w => w.roleName), ...(c.work_experiences || []).map(w => w.company)]
        .map(norm).join(" ");
      return hay.includes(text);
    });
  }, [raw, q]);

  const scored = useMemo(() => candidates.map((c) => ({ cand: c, meta: computeScore(c, weights) })), [candidates, weights]);

  // full list sorted; (removed .slice(0, 200))
  const top = useMemo(() => scored.sort((a, b) => b.meta.score - a.meta.score), [scored]);

  // reset to page 1 when data or sort drivers change
  useEffect(() => { setPage(1); }, [raw, q, weights]);

  const totalRows = top.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const currentRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return top.slice(start, start + pageSize);
  }, [top, page, pageSize]);

  const goto = (n) => setPage(Math.min(Math.max(1, n), pageCount));
  const pageWindow = useMemo(() => {
    const start = Math.max(1, page - 2);
    const end = Math.min(pageCount, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, pageCount]);

  const Pager = () => (
    <div className="pagebar">
      <div className="small">
        Showing <strong>{Math.min((page - 1) * pageSize + 1, totalRows)}</strong>–<strong>{Math.min(page * pageSize, totalRows)}</strong>
        {" "}of <strong>{totalRows}</strong>
      </div>
      <div className="pages">
        <button className="pagebtn" onClick={() => goto(1)} disabled={page === 1}>« First</button>
        <button className="pagebtn" onClick={() => goto(page - 1)} disabled={page === 1}>‹ Prev</button>
        {pageWindow.map(n => (
          <button key={n} className={`pagebtn ${n === page ? 'active' : ''}`} onClick={() => goto(n)}>{n}</button>
        ))}
        <button className="pagebtn" onClick={() => goto(page + 1)} disabled={page === pageCount}>Next ›</button>
        <button className="pagebtn" onClick={() => goto(pageCount)} disabled={page === pageCount}>Last »</button>
        <select className="pagesel" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
          {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}/page</option>)}
        </select>
      </div>
    </div>
  );

  const runAutoPick = () => {
    const picks = autoPick(candidates, weights, { preferDiversity, budgetAvg });
    setShortlist(picks);
  };
  const exportShortlist = () => {
    const blob = new Blob([JSON.stringify(shortlist, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `hirepilot-shortlist-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/hirepilot-logo.svg" alt="HirePilot" height="32" />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input ref={fileRef} type="file" accept="application/json" style={{ display: "none" }} onChange={onUpload} />
            <Button onClick={() => fileRef.current?.click()}>Upload JSON</Button>
            <Button className="secondary" onClick={runAutoPick}>Auto-pick 5</Button>
            <Button className="secondary" onClick={exportShortlist}>Export</Button>
          </div>
        </div>

        <div className="grid mt-6">
          <Card>
          <div className="control-row">
            <input
              className="input"
              style={{ color: '#111', WebkitTextFillColor: '#111' }}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by skill, location, company…"
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="small">Target avg. salary</span>
              <input className="number" type="number" value={budgetAvg} onChange={(e) => setBudgetAvg(Number(e.target.value) || 0)} />
            </div>
          </div>

          <div className="slider-wrap mt-2">
            {Object.keys(prioScore).map((k) => (
              <div className="slider" key={k}>
                <label>{k.replace("_", " ")}</label>
                <input type="range" min={0} max={2} step={0.25} value={weights[k]}
                  onChange={(e) => setWeights((w) => ({ ...w, [k]: Number(e.target.value) }))} />
                <div className="val">×{weights[k]}</div>
              </div>
            ))}
          </div>

          <div className="mt-2">
            <label><input className="checkbox" type="checkbox" checked={blind} onChange={(e) => setBlind(e.target.checked)} /> Blind mode</label>
            <label><input className="checkbox" type="checkbox" checked={preferDiversity} onChange={(e) => setPreferDiversity(e.target.checked)} /> Prefer region diversity</label>
          </div>
        </Card>

          <Card>
            <div className="snapshot">
              <div className="row"><span>Total candidates</span><strong>{candidates.length}</strong></div>
              <div className="row"><span>Shortlist</span><strong>{shortlist.length}</strong></div>
              <div className="metrics mt-2">
                {["APAC", "EU", "NA", "LATAM", "MEA", "Unknown"].map((r) => (
                  <span key={r} className="badge">{r}: {candidates.filter(c => regionOf(c.location) === r).length}</span>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="grid mt-6">
          <div>
            {/* TOP PAGER */}
            <Pager />

            <div className="list">
              {currentRows.map(({ cand, meta }, idx) => (
                <Card key={(cand.email || cand.name || idx) + idx}>
                  <div className="row">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="candidate-header">
                        <div style={{ fontWeight: 600, maxWidth: "60ch", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {blind ? "Candidate" : (cand.name || cand.email || "Unnamed")}
                        </div>
                        <Badge>{regionOf(cand.location)}</Badge>
                        <Badge>Score {meta.score}</Badge>
                        {meta.salary && <Badge>${(meta.salary).toLocaleString()}</Badge>}
                      </div>
                      <div className="candidate-sub">{cand.location || "—"}</div>
                      <div className="role-chips">
                        {Array.from(meta.cats).slice(0, 7).map((c) => <Chip key={c}>{c}</Chip>)}
                      </div>
                      {!!(cand.skills?.length) && (
                        <div className="mt-2"><span className="small">Skills: </span>{(cand.skills || []).slice(0, 12).join(", ")}</div>
                      )}
                      {!!(cand.work_experiences?.length) && (
                        <div className="mt-2"><span className="small">Experience: </span>{(cand.work_experiences || []).slice(0, 3).map(w => `${w.company} — ${w.roleName}`).join(" · ")}</div>
                      )}
                    </div>
                    <div className="actions">
                      <Button className="small" onClick={() =>
                        setShortlist((s) => s.find(x => x.email === cand.email) ? s : [...s, cand])
                      }>
                        Shortlist
                      </Button>
                      <Button className="small" onClick={() => alert(explain(cand).bullets.join("\n"))}>
                        Why
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* BOTTOM PAGER */}
            <Pager />
          </div>

          <div className="sticky">
            <Card>
              <div className="row">
                <h3 style={{ margin: 0 }}>Shortlist ({shortlist.length})</h3>
                <Button className="danger small" onClick={() => setShortlist([])}>Clear</Button>
              </div>
              <div className="mt-2">
                {shortlist.map((c, i) => (
                  <div key={c.email || c.name || i} className="short-card">
                    <div className="row">
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="short-title">{blind ? `Candidate ${i + 1}` : (c.name || c.email)}</div>
                        <div className="small">{regionOf(c.location)} • {c.location || "—"}</div>
                        <div className="small">{c.annual_salary_expectation?.["full-time"] || "—"}</div>
                      </div>
                      <button className="small" style={{ border: "none", background: "transparent", color: "#e11d48", cursor: "pointer" }}
                        onClick={() => setShortlist((s) => s.filter(x => x !== c))}>remove</button>
                    </div>
                    <div className="small mt-2">
                      {explain(c).bullets.map((b, idx) => <div key={idx}>• {b}</div>)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="mt-2">
              <h3 style={{ marginTop: 0 }}>Fairness & guardrails</h3>
              <ul className="fairlist">
                <li>Blind mode hides identity while screening.</li>
                <li>Scoring favours skills, experience, and budget — no protected attributes.</li>
                <li>“Prefer region diversity” seeks breadth across APAC, EU, NA, LATAM, MEA when possible.</li>
              </ul>
            </Card>

            <Card className="mt-2">
              <h3 style={{ marginTop: 0 }}>How I’d extend this</h3>
              <ul className="fairlist">
                <li>Interview scheduler + email templates.</li>
                <li>LLM résumé summarizer and duplicate-applicant detection.</li>
                <li>Role templates (FE, BE, Data/ML, DevOps, PM/Design).</li>
                <li>Score audits and snapshots.</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
