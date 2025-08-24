import React from "react";
import { prioScore } from "../lib/scoring";

export default function Controls({
  q, setQ,
  budgetAvg, setBudgetAvg,
  blind, setBlind,
  preferDiversity, setPreferDiversity,
  weights, setWeights,
}) {
  return (
    <div className="card">
      {/* top row: search + salary */}
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
    </div>
  );
}
