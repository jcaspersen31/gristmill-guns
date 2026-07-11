"use client";
import { useState } from "react";

const GOLD = "#c9a84c";

function Logo({ size = 80 }) {
  return <img src="https://res.cloudinary.com/dq2d56it9/image/upload/v1781047650/Gristmill_Logo_dqmsgw.png" alt="Gristmill Guns & Optics" width={size} height={size} style={{ objectFit:"contain" }}/>;
}

export default function ComingSoon() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!email || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", color:"#e8e0d0", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem", textAlign:"center", position:"relative", overflow:"hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0;}`}</style>

      {/* Background watermark */}
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", opacity:0.04, pointerEvents:"none" }}>
        <Logo size={700}/>
      </div>

      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:GOLD }}/>

      <div style={{ position:"relative", maxWidth:560, width:"100%" }}>
        <Logo size={90}/>

        <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:"#555", letterSpacing:"0.3em", margin:"1.5rem 0 0.4rem" }}>
          GRISTMILL GUNS & OPTICS
        </div>
        <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:"#444", letterSpacing:"0.2em", marginBottom:"2.5rem" }}>
          ORANGEVILLE, PA
        </div>

        <h1 style={{ fontFamily:"'Oswald',sans-serif", fontSize:"clamp(32px, 8vw, 56px)", fontWeight:700, color:"white", letterSpacing:"0.04em", lineHeight:1.1, marginBottom:"1rem" }}>
          SOMETHING BIG<br/>IS COMING
        </h1>

        <div style={{ width:48, height:2, background:GOLD, margin:"0 auto 1.5rem" }}/>

        <p style={{ fontFamily:"Georgia,serif", fontStyle:"italic", color:"#888", fontSize:16, lineHeight:1.8, marginBottom:"2.5rem" }}>
          We're putting the finishing touches on our online store. In the meantime, come visit us in-store or give us a call.
        </p>

        {!submitted ? (
          <div style={{ marginBottom:"2.5rem" }}>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:"#666", letterSpacing:"0.15em", marginBottom:12 }}>
              BE THE FIRST TO KNOW WHEN WE LAUNCH
            </div>
            <div style={{ display:"flex", gap:8, maxWidth:420, margin:"0 auto" }}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key==="Enter" && submit()}
                placeholder="your@email.com"
                style={{ flex:1, background:"#111", border:"1px solid #2a2a2a", color:"#e8e0d0", padding:"12px 16px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:14, outline:"none" }}/>
              <button onClick={submit} disabled={!email||submitting}
                style={{ background:GOLD, color:"#000", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:12, letterSpacing:"0.1em", padding:"12px 20px", border:"none", borderRadius:2, cursor:email&&!submitting?"pointer":"not-allowed", opacity:email&&!submitting?1:0.6, whiteSpace:"nowrap" }}>
                {submitting ? "..." : "NOTIFY ME"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom:"2.5rem", padding:"16px 24px", background:"rgba(201,168,76,0.08)", border:`1px solid ${GOLD}44`, borderRadius:3 }}>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:GOLD, letterSpacing:"0.1em" }}>✓ YOU'RE ON THE LIST</div>
            <div style={{ fontSize:12, color:"#666", fontStyle:"italic", marginTop:6 }}>We'll let you know when we launch.</div>
          </div>
        )}

        <div style={{ borderTop:"1px solid #1a1a1a", paddingTop:"2rem", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
          {[
            { label:"CALL US",  value:"(570) 713-7339",          href:"tel:5707137339" },
            { label:"EMAIL US", value:"grant@gristmillguns.com", href:"mailto:grant@gristmillguns.com" },
            { label:"FIND US",  value:"1549 PA-487, Orangeville PA", href:"https://maps.google.com/?q=1549+State+Route+487+Orangeville+PA" },
          ].map(({ label, value, href }) => (
            <div key={label}>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:9, color:"#444", letterSpacing:"0.2em", marginBottom:6 }}>{label}</div>
              <a href={href} target={href.startsWith("http")?"_blank":undefined} rel="noreferrer"
                style={{ fontFamily:"Georgia,serif", fontStyle:"italic", color:"#888", fontSize:12, textDecoration:"none", lineHeight:1.6 }}
                onMouseEnter={e=>e.currentTarget.style.color=GOLD}
                onMouseLeave={e=>e.currentTarget.style.color="#888"}>
                {value}
              </a>
            </div>
          ))}
        </div>

        <div style={{ marginTop:"2rem" }}>
          <a href="https://instagram.com/gristmillguns" target="_blank" rel="noreferrer"
            style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, color:"#444", letterSpacing:"0.15em", textDecoration:"none" }}
            onMouseEnter={e=>e.currentTarget.style.color=GOLD}
            onMouseLeave={e=>e.currentTarget.style.color="#444"}>
            @GRISTMILLGUNS ON INSTAGRAM
          </a>
        </div>
      </div>

      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3, background:GOLD }}/>
    </div>
  );
}
