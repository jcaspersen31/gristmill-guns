"use client";
import { useState, useEffect } from "react";
import PageHeader from "@/components/admin/PageHeader";
import AdminButton from "@/components/admin/AdminButton";

const GOLD = "#c9a84c";
const STATUS_COLORS = { pending:"#c9a84c", confirmed:"#4caf50", completed:"#2196f3", cancelled:"#c0392b" };

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reservations").then(r => r.json()).then(d => {
      setReservations(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, []);

  const update = async (id, status) => {
    await fetch(`/api/reservations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setReservations(rs => rs.map(r => r.id === id ? { ...r, status } : r));
  };

  const statuses = ["pending","confirmed","completed","cancelled"];
  const shown = filter === "all" ? reservations : reservations.filter(r => r.status === filter);

  return (
    <div>
      <PageHeader title="RESERVATIONS" />

      {/* Filter tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:20, flexWrap:"wrap" }}>
        {["all",...statuses].map(s => {
          const count = s === "all" ? reservations.length : reservations.filter(r => r.status === s).length;
          return (
            <button key={s} onClick={() => setFilter(s)} style={{
              background: filter===s ? `${GOLD}18`:"transparent",
              border: `1px solid ${filter===s ? GOLD:"#2a2a2a"}`,
              color: filter===s ? GOLD:"#a0a0a0",
              fontFamily:"'Oswald',sans-serif", fontSize:10,
              padding:"5px 14px", borderRadius:2, cursor:"pointer", letterSpacing:"0.1em"
            }}>
              {s.toUpperCase()} ({count})
            </button>
          );
        })}
      </div>

      {loading && <div style={{ color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.15em", padding:"3rem 0", textAlign:"center" }}>LOADING...</div>}
      {!loading && shown.length === 0 && <div style={{ color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.15em", padding:"3rem 0", textAlign:"center" }}>NO RESERVATIONS</div>}

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {shown.map(r => {
          const expires = r.expiresAt ? new Date(r.expiresAt) : null;
          const isExpired = expires && expires < new Date();
          return (
            <div key={r.id} style={{ background:"var(--bg-card)", border:`1px solid ${r.status==="pending" ? "rgba(201,168,76,0.25)":"#1a1a1a"}`, borderRadius:3, padding:"16px 20px" }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:16, flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:260 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                    <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:16, color:"var(--text)" }}>{r.customerName}</div>
                    <span style={{ fontSize:9, padding:"2px 7px", borderRadius:1, fontFamily:"'Oswald',sans-serif", letterSpacing:"0.1em", background:`${STATUS_COLORS[r.status]}22`, color:STATUS_COLORS[r.status], border:`1px solid ${STATUS_COLORS[r.status]}44` }}>{r.status.toUpperCase()}</span>
                    <span style={{ fontSize:9, padding:"2px 7px", borderRadius:1, fontFamily:"'Oswald',sans-serif", background: r.type==="deposit" ? `${GOLD}18`:"rgba(33,150,243,0.1)", color: r.type==="deposit" ? GOLD:"#2196f3", border:`1px solid ${r.type==="deposit" ? GOLD+"44":"#2196f344"}` }}>{r.type.toUpperCase()}</span>
                  </div>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:GOLD, marginBottom:6 }}>{r.product?.name || "Unknown product"}</div>
                  <div style={{ fontSize:12, color:"var(--text-dim)", lineHeight:1.8 }}>
                    <a href={`mailto:${r.customerEmail}`} style={{ color:"var(--text-muted)", textDecoration:"none" }}>{r.customerEmail}</a>
                    &nbsp;·&nbsp;
                    <a href={`tel:${r.customerPhone}`} style={{ color:"var(--text-muted)", textDecoration:"none" }}>{r.customerPhone}</a>
                  </div>
                  <div style={{ fontSize:11, color:"var(--text-dim)", marginTop:4, fontFamily:"'Oswald',sans-serif", display:"flex", gap:12, flexWrap:"wrap" }}>
                    <span>Paid: <span style={{ color:GOLD }}>${r.amountPaid?.toLocaleString()}</span></span>
                    <span>{new Date(r.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"})}</span>
                    {expires && <span style={{ color: isExpired ? "#c0392b":"#a0a0a0" }}>{isExpired ? "⚠ EXPIRED" : `Holds until ${expires.toLocaleDateString("en-US",{month:"short",day:"numeric"})}`}</span>}
                  </div>
                  {(r.product?.serialNumber || r.product?.sku) && (
                    <div style={{ fontSize:10, color:"var(--text-dim)", marginTop:4, fontFamily:"'Courier New',monospace" }}>
                      {r.product.sku && <>SKU: {r.product.sku}</>}
                      {r.product.sku && r.product.serialNumber && " · "}
                      {r.product.serialNumber && <>S/N: {r.product.serialNumber}</>}
                    </div>
                  )}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
                  {r.status === "pending" && <>
                    <AdminButton variant="ghost" onClick={() => update(r.id,"confirmed")} style={{ color:"#4caf50", borderColor:"#2a5a2a" }}>CONFIRM</AdminButton>
                    <AdminButton variant="ghost" onClick={() => update(r.id,"completed")} style={{ color:"#2196f3", borderColor:"#1a3a5a" }}>COMPLETED</AdminButton>
                    <AdminButton variant="danger" onClick={() => update(r.id,"cancelled")}>CANCEL</AdminButton>
                  </>}
                  {r.status === "confirmed" && <>
                    <AdminButton variant="ghost" onClick={() => update(r.id,"completed")} style={{ color:"#2196f3", borderColor:"#1a3a5a" }}>MARK COMPLETED</AdminButton>
                    <AdminButton variant="danger" onClick={() => update(r.id,"cancelled")}>CANCEL</AdminButton>
                  </>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
