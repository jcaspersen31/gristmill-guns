"use client";
import { useState, useEffect } from "react";

const GOLD = "#c9a84c";

function Logo({ size=40 }) {
  return <img src="https://res.cloudinary.com/dq2d56it9/image/upload/v1781047650/Gristmill_Logo_dqmsgw.png" alt="Gristmill Guns & Optics" width={size} height={size} style={{ objectFit:"contain" }}/>;
}

export default function MyReservationsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [devLink, setDevLink] = useState("");

  useEffect(() => {
    fetch("/api/auth/my-reservations").then(r => r.json()).then(d => {
      if (!d.error) setData(d);
      setLoading(false);
    });
  }, []);

  const requestLink = async () => {
    if (!email || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/auth/request-link", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ email }),
      });
      const d = await res.json();
      setSent(true);
      if (d.devLink) setDevLink(d.devLink);
    } finally { setSending(false); }
  };

  const STATUS_COLORS = { pending:GOLD, confirmed:"#4caf50", completed:"#2196f3", cancelled:"#c0392b" };

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", color:"var(--text)" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0;}`}</style>

      <header style={{ background:"var(--bg-header)", borderBottom:`2px solid ${GOLD}`, padding:"0 2rem" }}>
        <div style={{ maxWidth:700, margin:"0 auto", display:"flex", alignItems:"center", gap:14, padding:"0.85rem 0" }}>
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

      <main style={{ maxWidth:700, margin:"0 auto", padding:"3rem 2rem 5rem" }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:"4rem", fontFamily:"'Oswald',sans-serif", color:"var(--text-dim)", letterSpacing:"0.15em" }}>LOADING...</div>
        ) : data ? (
          <>
            <div style={{ textAlign:"center", marginBottom:"2.5rem" }}>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:9, color:"var(--text-dim)", letterSpacing:"0.28em", marginBottom:8 }}>SIGNED IN AS</div>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:18, color:GOLD }}>{data.email}</div>
            </div>

            {data.reservations.length === 0 ? (
              <div style={{ textAlign:"center", padding:"3rem", fontFamily:"'Oswald',sans-serif", color:"var(--text-dim)", letterSpacing:"0.15em" }}>NO RESERVATIONS YET</div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {data.reservations.map(r => (
                  <div key={r.id} style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:3, padding:"1.25rem" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8, flexWrap:"wrap" }}>
                      <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:15, color:"var(--text)" }}>{r.product?.name || "Item"}</div>
                      <span style={{ fontSize:9, padding:"2px 7px", borderRadius:1, fontFamily:"'Oswald',sans-serif", letterSpacing:"0.1em", background:`${STATUS_COLORS[r.status]}22`, color:STATUS_COLORS[r.status], border:`1px solid ${STATUS_COLORS[r.status]}44` }}>{r.status.toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize:12, color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif" }}>
                      {r.type === 'deposit' ? 'Deposit' : 'Full payment'}: ${r.amountPaid?.toLocaleString()}
                      &nbsp;·&nbsp;
                      {new Date(r.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ maxWidth:420, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:"2rem" }}>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:28, fontWeight:700, color:"var(--text)", letterSpacing:"0.04em", marginBottom:10 }}>MY RESERVATIONS</div>
              <div style={{ fontFamily:"Georgia,serif", fontStyle:"italic", color:"var(--text-dim)", fontSize:14 }}>Enter your email and we'll send you a link to view your reservations.</div>
            </div>

            {!sent ? (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && requestLink()}
                  placeholder="you@example.com"
                  style={{ width:"100%", background:"var(--bg-card)", border:"1px solid var(--border-mid)", color:"var(--text)", padding:"12px 16px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:12 }}
                />
                <button onClick={requestLink} disabled={!email || sending}
                  style={{ width:"100%", background:GOLD, color:"#000", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:14, letterSpacing:"0.1em", padding:"13px 0", border:"none", borderRadius:2, cursor: email && !sending ? "pointer":"not-allowed", opacity: email && !sending ? 1:0.6 }}>
                  {sending ? "SENDING..." : "SEND LOGIN LINK"}
                </button>
              </>
            ) : (
              <div style={{ textAlign:"center", padding:"2rem", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:3 }}>
                <div style={{ fontSize:32, marginBottom:12 }}>✉️</div>
                <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:15, color:GOLD, marginBottom:8 }}>CHECK YOUR EMAIL</div>
                <div style={{ fontSize:13, color:"var(--text-dim)", fontStyle:"italic" }}>We sent a login link to {email}. It expires in 15 minutes.</div>
                {devLink && (
                  <div style={{ marginTop:16, padding:"10px", background:"var(--bg)", borderRadius:2, fontSize:11, wordBreak:"break-all" }}>
                    <div style={{ color:"var(--text-dim)", marginBottom:4 }}>Email not configured — dev link:</div>
                    <a href={devLink} style={{ color:GOLD }}>{devLink}</a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
