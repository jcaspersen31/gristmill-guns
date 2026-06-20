"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const GOLD = "#c9a84c";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("verifying");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) { setStatus("error"); setError("No token provided"); return; }

    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setStatus("error"); setError(d.error); }
        else { setStatus("success"); setTimeout(() => router.replace("/my-reservations"), 1200); }
      })
      .catch(() => { setStatus("error"); setError("Something went wrong"); });
  }, []);

  return (
    <div style={{ textAlign:"center", maxWidth:360 }}>
      {status === "verifying" && (
        <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:14, color:"var(--text-dim)", letterSpacing:"0.15em" }}>VERIFYING...</div>
      )}
      {status === "success" && (
        <>
          <div style={{ fontSize:36, marginBottom:12 }}>✓</div>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:16, color:"var(--green)", letterSpacing:"0.1em" }}>SIGNED IN — REDIRECTING...</div>
        </>
      )}
      {status === "error" && (
        <>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:16, color:"var(--red-bright)", letterSpacing:"0.1em", marginBottom:12 }}>{error.toUpperCase()}</div>
          <a href="/my-reservations" style={{ fontFamily:"'Oswald',sans-serif", fontSize:12, color:GOLD, letterSpacing:"0.1em", textDecoration:"none" }}>← TRY AGAIN</a>
        </>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", color:"var(--text)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <Suspense fallback={<div style={{ fontFamily:"'Oswald',sans-serif", fontSize:14, color:"var(--text-dim)", letterSpacing:"0.15em" }}>LOADING...</div>}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
