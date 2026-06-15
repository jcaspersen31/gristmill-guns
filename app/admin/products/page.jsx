"use client";
import { useState, useEffect, useRef } from "react";
import PageHeader from "@/components/admin/PageHeader";
import AdminButton from "@/components/admin/AdminButton";
import InputField from "@/components/admin/InputField";

const GOLD = "#c9a84c";

const BLANK = {
  name:"", category:"", price:"", salePrice:"", saleEndsAt:"", msrp:"",
  description:"", specs:"", imageUrl:"", deposit:"100",
  serialNumber:"", sku:"", upc:"", manufacturer:"", model:"",
  partNumber:"", caliber:"", atfType:"", cartridge:"", action:"",
  barrelLength:"", overallLength:"", magazineCapacity:"", magazineType:"",
  condition:"New", quantityOnHand:"", reorderLevel:"",
};

function SectionHead({ title }) {
  return (
    <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, color:"var(--text-dim)", letterSpacing:"0.18em", marginBottom:12, paddingBottom:6, borderBottom:"1px solid var(--border)", marginTop:8 }}>
      {title}
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [imgPreview, setImgPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const fileRef = useRef();

  useEffect(() => {
    Promise.all([
      fetch("/api/products?limit=500").then(r => r.json()),
      fetch("/api/categories").then(r => r.json()),
    ]).then(([data, cats]) => {
      setProducts(Array.isArray(data.products) ? data.products : []);
      setCategories(Array.isArray(cats.categories) ? cats.categories : Array.isArray(cats) ? cats : []);
      setLoading(false);
    });
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openEdit = p => {
    setEditing(p.id);
    setForm({
      ...BLANK, ...p,
      price:            String(p.price ?? ""),
      salePrice:        p.salePrice ? String(p.salePrice) : "",
      saleEndsAt:       p.saleEndsAt ? new Date(p.saleEndsAt).toISOString().split('T')[0] : "",
      msrp:             p.msrp ? String(p.msrp) : "",
      deposit:          String(p.deposit ?? 100),
      quantityOnHand:   p.quantityOnHand != null ? String(p.quantityOnHand) : "",
      reorderLevel:     p.reorderLevel != null ? String(p.reorderLevel) : "",
      serialNumber:     p.serialNumber || "",
      sku:              p.sku || "",
      upc:              p.upc || "",
      manufacturer:     p.manufacturer || "",
      model:            p.model || "",
      partNumber:       p.partNumber || "",
      caliber:          p.caliber || "",
      atfType:          p.atfType || "",
      cartridge:        p.cartridge || "",
      action:           p.action || "",
      barrelLength:     p.barrelLength || "",
      overallLength:    p.overallLength || "",
      magazineCapacity: p.magazineCapacity || "",
      magazineType:     p.magazineType || "",
      condition:        p.condition || "New",
      imageUrl:         p.imageUrl || "",
    });
    setImgPreview(p.imageUrl || "");
  };

  const openNew = () => { setEditing("new"); setForm(BLANK); setImgPreview(""); };

  const save = async () => {
    setSaving(true);
    const body = {
      ...form,
      price:            Number(form.price),
      salePrice:        form.salePrice ? Number(form.salePrice) : null,
      saleEndsAt:       form.saleEndsAt || null,
      msrp:             form.msrp ? Number(form.msrp) : null,
      deposit:          Number(form.deposit) || 0,
      quantityOnHand:   form.quantityOnHand !== "" ? Number(form.quantityOnHand) : null,
      reorderLevel:     form.reorderLevel !== "" ? Number(form.reorderLevel) : null,
      imageUrl:         imgPreview || null,
      serialNumber:     form.serialNumber || null,
      sku:              form.sku || null,
      upc:              form.upc || null,
      manufacturer:     form.manufacturer || null,
      model:            form.model || null,
      partNumber:       form.partNumber || null,
      caliber:          form.caliber || null,
      atfType:          form.atfType || null,
      cartridge:        form.cartridge || null,
      action:           form.action || null,
      barrelLength:     form.barrelLength || null,
      overallLength:    form.overallLength || null,
      magazineCapacity: form.magazineCapacity || null,
      magazineType:     form.magazineType || null,
      condition:        form.condition || null,
    };
    try {
      if (editing === "new") {
        const res = await fetch("/api/products", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
        const p = await res.json();
        setProducts(ps => [...ps, p]);
      } else {
        await fetch(`/api/products/${editing}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
        setProducts(ps => ps.map(p => p.id === editing ? { ...p, ...body } : p));
      }
      setEditing(null);
    } finally { setSaving(false); }
  };

  const del = async id => {
    if (!confirm("Remove this product?")) return;
    await fetch(`/api/products/${id}`, { method:"DELETE" });
    setProducts(ps => ps.filter(p => p.id !== id));
  };

  const handleImg = async e => {
    const f = e.target.files[0];
    if (!f) return;
    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = ev => setImgPreview(ev.target.result);
    reader.readAsDataURL(f);
    // Upload to Cloudinary
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("upload_preset", "gristmill");
      fd.append("folder", "gristmill");
      const res = await fetch("https://api.cloudinary.com/v1_1/dq2d56it9/image/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.secure_url) {
        setImgPreview(data.secure_url);
        set("imageUrl", data.secure_url);
      }
    } catch(e) {
      console.error("Cloudinary upload failed:", e);
    } finally {
      setUploading(false);
    }
  };

  const filtered = products.filter(p => {
    const matchesCat = filterCat === "All" || p.category === filterCat;
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      p.name?.toLowerCase().includes(q) ||
      p.manufacturer?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.upc?.toLowerCase().includes(q) ||
      p.caliber?.toLowerCase().includes(q) ||
      p.model?.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const iStyle = { width:"100%", background:"var(--bg)", border:"1px solid #222", color:"var(--text)", padding:"8px 12px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:13, outline:"none", boxSizing:"border-box" };
  const lStyle = { display:"block", fontSize:9, color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.14em", marginBottom:4 };

  // ── EDIT / ADD FORM ──
  if (editing) return (
    <div>
      <PageHeader
        title={editing === "new" ? "ADD PRODUCT" : "EDIT PRODUCT"}
        action={<AdminButton variant="ghost" onClick={() => setEditing(null)}>CANCEL</AdminButton>}
      />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32, maxWidth:1000 }}>

        {/* LEFT COLUMN */}
        <div>
          <SectionHead title="IDENTIFICATION"/>
          <InputField label="Product Name / Description" value={form.name} onChange={v => set("name",v)}/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <InputField label="Manufacturer" value={form.manufacturer} onChange={v => set("manufacturer",v)}/>
            <InputField label="Model" value={form.model} onChange={v => set("model",v)}/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <InputField label="Part Number" value={form.partNumber} onChange={v => set("partNumber",v)}/>
            <InputField label="SKU" value={form.sku} onChange={v => set("sku",v)}/>
          </div>
          <InputField label="UPC" value={form.upc} onChange={v => set("upc",v)}/>

          <div style={{ marginBottom:14 }}>
            <label style={lStyle}>CATEGORY</label>
            <select value={form.category} onChange={e => set("category",e.target.value)} style={iStyle}>
              <option value="">— select —</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <SectionHead title="PRICING"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
            <InputField label="Retail Price ($)" value={form.price} onChange={v => set("price",v)} type="number"/>
            <InputField label="Sale Price ($)" value={form.salePrice} onChange={v => set("salePrice",v)} type="number"/>
            <InputField label="MSRP ($)" value={form.msrp} onChange={v => set("msrp",v)} type="number"/>
          </div>
          <InputField label="Deposit Amount ($)" value={form.deposit} onChange={v => set("deposit",v)} type="number"/>

          <SectionHead title="FIREARM SPECS"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <InputField label="Caliber / Gauge" value={form.caliber} onChange={v => set("caliber",v)} placeholder=".223 Remington"/>
            <div style={{ marginBottom:14 }}>
              <label style={lStyle}>ATF TYPE</label>
              <select value={form.atfType} onChange={e => set("atfType",e.target.value)} style={iStyle}>
                <option value="">—</option>
                {["Rifle","Pistol","Revolver","Shotgun","Other"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ marginBottom:14 }}>
              <label style={lStyle}>ACTION</label>
              <select value={form.action} onChange={e => set("action",e.target.value)} style={iStyle}>
                <option value="">—</option>
                {["Semi-Auto","Bolt","Lever","Pump","Revolver","Single Shot","Break Action","Other"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={lStyle}>CARTRIDGE TYPE</label>
              <select value={form.cartridge} onChange={e => set("cartridge",e.target.value)} style={iStyle}>
                <option value="">—</option>
                {["Centerfire","Rimfire"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <InputField label="Barrel Length" value={form.barrelLength} onChange={v => set("barrelLength",v)} placeholder='e.g. 18.5"'/>
            <InputField label="Overall Length" value={form.overallLength} onChange={v => set("overallLength",v)} placeholder='e.g. 37.5"'/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <InputField label="Magazine Capacity" value={form.magazineCapacity} onChange={v => set("magazineCapacity",v)} placeholder="e.g. 10"/>
            <InputField label="Magazine Type" value={form.magazineType} onChange={v => set("magazineType",v)} placeholder="e.g. Detachable"/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ marginBottom:14 }}>
              <label style={lStyle}>CONDITION</label>
              <select value={form.condition} onChange={e => set("condition",e.target.value)} style={iStyle}>
                {["New","Used","Consignment","Refurbished"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <InputField label="Qty on Hand" value={form.quantityOnHand} onChange={v => set("quantityOnHand",v)} type="number"/>
          </div>

          <SectionHead title="UNIT TRACKING — ADMIN ONLY"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <InputField label="Serial Number" value={form.serialNumber} onChange={v => set("serialNumber",v)} placeholder="e.g. G2274519"/>
              {form.serialNumber && <div style={{ fontSize:9, color:"var(--text-dim)", marginTop:-10, marginBottom:14, fontStyle:"italic" }}>Customer sees: ···{form.serialNumber.slice(-4)}</div>}
            </div>
            <InputField label="Reorder Level" value={form.reorderLevel} onChange={v => set("reorderLevel",v)} type="number"/>
          </div>

          <SectionHead title="ADDITIONAL"/>
          <InputField label="Description / Notes" value={form.description} onChange={v => set("description",v)} type="textarea"/>
          <InputField label='Legacy Specs (pipe-separated)' value={form.specs} onChange={v => set("specs",v)} placeholder='Caliber: 9mm | Barrel: 4"'/>
        </div>

        {/* RIGHT COLUMN — Photo */}
        <div>
          <SectionHead title="PRODUCT PHOTO"/>
          <div
            onClick={() => fileRef.current.click()}
            onMouseEnter={e=>e.currentTarget.style.borderColor=GOLD}
            onMouseLeave={e=>e.currentTarget.style.borderColor="#1e1e1e"}
            style={{ aspectRatio:"4/3", background:"var(--bg)", border:"2px dashed #1e1e1e", borderRadius:3, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", overflow:"hidden", transition:"border-color 0.2s", marginBottom:12 }}
          >
            {imgPreview
              ? <img src={imgPreview} alt="" style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
              : <div style={{ textAlign:"center", color:"var(--text-dim)" }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>↑</div>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:12, letterSpacing:"0.1em" }}>CLICK TO UPLOAD</div>
                  <div style={{ fontSize:10, marginTop:4, fontStyle:"italic", color:"#2a2a2a" }}>JPG / PNG → Cloudinary</div>
                </div>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImg} style={{ display:"none" }}/>
          {imgPreview && (
            <AdminButton variant="ghost" onClick={() => { setImgPreview(""); set("imageUrl",""); }} style={{ fontSize:10 }}>
              REMOVE PHOTO
            </AdminButton>
          )}
        </div>
      </div>

      <div style={{ marginTop:24, paddingTop:16, borderTop:"1px solid var(--border)" }}>
        <AdminButton onClick={save} disabled={saving || !form.name || !form.price}>
          {saving ? "SAVING..." : "SAVE PRODUCT"}
        </AdminButton>
      </div>
    </div>
  );

  // ── PRODUCT LIST ──
  return (
    <div>
      <PageHeader
        title={`INVENTORY (${products.length})`}
        action={<AdminButton onClick={openNew}>+ ADD PRODUCT</AdminButton>}
      />

      {!loading && (
        <div style={{ display:"flex", gap:10, marginBottom:12, flexWrap:"wrap" }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, make, model, SKU, UPC, caliber..."
            style={{ flex:1, minWidth:200, background:"var(--bg)", border:"1px solid #222", color:"var(--text)", padding:"8px 14px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:13, outline:"none" }}
          />
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            style={{ background:"var(--bg)", border:"1px solid #222", color:"var(--text)", padding:"8px 12px", borderRadius:2, fontFamily:"'Oswald',sans-serif", fontSize:11, outline:"none", letterSpacing:"0.08em" }}>
            <option value="All">ALL CATEGORIES</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name.toUpperCase()}</option>)}
          </select>
          {(search || filterCat !== "All") && (
            <button onClick={() => { setSearch(""); setFilterCat("All"); }}
              style={{ background:"transparent", border:"1px solid var(--border-mid)", color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", fontSize:11, padding:"8px 14px", borderRadius:2, cursor:"pointer", letterSpacing:"0.08em" }}>
              CLEAR
            </button>
          )}
        </div>
      )}

      <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, color:"var(--text-dim)", letterSpacing:"0.12em", marginBottom:10 }}>
        {!loading && `${filtered.length} of ${products.length} ITEMS`}
      </div>

      {loading && <div style={{ color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.15em", padding:"3rem 0", textAlign:"center" }}>LOADING...</div>}
      {!loading && filtered.length === 0 && <div style={{ color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.15em", padding:"3rem 0", textAlign:"center" }}>NO PRODUCTS MATCH</div>}

      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {filtered.map(p => (
          <div key={p.id} style={{ display:"flex", alignItems:"center", gap:12, background:"var(--bg-card)", border:"1px solid #1a1a1a", borderRadius:2, padding:"10px 14px" }}>
            <div style={{ width:52, height:40, background:"#161616", borderRadius:2, flexShrink:0, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {p.imageUrl ? <img src={p.imageUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"contain" }}/> : <span style={{ fontSize:16, opacity:0.15 }}>🔫</span>}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:"var(--text)", display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
                {p.name}
                {p.salePrice && <span style={{ background:"#7a1515", color:"#fff", fontSize:8, padding:"2px 5px", borderRadius:1 }}>SALE</span>}
                {p.quantityOnHand != null && <span style={{ fontFamily:"'Courier New',monospace", fontSize:9, color:"var(--text-dim)" }}>QTY: {p.quantityOnHand}</span>}
              </div>
              <div style={{ fontSize:10, color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", marginTop:2, display:"flex", gap:10, flexWrap:"wrap" }}>
                <span>{p.category}</span>
                <span>${p.price?.toLocaleString()}{p.salePrice ? ` → $${p.salePrice.toLocaleString()}` : ""}</span>
                {p.caliber && <span>{p.caliber}</span>}
                {p.sku && <span style={{ fontFamily:"'Courier New',monospace" }}>{p.sku}</span>}
              </div>
            </div>
            <div style={{ display:"flex", gap:6, flexShrink:0 }}>
              <AdminButton variant="outline" onClick={() => openEdit(p)} style={{ fontSize:10, padding:"4px 10px" }}>EDIT</AdminButton>
              <AdminButton variant="danger" onClick={() => del(p.id)} style={{ fontSize:10, padding:"4px 10px" }}>DEL</AdminButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
