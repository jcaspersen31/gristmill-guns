"use client";
import { useState, useEffect, useRef } from "react";
import PageHeader from "@/components/admin/PageHeader";
import AdminButton from "@/components/admin/AdminButton";
import InputField from "@/components/admin/InputField";

const GOLD = "#c9a84c";
const CLOUD = "https://api.cloudinary.com/v1_1/dq2d56it9/image/upload";
const PRESET = "gristmill";

function ImageUpload({ label, value, onChange, hint }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleFile = async e => {
    const f = e.target.files[0];
    if (!f) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("upload_preset", PRESET);
      fd.append("folder", "gristmill/about");
      const res = await fetch(CLOUD, { method:"POST", body:fd });
      const data = await res.json();
      if (data.secure_url) onChange(data.secure_url);
    } finally { setUploading(false); }
  };

  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:"block", fontSize:9, color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.14em", marginBottom:6 }}>{label.toUpperCase()}</label>
      <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
        <div style={{ width:120, height:80, background:"var(--bg)", border:"1px solid var(--border-mid)", borderRadius:2, overflow:"hidden", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
          {value
            ? <img src={value} alt="" style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
            : <span style={{ fontSize:10, color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif" }}>NO IMAGE</span>}
        </div>
        <div style={{ flex:1 }}>
          <input value={value || ""} onChange={e => onChange(e.target.value)}
            placeholder="Paste Cloudinary URL or upload below..."
            style={{ width:"100%", background:"var(--bg)", border:"1px solid var(--border-mid)", color:"var(--text)", padding:"7px 10px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:12, outline:"none", boxSizing:"border-box", marginBottom:6 }}/>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => fileRef.current.click()} disabled={uploading}
              style={{ background:"transparent", border:`1px solid ${GOLD}`, color:GOLD, fontFamily:"'Oswald',sans-serif", fontSize:10, padding:"5px 12px", borderRadius:2, cursor:"pointer", letterSpacing:"0.08em" }}>
              {uploading ? "UPLOADING..." : "UPLOAD PHOTO"}
            </button>
            {value && <button onClick={() => onChange("")}
              style={{ background:"transparent", border:"1px solid var(--border-mid)", color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", fontSize:10, padding:"5px 10px", borderRadius:2, cursor:"pointer" }}>
              CLEAR
            </button>}
          </div>
          {hint && <div style={{ fontSize:10, color:"var(--text-dim)", marginTop:4, fontStyle:"italic" }}>{hint}</div>}
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }}/>
    </div>
  );
}

export default function ContentPage() {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/content").then(r => r.json()).then(d => {
      setContent(d);
      setLoading(false);
    });
  }, []);

  const set = (k, v) => setContent(c => ({ ...c, [k]: v }));

  const save = async () => {
    setSaving(true);
    await fetch("/api/content", {
      method:"PUT",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(content),
    });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div style={{ color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.15em" }}>LOADING...</div>;

  return (
    <div style={{ maxWidth:800 }}>
      <PageHeader title="SITE CONTENT" action={
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {saved && <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:"var(--green)", letterSpacing:"0.1em" }}>✓ SAVED</span>}
          <AdminButton onClick={save} disabled={saving}>{saving ? "SAVING..." : "SAVE ALL"}</AdminButton>
        </div>
      }/>

      {/* ABOUT SECTION */}
      <div style={{ marginBottom:32 }}>
        <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:GOLD, letterSpacing:"0.15em", marginBottom:16, paddingBottom:8, borderBottom:"1px solid var(--border)" }}>ABOUT THE MILL</div>

        <InputField label="About Section Tagline" value={content.about_tagline||""} onChange={v => set("about_tagline",v)} type="textarea"
          hint="The paragraph shown at the top of the About section"/>

        <ImageUpload label="Hero Photo (wide banner)" value={content.about_hero_img||""} onChange={v => set("about_hero_img",v)}
          hint="Best size: wide landscape shot of the exterior or main room. Recommended: 1800×600px"/>
        <ImageUpload label="Interior Photo" value={content.about_img_interior||""} onChange={v => set("about_img_interior",v)}
          hint="Wide shot of the shop floor or display cases"/>
        <ImageUpload label="The Millstone Photo" value={content.about_img_millstone||""} onChange={v => set("about_img_millstone",v)}
          hint="Original millstone or mill equipment"/>
        <ImageUpload label="The Décor Photo" value={content.about_img_decor||""} onChange={v => set("about_img_decor",v)}
          hint="Rustic details — reclaimed wood, vintage signs, antiques"/>
      </div>

      {/* INFO CARDS */}
      <div style={{ marginBottom:32 }}>
        <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:GOLD, letterSpacing:"0.15em", marginBottom:16, paddingBottom:8, borderBottom:"1px solid var(--border)" }}>INFO CARDS</div>
        {[1,2,3,4].map(n => (
          <div key={n} style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:3, padding:"1rem", marginBottom:12 }}>
            <InputField label={`Card ${n} Title`} value={content[`about_card_${n}_title`]||""} onChange={v => set(`about_card_${n}_title`,v)}/>
            <InputField label={`Card ${n} Body`} value={content[`about_card_${n}_body`]||""} onChange={v => set(`about_card_${n}_body`,v)} type="textarea"/>
          </div>
        ))}
      </div>

      {/* HOURS */}
      <div style={{ marginBottom:32 }}>
        <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:GOLD, letterSpacing:"0.15em", marginBottom:16, paddingBottom:8, borderBottom:"1px solid var(--border)" }}>STORE HOURS</div>
        <InputField label="Hours" value={content.shop_hours||""} onChange={v => set("shop_hours",v)}
          hint='Shown in the About section. Format: "Mon-Fri: 10am-6pm | Sat: 9am-5pm | Sun: Closed"'/>
      </div>

      <AdminButton onClick={save} disabled={saving}>{saving ? "SAVING..." : "SAVE ALL CONTENT"}</AdminButton>
      {saved && <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:"var(--green)", letterSpacing:"0.1em", marginLeft:12 }}>✓ SAVED</span>}
    </div>
  );
}
