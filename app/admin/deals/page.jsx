"use client";
import { useState, useEffect, useRef } from "react";
import PageHeader from "@/components/admin/PageHeader";
import AdminButton from "@/components/admin/AdminButton";

const GOLD = "#c9a84c";

function ProductSearch({ products, value, onChange }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef();

  // Find selected product name for display
  const selected = products.find(p => p.id === Number(value));

  useEffect(() => {
    if (selected) setQuery(selected.name);
  }, [value]);

  const filtered = products
    .filter(p => !query || p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.manufacturer || "").toLowerCase().includes(query.toLowerCase()) ||
      (p.caliber || "").toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 12);

  // Close on outside click
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = p => {
    onChange(p.id);
    setQuery(p.name);
    setOpen(false);
  };

  const clear = () => { onChange(""); setQuery(""); setOpen(false); };

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <label style={{ display:"block", fontSize:9, color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.14em", marginBottom:4 }}>SELECT GUN</label>
      <div style={{ position:"relative" }}>
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(""); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Type to search by name, make, caliber..."
          style={{ width:"100%", background:"var(--bg)", border:`1px solid ${value ? GOLD+"66" : "#222"}`, color:"var(--text)", padding:"8px 32px 8px 12px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:13, outline:"none", boxSizing:"border-box" }}
        />
        {query && (
          <button onClick={clear} style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"var(--text-dim)", cursor:"pointer", fontSize:16, lineHeight:1 }}>×</button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"var(--bg-card)", border:"1px solid var(--border-mid)", borderRadius:2, zIndex:100, maxHeight:280, overflowY:"auto", marginTop:2 }}>
          {filtered.map(p => (
            <div key={p.id} onClick={() => select(p)}
              style={{ padding:"9px 12px", cursor:"pointer", borderBottom:"1px solid var(--border)", transition:"background 0.1s" }}
              onMouseEnter={e=>e.currentTarget.style.background="#1a1a1a"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}
            >
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:"var(--text)" }}>{p.name}</div>
              <div style={{ fontSize:10, color:"var(--text-dim)", marginTop:2, fontFamily:"'Oswald',sans-serif" }}>
                {[p.category, p.caliber, `$${p.price?.toLocaleString()}`].filter(Boolean).join(" · ")}
              </div>
            </div>
          ))}
        </div>
      )}
      {open && query && filtered.length === 0 && (
        <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"var(--bg-card)", border:"1px solid var(--border-mid)", borderRadius:2, zIndex:100, padding:"12px", fontSize:12, color:"var(--text-dim)", fontStyle:"italic", marginTop:2 }}>
          No products match
        </div>
      )}
    </div>
  );
}

