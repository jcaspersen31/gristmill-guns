"use client";
import { useState, useEffect } from "react";

const GOLD = "#c9a84c";

function Logo({ size = 52 }) {
  return <img src="https://res.cloudinary.com/dq2d56it9/image/upload/v1781047650/Gristmill_Logo_dqmsgw.png" alt="Gristmill Guns & Optics" width={size} height={size} style={{ objectFit:"contain" }}/>
;}

export default function AgeGate({ children }) {
  const [verified, setVerified] = useState(true); // default true to avoid flash
  const [denied, setDenied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = sessionStorage.getItem("gm_age_verified");
      setVerified(stored === "1");
    } catch {
      setVerified(false);
    }
  }, []);

  const accept = () => {
    try { sessionStorage.setItem("gm_age_verified", "1"); } catch {}
    setVerified(true);
  };

  const decline = () => setDenied(true);

  // Don't render gate until mounted to avoid SSR mismatch
  if (!mounted) return <>{children}</>;
  if (verified) return <>{children}</>;

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <div style={{
        position:"fixed", inset:0, zIndex:99999,
        background:"var(--bg)",
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:24,
      }}>
        {/* Background watermark */}
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", opacity:0.03, pointerEvents:"none" }}>
          <Logo size={600}/>
        </div>

        <div style={{ position:"relative", textAlign:"center", maxWidth:460, width:"100%" }}>
          <Logo size={64}/>

          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:"var(--text-dim)", letterSpacing:"0.28em", margin:"1.25rem 0 0.25rem" }}>
            GRISTMILL GUNS & OPTICS
          </div>

          {denied ? (
            <div style={{ marginTop:"2rem" }}>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:22, color:"var(--text)", letterSpacing:"0.06em", marginBottom:12 }}>
                SORRY, YOU MUST BE 18 OR OLDER
              </div>
              <div style={{ fontFamily:"Georgia,serif", fontStyle:"italic", color:"var(--text-dim)", fontSize:13, lineHeight:1.7 }}>
                This site contains content related to the purchase of firearms and is restricted to adults 18 years of age or older.
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:28, fontWeight:700, color:"var(--text)", letterSpacing:"0.05em", margin:"1.5rem 0 0.5rem", lineHeight:1.1 }}>
                ARE YOU 18 OR OLDER?
              </div>
              <div style={{ fontFamily:"Georgia,serif", fontStyle:"italic", color:"var(--text-dim)", fontSize:13, lineHeight:1.7, marginBottom:"2.5rem" }}>
                You must be 18 years of age or older to visit this site. Please verify your age to continue.
              </div>

              <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
                <button
                  onClick={accept}
                  style={{
                    background:GOLD, color:"#000",
                    fontFamily:"'Oswald',sans-serif", fontWeight:700,
                    fontSize:15, letterSpacing:"0.12em",
                    padding:"13px 36px", border:"none",
                    borderRadius:2, cursor:"pointer",
                    transition:"opacity 0.2s",
                    minWidth:140,
                  }}
                  onMouseEnter={e=>e.currentTarget.style.opacity=0.85}
                  onMouseLeave={e=>e.currentTarget.style.opacity=1}
                >
                  YES, I AM 18+
                </button>
                <button
                  onClick={decline}
                  style={{
                    background:"transparent", color:"var(--text-dim)",
                    fontFamily:"'Oswald',sans-serif", fontWeight:600,
                    fontSize:15, letterSpacing:"0.12em",
                    padding:"13px 36px",
                    border:"1px solid var(--border-mid)",
                    borderRadius:2, cursor:"pointer",
                    minWidth:140,
                  }}
                >
                  NO, I AM NOT
                </button>
              </div>

              <div style={{ marginTop:"2rem", fontFamily:"Georgia,serif", fontStyle:"italic", color:"var(--text-dim)", fontSize:11, lineHeight:1.6 }}>
                By entering this site you agree that you are 18 years of age or older and consent to viewing firearm-related content. This site uses session storage to remember your response.
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
