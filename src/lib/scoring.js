// Skills / roles / weights
export const kw = {
  frontend: ["react","angular","vue","javascript","typescript","html","css","tailwind","next js","redux","bootstrap"],
  backend: ["node","express","django","flask","spring","java","kotlin","go","golang","php","c#",".net","ruby","rails","graphql","microservices"],
  data_ml: ["machine learning","ml","data science","pandas","numpy","pytorch","tensorflow","scikit","sql","spark","etl","dbt","snowflake"],
  devops_cloud: ["aws","amazon web services","gcp","azure","docker","kubernetes","terraform","ci","cd","jenkins"],
  mobile: ["react native","android","ios","swift","kotlin"],
  product: ["product manager","product management"],
  design: ["ui/ux","ux","ui","designer","photoshop","figma","illustrator"],
  qa: ["qa","quality","test","testing"],
  data_engineer: ["spark","kafka","hadoop","databricks","airflow"],
};
export const roleMap = {
  frontend: ["frontend engineer","web developer","frontend developer"],
  backend: ["backend engineer","backend developer"],
  fullstack: ["full stack","fullstack"],
  product: ["product manager","product"],
  data_ml: ["data scientist","ml","machine learning","data analyst"],
  data_engineer: ["data engineer"],
  devops_cloud: ["devops","sre","cloud"],
  qa: ["qa","quality"],
  design: ["ux","ui","designer"],
};
export const prioScore = { frontend:10, backend:10, fullstack:9, data_ml:9, data_engineer:9, devops_cloud:8, product:7, design:6 };
export const GROUPS = [
  ["frontend"],
  ["backend"],
  ["data_ml","data_engineer"],
  ["devops_cloud"],
  ["product","design","fullstack"],
];

export const norm = (s) => (s || "").toLowerCase();
export const parseSalary = (cand) => {
  try {
    const s = cand?.annual_salary_expectation?.["full-time"];
    if (!s) return null;
    return Number((s + "").replace(/[^\d]/g, "")) || null;
  } catch { return null; }
};
export const yearsExperience = (cand) => (Array.isArray(cand?.work_experiences) ? cand.work_experiences.length : 0);
export const gradTier = (cand) => {
  const degs = cand?.education?.degrees || [];
  const top25 = degs.some((d) => d?.isTop25);
  const top50 = degs.some((d) => d?.isTop50);
  return top25 ? 2 : top50 ? 1 : 0;
};
export const hasSkill = (cand, key) => {
  const ns = norm(key);
  const skills = (cand?.skills || []).map(norm);
  const skillHit = skills.some((s) => s.includes(ns));
  const roleHit = (cand?.work_experiences || []).some((w) => norm(w?.roleName).includes(ns));
  const eduHit = (cand?.education?.degrees || []).some((d) => norm(d?.subject).includes(ns));
  return skillHit || roleHit || eduHit;
};
export const categorize = (cand) => {
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

export const regionOf = (loc) => {
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

export const computeScore = (cand, weights) => {
  const cats = categorize(cand);
  let base = 0;
  Object.keys(prioScore).forEach((cat) => {
    if (cats.has(cat)) base += (weights?.[cat] ?? 1) * prioScore[cat];
  });
  if (hasSkill(cand, "React")) base += 4;
  if (hasSkill(cand, "TypeScript")) base += 3;
  if (["AWS","Azure","GCP"].some((k) => hasSkill(cand, k))) base += 3;
  if (hasSkill(cand, "Node")) base += 2;
  if (hasSkill(cand, "Python")) base += 2;
  if (hasSkill(cand, "Machine Learning")) base += 2;
  base += Math.min(yearsExperience(cand), 8);
  base += gradTier(cand) * 2;
  const sal = parseSalary(cand);
  if (sal != null) {
    if (sal < 80000) base += 5;
    else if (sal < 110000) base += 3;
    else if (sal < 140000) base += 1;
    else base -= 1;
  }
  if ((cand?.skills || []).length) base += 1;
  if (!cand?.name) base -= 1;
  if ((cand?.work_availability || []).includes("full-time")) base += 2;
  return { score: base, cats, salary: sal };
};

// --- auto-pick (budget-aware, preserves role coverage) ---
const avgKnownFromScored = (pick) => {
  const nums = pick.map(p=>p.meta.salary).filter(n=>typeof n==='number' && !Number.isNaN(n));
  return nums.length ? Math.round(nums.reduce((a,b)=>a+b,0)/nums.length) : null;
};
const groupIndexOf = (item) => {
  const cats = item.meta.cats;
  for (let i=0;i<GROUPS.length;i++) if ([...cats].some((g)=>GROUPS[i].includes(g))) return i;
  return -1;
};

export function autoPick(cands, weights, { preferDiversity = true, budgetAvg = null } = {}) {
  const scored = cands.map((c) => ({ cand: c, meta: computeScore(c, weights) }));
  const usedRegions = new Set(); const pick = [];

  // Greedy pass
  for (const group of GROUPS) {
    const eligible = scored
      .filter(({meta,cand})=>[...meta.cats].some(g=>group.includes(g)) && !pick.some(p=>p.cand===cand))
      .sort((a,b)=>{
        const ra=regionOf(a.cand.location), rb=regionOf(b.cand.location);
        const na=preferDiversity && ra!=="Unknown" && !usedRegions.has(ra) ? 1:0;
        const nb=preferDiversity && rb!=="Unknown" && !usedRegions.has(rb) ? 1:0;
        const sa=a.meta.salary ?? Number.POSITIVE_INFINITY;
        const sb=b.meta.salary ?? Number.POSITIVE_INFINITY;
        return (nb-na)||(b.meta.score-a.meta.score)||(sa-sb);
      });
    if (eligible[0]) { pick.push(eligible[0]); usedRegions.add(regionOf(eligible[0].cand.location)); }
  }

  // Budget pass: cheaper swaps within the same role-group
  if (budgetAvg) {
    let avg = avgKnownFromScored(pick);
    if (avg!==null && avg>budgetAvg){
      const pricey = [...pick].map((p,i)=>({i,sal:p.meta.salary??Number.POSITIVE_INFINITY}))
        .sort((a,b)=>b.sal-a.sal).map(x=>x.i);
      for (const i of pricey){
        const g = groupIndexOf(pick[i]);
        const cur = pick[i].meta.salary ?? Number.POSITIVE_INFINITY;
        const alts = scored
          .filter(s => groupIndexOf(s)===g && !pick.some(p=>p.cand===s.cand) && (s.meta.salary ?? Number.POSITIVE_INFINITY) < cur)
          .sort((a,b)=> (a.meta.salary??1e12)-(b.meta.salary??1e12) || (b.meta.score-a.meta.score));
        for (const alt of alts){
          const tmp=[...pick]; tmp[i]=alt;
          const newAvg=avgKnownFromScored(tmp);
          if (newAvg!==null && newAvg<=budgetAvg){ pick[i]=alt; avg=newAvg; break; }
        }
        if (avg!==null && avg<=budgetAvg) break;
      }
    }
  }
  return pick.map(p=>p.cand);
}

export function explain(c) {
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