export default function DealsPage() {
  const [queue, setQueue] = useState([]);
  const [products, setProducts] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newDeal, setNewDeal] = useState({ productId:"", pct:"" });
  const [loading, setLoading] = useState(true);
  const [todaysDeal, setTodaysDeal] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/deals").then(r => r.json()),
      fetch("/api/products?limit=500").then(r => r.json()),
      fetch("/api/deals/today").then(r => r.json()),
    ]).then(([deals, prods, today]) => {
      setQueue(Array.isArray(deals) ? deals : []);
      setProducts(Array.isArray(prods.products) ? prods.products.sort((a,b) => a.name.localeCompare(b.name)) : []);
      setTodaysDeal(today);
      setLoading(false);
    });
  }, []);

  const addDeal = async () => {
    if (!newDeal.productId || !newDeal.pct) return;
    const res = await fetch("/api/deals", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ productId:Number(newDeal.productId), discountPct:Number(newDeal.pct) })
    });
    const deal = await res.json();
    setQueue(q => [...q, deal]);
    setNewDeal({ productId:"", pct:"" });
    setAdding(false);
  };

  const remove = async id => {
    await fetch(`/api/deals/${id}`, { method:"DELETE" });
    setQueue(q => q.filter(d => d.id !== id));
  };

  const preview = newDeal.productId ? products.find(p => p.id === Number(newDeal.productId)) : null;
  const previewPrice = preview && newDeal.pct ? Math.round(preview.price * (1 - Number(newDeal.pct) / 100)) : null;

  return (
    <div>
      <PageHeader title="DAILY DEALS" action={
        !adding && <AdminButton onClick={() => setAdding(true)}>+ ADD GUN DEAL</AdminButton>
      }/>

      {/* Today's deal */}
      {todaysDeal && (() => {
        const prod = todaysDeal.product || products.find(p => p.id === todaysDeal.productId);
        return prod && (
          <div style={{ padding:"12px 16px", background:"#0d1a0d", border:"1px solid #2a5a2a", borderRadius:3, marginBottom:20, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, color:"#4caf50", letterSpacing:"0.18em" }}>TODAY'S DEAL</div>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:14, color:"var(--text)" }}>{prod.name}</div>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:14, color:GOLD }}>{todaysDeal.discountPct}% OFF</div>
            <div style={{ fontSize:11, color:"var(--text-dim)", marginLeft:"auto", fontStyle:"italic" }}>
              Sale price: ${Math.round((prod.price || 0) * (1 - todaysDeal.discountPct / 100)).toLocaleString()}
            </div>
          </div>
        );
      })()}

      {/* Add deal form */}
      {adding && (
        <div style={{ background:"var(--bg-card)", border:`1px solid ${GOLD}`, borderRadius:3, padding:"1.5rem", marginBottom:20 }}>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:14, color:GOLD, letterSpacing:"0.1em", marginBottom:16 }}>ADD GUN DEAL</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:12, alignItems:"end", marginBottom:12 }}>
            <ProductSearch products={products} value={newDeal.productId} onChange={v => setNewDeal(d => ({...d, productId:v}))}/>
            <div>
              <label style={{ display:"block", fontSize:9, color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.14em", marginBottom:4 }}>DISCOUNT %</label>
              <input type="number" min="1" max="99" value={newDeal.pct} onChange={e => setNewDeal(d => ({...d, pct:e.target.value}))}
                placeholder="e.g. 15"
                style={{ width:100, background:"var(--bg)", border:"1px solid #222", color:"var(--text)", padding:"8px 12px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:13, outline:"none" }}/>
            </div>
          </div>
          {preview && previewPrice && (
            <div style={{ fontSize:11, color:"#4caf50", fontFamily:"'Oswald',sans-serif", marginBottom:14 }}>
              {preview.name} · Regular: ${preview.price.toLocaleString()} → Deal: ${previewPrice.toLocaleString()} (saving ${(preview.price - previewPrice).toLocaleString()})
            </div>
          )}
          <div style={{ display:"flex", gap:8 }}>
            <AdminButton onClick={addDeal} disabled={!newDeal.productId || !newDeal.pct}>ADD DEAL</AdminButton>
            <AdminButton variant="ghost" onClick={() => { setAdding(false); setNewDeal({ productId:"", pct:"" }); }}>CANCEL</AdminButton>
          </div>
        </div>
      )}

      {loading && <div style={{ color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.15em", padding:"3rem 0", textAlign:"center" }}>LOADING...</div>}
      {!loading && queue.length === 0 && (
        <div style={{ color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.15em", padding:"3rem 0", textAlign:"center" }}>
          NO DEALS YET — ADD ONE ABOVE
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {queue.map((d, i) => {
          const prod = d.product || products.find(p => p.id === d.productId);
          const salePrice = prod ? Math.round(prod.price * (1 - d.discountPct / 100)) : null;
          return (
            <div key={d.id} style={{ display:"flex", alignItems:"center", gap:12, background:"var(--bg-card)", border:"1px solid #1a1a1a", borderRadius:2, padding:"12px 16px" }}>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:"var(--text-dim)", minWidth:24, textAlign:"center" }}>#{i+1}</div>
              <div style={{ width:40, height:32, background:"#161616", borderRadius:2, flexShrink:0, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {prod?.imageUrl ? <img src={prod.imageUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"contain" }}/> : <span style={{ fontSize:14, opacity:0.15 }}>🔫</span>}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:"var(--text)" }}>{prod?.name || "Unknown"}</div>
                <div style={{ fontSize:10, color:"var(--text-dim)", marginTop:2, fontFamily:"'Oswald',sans-serif" }}>
                  {prod?.category} · ${prod?.price?.toLocaleString()} → ${salePrice?.toLocaleString()} ({d.discountPct}% off)
                </div>
              </div>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:18, color:GOLD, fontWeight:700, minWidth:70, textAlign:"right" }}>{d.discountPct}% OFF</div>
              <AdminButton variant="danger" onClick={() => remove(d.id)} style={{ fontSize:10, padding:"4px 10px" }}>DEL</AdminButton>
            </div>
          );
        })}
      </div>
    </div>
  );
}
