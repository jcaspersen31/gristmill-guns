"use client";
import { useState, useEffect, useRef } from "react";
import PageHeader from "@/components/admin/PageHeader";
import AdminButton from "@/components/admin/AdminButton";
import InputField from "@/components/admin/InputField";

const GOLD = "#c9a84c";
const CLOUD = "https://api.cloudinary.com/v1_1/dq2d56it9/image/upload";

const BLANK = { title:"", body:"", excerpt:"", coverImage:"", published:false };

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [imgPreview, setImgPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    fetch("/api/posts?all=true").then(r => r.json()).then(d => {
      setPosts(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => { setEditing("new"); setForm(BLANK); setImgPreview(""); };
  const openEdit = p => {
    setEditing(p.slug);
    setForm({ title:p.title, body:p.body, excerpt:p.excerpt||"", coverImage:p.coverImage||"", published:p.published });
    setImgPreview(p.coverImage||"");
  };

  const save = async () => {
    if (!form.title || !form.body) return;
    setSaving(true);
    try {
      if (editing === "new") {
        const res = await fetch("/api/posts", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({...form, coverImage:imgPreview||null}) });
        const p = await res.json();
        setPosts(ps => [p, ...ps]);
      } else {
        await fetch(`/api/posts/${editing}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({...form, coverImage:imgPreview||null}) });
        setPosts(ps => ps.map(p => p.slug===editing ? {...p,...form, coverImage:imgPreview||null} : p));
      }
      setEditing(null);
    } finally { setSaving(false); }
  };

  const del = async slug => {
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/posts/${slug}`, { method:"DELETE" });
    setPosts(ps => ps.filter(p => p.slug!==slug));
  };

  const handleImg = async e => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => setImgPreview(ev.target.result);
    reader.readAsDataURL(f);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("upload_preset", "gristmill");
      fd.append("folder", "gristmill/blog");
      const res = await fetch(CLOUD, { method:"POST", body:fd });
      const data = await res.json();
      if (data.secure_url) { setImgPreview(data.secure_url); set("coverImage", data.secure_url); }
    } finally { setUploading(false); }
  };

  if (editing) return (
    <div style={{ maxWidth:800 }}>
      <PageHeader
        title={editing === "new" ? "NEW POST" : "EDIT POST"}
        action={<AdminButton variant="ghost" onClick={() => setEditing(null)}>CANCEL</AdminButton>}
      />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
        <div>
          <InputField label="Title" value={form.title} onChange={v => set("title",v)} placeholder="e.g. New Shipment of Henry Rifles Just Arrived"/>
          <InputField label="Excerpt" value={form.excerpt} onChange={v => set("excerpt",v)} type="textarea"
            hint="Short summary shown on the blog index page. 1-2 sentences."/>
          <InputField label="Body" value={form.body} onChange={v => set("body",v)} type="textarea"/>
          <div style={{ marginTop:4 }}>
            <textarea value={form.body} onChange={e => set("body", e.target.value)} rows={16}
              placeholder="Write your post here..."
              style={{ width:"100%", background:"var(--bg)", border:"1px solid var(--border-mid)", color:"var(--text)", padding:"10px 12px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:13, outline:"none", resize:"vertical", boxSizing:"border-box", lineHeight:1.7 }}/>
            <div style={{ fontSize:10, color:"var(--text-dim)", marginTop:3, fontStyle:"italic" }}>Plain text or basic HTML supported</div>
          </div>
          <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", marginTop:16 }}>
            <input type="checkbox" checked={form.published} onChange={e => set("published", e.target.checked)} style={{ width:15, height:15, accentColor:GOLD }}/>
            <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:12, color:GOLD, letterSpacing:"0.08em" }}>PUBLISHED — visible on the site</span>
          </label>
        </div>
        <div>
          <div style={{ fontSize:9, color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.14em", marginBottom:8 }}>COVER IMAGE</div>
          <div onClick={() => fileRef.current.click()}
            onMouseEnter={e=>e.currentTarget.style.borderColor=GOLD}
            onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}
            style={{ aspectRatio:"16/9", background:"var(--bg)", border:"2px dashed var(--border)", borderRadius:3, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", overflow:"hidden", transition:"border-color 0.2s", marginBottom:8, position:"relative" }}>
            {imgPreview
              ? <img src={imgPreview} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              : <div style={{ textAlign:"center", color:"var(--text-dim)" }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>↑</div>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:12, letterSpacing:"0.1em" }}>{uploading ? "UPLOADING..." : "CLICK TO UPLOAD"}</div>
                </div>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImg} style={{ display:"none" }}/>
          {imgPreview && <AdminButton variant="ghost" onClick={() => { setImgPreview(""); set("coverImage",""); }} style={{ fontSize:10 }}>REMOVE</AdminButton>}
        </div>
      </div>
      <div style={{ marginTop:24, display:"flex", gap:10 }}>
        <AdminButton onClick={save} disabled={saving || !form.title || !form.body}>{saving ? "SAVING..." : "SAVE POST"}</AdminButton>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader title={`BLOG POSTS (${posts.length})`} action={
        <AdminButton onClick={openNew}>+ NEW POST</AdminButton>
      }/>
      {loading && <div style={{ color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.15em", padding:"3rem 0", textAlign:"center" }}>LOADING...</div>}
      {!loading && posts.length === 0 && (
        <div style={{ color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.15em", padding:"3rem 0", textAlign:"center" }}>NO POSTS YET — CREATE YOUR FIRST ONE</div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {posts.map(p => (
          <div key={p.slug} style={{ display:"flex", alignItems:"center", gap:12, background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:2, padding:"12px 16px" }}>
            {p.coverImage && (
              <div style={{ width:64, height:48, borderRadius:2, overflow:"hidden", flexShrink:0 }}>
                <img src={p.coverImage} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              </div>
            )}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:"var(--text)", display:"flex", alignItems:"center", gap:8 }}>
                {p.title}
                <span style={{ fontSize:9, padding:"2px 6px", borderRadius:1, fontFamily:"'Oswald',sans-serif", letterSpacing:"0.1em",
                  background: p.published ? "rgba(76,175,80,0.15)" : "rgba(158,158,158,0.1)",
                  color: p.published ? "var(--green)" : "var(--text-dim)",
                  border: p.published ? "1px solid rgba(76,175,80,0.3)" : "1px solid var(--border-mid)"
                }}>{p.published ? "PUBLISHED" : "DRAFT"}</span>
              </div>
              <div style={{ fontSize:10, color:"var(--text-dim)", marginTop:2, fontFamily:"'Oswald',sans-serif" }}>
                {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "Not published"}
                {p.excerpt && ` · ${p.excerpt.slice(0,60)}...`}
              </div>
            </div>
            <div style={{ display:"flex", gap:6, flexShrink:0 }}>
              <AdminButton variant="outline" onClick={() => openEdit(p)} style={{ fontSize:10, padding:"4px 10px" }}>EDIT</AdminButton>
              <AdminButton variant="ghost" onClick={() => window.open(`/blog/${p.slug}`, '_blank')} style={{ fontSize:10, padding:"4px 10px" }}>VIEW</AdminButton>
              <AdminButton variant="danger" onClick={() => del(p.slug)} style={{ fontSize:10, padding:"4px 10px" }}>DEL</AdminButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
