"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";

const GOLD = "#c9a84c";

function Logo({ size=36 }) {
  return <img src="https://res.cloudinary.com/dq2d56it9/image/upload/v1781047650/Gristmill_Logo_dqmsgw.png" alt="Gristmill Guns & Optics" width={size} height={size} style={{ objectFit:"contain" }}/>;
}

export default function BlogIndex() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/posts").then(r => r.json()).then(d => {
      setPosts(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", color:"var(--text)" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0;}`}</style>

      <header style={{ background:"var(--bg-header)", borderBottom:`2px solid ${GOLD}`, padding:"0 2rem", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", gap:14, padding:"0.85rem 0" }}>
          <a href="/" style={{ display:"flex", alignItems:"center", gap:12, textDecoration:"none" }}>
            <Logo size={40}/>
            <div>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:20, fontWeight:700, color:"var(--text)", letterSpacing:"0.1em", lineHeight:1 }}>GRISTMILL</div>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:9, color:GOLD, letterSpacing:"0.24em" }}>GUNS & OPTICS</div>
            </div>
          </a>
          <a href="/" style={{ marginLeft:"auto", fontFamily:"'Oswald',sans-serif", fontSize:11, color:"var(--text-dim)", letterSpacing:"0.1em", textDecoration:"none" }}>← BACK TO CATALOG</a>
        </div>
      </header>

      <main style={{ maxWidth:900, margin:"0 auto", padding:"3rem 2rem 5rem" }}>
        <div style={{ textAlign:"center", marginBottom:"3rem" }}>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:9, color:"var(--text-dim)", letterSpacing:"0.28em", marginBottom:8 }}>GRISTMILL GUNS & OPTICS</div>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:34, fontWeight:700, color:"var(--text)", letterSpacing:"0.05em" }}>NEWS & UPDATES</div>
          <div style={{ width:48, height:2, background:GOLD, margin:"12px auto 0" }}/>
        </div>

        {loading && <div style={{ textAlign:"center", padding:"4rem", fontFamily:"'Oswald',sans-serif", color:"var(--text-dim)", letterSpacing:"0.15em" }}>LOADING...</div>}
        {!loading && posts.length === 0 && <div style={{ textAlign:"center", padding:"4rem", fontFamily:"'Oswald',sans-serif", color:"var(--text-dim)", letterSpacing:"0.15em" }}>NO POSTS YET — CHECK BACK SOON</div>}

        <div style={{ display:"grid", gap:"1.5rem" }}>
          {posts.map(p => (
            <a key={p.slug} href={`/blog/${p.slug}`} style={{ textDecoration:"none", display:"grid", gridTemplateColumns: p.coverImage ? "280px 1fr" : "1fr", gap:24, background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:3, overflow:"hidden", transition:"border-color 0.2s" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=GOLD}
              onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
              {p.coverImage && (
                <div style={{ aspectRatio:"16/9", overflow:"hidden" }}>
                  <img src={p.coverImage} alt={p.title} loading="lazy" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                </div>
              )}
              <div style={{ padding:"1.5rem" }}>
                <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, color:"var(--text-dim)", letterSpacing:"0.15em", marginBottom:8 }}>
                  {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}) : ""}
                </div>
                <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:22, fontWeight:700, color:"var(--text)", letterSpacing:"0.04em", lineHeight:1.2, marginBottom:10 }}>{p.title}</div>
                {p.excerpt && <div style={{ fontFamily:"Georgia,serif", fontStyle:"italic", color:"var(--text-muted)", fontSize:14, lineHeight:1.7, marginBottom:14 }}>{p.excerpt}</div>}
                <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:GOLD, letterSpacing:"0.1em" }}>READ MORE →</div>
              </div>
            </a>
          ))}
        </div>
      </main>

      <footer style={{ background:"var(--bg-header)", borderTop:"1px solid var(--border-mid)", padding:"1.5rem 2rem", textAlign:"center" }}>
        <div style={{ fontSize:12, color:"var(--text-muted)", fontStyle:"italic" }}>
          Gristmill Guns & Optics · 1549 State Route 487, Orangeville PA 17859 · <a href="tel:5707137339" style={{ color:"var(--text-muted)", textDecoration:"none" }}>(570) 713-7339</a>
        </div>
      </footer>
    </div>
  );
}
