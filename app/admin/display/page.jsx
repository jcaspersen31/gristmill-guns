"use client";
import { useState, useEffect } from "react";
import PageHeader from "@/components/admin/PageHeader";
import AdminButton from "@/components/admin/AdminButton";

const GOLD = "#c9a84c";

const ALL_FIELDS = [
  { key:"manufacturer",     label:"Manufacturer",       hint:"Make of the firearm" },
  { key:"model",            label:"Model",              hint:"Model name/number" },
  { key:"caliber",          label:"Caliber",            hint:"Caliber or gauge" },
  { key:"atfType",          label:"ATF Type",           hint:"Rifle, Pistol, Revolver, etc." },
  { key:"cartridge",        label:"Cartridge Type",     hint:"Centerfire or Rimfire" },
  { key:"action",           label:"Action",             hint:"Bolt, Lever, Semi-Auto, etc." },
  { key:"barrelLength",     label:"Barrel Length",      hint:"In inches" },
  { key:"overallLength",    label:"Overall Length",     hint:"In inches" },
  { key:"magazineCapacity", label:"Magazine Capacity",  hint:"Round count" },
  { key:"magazineType",     label:"Magazine Type",      hint:"Detachable, Fixed, etc." },
  { key:"condition",        label:"Condition",          hint:"New, Used, etc." },
  { key:"upc",              label:"UPC",                hint:"Barcode — consider keeping private" },
  { key:"partNumber",       label:"Part Number",        hint:"Manufacturer part number" },
  { key:"msrp",             label:"MSRP",               hint:"Manufacturer suggested retail" },
  { key:"quantityOnHand",   label:"Qty in Stock",       hint:"Shows available quantity" },
];

export default function DisplayPage() {
  const [visible, setVisible] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/display-settings").then(r => r.json()).then(d => {
      setVisible(Array.isArray(d.visibleFields) ? d.visibleFields : []);
      setLoading(false);
    });
  }, []);

  const toggle = key => {
    setVisible(v => v.includes(key) ? v.filter(k => k!==key) : [...v, key]);
  };

  const save = async () => {
    await fetch("/api/display-settings", {
      method:"PUT",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ visibleFields: visible }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ maxWidth:600 }}>
      <PageHeader title="DISPLAY SETTINGS"/>
      <div style={{ fontFamily:"Georgia,serif", fontStyle:"italic", color:"var(--text-dim)", fontSize:13, lineHeight:1.7, marginBottom:24 }}>
        Choose which product fields are visible to customers on the public catalog and detail pages. All fields are always visible in the admin.
      </div>

      {loading ? <div style={{ color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.15em" }}>LOADING...</div> : (
        <>
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:24 }}>
            {ALL_FIELDS.map(({ key, label, hint }) => {
              const on = visible.includes(key);
              return (
                <div key={key} onClick={() => toggle(key)} style={{ display:"flex", alignItems:"center", gap:14, background:"var(--bg-card)", border:`1px solid ${on ? GOLD+"44":"#1a1a1a"}`, borderRadius:2, padding:"12px 16px", cursor:"pointer", transition:"border-color 0.15s" }}>
                  {/* Toggle */}
                  <div style={{ width:36, height:20, borderRadius:10, background: on ? GOLD:"#2a2a2a", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
                    <div style={{ position:"absolute", top:3, left: on ? 19:3, width:14, height:14, borderRadius:"50%", background: on ? "#000":"#a0a0a0", transition:"left 0.2s" }}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color: on ? "#e8e0d0":"#666", letterSpacing:"0.06em" }}>{label}</div>
                    <div style={{ fontSize:11, color:"var(--text-dim)", marginTop:2, fontStyle:"italic" }}>{hint}</div>
                  </div>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:9, color: on ? GOLD:"#9e9e9e", letterSpacing:"0.15em" }}>{on ? "VISIBLE":"HIDDEN"}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <AdminButton onClick={save}>SAVE DISPLAY SETTINGS</AdminButton>
            {saved && <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:"#4caf50", letterSpacing:"0.1em" }}>✓ SAVED</span>}
          </div>
        </>
      )}
    </div>
  );
}
