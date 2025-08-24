import React from "react";
import { Button } from "./UI";

export default function Header({ onUploadClick, onAutoPick, onExport }) {
  return (
    <div className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="/hirepilot-logo.svg" alt="HirePilot" height="32" />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button onClick={onUploadClick}>Upload JSON</Button>
        <Button className="secondary" onClick={onAutoPick}>Auto-pick 5</Button>
        <Button className="secondary" onClick={onExport}>Export</Button>
      </div>
    </div>
  );
}
