import React from "react";
import { Card } from "./UI";
import { regionOf } from "../lib/scoring";

export default function Snapshot({ candidates, shortlist, avgShortlist }) {
  const regions = ["APAC","EU","NA","LATAM","MEA","Unknown"];
  return (
    <Card>
      <div className="snapshot">
        <div className="row"><span>Total candidates</span><strong>{candidates.length}</strong></div>
        <div className="row"><span>Shortlist</span><strong>{shortlist.length}</strong></div>
        <div className="row"><span>Avg salary (shortlist)</span>
          <strong>{avgShortlist != null ? `$${avgShortlist.toLocaleString()}` : "—"}</strong>
        </div>
        <div className="metrics mt-2">
          {regions.map((r)=> (
            <span key={r} className="badge">{r}: {candidates.filter(c=>regionOf(c.location)===r).length}</span>
          ))}
        </div>
      </div>
    </Card>
  );
}
