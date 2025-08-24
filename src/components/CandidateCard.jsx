import React, { useState } from "react";
import { Badge, Chip, Button, Card } from "./UI";
import { explain, regionOf } from "../lib/scoring";

export default function CandidateCard({ cand, meta, blind, onShortlist }) {
  const [openWhy, setOpenWhy] = useState(false);

  const id = cand.email || cand.name;
  return (
    <Card>
      <div className="row">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="candidate-header">
            <div style={{fontWeight:600, maxWidth:"60ch", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
              {blind ? "Candidate" : (cand.name || cand.email || "Unnamed")}
            </div>
            <Badge>{regionOf(cand.location)}</Badge>
            <Badge>Score {meta.score}</Badge>
            {meta.salary && <Badge>${(meta.salary).toLocaleString()}</Badge>}
          </div>
          <div className="candidate-sub">{cand.location || "—"}</div>
          <div className="role-chips">
            {Array.from(meta.cats).slice(0,7).map((c)=> <Chip key={c}>{c}</Chip>)}
          </div>
          {!!(cand.skills?.length) && (
            <div className="mt-2"><span className="small">Skills: </span>{(cand.skills||[]).slice(0,12).join(", ")}</div>
          )}
          {!!(cand.work_experiences?.length) && (
            <div className="mt-2"><span className="small">Experience: </span>{(cand.work_experiences||[]).slice(0,3).map(w=>`${w.company} — ${w.roleName}`).join(" · ")}</div>
          )}

          {openWhy && (
            <div className="small mt-2" style={{background:"#f9f9f9", border:"1px solid #eee", borderRadius:8, padding:10}}>
              {explain(cand).bullets.map((b,idx)=> <div key={`${id}-b-${idx}`}>• {b}</div>)}
            </div>
          )}
        </div>
        <div className="actions">
          <Button className="small" onClick={() => onShortlist(cand)}>Shortlist</Button>
          <Button className="small" onClick={() => setOpenWhy(v=>!v)}>{openWhy? "Hide" : "Why"}</Button>
        </div>
      </div>
    </Card>
  );
}
