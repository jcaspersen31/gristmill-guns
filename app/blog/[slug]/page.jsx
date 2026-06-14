"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

const GOLD = "#c9a84c";

function Logo({ size=36 }) {
  return <img src="https://res.cloudinary.com/dq2d56it9/image/upload/v1781047650/Gristmill_Logo_dqmsgw.png" alt="Gristmill Guns & Optics" width={size} height={size} style={{ objectFit:"contain" }}/>;
}

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/posts/${slug}`).then(r => r.json()).then(d => {
      setPost(d.error ? null : d);
      setLoading(false);
    });
  }, [slug]);

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", color:"var(--text)" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0;} .post-body p{margin-bottom:1rem;line-height:1.8;} .post-body h2{font-family:'Oswald',sans-serif;font-size:1.4rem;color:${GOLD};margin:2rem 0 0.75rem;letter-spacing:0.06em;} .post-body h3{font-family:'Oswald',sans-serif;font-size:1.1rem;color:var(--text);margin:1.5rem 0 0.5rem;} .post-body ul,.post-body ol{padding-left:1.5rem;margin-bottom:1rem;line-height:1.8;} .post-body a{color:${GOLD};}`}</style>

      <header style={{ background:"var(--bg-header)", borderBottom:`2px solid ${GOLD}`, padding:"0 2rem", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", gap:14, padding:"0.85rem 0" }}>
          <a href="/" style={{ display:"flex", alignItems:"center", gap:12, textDecoration:"none" }}>
            <Logo size={40}/>
            <div>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:20, fontWeight:700, color:"var(--text)", letterSpacing:"0.1em", lineHeight:1 }}>GRISTMILL</div>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:9, color:GOLD, letterSpacing:"0.24em" }}>GUNS & OPTICS</div>
            </div>
          </a>
          <a href="/blog" style={{ marginLeft:"auto", fontFamily:"'Oswald',sans-serif", fontSize:11, color:"var(--text-dim)", letterSpacing:"0.1em", textDecoration:"none" }}>← ALL POSTS</a>
        </div>
      </header>

      <main style={{ maxWidth:740, margin:"0 auto", padding:"3rem 2rem 5rem" }}>
        {loading && <div style={{ textAlign:"center", padding:"4rem", fontFamily:"'Oswald',sans-serif", color:"var(--text-dim)", letterSpacing:"0.15em" }}>LOADING...</div>}
        {!loading && !post && <div style={{ textAlign:"center", padding:"4rem", fontFamily:"'Oswald',sans-serif", color:"var(--text-dim)", letterSpacing:"0.15em" }}>POST NOT FOUND</div>}
        {post && <>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, color:"var(--text-dim)", letterSpacing:"0.15em", marginBottom:12 }}>
            {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}) : ""}
          </div>
          <h1 style={{ fontFamily:"'Oswald',sans-serif", fontSize:36, fontWeight:700, color:"var(--text)", letterSpacing:"0.04em", lineHeight:1.1, marginBottom:16 }}>{post.title}</h1>
          <div style={{ width:48, height:2, background:GOLD, marginBottom:24 }}/>
          {post.excerpt && <div style={{ fontFamily:"Georgia,serif", fontStyle:"italic", color:"var(--text-muted)", fontSize:16, lineHeight:1.7, marginBottom:24, paddingBottom:24, borderBottom:"1px solid var(--border)" }}>{post.excerpt}</div>}
          {post.coverImage && (
            <div style={{ marginBottom:32, borderRadius:3, overflow:"hidden", aspectRatio:"16/9" }}>
              <img src={post.coverImage} alt={post.title} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            </div>
          )}
          <div className="post-body" style={{ fontFamily:"Georgia,serif", fontSize:15, color:"var(--text-muted)", lineHeight:1.8 }}
            dangerouslySetInnerHTML={{ __html: post.body.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>').replace(/^/, '<p>').replace(/$/, '</p>') }}
          />
        </>}
      </main>

      <footer style={{ background:"var(--bg-header)", borderTop:"1px solid var(--border-mid)", padding:"1.5rem 2rem", textAlign:"center" }}>
        <div style={{ fontSize:12, color:"var(--text-muted)", fontStyle:"italic" }}>
          Gristmill Guns & Optics · 1549 State Route 487, Orangeville PA 17859 · <a href="tel:5707137339" style={{ color:"var(--text-muted)", textDecoration:"none" }}>(570) 713-7339</a>
        </div>
      </footer>
    </div>
  );
}
