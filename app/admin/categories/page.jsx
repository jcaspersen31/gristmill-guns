"use client";
import { useState, useEffect } from "react";
import PageHeader from "@/components/admin/PageHeader";
import AdminButton from "@/components/admin/AdminButton";

const GOLD = "#c9a84c";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [missingCats, setMissingCats] = useState([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [syncResult, setSyncResult] = useState(null);

  const loadCategories = () => {
    fetch("/api/categories").then(r => r.json()).then(d => {
      setCategories(Array.isArray(d.categories) ? d.categories : []);
      setMissingCats(Array.isArray(d.missingCategories) ? d.missingCategories : []);
      setLoading(false);
    });
  };

  useEffect(() => { loadCategories(); }, []);

  const add = async () => {
    if (!newName.trim()) return;
    const res = await fetch("/api/categories", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ name:newName.trim() })
    });
    const cat = await res.json();
    if (cat.error) { setError(cat.error); return; }
    setCategories(cs => [...cs, { ...cat, productCount:0 }]);
    setNewName("");
  };

  const save = async (id) => {
    if (!editName.trim()) return;
    const res = await fetch(`/api/categories/${id}`, {
      method:"PUT", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ name:editName.trim() })
    });
    const cat = await res.json();
    setCategories(cs => cs.map(c => c.id===id ? { ...cat, productCount: c.productCount } : c));
    setEditingId(null);
  };

  const del = async (id) => {
    const res = await fetch(`/api/categories/${id}`, { method:"DELETE" });
    const d = await res.json();
    if (d.error) { setError(d.error); setTimeout(() => setError(""), 4000); return; }
    setCategories(cs => cs.filter(c => c.id!==id));
  };

  const syncMissing = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/categories/sync", { method:"POST" });
      const d = await res.json();
      if (d.error) { setError(d.error); return; }
      setSyncResult(d.count);
      // Reload after a short delay to ensure DB has committed
      setTimeout(() => {
        setLoading(true);
        loadCategories();
      }, 500);
    } catch(e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  };

  const iStyle = { background:"var(--bg)", border:"1px solid var(--border-mid)", color:"var(--text)", padding:"7px 12px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:13, outline:"none", boxSizing:"border-box" };

  return (
    <div style={{ maxWidth:640 }}>
      <PageHeader title="CATEGORIES"/>

      {/* Missing categories warning */}
      {missingCats.length > 0 && (
        <div style={{ padding:"14px 16px", background:"#1a1200", border:`1px solid ${GOLD}44`, borderRadius:3, marginBottom:20 }}>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:12, color:GOLD, letterSpacing:"0.12em", marginBottom:8 }}>
            ⚠ {missingCats.length} UNRECOGNIZED {missingCats.length === 1 ? "CATEGORY" : "CATEGORIES"} IN INVENTORY
          </div>
          <div style={{ fontSize:12, color:"var(--text-muted)", marginBottom:12, lineHeight:1.6 }}>
            These category names exist on products but have no matching Category record:
            <div style={{ marginTop:6, display:"flex", gap:6, flexWrap:"wrap" }}>
              {missingCats.map(c => (
                <span key={c} style={{ background:"var(--bg-card)", border:"1px solid var(--border-mid)", padding:"2px 8px", borderRadius:2, fontFamily:"'Courier New',monospace", fontSize:11 }}>{c}</span>
              ))}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <AdminButton onClick={syncMissing} disabled={syncing}>
              {syncing ? "CREATING..." : `AUTO-CREATE ${missingCats.length} ${missingCats.length === 1 ? "CATEGORY" : "CATEGORIES"}`}
            </AdminButton>
            {syncResult !== null && (
              <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:"var(--green)", letterSpacing:"0.1em" }}>
                ✓ {syncResult} created
              </span>
            )}
          </div>
        </div>
      )}

      {error && <div style={{ padding:"10px 14px", background:"#1a0000", border:"1px solid var(--red-bright)", borderRadius:3, color:"var(--red-bright)", fontSize:12, fontStyle:"italic", marginBottom:16 }}>{error}</div>}

      {/* Add new */}
      <div style={{ display:"flex", gap:8, marginBottom:24 }}>
        <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key==="Enter" && add()}
          placeholder="New category name..." style={{ ...iStyle, flex:1 }}/>
        <AdminButton onClick={add} disabled={!newName.trim()}>ADD</AdminButton>
      </div>

      {loading && <div style={{ color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.15em", padding:"2rem 0", textAlign:"center" }}>LOADING...</div>}

      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {categories.map(c => (
          <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:2, padding:"10px 14px" }}>
            {editingId === c.id ? (
              <>
                <input value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key==="Enter" && save(c.id)}
                  style={{ ...iStyle, flex:1 }} autoFocus/>
                <AdminButton onClick={() => save(c.id)} style={{ fontSize:10, padding:"4px 10px" }}>SAVE</AdminButton>
                <AdminButton variant="ghost" onClick={() => setEditingId(null)} style={{ fontSize:10, padding:"4px 10px" }}>CANCEL</AdminButton>
              </>
            ) : (
              <>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:"var(--text)" }}>{c.name}</div>
                  <div style={{ fontSize:10, color:"var(--text-dim)", marginTop:2 }}>
                    {c.productCount || 0} product{c.productCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <AdminButton variant="outline" onClick={() => { setEditingId(c.id); setEditName(c.name); }} style={{ fontSize:10, padding:"4px 10px" }}>EDIT</AdminButton>
                <AdminButton variant="danger" onClick={() => del(c.id)} style={{ fontSize:10, padding:"4px 10px" }}
                  disabled={c.productCount > 0} title={c.productCount > 0 ? "Can't delete — has products" : ""}>
                  DEL
                </AdminButton>
              </>
            )}
          </div>
        ))}
      </div>

      {!loading && categories.length === 0 && (
        <div style={{ color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.15em", padding:"2rem 0", textAlign:"center" }}>NO CATEGORIES YET</div>
      )}
    </div>
  );
}
