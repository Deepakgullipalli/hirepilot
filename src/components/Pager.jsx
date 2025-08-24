import React from "react";

export default function Pager({ page, pageCount, pageSize, setPage, setPageSize, totalRows }) {
  const goto = (n) => setPage(Math.min(Math.max(1, n), pageCount));
  const start = Math.max(1, page - 2);
  const end = Math.min(pageCount, start + 4);
  const windowPages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="pagebar">
      <div className="small">
        Showing <strong>{Math.min((page-1)*pageSize+1, totalRows)}</strong>–<strong>{Math.min(page*pageSize, totalRows)}</strong>
        {" "}of <strong>{totalRows}</strong>
      </div>
      <div className="pages">
        <button className="pagebtn" onClick={()=>goto(1)} disabled={page===1}>« First</button>
        <button className="pagebtn" onClick={()=>goto(page-1)} disabled={page===1}>‹ Prev</button>
        {windowPages.map(n=> (
          <button key={n} className={`pagebtn ${n===page ? 'active':''}`} onClick={()=>goto(n)}>{n}</button>
        ))}
        <button className="pagebtn" onClick={()=>goto(page+1)} disabled={page===pageCount}>Next ›</button>
        <button className="pagebtn" onClick={()=>goto(pageCount)} disabled={page===pageCount}>Last »</button>
        <select className="pagesel" aria-label="Rows per page"
          value={pageSize}
          onChange={(e)=>{ setPageSize(Number(e.target.value)); setPage(1); }}>
          {[10,25,50,100].map(n => <option key={n} value={n}>{n}/page</option>)}
        </select>
      </div>
    </div>
  );
}
