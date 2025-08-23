import React, { useState } from "react";

function CandidateCard({ candidate, onShortlist }) {
  return (
    <div className="card">
      <h3>{candidate.name || candidate.email}</h3>
      <p>{candidate.location || "—"}</p>
      <button className="button" onClick={() => onShortlist(candidate)}>Shortlist</button>
    </div>
  );
}

export default function App() {
  const [candidates, setCandidates] = useState([]);
  const [shortlist, setShortlist] = useState([]);

  const onUpload = async (evt) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    const txt = await file.text();
    try { setCandidates(JSON.parse(txt)); } catch { alert("Invalid JSON"); }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>HirePilot (React Only)</h1>
      <input type="file" accept="application/json" onChange={onUpload} />
      <div>
        {candidates.map((c, i) => (
          <CandidateCard
            key={i}
            candidate={c}
            onShortlist={(cand) => setShortlist([...shortlist, cand])}
          />
        ))}
      </div>
      <h2>Shortlist ({shortlist.length})</h2>
      {shortlist.map((s, i) => (
        <div key={i} className="card">{s.name || s.email}</div>
      ))}
    </div>
  );
}
