"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

const GOLD = "#c9a84c";
const maskSerial = s => s && s.length > 4 ? `···${s.slice(-4)}` : s ? `···${s}` : null;

function Logo({ size=36 }) {
  return <img src="https://res.cloudinary.com/dq2d56it9/image/upload/v1781047650/Gristmill_Logo_dqmsgw.png" alt="Gristmill Guns & Optics" width={size} height={size} style={{ objectFit:"contain" }}/>
}

function Modal({ product, price, type, onClose, paymentMode }) {
  const [form, setForm] = useState({ name:"", email:"", phone:"" });
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState("");
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));
  const valid = form.name && form.email && form.phone;

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    setConflictError("");
    try {
      const res = await fetch("/api/reservations", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ productId:product.id, customerName:form.name, customerEmail:form.email, customerPhone:form.phone, amountPaid:type==="deposit"?product.deposit:price, type }),
      });
      const reservation = await res.json();

      if (res.status === 409) {
        setConflictError(reservation.error || "This item has already been reserved.");
        return;
      }

      // Try payment redirect
      const amount = type==="deposit" ? product.deposit : price;
      const paymentRes = await fetch("/api/payment", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ reservationId:reservation.id, amount, description:`${type==="deposit"?"Deposit":"Payment"} - ${product.name}`, email:form.email, name:form.name }),
      });
      const paymentData = await paymentRes.json();
      if (paymentData.redirectUrl) {
        window.location.href = paymentData.redirectUrl;
        return;
      }
      setDone(true);
    } finally { setSubmitting(false); }
  };

  return (
    <div onClick={e => e.target===e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, padding:16 }}>
      <div style={{ background:"var(--bg-card)", border:`1px solid ${GOLD}`, borderRadius:3, padding:"2rem", width:"100%", maxWidth:400, position:"relative" }}>
        <button onClick={onClose} style={{ position:"absolute", top:10, right:14, background:"none", border:"none", color:"var(--text-dim)", fontSize:22, cursor:"pointer" }}>×</button>
        {!done ? <>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:18, color:GOLD, letterSpacing:"0.1em", marginBottom:3 }}>
            {paymentMode === "email_only" ? "RESERVE THIS ITEM" : (type==="deposit"?"RESERVE THIS ITEM":"PAY IN FULL")}
          </div>
          <div style={{ fontStyle:"italic", color:"var(--text-dim)", fontSize:12, marginBottom:18 }}>{product.name}{paymentMode !== "email_only" && ` · $${price?.toLocaleString()}`}</div>
          {[["Full Name","name","text"],["Email Address","email","email"],["Phone Number","phone","tel"]].map(([label,key,t]) => (
            <div key={key} style={{ marginBottom:12 }}>
              <label style={{ display:"block", fontSize:10, color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.12em", marginBottom:4 }}>{label.toUpperCase()}</label>
              <input type={t} value={form[key]} onChange={e => set(key,e.target.value)} style={{ width:"100%", background:"var(--bg)", border:"1px solid var(--border-mid)", color:"var(--text)", padding:"8px 12px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
            </div>
          ))}
          {paymentMode !== "email_only" && (
            <div style={{ padding:"12px 14px", background:"var(--bg)", border:"1px solid var(--border)", borderRadius:2, marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:12, color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif" }}>{type==="deposit"?"DEPOSIT":"TOTAL"} DUE NOW</span>
                <span style={{ fontSize:16, color:GOLD, fontFamily:"'Oswald',sans-serif", fontWeight:700 }}>${(type==="deposit"?product.deposit:price)?.toLocaleString()}</span>
              </div>
              {type==="deposit" && <div style={{ fontSize:10, color:"var(--text-dim)", marginTop:4, fontStyle:"italic" }}>Balance of ${(price-product.deposit)?.toLocaleString()} due in-store</div>}
            </div>
          )}
          {conflictError && <div style={{ padding:"10px 14px", background:"#1a0000", border:"1px solid var(--red-bright)", borderRadius:2, color:"var(--red-bright)", fontSize:12, fontStyle:"italic", marginBottom:12 }}>{conflictError}</div>}
          <button onClick={submit} disabled={!valid||submitting||!!conflictError} style={{ width:"100%", background:valid&&!submitting?GOLD:"#9e9e9e", color:valid&&!submitting?"#000":"#666", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:15, letterSpacing:"0.1em", padding:"12px 0", border:"none", borderRadius:2, cursor:valid&&!submitting?"pointer":"not-allowed" }}>
            {submitting?"SAVING...":(paymentMode==="email_only"?"CONFIRM RESERVATION →":"PROCEED TO PAYMENT →")}
          </button>
        </> : (
          <div style={{ textAlign:"center", padding:"1rem 0" }}>
            <div style={{ fontSize:42, color:"#4caf50", marginBottom:12 }}>✓</div>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:20, color:"#4caf50", letterSpacing:"0.1em", marginBottom:10 }}>YOU'RE ALL SET</div>
            <div style={{ color:"var(--text-dim)", fontSize:13, lineHeight:1.7 }}>
              Confirmation sent to <strong style={{ color:"var(--text)" }}>{form.email}</strong>. Come in within 48 hours with valid ID.
              {(product.sku || product.serialNumber) && (
                <div style={{ marginTop:14, padding:"10px 14px", background:"var(--bg)", border:"1px solid var(--border-mid)", borderRadius:2, textAlign:"left" }}>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, color:"var(--text-dim)", letterSpacing:"0.15em", marginBottom:6 }}>YOUR ITEM REFERENCE</div>
                  {product.sku && <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ color:"var(--text-dim)", fontSize:12 }}>SKU</span><span style={{ color:"var(--text)", fontSize:12, fontFamily:"'Courier New',monospace" }}>{product.sku}</span></div>}
                  {product.serialNumber && <div style={{ display:"flex", justifyContent:"space-between" }}><span style={{ color:"var(--text-dim)", fontSize:12 }}>Serial</span><span style={{ color:GOLD, fontSize:12, fontFamily:"'Courier New',monospace" }}>{maskSerial(product.serialNumber)}</span></div>}
                </div>
              )}
              <br/><em>Questions? Call (570) 713-7339</em>
            </div>
            <button onClick={onClose} style={{ marginTop:20, background:"transparent", border:`1px solid ${GOLD}`, color:GOLD, fontFamily:"'Oswald',sans-serif", fontSize:13, padding:"9px 28px", borderRadius:2, cursor:"pointer", letterSpacing:"0.08em" }}>CLOSE</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ItemPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [visibleFields, setVisibleFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [held, setHeld] = useState(false);
  const [paymentMode, setPaymentMode] = useState("email_only");

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${id}`).then(r => r.json()),
      fetch('/api/display-settings').then(r => r.json()),
    ]).then(([prod, disp]) => {
      setProduct(prod);
      setVisibleFields(Array.isArray(disp.visibleFields) ? disp.visibleFields : []);
      setLoading(false);
      // Check availability
      fetch(`/api/availability?ids=${id}`)
        .then(r => r.json())
        .then(a => setHeld((a.heldProductIds || []).includes(Number(id))));
      // Check payment mode
      fetch('/api/settings').then(r => r.json()).then(s => {
        if (s.payment_mode) setPaymentMode(s.payment_mode);
      });
    });
  }, [id]);

  const FIELD_LABELS = {
    manufacturer:'Manufacturer', model:'Model', caliber:'Caliber',
    atfType:'Type', cartridge:'Cartridge', action:'Action',
    barrelLength:'Barrel Length', overallLength:'Overall Length',
    magazineCapacity:'Capacity', magazineType:'Magazine Type',
    condition:'Condition', upc:'UPC', partNumber:'Part Number',
    msrp:'MSRP', quantityOnHand:'In Stock',
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ fontFamily:"'Oswald',sans-serif", color:"var(--text-dim)", fontSize:13, letterSpacing:"0.2em" }}>LOADING...</div>
    </div>
  );

  if (!product || product.error) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
      <div style={{ fontFamily:"'Oswald',sans-serif", color:"var(--text-dim)", fontSize:13, letterSpacing:"0.2em" }}>PRODUCT NOT FOUND</div>
      <a href="/" style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:GOLD, letterSpacing:"0.1em", textDecoration:"none" }}>← BACK TO CATALOG</a>
    </div>
  );

  const displayPrice = product.salePrice ?? product.price;

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", color:"var(--text)" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0;}`}</style>

      {/* Header */}
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

      <main style={{ maxWidth:1000, margin:"0 auto", padding:"3rem 2rem 5rem" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:48, alignItems:"start" }}>

          {/* Image */}
          <div style={{ aspectRatio:"4/3", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:3, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
            {product.imageUrl
              ? <img src={product.imageUrl} alt={product.name} style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
              : <svg width="100" height="62" viewBox="0 0 100 62" fill="none">
                  <rect x="2" y="24" width="66" height="14" rx="2" fill="#2a2a2a" stroke="#9e9e9e" strokeWidth="1.5"/>
                  <rect x="20" y="14" width="46" height="10" rx="1" fill="#222" stroke="#9e9e9e" strokeWidth="1.5"/>
                  <rect x="12" y="36" width="14" height="18" rx="1" fill="#222" stroke="#9e9e9e" strokeWidth="1.5"/>
                  <circle cx="72" cy="31" r="12" fill="none" stroke="#9e9e9e" strokeWidth="2"/>
                  <circle cx="72" cy="31" r="4" fill="#2a2a2a"/>
                </svg>}
          </div>

          {/* Details */}
          <div>
            <div style={{ fontSize:10, color:"var(--text-dim)", letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:6, fontFamily:"'Oswald',sans-serif" }}>{product.category}</div>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:32, fontWeight:700, color:"var(--text)", lineHeight:1.1, marginBottom:12 }}>{product.name}</div>
            <div style={{ fontFamily:"Georgia,serif", fontStyle:"italic", color:"var(--text-dim)", fontSize:15, lineHeight:1.7, marginBottom:20 }}>{product.description}</div>

            {/* Dynamic fields from display settings */}
            {visibleFields.length > 0 && (
              <div style={{ marginBottom:24 }}>
                <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, color:"var(--text-dim)", letterSpacing:"0.16em", marginBottom:10 }}>SPECIFICATIONS</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 16px" }}>
                  {visibleFields.filter(f => product[f] !== null && product[f] !== undefined && product[f] !== '').map(f => (
                    <div key={f} style={{ padding:"6px 0", borderBottom:"1px solid var(--border)" }}>
                      <div style={{ fontSize:9, color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.12em" }}>{FIELD_LABELS[f]?.toUpperCase() || f.toUpperCase()}</div>
                      <div style={{ fontSize:13, color:"var(--text)", marginTop:2 }}>
                        {f === 'msrp' ? `$${product[f]?.toLocaleString()}` : f === 'quantityOnHand' ? `${product[f]} in stock` : product[f]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Legacy specs field fallback */}
            {visibleFields.length === 0 && product.specs && (
              <div style={{ marginBottom:24 }}>
                <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, color:"var(--text-dim)", letterSpacing:"0.16em", marginBottom:10 }}>SPECIFICATIONS</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 16px" }}>
                  {product.specs.split(" | ").map((s,i) => {
                    const [key, val] = s.split(": ");
                    return (
                      <div key={i} style={{ padding:"6px 0", borderBottom:"1px solid var(--border)" }}>
                        <div style={{ fontSize:9, color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.12em" }}>{key?.toUpperCase()}</div>
                        <div style={{ fontSize:13, color:"var(--text)", marginTop:2 }}>{val || key}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price */}
            <div style={{ display:"flex", alignItems:"baseline", gap:12, marginBottom:6 }}>
              <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:36, color:GOLD, fontWeight:700 }}>${displayPrice?.toLocaleString()}</span>
              {product.salePrice && <span style={{ fontSize:18, color:"var(--text-dim)", textDecoration:"line-through" }}>${product.price?.toLocaleString()}</span>}
            </div>
            {product.salePrice && <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:"#4caf50", letterSpacing:"0.1em", marginBottom:20 }}>ON SALE — SAVE ${(product.price-product.salePrice)?.toLocaleString()}</div>}

            {/* SKU visible, serial masked */}
            {(product.sku || product.serialNumber) && (
              <div style={{ fontSize:11, color:"var(--text-dim)", fontFamily:"'Courier New',monospace", marginBottom:20, lineHeight:1.8 }}>
                {product.sku && <div>SKU: {product.sku}</div>}
                {product.serialNumber && <div>Serial: {maskSerial(product.serialNumber)}</div>}
              </div>
            )}

            {product.deposit > 0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {held && (
                  <div style={{ padding:"12px 16px", background:"#1a1a00", border:`1px solid ${GOLD}44`, borderRadius:2, fontFamily:"'Oswald',sans-serif", fontSize:12, color:GOLD, letterSpacing:"0.1em", textAlign:"center" }}>
                    THIS ITEM IS CURRENTLY RESERVED
                  </div>
                )}
                {paymentMode === "email_only" ? (
                  <button onClick={() => !held && setModal({ type:"deposit", price:displayPrice })}
                    disabled={held}
                    style={{ background: held ? "#1a1a1a" : GOLD, color: held ? "var(--text-dim)" : "#000", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:15, letterSpacing:"0.1em", padding:"14px 0", border:"none", borderRadius:2, cursor: held ? "not-allowed" : "pointer" }}>
                    {held ? "CURRENTLY RESERVED" : "RESERVE THIS ITEM"}
                  </button>
                ) : (
                  <>
                    <button onClick={() => !held && setModal({ type:"deposit", price:displayPrice })}
                      disabled={held}
                      style={{ background: held ? "#1a1a1a" : GOLD, color: held ? "var(--text-dim)" : "#000", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:15, letterSpacing:"0.1em", padding:"14px 0", border:"none", borderRadius:2, cursor: held ? "not-allowed" : "pointer" }}>
                      {held ? "CURRENTLY RESERVED" : `RESERVE IT · $${product.deposit} DEPOSIT`}
                    </button>
                    <button onClick={() => !held && setModal({ type:"full", price:displayPrice })}
                      disabled={held}
                      style={{ background:"transparent", color: held ? "var(--text-dim)" : "var(--text)", fontFamily:"'Oswald',sans-serif", fontSize:13, letterSpacing:"0.08em", padding:"12px 0", border:"1px solid #333", borderRadius:2, cursor: held ? "not-allowed" : "pointer" }}>
                      PAY IN FULL · ${displayPrice?.toLocaleString()}
                    </button>
                  </>
                )}
                <div style={{ fontSize:10, color:"var(--text-dim)", textAlign:"center", fontStyle:"italic" }}>
                  {paymentMode === "email_only" ? "Come in or call to complete payment. Valid ID required." : "FFL paperwork completed in-store. Valid ID required."}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer style={{ background:"var(--bg-header)", borderTop:"1px solid var(--border-mid)", padding:"1.25rem 2rem", textAlign:"center" }}>
        <div style={{ fontSize:12, color:"var(--text-muted)", fontStyle:"italic" }}>
          Gristmill Guns & Optics · 1549 State Route 487, Orangeville PA 17859 · <a href="tel:5707137339" style={{ color:"var(--text-muted)", textDecoration:"none" }}>(570) 713-7339</a>
        </div>
      </footer>

      {modal && <Modal product={product} price={modal.price} type={modal.type} paymentMode={paymentMode} onClose={() => setModal(null)}/>}
    </div>
  );
}
