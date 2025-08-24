import React, { useEffect, useMemo, useRef, useState } from "react";
import useDebouncedValue from "./hooks/useDebouncedValue";
import Controls from "./components/Controls";
import CandidateCard from "./components/CandidateCard";
import Pager from "./components/Pager";
import Snapshot from "./components/Snapshot";
import SidebarShortlist from "./components/SidebarShortlist";
import { Card } from "./components/UI";
import {
  computeScore, autoPick, parseSalary, norm
} from "./lib/scoring";
import Header from "./components/Header";

// presets for creative weighting
const PRESETS = {
  Balanced: { frontend:1, backend:1, fullstack:1, data_ml:1, data_engineer:1, devops_cloud:1, product:1, design:1 },
  ProductLed: { frontend:1, backend:0.75, fullstack:1, data_ml:0.75, data_engineer:0.75, devops_cloud:0.5, product:1.5, design:1.25 },
  InfraHeavy: { frontend:0.75, backend:1.25, fullstack:1, data_ml:0.75, data_engineer:1.25, devops_cloud:1.25, product:0.75, design:0.75 },
};

export default function App() {
  const [raw, setRaw] = useState([]);
  const [q, setQ] = useState("");
  const [blind, setBlind] = useState(false);
  const [preferDiversity, setPreferDiversity] = useState(true);
  const [budgetAvg, setBudgetAvg] = useState(100000);
  const [weights, setWeights] = useState(PRESETS.Balanced);
  const [shortlist, setShortlist] = useState([]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fileRef = useRef();

  // restore settings
  useEffect(()=>{
    try{
      const s = JSON.parse(localStorage.getItem("hp-settings")||"{}");
      if (s.weights) setWeights(s.weights);
      if (typeof s.preferDiversity === "boolean") setPreferDiversity(s.preferDiversity);
      if (s.budgetAvg) setBudgetAvg(s.budgetAvg);
      if (s.pageSize) setPageSize(s.pageSize);
    } catch {}
  }, []);
  // persist settings
  useEffect(()=>{
    localStorage.setItem("hp-settings", JSON.stringify({weights, preferDiversity, budgetAvg, pageSize}));
  }, [weights, preferDiversity, budgetAvg, pageSize]);

  // demo autoload
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo")) {
      fetch("/Mercor-form-submissions.json").then(r=>r.json()).then(setRaw).catch(()=>{});
    }
  }, []);

  const onUpload = async (evt) => {
    const file = evt.target.files?.[0]; if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const clean = Array.isArray(data) ? data.filter(x=>x && (x.email || x.name)) : [];
      setRaw(clean);
    } catch { alert("Invalid JSON"); }
  };

  // Search (debounced + tokenized AND)
  const qDebounced = useDebouncedValue(q, 250);
  const candidates = useMemo(() => {
    if (!Array.isArray(raw)) return [];
    const tokens = norm(qDebounced).split(/\s+/).filter(Boolean);
    return raw.filter((c) => {
      if (!tokens.length) return true;
      const hay = [
        c.name, c.email, c.location,
        ...(c.skills||[]),
        ...(c.work_experiences||[]).map(w=>w.roleName),
        ...(c.work_experiences||[]).map(w=>w.company),
      ].map(norm).join(" ");
      return tokens.every(t => hay.includes(t));
    });
  }, [raw, qDebounced]);

  const scored = useMemo(() => candidates.map((c) => ({ cand: c, meta: computeScore(c, weights) })), [candidates, weights]);
  const sorted = useMemo(() => scored.sort((a,b)=> b.meta.score - a.meta.score), [scored]);

  // pagination
  useEffect(()=> setPage(1), [raw, qDebounced, weights]);
  const totalRows = sorted.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  useEffect(()=> { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);
  const currentRows = useMemo(()=> {
    const start = (page-1)*pageSize; return sorted.slice(start, start+pageSize);
  }, [sorted, page, pageSize]);

  // team metrics
  const avgShortlist = useMemo(()=>{
    const nums = shortlist.map(parseSalary).filter(n=>typeof n==='number' && !Number.isNaN(n));
    return nums.length ? Math.round(nums.reduce((a,b)=>a+b,0)/nums.length) : null;
  }, [shortlist]);

  const handleShortlistAdd = (cand) =>
    setShortlist((s)=> s.find(x=>x.email===cand.email) ? s : [...s, cand]);

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
        {/* HEADER back with buttons */}
        <Header
          onUploadClick={() => fileRef.current?.click()}
          onAutoPick={runAutoPick}
          onExport={exportShortlist}
        />
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={onUpload}
        />

        {/* Controls + Snapshot share a single grid row (like your “good” screenshot) */}
        <div className="grid mt-6">
          <Controls
            q={q} setQ={setQ}
            budgetAvg={budgetAvg} setBudgetAvg={setBudgetAvg}
            blind={blind} setBlind={setBlind}
            preferDiversity={preferDiversity} setPreferDiversity={setPreferDiversity}
            weights={weights} setWeights={setWeights}
          />
          <Snapshot candidates={candidates} shortlist={shortlist} avgShortlist={avgShortlist} />
        </div>

        {/* Main grid: list + sidebar */}
        <div className="grid mt-6">
          <div>
            <Pager
              page={page} pageCount={pageCount}
              pageSize={pageSize} setPage={setPage} setPageSize={setPageSize}
              totalRows={totalRows}
            />
            <div className="list">
              {currentRows.map(({ cand, meta }, idx) => (
                <CandidateCard
                  key={(cand.email||cand.name||idx)+idx}
                  cand={cand}
                  meta={meta}
                  blind={blind}
                  onShortlist={handleShortlistAdd}
                />
              ))}
            </div>
            <Pager
              page={page} pageCount={pageCount}
              pageSize={pageSize} setPage={setPage} setPageSize={setPageSize}
              totalRows={totalRows}
            />
          </div>

          <div className="sticky">
            <SidebarShortlist
              shortlist={shortlist}
              blind={blind}
              onRemove={(c)=> setShortlist((s)=> s.filter(x=>x!==c))}
              onClear={()=> setShortlist([])}
            />
          </div>
        </div>
      </div>
    </div>
  );
}