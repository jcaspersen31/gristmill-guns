"use client";
import { useState, useRef } from "react";
import PageHeader from "@/components/admin/PageHeader";
import AdminButton from "@/components/admin/AdminButton";

const GOLD = "#c9a84c";

const PREVIEW_COLS = [
  { key: 'name',             label: 'Product Name' },
  { key: 'manufacturer',     label: 'Manufacturer' },
  { key: 'model',            label: 'Model' },
  { key: 'category',         label: 'Category' },
  { key: 'caliber',          label: 'Caliber' },
  { key: 'action',           label: 'Action' },
  { key: 'condition',        label: 'Condition' },
  { key: 'price',            label: 'Price' },
  { key: 'quantityOnHand',   label: 'Qty' },
];

export default function ImportPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [total, setTotal] = useState(0);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const sendFile = async (f, isPreview) => {
    const fd = new FormData();
    fd.append('file', f);
    fd.append('preview', isPreview ? 'true' : 'false');
    const res = await fetch("/api/import", { method: "POST", body: fd });
    return res.json();
  };

  const handleFile = async (f) => {
    if (!f) return;
    setFile(f);
    setPreview(null);
    setResult(null);
    setError("");
    const data = await sendFile(f, true);
    if (data.error) { setError(data.error); return; }
    setPreview(data.rows);
    setTotal(data.total);
  };

  const runImport = async () => {
    if (!file || importing) return;
    setImporting(true);
    setResult(null);
    setError("");
    try {
      const data = await sendFile(file, false);
      if (data.error) { setError(data.error); return; }
      setResult(data);
      setPreview(null);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      setError(e.message);
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setFile(null); setPreview(null); setResult(null); setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div>
      <PageHeader title="IMPORT FROM ORCHID" />

      <div style={{ maxWidth:700, marginBottom:24, fontFamily:"Georgia,serif", fontStyle:"italic", color:"var(--text-dim)", fontSize:13, lineHeight:1.7 }}>
        Export your inventory from Orchid Advisors and upload the file here — Excel (.xlsx) or CSV accepted. The importer previews your data before committing. Existing products matched by UPC or Part Number will be updated, not duplicated.
      </div>

      {/* Upload zone */}
      {!preview && !result && (
        <div
          onClick={() => fileRef.current.click()}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor=GOLD; }}
          onDragLeave={e => { e.currentTarget.style.borderColor="#2a2a2a"; }}
          onDrop={e => {
            e.preventDefault();
            e.currentTarget.style.borderColor="#2a2a2a";
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          style={{ border:"2px dashed #2a2a2a", borderRadius:3, padding:"3rem 2rem", textAlign:"center", cursor:"pointer", transition:"border-color 0.2s", marginBottom:16 }}
          onMouseEnter={e=>e.currentTarget.style.borderColor=GOLD}
          onMouseLeave={e=>e.currentTarget.style.borderColor="#2a2a2a"}
        >
          <div style={{ fontSize:32, marginBottom:12, opacity:0.3 }}>📂</div>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:14, color:"var(--text-dim)", letterSpacing:"0.1em" }}>
            {file ? file.name : "CLICK OR DRAG ORCHID FILE HERE"}
          </div>
          <div style={{ fontSize:11, color:"var(--text-dim)", marginTop:6, fontStyle:"italic" }}>
            Accepts .xlsx (Excel) or .csv · Export from Orchid: Inventory → Reports → Inventory List
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" accept=".xlsx,.csv" onChange={e => handleFile(e.target.files[0])} style={{ display:"none" }}/>

      {error && (
        <div style={{ padding:"12px 16px", background:"#1a0000", border:"1px solid #c0392b", borderRadius:3, color:"#c0392b", fontSize:12, fontStyle:"italic", marginBottom:16 }}>{error}</div>
      )}

      {/* Preview */}
      {preview && (
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, flexWrap:"wrap" }}>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:"var(--text-muted)", letterSpacing:"0.1em" }}>
              PREVIEW — {total} PRODUCTS FOUND
              {total > 10 && <span style={{ color:"var(--text-dim)", fontSize:11, marginLeft:8 }}>(showing first 10)</span>}
            </div>
            <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
              <AdminButton onClick={reset} variant="ghost">CANCEL</AdminButton>
              <AdminButton onClick={runImport} disabled={importing}>
                {importing ? "IMPORTING..." : `IMPORT ALL ${total} PRODUCTS`}
              </AdminButton>
            </div>
          </div>

          <div style={{ overflowX:"auto", borderRadius:3, border:"1px solid #1a1a1a" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"Georgia,serif", fontSize:12 }}>
              <thead>
                <tr style={{ background:"var(--bg-card)", borderBottom:"1px solid #2a2a2a" }}>
                  {PREVIEW_COLS.map(c => (
                    <th key={c.key} style={{ padding:"8px 12px", textAlign:"left", fontFamily:"'Oswald',sans-serif", fontSize:9, color:"var(--text-dim)", letterSpacing:"0.14em", whiteSpace:"nowrap" }}>{c.label.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} style={{ borderBottom:"1px solid var(--border)", background: i%2===0 ? "#0d0d0d":"#111" }}>
                    {PREVIEW_COLS.map(c => (
                      <td key={c.key} style={{ padding:"8px 12px", color: c.key==="price" ? GOLD:"#aaa", whiteSpace: c.key==="name" ? "normal":"nowrap", maxWidth: c.key==="name" ? 220:undefined }}>
                        {c.key==="price" ? (row[c.key] ? `$${row[c.key].toLocaleString()}` : "—") : (row[c.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop:16, padding:"12px 16px", background:"var(--bg)", border:"1px solid #1a1a1a", borderRadius:3, fontSize:11, color:"var(--text-dim)", fontStyle:"italic" }}>
            ⚠ Existing products matched by UPC or Part Number will be updated. New products will be created. Make sure the preview looks correct before importing.
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ maxWidth:500 }}>
          <div style={{ padding:"20px 24px", background:"#0d1a0d", border:"1px solid #2a5a2a", borderRadius:3, marginBottom:16 }}>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:18, color:"#4caf50", letterSpacing:"0.1em", marginBottom:16 }}>✓ IMPORT COMPLETE</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:16 }}>
              {[
                { label:"CREATED", value:result.created, color:"#4caf50" },
                { label:"UPDATED", value:result.updated, color:GOLD },
                { label:"SKIPPED", value:result.skipped, color:"var(--text-muted)" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background:"var(--bg-card)", border:"1px solid #1a1a1a", borderRadius:2, padding:"12px 16px", textAlign:"center" }}>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:28, color, fontWeight:700 }}>{value}</div>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:9, color:"var(--text-dim)", letterSpacing:"0.14em", marginTop:4 }}>{label}</div>
                </div>
              ))}
            </div>
            {result.errors?.length > 0 && (
              <div>
                <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, color:"#c0392b", letterSpacing:"0.14em", marginBottom:8 }}>ERRORS ({result.errors.length})</div>
                {result.errors.map((e, i) => (
                  <div key={i} style={{ fontSize:11, color:"#c0392b", fontStyle:"italic", marginBottom:4 }}>{e.row}: {e.error}</div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <AdminButton onClick={reset}>IMPORT ANOTHER FILE</AdminButton>
            <AdminButton variant="outline" onClick={() => window.location.href="/admin/products"}>VIEW INVENTORY</AdminButton>
          </div>
        </div>
      )}
    </div>
  );
}
