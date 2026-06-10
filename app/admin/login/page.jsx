"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const GOLD = "#c9a84c";

function Logo({ size = 48 }) {
  return <img src="https://res.cloudinary.com/dq2d56it9/image/upload/v1781047650/Gristmill_Logo_dqmsgw.png" alt="Gristmill Guns & Optics" width={size} height={size} style={{ objectFit:"contain" }}/>
;}

export default function AdminLoginPage() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async () => {
    if (!pw || loading) return;
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        router.replace("/admin/reservations");
      } else {
        setErr("Incorrect password");
      }
    } catch {
      setErr("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#080808", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap'); * { box-sizing:border-box; }`}</style>
      <div style={{ background:"var(--bg-card)", border:`1px solid ${GOLD}`, borderRadius:3, padding:"2.5rem", width:320, textAlign:"center" }}>
        <Logo size={52}/>
        <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:"var(--text-dim)", letterSpacing:"0.28em", margin:"1rem 0 0.25rem" }}>GRISTMILL GUNS & OPTICS</div>
        <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:16, color:GOLD, letterSpacing:"0.2em", marginBottom:"1.75rem" }}>ADMIN ACCESS</div>

        <input
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="Password"
          style={{ width:"100%", background:"var(--bg)", border:`1px solid ${err ? "#c0392b" : "#1e1e1e"}`, color:"var(--text)", padding:"10px 14px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:14, outline:"none", boxSizing:"border-box", marginBottom: err ? 8 : 14 }}
        />
        {err && <div style={{ color:"#c0392b", fontSize:12, fontStyle:"italic", marginBottom:10 }}>{err}</div>}

        <button
          onClick={submit}
          disabled={loading}
          style={{ width:"100%", background:GOLD, color:"#000", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:14, letterSpacing:"0.12em", padding:"12px 0", border:"none", borderRadius:2, cursor: loading ? "not-allowed":"pointer", opacity: loading ? 0.6:1 }}
        >
          {loading ? "CHECKING..." : "ENTER"}
        </button>

        <a href="/" style={{ display:"block", marginTop:16, fontFamily:"'Oswald',sans-serif", fontSize:10, color:"var(--text-dim)", letterSpacing:"0.1em", textDecoration:"none" }}>← BACK TO SITE</a>
      </div>
    </div>
  );
}
