import React from "react";
import { Card, Button } from "./UI";
import { regionOf } from "../lib/scoring";

export default function SidebarShortlist({ shortlist, blind, onRemove, onClear }) {
  return (
    <>
      <Card>
        <div className="row">
          <h3 style={{ margin: 0 }}>Shortlist ({shortlist.length})</h3>
          <Button className="danger small" onClick={onClear}>Clear</Button>
        </div>
        <div className="mt-2">
          {shortlist.map((c, i)=> (
            <div key={c.email||c.name||i} className="short-card">
              <div className="row">
                <div style={{minWidth:0, flex:1}}>
                  <div className="short-title">{blind ? `Candidate ${i+1}` : (c.name || c.email)}</div>
                  <div className="small">{regionOf(c.location)} • {c.location || "—"}</div>
                  <div className="small">{c.annual_salary_expectation?.["full-time"] || "—"}</div>
                </div>
                <button className="small" style={{border:"none", background:"transparent", color:"#e11d48", cursor:"pointer"}}
                        onClick={()=>onRemove(c)}>remove</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-2">
        <h3 style={{marginTop:0}}>Fairness & guardrails</h3>
        <ul className="fairlist">
          <li>Blind mode hides identity while screening.</li>
          <li>Scoring favours skills, experience, and budget — no protected attributes.</li>
          <li>“Prefer region diversity” seeks breadth across APAC, EU, NA, LATAM, MEA when possible.</li>
        </ul>
      </Card>

      <Card className="mt-2">
        <h3 style={{marginTop:0}}>How I’d extend this</h3>
        <ul className="fairlist">
          <li>Interview scheduler + email templates.</li>
          <li>LLM résumé summarizer and duplicate-applicant detection.</li>
          <li>Role templates (FE, BE, Data/ML, DevOps, PM/Design).</li>
          <li>Score audits and snapshots.</li>
        </ul>
      </Card>
    </>
  );
}
