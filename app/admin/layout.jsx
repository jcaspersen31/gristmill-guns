"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const GOLD = "#c9a84c";

function Logo({ size = 36 }) {
  return <img src="https://res.cloudinary.com/dq2d56it9/image/upload/v1781047650/Gristmill_Logo_dqmsgw.png" alt="Gristmill Guns & Optics" width={size} height={size} style={{ objectFit:"contain" }}/>
;}

const NAV_ITEMS = [
  { href: "/admin/reservations", label: "RESERVATIONS", icon: "📋" },
  { href: "/admin/products",     label: "INVENTORY",     icon: "🔫" },
  { href: "/admin/import",       label: "IMPORT CSV",    icon: "📥" },
  { href: "/admin/deals",        label: "DAILY DEALS",   icon: "🎯" },
  { href: "/admin/categories",   label: "CATEGORIES",    icon: "📂" },
  { href: "/admin/display",      label: "DISPLAY",       icon: "👁" },
  { href: "/admin/content",      label: "SITE CONTENT",  icon: "✏️" },
  { href: "/admin/blog",         label: "BLOG POSTS",    icon: "📝" },
  { href: "/admin/settings",     label: "SETTINGS",      icon: "⚙" },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setChecking(false);
      return;
    }
    fetch("/api/admin/session")
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) {
          router.replace("/admin/login");
        } else {
          setAuthed(true);
          setChecking(false);
          // Get pending reservation count for badge
          fetch("/api/reservations")
            .then(r => r.json())
            .then(res => {
              if (Array.isArray(res)) setPendingCount(res.filter(r => r.status === "pending").length);
            });
        }
      });
  }, [pathname]);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  };

  // Login page renders without sidebar
  if (pathname === "/admin/login") return <>{children}</>;

  if (checking) return (
    <div style={{ minHeight:"100vh", background:"#080808", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ fontFamily:"'Oswald',sans-serif", color:"var(--text-dim)", fontSize:13, letterSpacing:"0.2em" }}>LOADING...</div>
    </div>
  );

  if (!authed) return null;

  return (
    <div style={{ minHeight:"100vh", background:"#080808", display:"flex", fontFamily:"Georgia,serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap'); * { box-sizing:border-box; margin:0; padding:0; }`}</style>

      {/* SIDEBAR */}
      <aside style={{ width:220, background:"var(--bg-header)", borderRight:`1px solid #1a1a1a`, display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, bottom:0, zIndex:50 }}>
        {/* Logo */}
        <div style={{ padding:"1.25rem 1rem", borderBottom:`1px solid #1a1a1a`, display:"flex", alignItems:"center", gap:10 }}>
          <Logo size={32}/>
          <div>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, fontWeight:700, color:"var(--text)", letterSpacing:"0.1em", lineHeight:1 }}>GRISTMILL</div>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:8, color:GOLD, letterSpacing:"0.2em" }}>ADMIN</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"1rem 0" }}>
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active = pathname.startsWith(href);
            const isPending = href.includes("reservations") && pendingCount > 0;
            return (
              <a key={href} href={href} style={{
                display:"flex", alignItems:"center", gap:10,
                padding:"10px 16px",
                background: active ? `${GOLD}12` : "transparent",
                borderLeft: active ? `3px solid ${GOLD}` : "3px solid transparent",
                color: active ? GOLD : "#666",
                textDecoration:"none",
                fontFamily:"'Oswald',sans-serif",
                fontSize:11,
                letterSpacing:"0.12em",
                transition:"all 0.15s",
              }}>
                <span style={{ fontSize:14, opacity:0.7 }}>{icon}</span>
                <span style={{ flex:1 }}>{label}</span>
                {isPending && (
                  <span style={{ background:"#c0392b", color:"#fff", fontSize:9, padding:"1px 5px", borderRadius:999, fontWeight:700 }}>{pendingCount}</span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding:"1rem", borderTop:"1px solid var(--border)" }}>
          <a href="/" style={{ display:"block", fontFamily:"'Oswald',sans-serif", fontSize:10, color:"var(--text-dim)", letterSpacing:"0.1em", textDecoration:"none", marginBottom:8 }}>← VIEW SITE</a>
          <button onClick={logout} style={{ background:"transparent", border:"1px solid var(--border-mid)", color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", fontSize:10, letterSpacing:"0.1em", padding:"6px 12px", borderRadius:2, cursor:"pointer", width:"100%" }}>SIGN OUT</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ marginLeft:220, flex:1, padding:"2rem", minHeight:"100vh", color:"var(--text)" }}>
        {children}
      </main>
    </div>
  );
}
