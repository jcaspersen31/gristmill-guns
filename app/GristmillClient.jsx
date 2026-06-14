"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useRef, useCallback } from "react";

const GOLD = "#c9a84c";
const GOLD2 = "#e8c84a";
const ADMIN_PASS = "gristmill2024";
const maskSerial = (s) => s && s.length > 4 ? `···${s.slice(-4)}` : s ? `···${s}` : null;

// ── seeded daily shuffle ──────────────────────────────────────────────────
// Deterministic for a given day so every visitor gets the same gun
function getDayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
const SPIN_KEY = () => `gm_spun_${getDayKey()}`;
const TIMER_KEY = () => `gm_timer_${getDayKey()}`;
function getStoredSpin() {
  try { return localStorage.getItem(SPIN_KEY()) === "1"; } catch { return false; }
}
function saveSpinResult(endTime) {
  try { localStorage.setItem(SPIN_KEY(), "1"); localStorage.setItem(TIMER_KEY(), String(endTime)); } catch {}
}
function getStoredEndTime() {
  try { const v = localStorage.getItem(TIMER_KEY()); return v ? Number(v) : null; } catch { return null; }
}
function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(31, h) + seed.charCodeAt(i) | 0; }
  return () => { h ^= h >>> 13; h ^= h << 17; h ^= h >>> 5; return (h >>> 0) / 4294967296; };
}
function getTodaysDeal(dealList) {
  if (!dealList.length) return null;
  // Use cycle key stored in localStorage — resets when all items shown
  let cycleKey = "gm_cycle";
  let usedKey = "gm_used";
  let dayKey = "gm_day";
  try {
    const storedDay = localStorage.getItem(dayKey);
    const today = getDayKey();
    if (storedDay === today) {
      const id = localStorage.getItem(cycleKey);
      return dealList.find(d => String(d.id) === id) || dealList[0];
    }
    // New day — pick next unseen item
    let used = JSON.parse(localStorage.getItem(usedKey) || "[]");
    let remaining = dealList.filter(d => !used.includes(d.id));
    if (!remaining.length) { used = []; remaining = [...dealList]; }
    const rng = seededRandom(today);
    const pick = remaining[Math.floor(rng() * remaining.length)];
    used.push(pick.id);
    localStorage.setItem(usedKey, JSON.stringify(used));
    localStorage.setItem(cycleKey, String(pick.id));
    localStorage.setItem(dayKey, today);
    return pick;
  } catch { return dealList[0]; }
}

// mock data removed — now loaded from API

const CATS = ["All","Rifles","Shotguns","Handguns","Optics","Ammunition","Accessories"];

// ── helpers ───────────────────────────────────────────────────────────────
const LOGO_URL = "https://res.cloudinary.com/dq2d56it9/image/upload/v1781047650/Gristmill_Logo_dqmsgw.png";

function Logo({ size = 48 }) {
  return <img src={LOGO_URL} alt="Gristmill Guns & Optics" width={size} height={size} style={{ objectFit:"contain" }}/>;
}

function useCountdown(endTime) {
  const [rem, setRem] = useState(0);
  useEffect(() => {
    if (!endTime) return;
    const tick = () => setRem(Math.max(0, endTime - Date.now()));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [endTime]);
  return { rem, mins: Math.floor(rem / 60000), secs: Math.floor((rem % 60000) / 1000), expired: rem === 0 };
}

// ── spinner wheel — visual only, always lands on today's deal ─────────────
function SpinnerWheel({ onResult, todaysDeal }) {
  const canvasRef = useRef(null);
  const angleRef = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const [done, setDone] = useState(false);

  // 12 decorative slices — alternating gold tones, no text
  const SLICES = 12;
  const COLORS = [
    "#1a0e00","#0f0800","#1a1200","#120900",
    "#150b00","#1c1000","#0d0700","#181100",
    "#200f00","#110800","#1a0e00","#0e0700",
  ];
  const ACCENTS = [
    "#8b6914","#c9a84c","#6b5010","#e8c84a",
    "#a07820","#c9a84c","#7a5c18","#e0b840",
    "#9a7220","#b89030","#7a5c18","#d4a030",
  ];

  const drawWheel = useCallback((angle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = 260, cy = 260, r = 240;
    const arc = (Math.PI * 2) / SLICES;
    ctx.clearRect(0, 0, 520, 520);

    // outer glow ring
    ctx.save();
    ctx.shadowColor = GOLD;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // slices
    COLORS.forEach((col, i) => {
      const start = angle + i * arc;
      const end = start + arc;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
      ctx.strokeStyle = ACCENTS[i];
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // decorative line toward edge
      const mid = start + arc / 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(mid) * 60, cy + Math.sin(mid) * 60);
      ctx.lineTo(cx + Math.cos(mid) * (r - 20), cy + Math.sin(mid) * (r - 20));
      ctx.strokeStyle = ACCENTS[i];
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // crosshair diamond near rim
      const dx = cx + Math.cos(mid) * (r - 24);
      const dy = cy + Math.sin(mid) * (r - 24);
      const ds = 6;
      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(mid);
      ctx.beginPath();
      ctx.moveTo(0, -ds); ctx.lineTo(ds, 0); ctx.lineTo(0, ds); ctx.lineTo(-ds, 0);
      ctx.closePath();
      ctx.fillStyle = ACCENTS[i];
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    });

    // tick marks
    for (let i = 0; i < SLICES * 4; i++) {
      const t = angle + (i / (SLICES * 4)) * Math.PI * 2;
      const len = i % 4 === 0 ? 10 : 5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(t) * (r - len), cy + Math.sin(t) * (r - len));
      ctx.lineTo(cx + Math.cos(t) * (r + 2), cy + Math.sin(t) * (r + 2));
      ctx.strokeStyle = i % 4 === 0 ? GOLD : "rgba(201,168,76,0.3)";
      ctx.lineWidth = i % 4 === 0 ? 1.5 : 0.8;
      ctx.stroke();
    }

    // hub
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, Math.PI * 2);
    ctx.fillStyle = "#0a0a0a";
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.stroke();

    // crosshair in hub
    [[-20,0,20,0],[0,-20,0,20]].forEach(([x1,y1,x2,y2]) => {
      ctx.beginPath(); ctx.moveTo(cx+x1, cy+y1); ctx.lineTo(cx+x2, cy+y2);
      ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5; ctx.stroke();
    });
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI*2);
    ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI*2);
    ctx.fillStyle = GOLD; ctx.fill();
  }, []);

  useEffect(() => { drawWheel(0); }, [drawWheel]);

  const spin = () => {
    if (spinning || done || !todaysDeal) return;
    setSpinning(true);

    // Always land on slice 0 (top) — the wheel is pure theater
    const spins = 6 + Math.random() * 3;
    const targetAngle = spins * Math.PI * 2;
    const duration = 5200;
    const startTime = performance.now();
    const startAngle = angleRef.current;

    const easeOut = t => 1 - Math.pow(1 - t, 4);

    function frame(now) {
      const t = Math.min((now - startTime) / duration, 1);
      angleRef.current = startAngle + targetAngle * easeOut(t);
      drawWheel(angleRef.current);
      if (t < 1) requestAnimationFrame(frame);
      else { setSpinning(false); setDone(true); onResult(); }
    }
    requestAnimationFrame(frame);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
      <div style={{ width:0, height:0, borderLeft:"18px solid transparent", borderRight:"18px solid transparent", borderTop:`36px solid ${GOLD}`, filter:`drop-shadow(0 0 8px rgba(201,168,76,0.8))`, marginBottom:-6, zIndex:10 }}/>
      <canvas ref={canvasRef} width={520} height={520} style={{ display:"block", maxWidth:"min(520px, 90vw)", borderRadius:"50%", border:`4px solid #111` }}/>
      {!done && (
        <button onClick={spin} disabled={spinning || !todaysDeal}
          style={{ marginTop:28, background: spinning ? "#111" : `linear-gradient(180deg, ${GOLD2} 0%, ${GOLD} 100%)`, color: spinning ? "#9e9e9e" : "#000", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:20, letterSpacing:"0.14em", padding:"16px 64px", border:`2px solid ${GOLD}`, borderRadius:3, cursor: spinning||!todaysDeal ? "not-allowed":"pointer", boxShadow: spinning ? "none" : `0 0 28px rgba(201,168,76,0.35)`, transition:"all 0.2s" }}>
          {spinning ? "SPINNING..." : todaysDeal ? "SPIN FOR TODAY'S DEAL" : "NO DEAL TODAY"}
        </button>
      )}
    </div>
  );
}

// ── deal result ───────────────────────────────────────────────────────────
function DealResult({ product, pct, claimed: alreadyClaimed, onReserve, onPayFull }) {
  const [endTime] = useState(() => getStoredEndTime() || Date.now() + 10 * 60 * 1000);
  const { rem, mins, secs, expired } = useCountdown(endTime);
  const [claimed, setClaimed] = useState(false);
  const salePrice = Math.round(product.price * (1 - pct / 100));
  const savings = product.price - salePrice;

  return (
    <div style={{ maxWidth:700, margin:"0 auto", animation:"fadeUp 0.5s ease" }}>
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:"var(--text-dim)", letterSpacing:"0.2em", marginBottom:6 }}>TODAY'S DEAL</div>
        <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:58, fontWeight:700, color:GOLD, letterSpacing:"0.04em", lineHeight:1, textShadow:`0 0 40px rgba(201,168,76,0.5)` }}>{pct}% OFF</div>
        <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:20, color:"var(--text)", letterSpacing:"0.1em", marginTop:4 }}>{product.name}</div>
      </div>

      {!claimed && !expired && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:16, marginBottom:24, padding:"14px", background:"var(--bg)", border:`1px solid ${rem < 60000 ? "#c0392b" : "#2a2a2a"}`, borderRadius:3, transition:"border-color 0.5s" }}>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:"var(--text-dim)", letterSpacing:"0.2em" }}>OFFER EXPIRES IN</div>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:48, fontWeight:700, color: rem < 60000 ? "#c0392b" : GOLD, letterSpacing:"0.06em", lineHeight:1, minWidth:130, textAlign:"center", transition:"color 0.5s" }}>
            {String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}
          </div>
        </div>
      )}
      {expired && !claimed && <div style={{ textAlign:"center", padding:"14px", marginBottom:20, background:"#1a0000", border:"1px solid #c0392b", borderRadius:3, fontFamily:"'Oswald',sans-serif", fontSize:13, color:"#c0392b", letterSpacing:"0.12em" }}>OFFER EXPIRED — CHECK BACK TOMORROW</div>}
      {alreadyClaimed && !claimed && <div style={{ textAlign:"center", padding:"14px", marginBottom:20, background:"#1a1a00", border:`1px solid ${GOLD}44`, borderRadius:3, fontFamily:"'Oswald',sans-serif", fontSize:13, color:GOLD, letterSpacing:"0.12em" }}>TODAY'S DEAL HAS BEEN CLAIMED — CHECK BACK TOMORROW</div>}
      {claimed && <div style={{ textAlign:"center", padding:"18px", marginBottom:20, background:"#0d1a0d", border:"1px solid #2a5a2a", borderRadius:3 }}>
        <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:18, color:"#4caf50", letterSpacing:"0.1em" }}>✓ RESERVATION RECEIVED</div>
        <div style={{ color:"var(--text-dim)", fontSize:13, marginTop:5, fontStyle:"italic" }}>Come in within 48 hours to complete your purchase and paperwork.</div>
      </div>}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:3, padding:24 }}>
        <div style={{ aspectRatio:"4/3", background:"#161616", border:"1px solid var(--border)", borderRadius:3, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
          {product.img ? <img src={product.img} alt={product.name} style={{ width:"100%", height:"100%", objectFit:"contain" }}/> :
            <svg width="80" height="50" viewBox="0 0 80 50" fill="none">
              <rect x="2" y="20" width="52" height="10" rx="2" fill="#2a2a2a" stroke="#9e9e9e" strokeWidth="1"/>
              <rect x="16" y="12" width="36" height="8" rx="1" fill="#222" stroke="#9e9e9e" strokeWidth="1"/>
              <rect x="10" y="28" width="10" height="14" rx="1" fill="#222" stroke="#9e9e9e" strokeWidth="1"/>
              <circle cx="56" cy="25" r="8" fill="none" stroke="#9e9e9e" strokeWidth="1.5"/>
            </svg>}
        </div>
        <div>
          <div style={{ fontSize:9, color:"var(--text-dim)", letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:5, fontFamily:"'Oswald',sans-serif" }}>{product.cat}</div>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:22, color:"var(--text)", fontWeight:700, lineHeight:1.2, marginBottom:8 }}>{product.name}</div>
          <div style={{ fontStyle:"italic", color:"var(--text-dim)", fontSize:13, lineHeight:1.6, marginBottom:10 }}>{product.desc}</div>
          {product.specs && <div style={{ fontSize:10, color:"var(--text-dim)", fontFamily:"'Courier New',monospace", lineHeight:1.8, marginBottom:14 }}>
            {product.specs.split(" | ").map((s,i) => <div key={i}>· {s}</div>)}
          </div>}
          <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:4 }}>
            <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:32, color:GOLD, fontWeight:700 }}>${salePrice.toLocaleString()}</span>
            <span style={{ fontSize:15, color:"var(--text-dim)", textDecoration:"line-through" }}>${product.price.toLocaleString()}</span>
          </div>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:"#4caf50", letterSpacing:"0.1em", marginBottom:16 }}>TODAY ONLY — SAVE ${savings.toLocaleString()}</div>
          {!claimed && !expired && !alreadyClaimed && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <button onClick={() => onReserve(product, salePrice)}
                style={{ width:"100%", background:GOLD, color:"#000", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:14, letterSpacing:"0.1em", padding:"12px 0", border:"none", borderRadius:2, cursor:"pointer" }}>
                RESERVE IT · ${product.deposit} DEPOSIT
              </button>
              <button onClick={() => onPayFull(product, salePrice)}
                style={{ width:"100%", background:"transparent", color:"var(--text)", fontFamily:"'Oswald',sans-serif", fontSize:13, letterSpacing:"0.08em", padding:"10px 0", border:"1px solid #333", borderRadius:2, cursor:"pointer" }}>
                PAY IN FULL · ${salePrice.toLocaleString()}
              </button>
              <div style={{ fontSize:10, color:"var(--text-dim)", textAlign:"center", fontStyle:"italic" }}>FFL paperwork completed in-store. Valid ID required.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── reservation modal ─────────────────────────────────────────────────────
function Modal({ product, price, type, dealId, onClose, onSuccess }) {
  const [form, setForm] = useState({ name:"", email:"", phone:"" });
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState("");
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));
  const valid = form.name && form.email && form.phone;

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      // Save reservation first
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId:     product.id,
          dealId:        dealId || null,
          customerName:  form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          amountPaid:    type === 'deposit' ? product.deposit : price,
          type,
        }),
      });
      const reservation = await res.json();
      if (res.status === 409) {
        setConflictError(reservation.error || "This item is no longer available.");
        return;
      }
      // Notify parent of successful reservation
      if (onSuccess) onSuccess();

      // Fetch payment settings then redirect to FirstPay
      const setts = await fetch('/api/settings').then(r => r.json());
      const checkoutUrl = setts?.firstpay_checkout_url;

      if (checkoutUrl) {
        const amount = type === 'deposit' ? product.deposit : price;
        const params = new URLSearchParams({
          amount: amount.toFixed(2),
          order_id: String(reservation.id),
          description: `${type === 'deposit' ? 'Deposit' : 'Payment'} - ${product.name}`,
          email: form.email,
          name: form.name,
        });
        window.location.href = `${checkoutUrl}?${params.toString()}`;
      } else {
        // No checkout URL configured yet — just show confirmation
        setDone(true);
      }
    } catch (e) {
      console.error(e);
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, padding:16 }}>
      <div style={{ background:"var(--bg-card)", border:`1px solid ${GOLD}`, borderRadius:3, padding:"2rem", width:"100%", maxWidth:400, position:"relative" }}>
        <button onClick={onClose} style={{ position:"absolute", top:10, right:14, background:"none", border:"none", color:"var(--text-dim)", fontSize:22, cursor:"pointer" }}>×</button>
        {!done ? <>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:18, color:GOLD, letterSpacing:"0.1em", marginBottom:3 }}>{type==="deposit" ? "RESERVE THIS ITEM" : "PAY IN FULL"}</div>
          <div style={{ fontStyle:"italic", color:"var(--text-dim)", fontSize:12, marginBottom:18 }}>{product.name} · ${price.toLocaleString()}</div>
          {[["Full Name","name","text"],["Email Address","email","email"],["Phone Number","phone","tel"]].map(([label,key,t]) => (
            <div key={key} style={{ marginBottom:12 }}>
              <label style={{ display:"block", fontSize:10, color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.12em", marginBottom:4 }}>{label.toUpperCase()}</label>
              <input type={t} value={form[key]} onChange={e => set(key, e.target.value)} style={{ width:"100%", background:"var(--bg)", border:"1px solid var(--border-mid)", color:"var(--text)", padding:"8px 12px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
            </div>
          ))}
          <div style={{ padding:"12px 14px", background:"var(--bg)", border:"1px solid var(--border)", borderRadius:2, marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:12, color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif" }}>{type==="deposit" ? "DEPOSIT" : "TOTAL"} DUE NOW</span>
              <span style={{ fontSize:16, color:GOLD, fontFamily:"'Oswald',sans-serif", fontWeight:700 }}>${(type==="deposit" ? product.deposit : price).toLocaleString()}</span>
            </div>
            {type==="deposit" && <div style={{ fontSize:10, color:"var(--text-dim)", marginTop:4, fontStyle:"italic" }}>Balance of ${(price - product.deposit).toLocaleString()} due in-store</div>}
          </div>
          {conflictError && <div style={{ padding:"10px 14px", background:"#1a0000", border:"1px solid var(--red-bright)", borderRadius:2, color:"var(--red-bright)", fontSize:12, fontStyle:"italic", marginBottom:12 }}>{conflictError}</div>}
          <button onClick={submit} disabled={!valid || submitting || !!conflictError} style={{ width:"100%", background: valid && !submitting ? GOLD : "#9e9e9e", color: valid && !submitting ? "#000" : "#666", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:15, letterSpacing:"0.1em", padding:"12px 0", border:"none", borderRadius:2, cursor: valid && !submitting ? "pointer":"not-allowed" }}>
            {submitting ? "SAVING..." : "PROCEED TO PAYMENT →"}
          </button>
        </> : (
          <div style={{ textAlign:"center", padding:"1rem 0" }}>
            <div style={{ fontSize:42, color:"#4caf50", marginBottom:12 }}>✓</div>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:20, color:"#4caf50", letterSpacing:"0.1em", marginBottom:10 }}>YOU'RE ALL SET</div>
            <div style={{ color:"var(--text-dim)", fontSize:13, lineHeight:1.7 }}>
              Confirmation sent to <strong style={{ color:"var(--text)" }}>{form.email}</strong>. Come in within 48 hours with valid ID.
              {(product.sku || product.serial) && (
                <div style={{ marginTop:14, padding:"10px 14px", background:"var(--bg)", border:"1px solid var(--border-mid)", borderRadius:2, textAlign:"left" }}>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, color:"var(--text-dim)", letterSpacing:"0.15em", marginBottom:6 }}>YOUR ITEM REFERENCE</div>
                  {product.sku && <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ color:"var(--text-dim)", fontSize:12 }}>SKU</span>
                    <span style={{ color:"var(--text)", fontSize:12, fontFamily:"'Courier New',monospace" }}>{product.sku}</span>
                  </div>}
                  {product.serial && <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ color:"var(--text-dim)", fontSize:12 }}>Serial</span>
                    <span style={{ color:GOLD, fontSize:12, fontFamily:"'Courier New',monospace" }}>{maskSerial(product.serial)}</span>
                  </div>}
                </div>
              )}
              <br/><em>Questions? Call (570) 713-7339 or email grant@gristmillguns.com</em>
            </div>
            <button onClick={onClose} style={{ marginTop:20, background:"transparent", border:`1px solid ${GOLD}`, color:GOLD, fontFamily:"'Oswald',sans-serif", fontSize:13, padding:"9px 28px", borderRadius:2, cursor:"pointer", letterSpacing:"0.08em" }}>CLOSE</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── product card ──────────────────────────────────────────────────────────
function ProductCard({ p, held }) {
  const [hov, setHov] = useState(false);
  const dp = p.salePrice ?? p.sale ?? p.price;
  return (
    <a href={`/item/${p.id}`} style={{ textDecoration:"none" }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ background:"var(--bg-card)", border:`1px solid ${hov ? GOLD : "#1e1e1e"}`, borderRadius:3, overflow:"hidden", transition:"transform 0.18s,border-color 0.18s", transform: hov ? "translateY(-3px)":"none" }}>
        <div style={{ aspectRatio:"4/3", background:"#161616", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", borderBottom:"1px solid var(--border)", overflow:"hidden" }}>
          {(p.img||p.imageUrl) ? <img src={p.img||p.imageUrl} alt={p.name} loading="lazy" style={{ width:"100%", height:"100%", objectFit:"contain" }}/> :
            <svg width="64" height="40" viewBox="0 0 64 40" fill="none">
              <rect x="2" y="16" width="42" height="8" rx="2" fill="#2a2a2a" stroke="#9e9e9e" strokeWidth="1"/>
              <rect x="12" y="10" width="30" height="6" rx="1" fill="#222" stroke="#9e9e9e" strokeWidth="1"/>
              <rect x="8" y="22" width="8" height="12" rx="1" fill="#222" stroke="#9e9e9e" strokeWidth="1"/>
              <circle cx="46" cy="20" r="7" fill="none" stroke="#9e9e9e" strokeWidth="1.5"/>
            </svg>}
          {(p.sale||p.salePrice) && <span style={{ position:"absolute", top:7, right:7, background:"#7a1515", color:"#fff", fontSize:10, padding:"2px 7px", borderRadius:1, fontFamily:"'Oswald',sans-serif" }}>SALE</span>}
          {held && <span style={{ position:"absolute", top:7, left:7, background:"#1a3a5a", color:"#7ab8e8", fontSize:10, padding:"2px 7px", borderRadius:1, fontFamily:"'Oswald',sans-serif" }}>ON HOLD</span>}
        </div>
        <div style={{ padding:"11px 13px 13px" }}>
          <div style={{ fontSize:9, color:"var(--text-dim)", letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:3, fontFamily:"'Oswald',sans-serif" }}>{p.cat||p.category}</div>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:14, color:"var(--text)", fontWeight:600, lineHeight:1.2, marginBottom:4 }}>{p.name}</div>
          <div style={{ fontSize:11, color:"var(--text-dim)", lineHeight:1.5, marginBottom:6, fontStyle:"italic" }}>{p.desc||p.description}</div>
          <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:8 }}>
            <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:18, color:GOLD, fontWeight:700 }}>${dp?.toLocaleString()}</span>
            {(p.sale||p.salePrice) && <span style={{ fontSize:11, color:"var(--text-dim)", textDecoration:"line-through" }}>${p.price?.toLocaleString()}</span>}
          </div>
          <div style={{ width:"100%", background: held ? "transparent":"transparent", border:`1px solid ${held ? "#1a3a5a" : GOLD}`, color: held ? "#7ab8e8":GOLD, fontFamily:"'Oswald',sans-serif", fontSize:11, padding:"6px 0", borderRadius:2, textAlign:"center", letterSpacing:"0.08em" }}>
            {held ? "VIEW DETAILS (ON HOLD)" : "VIEW DETAILS →"}
          </div>
        </div>
      </div>
    </a>
  );
}

// ── reservations list ────────────────────────────────────────────────────
function ReservationsList({ reservations, onUpdate }) {
  const [filter, setFilter] = useState("all");
  const statuses = ["all","pending","confirmed","completed","cancelled"];
  const shown = filter === "all" ? reservations : reservations.filter(r => r.status === filter);
  const statusColors = { pending:"#c9a84c", confirmed:"#4caf50", completed:"#2196f3", cancelled:"#c0392b" };

  return (
    <div>
      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        {statuses.map(s => {
          const count = s === "all" ? reservations.length : reservations.filter(r => r.status === s).length;
          return (
            <button key={s} onClick={() => setFilter(s)} style={{ background: filter===s ? `${GOLD}18`:"transparent", border:`1px solid ${filter===s ? GOLD:"#2a2a2a"}`, color: filter===s ? GOLD:"#a0a0a0", fontFamily:"'Oswald',sans-serif", fontSize:10, padding:"5px 12px", borderRadius:2, cursor:"pointer", letterSpacing:"0.1em" }}>
              {s.toUpperCase()} ({count})
            </button>
          );
        })}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {shown.map(r => {
          const expires = r.expiresAt ? new Date(r.expiresAt) : null;
          const isExpired = expires && expires < new Date();
          return (
            <div key={r.id} style={{ background:"var(--bg-card)", border:`1px solid ${r.status==="pending" ? "rgba(201,168,76,0.2)":"#1a1a1a"}`, borderRadius:3, padding:"14px 16px" }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:12, flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                    <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:14, color:"var(--text)" }}>{r.customerName}</div>
                    <span style={{ fontSize:9, padding:"2px 7px", borderRadius:1, fontFamily:"'Oswald',sans-serif", letterSpacing:"0.1em", background:`${statusColors[r.status]}22`, color:statusColors[r.status], border:`1px solid ${statusColors[r.status]}44` }}>{r.status.toUpperCase()}</span>
                    <span style={{ fontSize:9, padding:"2px 7px", borderRadius:1, fontFamily:"'Oswald',sans-serif", background: r.type==="deposit" ? "rgba(201,168,76,0.1)":"rgba(33,150,243,0.1)", color: r.type==="deposit" ? GOLD:"#2196f3", border:`1px solid ${r.type==="deposit" ? GOLD+"44":"#2196f344"}` }}>{r.type.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize:12, color:GOLD, fontFamily:"'Oswald',sans-serif", marginBottom:4 }}>{r.product?.name || "Unknown product"}</div>
                  <div style={{ fontSize:11, color:"var(--text-dim)", lineHeight:1.7 }}>
                    <a href={`mailto:${r.customerEmail}`} style={{ color:"var(--text-dim)", textDecoration:"none" }}>{r.customerEmail}</a>
                    &nbsp;·&nbsp;
                    <a href={`tel:${r.customerPhone}`} style={{ color:"var(--text-dim)", textDecoration:"none" }}>{r.customerPhone}</a>
                  </div>
                  <div style={{ fontSize:10, color:"var(--text-dim)", marginTop:4, fontFamily:"'Oswald',sans-serif" }}>
                    Paid: <span style={{ color:GOLD }}>${r.amountPaid.toLocaleString()}</span>
                    &nbsp;·&nbsp;
                    {new Date(r.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit' })}
                    {expires && <span style={{ color: isExpired ? "#c0392b":"#a0a0a0", marginLeft:8 }}>{isExpired ? "⚠ EXPIRED" : `Holds until ${expires.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`}</span>}
                  </div>
                  {r.product?.serialNumber && (
                    <div style={{ fontSize:10, color:"var(--text-dim)", marginTop:3, fontFamily:"'Courier New',monospace" }}>S/N: {r.product.serialNumber} &nbsp;·&nbsp; SKU: {r.product.sku}</div>
                  )}
                </div>
                {r.status === "pending" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
                    <button onClick={() => onUpdate(r.id, "confirmed")} style={{ background:"transparent", border:"1px solid #2a5a2a", color:"#4caf50", fontFamily:"'Oswald',sans-serif", fontSize:10, padding:"5px 12px", borderRadius:2, cursor:"pointer", letterSpacing:"0.06em" }}>CONFIRM</button>
                    <button onClick={() => onUpdate(r.id, "completed")} style={{ background:"transparent", border:"1px solid #1a3a5a", color:"#2196f3", fontFamily:"'Oswald',sans-serif", fontSize:10, padding:"5px 12px", borderRadius:2, cursor:"pointer", letterSpacing:"0.06em" }}>COMPLETED</button>
                    <button onClick={() => onUpdate(r.id, "cancelled")} style={{ background:"transparent", border:"1px solid #330000", color:"#c0392b", fontFamily:"'Oswald',sans-serif", fontSize:10, padding:"5px 12px", borderRadius:2, cursor:"pointer", letterSpacing:"0.06em" }}>CANCEL</button>
                  </div>
                )}
                {r.status === "confirmed" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
                    <button onClick={() => onUpdate(r.id, "completed")} style={{ background:"transparent", border:"1px solid #1a3a5a", color:"#2196f3", fontFamily:"'Oswald',sans-serif", fontSize:10, padding:"5px 12px", borderRadius:2, cursor:"pointer", letterSpacing:"0.06em" }}>MARK COMPLETED</button>
                    <button onClick={() => onUpdate(r.id, "cancelled")} style={{ background:"transparent", border:"1px solid #330000", color:"#c0392b", fontFamily:"'Oswald',sans-serif", fontSize:10, padding:"5px 12px", borderRadius:2, cursor:"pointer", letterSpacing:"0.06em" }}>CANCEL</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── admin login ───────────────────────────────────────────────────────────
function AdminLogin({ onLogin, onBack }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [checking, setChecking] = useState(false);

  const submit = async () => {
    if (!pw || checking) return;
    setChecking(true);
    try {
      // Check against stored password — falls back to hardcoded default if not set
      const setts = await fetch('/api/settings').then(r => r.json());
      const storedPw = setts?.admin_password || ADMIN_PASS;
      if (pw === storedPw) {
        onLogin();
      } else {
        setErr(true);
        setTimeout(() => setErr(false), 2000);
      }
    } catch {
      // Fallback to hardcoded if API fails
      if (pw === ADMIN_PASS) onLogin();
      else { setErr(true); setTimeout(() => setErr(false), 2000); }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#080808", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap');`}</style>
      <div style={{ background:"var(--bg-card)", border:`1px solid ${GOLD}`, borderRadius:3, padding:"2.5rem", width:320, textAlign:"center" }}>
        <Logo size={46}/>
        <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:14, color:GOLD, letterSpacing:"0.22em", margin:"1rem 0 1.5rem" }}>ADMIN ACCESS</div>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key==="Enter" && submit()} placeholder="Password"
          style={{ width:"100%", background:"var(--bg)", border:`1px solid ${err ? "#c0392b":"#1e1e1e"}`, color:"var(--text)", padding:"9px 14px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:14, outline:"none", boxSizing:"border-box", marginBottom: err ? 8:14 }}/>
        {err && <div style={{ color:"#c0392b", fontSize:12, fontStyle:"italic", marginBottom:10 }}>Incorrect password</div>}
        <button onClick={submit} disabled={checking} style={{ width:"100%", background:GOLD, color:"#000", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:14, letterSpacing:"0.1em", padding:"11px 0", border:"none", borderRadius:2, cursor:"pointer", opacity: checking ? 0.6:1 }}>{checking ? "CHECKING...":"ENTER"}</button>
        <button onClick={onBack} style={{ marginTop:12, background:"transparent", border:"none", color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", fontSize:11, cursor:"pointer", letterSpacing:"0.1em" }}>← BACK TO SITE</button>
      </div>
    </div>
  );
}

// ── admin panel ───────────────────────────────────────────────────────────
function AdminPanel({ onClose }) {
  const [products, setProducts] = useState([]);
  const [dealsQueue, setDealsQueue] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [settings, setSettings] = useState({ firstpay_merchant_id: '', firstpay_checkout_url: '' });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/deals').then(r => r.json()),
      fetch('/api/reservations').then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([prods, deals, res, setts]) => {
      setSettings(s => ({ ...s, ...setts }));
      setProducts(Array.isArray(prods) ? prods.map(p => ({...p, cat:p.category, sale:p.salePrice, desc:p.description, img:p.imageUrl||"", serial:p.serialNumber||"", sku:p.sku||""})) : []);
      setDealsQueue(Array.isArray(deals) ? deals.map(d => ({...d, productId:d.productId, pct:d.discountPct})) : []);
      setReservations(Array.isArray(res) ? res : []);
      setAdminLoading(false);
    }).catch(() => setAdminLoading(false));
  }, []);

  const saveSettings = async () => {
    const payload = { ...settings };
    // Handle password change
    if (payload.new_password && payload.new_password === payload.confirm_password) {
      payload.admin_password = payload.new_password;
    }
    delete payload.new_password;
    delete payload.confirm_password;
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSettings(s => ({ ...s, new_password: '', confirm_password: '' }));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const updateReservationStatus = async (id, status) => {
    await fetch(`/api/reservations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setReservations(rs => rs.map(r => r.id === id ? { ...r, status } : r));
  };
  const [tab, setTab] = useState("queue"); // queue | products
  const [editingProduct, setEditingProduct] = useState(null);
  const [addingDeal, setAddingDeal] = useState(false);
  const [newDeal, setNewDeal] = useState({ productId:"", pct:"" });
  const BLANK = { id:0, name:"", cat:"Rifles", price:"", sale:"", desc:"", specs:"", img:"", deposit:"100", serial:"", sku:"" };
  const [form, setForm] = useState(BLANK);
  const [imgPreview, setImgPreview] = useState("");
  const fileRef = useRef();
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));

  const openEdit = p => { setEditingProduct(p.id); setForm({ ...p, price:String(p.price), sale: p.sale!=null?String(p.sale):"", deposit:String(p.deposit), serial:p.serial||"", sku:p.sku||"" }); setImgPreview(p.img||""); };
  const openNew = () => { setEditingProduct("new"); setForm({ ...BLANK, id:Date.now() }); setImgPreview(""); };
  const saveProduct = async () => {
    const body = {
      name: form.name, category: form.cat, price: Number(form.price),
      salePrice: form.sale ? Number(form.sale) : null,
      description: form.desc, specs: form.specs, imageUrl: imgPreview||null,
      deposit: Number(form.deposit)||0, serialNumber: form.serial||null, sku: form.sku||null,
    };
    if (editingProduct === "new") {
      const res = await fetch('/api/products', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      const p = await res.json();
      setProducts(ps => [...ps, {...p, cat:p.category, sale:p.salePrice, desc:p.description, img:p.imageUrl||"", serial:p.serialNumber||"", sku:p.sku||""}]);
    } else {
      await fetch(`/api/products/${editingProduct}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      setProducts(ps => ps.map(x => x.id===editingProduct ? {...x,...body,cat:body.category,sale:body.salePrice,desc:body.description,img:body.imageUrl||""} : x));
    }
    setEditingProduct(null);
  };
  const delProduct = async id => {
    await fetch(`/api/products/${id}`, { method:'DELETE' });
    setProducts(ps => ps.filter(p => p.id!==id));
  };
  const handleImg = e => { const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=ev=>{setImgPreview(ev.target.result);set("img",ev.target.result);}; r.readAsDataURL(f); };
  const addToQueue = async () => {
    if (!newDeal.productId || !newDeal.pct) return;
    const res = await fetch('/api/deals', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ productId: Number(newDeal.productId), discountPct: Number(newDeal.pct) }),
    });
    const deal = await res.json();
    setDealsQueue(q => [...q, {...deal, productId:deal.productId, pct:deal.discountPct}]);
    setNewDeal({ productId:"", pct:"" });
    setAddingDeal(false);
  };
  const removeFromQueue = async id => {
    await fetch(`/api/deals/${id}`, { method:'DELETE' });
    setDealsQueue(q => q.filter(d => d.id!==id));
  };
  const moveUp = id => setDealsQueue(q => { const i=q.findIndex(d=>d.id===id); if(i<=0)return q; const n=[...q]; [n[i-1],n[i]]=[n[i],n[i-1]]; return n; });

  const iStyle = { width:"100%", background:"var(--bg)", border:"1px solid #222", color:"var(--text)", padding:"8px 12px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:13, outline:"none", boxSizing:"border-box" };
  const lStyle = { display:"block", fontSize:9, color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.14em", marginBottom:4 };
  const tabBtn = (id, label, count) => (
    <button onClick={() => setTab(id)} style={{ background: tab===id ? `${GOLD}18`:"transparent", border:`1px solid ${tab===id ? GOLD:"#2a2a2a"}`, color: tab===id ? GOLD:"#666", fontFamily:"'Oswald',sans-serif", fontSize:12, padding:"7px 18px", borderRadius:2, cursor:"pointer", letterSpacing:"0.1em", position:"relative" }}>
      {label}
      {count > 0 && <span style={{ marginLeft:6, background:"#c0392b", color:"#fff", fontSize:9, padding:"1px 5px", borderRadius:999, fontWeight:700 }}>{count}</span>}
    </button>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#080808", color:"var(--text)" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap');`}</style>
      <div style={{ background:"var(--bg)", borderBottom:`2px solid ${GOLD}`, padding:"0.85rem 1.5rem", display:"flex", alignItems:"center", gap:14 }}>
        <Logo size={36}/>
        <div>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:16, color:GOLD, letterSpacing:"0.18em" }}>ADMIN PANEL</div>
          <div style={{ fontSize:10, color:"var(--text-dim)", fontStyle:"italic" }}>Gristmill Guns & Optics</div>
        </div>
        <button onClick={onClose} style={{ marginLeft:"auto", background:"transparent", border:"1px solid var(--border-mid)", color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", fontSize:11, padding:"6px 14px", borderRadius:2, cursor:"pointer", letterSpacing:"0.08em" }}>← BACK TO SITE</button>
      </div>

      <div style={{ padding:"1.5rem", maxWidth:980, margin:"0 auto" }}>
        <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
          {tabBtn("queue","DEALS QUEUE")}
          {tabBtn("products","INVENTORY")}
          {tabBtn("reservations","RESERVATIONS", reservations.filter(r => r.status === "pending").length)}
          {tabBtn("settings","SETTINGS")}
        </div>

        {/* ── DEALS QUEUE TAB ── */}
        {tab==="queue" && (
          <div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:16, color:GOLD, letterSpacing:"0.1em", marginBottom:6 }}>DAILY DEALS QUEUE</div>
              <div style={{ fontSize:12, color:"var(--text-dim)", fontStyle:"italic", marginBottom:16 }}>Guns rotate randomly, never repeating until the full list cycles. The discount is set per gun.</div>
            </div>

            {/* today's deal preview */}
            {(() => {
              const td = getTodaysDeal(dealsQueue);
              const prod = td ? products.find(p => p.id === td.productId) : null;
              return prod && (
                <div style={{ padding:"12px 16px", background:"#0d1a0d", border:"1px solid #2a5a2a", borderRadius:3, marginBottom:20, display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, color:"#4caf50", letterSpacing:"0.18em" }}>TODAY'S DEAL</div>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:14, color:"var(--text)" }}>{prod.name}</div>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:14, color:GOLD }}>{td.pct}% OFF</div>
                  <div style={{ fontSize:11, color:"var(--text-dim)", marginLeft:"auto", fontStyle:"italic" }}>Sale price: ${Math.round(prod.price * (1-td.pct/100)).toLocaleString()}</div>
                </div>
              );
            })()}

            <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
              {dealsQueue.map((d, i) => {
                const prod = products.find(p => p.id === d.productId);
                if (!prod) return null;
                return (
                  <div key={d.id} style={{ display:"flex", alignItems:"center", gap:12, background:"var(--bg-card)", border:"1px solid #1a1a1a", borderRadius:2, padding:"10px 14px" }}>
                    <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:"var(--text-dim)", minWidth:24, textAlign:"center" }}>#{i+1}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:"var(--text)" }}>{prod.name}</div>
                      <div style={{ fontSize:10, color:"var(--text-dim)", marginTop:2 }}>{prod.cat} · Regular: ${prod.price.toLocaleString()} · Deal: ${Math.round(prod.price*(1-d.pct/100)).toLocaleString()} ({d.pct}% off)</div>
                    </div>
                    <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:16, color:GOLD, fontWeight:700, minWidth:60, textAlign:"right" }}>{d.pct}% OFF</div>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={() => moveUp(d.id)} style={{ background:"transparent", border:"1px solid var(--border-mid)", color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", fontSize:10, padding:"4px 8px", borderRadius:2, cursor:"pointer" }}>↑</button>
                      <button onClick={() => removeFromQueue(d.id)} style={{ background:"transparent", border:"1px solid #330000", color:"#7a1515", fontFamily:"'Oswald',sans-serif", fontSize:10, padding:"4px 9px", borderRadius:2, cursor:"pointer" }}>DEL</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {addingDeal ? (
              <div style={{ background:"var(--bg-card)", border:`1px solid ${GOLD}`, borderRadius:3, padding:"1.25rem", marginTop:8 }}>
                <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:GOLD, letterSpacing:"0.1em", marginBottom:14 }}>ADD TO DEALS QUEUE</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
                  <div>
                    <label style={lStyle}>SELECT GUN</label>
                    <select value={newDeal.productId} onChange={e => setNewDeal(d => ({...d, productId:e.target.value}))} style={iStyle}>
                      <option value="">— choose a product —</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lStyle}>DISCOUNT %</label>
                    <input type="number" min="1" max="99" value={newDeal.pct} onChange={e => setNewDeal(d => ({...d, pct:e.target.value}))} placeholder="e.g. 15" style={iStyle}/>
                  </div>
                </div>
                {newDeal.productId && newDeal.pct && (() => {
                  const prod = products.find(p => p.id === Number(newDeal.productId));
                  const sp = prod ? Math.round(prod.price * (1 - Number(newDeal.pct)/100)) : 0;
                  return <div style={{ fontSize:11, color:"#4caf50", fontFamily:"'Oswald',sans-serif", marginBottom:14 }}>
                    Sale price will be: ${sp.toLocaleString()} (saving ${prod ? prod.price-sp : 0})
                  </div>;
                })()}
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={addToQueue} style={{ background:GOLD, color:"#000", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:13, letterSpacing:"0.08em", padding:"8px 20px", border:"none", borderRadius:2, cursor:"pointer" }}>ADD TO QUEUE</button>
                  <button onClick={() => setAddingDeal(false)} style={{ background:"transparent", border:"1px solid var(--border-mid)", color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", fontSize:12, padding:"8px 16px", borderRadius:2, cursor:"pointer" }}>CANCEL</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingDeal(true)} style={{ background:"transparent", border:`1px solid ${GOLD}`, color:GOLD, fontFamily:"'Oswald',sans-serif", fontSize:12, letterSpacing:"0.1em", padding:"9px 20px", borderRadius:2, cursor:"pointer" }}>+ ADD GUN TO QUEUE</button>
            )}
          </div>
        )}

        {/* ── PRODUCTS TAB ── */}
        {tab==="products" && !editingProduct && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:16, color:GOLD, letterSpacing:"0.1em" }}>INVENTORY ({products.length} items)</div>
              <button onClick={openNew} style={{ background:GOLD, color:"#000", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:12, letterSpacing:"0.1em", padding:"8px 18px", border:"none", borderRadius:2, cursor:"pointer" }}>+ ADD PRODUCT</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {products.map(p => (
                <div key={p.id} style={{ display:"flex", alignItems:"center", gap:12, background:"var(--bg-card)", border:"1px solid #1a1a1a", borderRadius:2, padding:"10px 14px" }}>
                  <div style={{ width:48, height:36, background:"#161616", borderRadius:2, flexShrink:0, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {p.img ? <img src={p.img} alt="" style={{ width:"100%", height:"100%", objectFit:"contain" }}/> : <span style={{ fontSize:16, opacity:0.15 }}>🔫</span>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:"var(--text)", display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
                      {p.name}
                      {dealsQueue.some(d => d.productId===p.id) && <span style={{ background:`${GOLD}22`, border:`1px solid ${GOLD}44`, color:GOLD, fontSize:8, padding:"2px 5px", borderRadius:1, letterSpacing:"0.1em" }}>IN QUEUE</span>}
                      {p.sale && <span style={{ background:"#7a1515", color:"#fff", fontSize:8, padding:"2px 5px", borderRadius:1 }}>SALE</span>}
                    </div>
                    <div style={{ fontSize:10, color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", marginTop:2 }}>
                      {p.cat} · ${p.price}{p.sale?` → $${p.sale}`:""} · Deposit: ${p.deposit}
                      {p.sku && <span style={{ color:"var(--text-dim)", fontFamily:"'Courier New',monospace", marginLeft:8 }}>SKU: {p.sku}</span>}
                      {p.serial && <span style={{ color:"var(--text-dim)", fontFamily:"'Courier New',monospace", marginLeft:8 }}>S/N: {p.serial}</span>}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                    <button onClick={() => openEdit(p)} style={{ background:"transparent", border:"1px solid var(--border-mid)", color:GOLD, fontFamily:"'Oswald',sans-serif", fontSize:10, padding:"4px 9px", borderRadius:2, cursor:"pointer" }}>EDIT</button>
                    <button onClick={() => delProduct(p.id)} style={{ background:"transparent", border:"1px solid #330000", color:"#7a1515", fontFamily:"'Oswald',sans-serif", fontSize:10, padding:"4px 9px", borderRadius:2, cursor:"pointer" }}>DEL</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab==="settings" && (
          <div style={{ maxWidth:500 }}>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:16, color:GOLD, letterSpacing:"0.1em", marginBottom:6 }}>PAYMENT SETTINGS</div>
            <div style={{ fontSize:12, color:"var(--text-dim)", fontStyle:"italic", marginBottom:24 }}>Enter your FirstPay credentials. These are stored securely in your database and never shared.</div>

            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <label style={{ display:"block", fontSize:9, color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.14em", marginBottom:4 }}>FIRSTPAY MERCHANT ID</label>
                <input type="password" value={settings.firstpay_merchant_id || ''} onChange={e => setSettings(s => ({...s, firstpay_merchant_id: e.target.value}))}
                  placeholder="Your FirstPay merchant ID"
                  style={{ width:"100%", background:"var(--bg)", border:"1px solid #222", color:"var(--text)", padding:"8px 12px", borderRadius:2, fontFamily:"'Courier New',monospace", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
                <div style={{ fontSize:10, color:"var(--text-dim)", marginTop:3, fontStyle:"italic" }}>Stored encrypted. Never visible in code or git.</div>
              </div>
              <div>
                <label style={{ display:"block", fontSize:9, color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.14em", marginBottom:4 }}>FIRSTPAY CHECKOUT URL</label>
                <input type="text" value={settings.firstpay_checkout_url || ''} onChange={e => setSettings(s => ({...s, firstpay_checkout_url: e.target.value}))}
                  placeholder="e.g. https://checkout.firstpay.com/pay/..."
                  style={{ width:"100%", background:"var(--bg)", border:"1px solid #222", color:"var(--text)", padding:"8px 12px", borderRadius:2, fontFamily:"'Courier New',monospace", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
                <div style={{ fontSize:10, color:"var(--text-dim)", marginTop:3, fontStyle:"italic" }}>Find this in your FirstPay dashboard under Payment Links or Hosted Checkout.</div>
              </div>
            </div>

            <div style={{ borderTop:"1px solid var(--border)", paddingTop:20, marginTop:8 }}>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:16, color:GOLD, letterSpacing:"0.1em", marginBottom:6 }}>CHANGE ADMIN PASSWORD</div>
              <div style={{ fontSize:12, color:"var(--text-dim)", fontStyle:"italic", marginBottom:14 }}>Leave blank to keep your current password.</div>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div>
                  <label style={{ display:"block", fontSize:9, color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.14em", marginBottom:4 }}>NEW PASSWORD</label>
                  <input type="password" value={settings.new_password || ''} onChange={e => setSettings(s => ({...s, new_password: e.target.value}))}
                    placeholder="Enter new password"
                    style={{ width:"100%", background:"var(--bg)", border:"1px solid #222", color:"var(--text)", padding:"8px 12px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:9, color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.14em", marginBottom:4 }}>CONFIRM NEW PASSWORD</label>
                  <input type="password" value={settings.confirm_password || ''} onChange={e => setSettings(s => ({...s, confirm_password: e.target.value}))}
                    placeholder="Confirm new password"
                    style={{ width:"100%", background:"var(--bg)", border:"1px solid #222", color:"var(--text)", padding:"8px 12px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
                </div>
                {settings.new_password && settings.confirm_password && settings.new_password !== settings.confirm_password && (
                  <div style={{ fontSize:11, color:"#c0392b", fontStyle:"italic" }}>Passwords don't match</div>
                )}
              </div>
            </div>

            <div style={{ marginTop:20, display:"flex", alignItems:"center", gap:12 }}>
              <button onClick={saveSettings} style={{ background:GOLD, color:"#000", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:13, letterSpacing:"0.1em", padding:"10px 24px", border:"none", borderRadius:2, cursor:"pointer" }}>SAVE SETTINGS</button>
              {settingsSaved && <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:"#4caf50", letterSpacing:"0.1em" }}>✓ SAVED</span>}
            </div>
          </div>
        )}

        {/* ── RESERVATIONS TAB ── */}
        {tab==="reservations" && (
          <div>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:16, color:GOLD, letterSpacing:"0.1em", marginBottom:6 }}>RESERVATIONS</div>
            <div style={{ fontSize:12, color:"var(--text-dim)", fontStyle:"italic", marginBottom:20 }}>Customer holds and purchases. Update status as each is handled.</div>

            {reservations.length === 0 && (
              <div style={{ textAlign:"center", padding:"3rem", color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.15em" }}>NO RESERVATIONS YET</div>
            )}

            {/* Status filter tabs */}
            {reservations.length > 0 && (
              <ReservationsList reservations={reservations} onUpdate={updateReservationStatus} />
            )}
          </div>
        )}

        {tab==="products" && editingProduct && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:18, color:GOLD, letterSpacing:"0.1em" }}>{editingProduct==="new" ? "ADD NEW PRODUCT":"EDIT PRODUCT"}</div>
              <button onClick={() => setEditingProduct(null)} style={{ background:"transparent", border:"1px solid var(--border-mid)", color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", fontSize:11, padding:"6px 14px", borderRadius:2, cursor:"pointer" }}>CANCEL</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {[["Product Name","name","text"],["Regular Price ($)","price","number"],["Sale Price (optional)","sale","number"],["Deposit Amount ($)","deposit","number"]].map(([l,k,t]) => (
                  <div key={k}><label style={lStyle}>{l.toUpperCase()}</label><input type={t} value={form[k]} onChange={e => set(k, e.target.value)} style={iStyle}/></div>
                ))}
                <div><label style={lStyle}>CATEGORY</label>
                  <select value={form.cat} onChange={e => set("cat", e.target.value)} style={iStyle}>
                    {CATS.filter(c => c!=="All").map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label style={lStyle}>DESCRIPTION</label><textarea value={form.desc} onChange={e => set("desc", e.target.value)} rows={3} style={{ ...iStyle, resize:"vertical" }}/></div>
                <div><label style={lStyle}>SPECS (separate with " | ")</label><input type="text" value={form.specs} onChange={e => set("specs", e.target.value)} placeholder='Caliber: 9mm | Barrel: 4" | Capacity: 17+1' style={{ ...iStyle, fontFamily:"'Courier New',monospace", fontSize:11 }}/></div>
                <div style={{ borderTop:"1px solid var(--border)", paddingTop:12 }}>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, color:"var(--text-dim)", letterSpacing:"0.16em", marginBottom:10 }}>UNIT TRACKING — ADMIN ONLY</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    <div>
                      <label style={lStyle}>SERIAL NUMBER</label>
                      <input type="text" value={form.serial} onChange={e => set("serial", e.target.value)} placeholder="e.g. G2274519" style={{ ...iStyle, fontFamily:"'Courier New',monospace", fontSize:12 }}/>
                      <div style={{ fontSize:9, color:"var(--text-dim)", marginTop:3, fontStyle:"italic" }}>Customer sees: {form.serial ? maskSerial(form.serial) : "—"}</div>
                    </div>
                    <div>
                      <label style={lStyle}>SKU / ITEM NUMBER</label>
                      <input type="text" value={form.sku} onChange={e => set("sku", e.target.value)} placeholder="e.g. WIN-M70-3006" style={{ ...iStyle, fontFamily:"'Courier New',monospace", fontSize:12 }}/>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label style={lStyle}>PRODUCT PHOTO</label>
                <div onClick={() => fileRef.current.click()} onMouseEnter={e => e.currentTarget.style.borderColor=GOLD} onMouseLeave={e => e.currentTarget.style.borderColor="#1e1e1e"}
                  style={{ aspectRatio:"4/3", background:"var(--bg)", border:"2px dashed #1e1e1e", borderRadius:3, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", overflow:"hidden", transition:"border-color 0.2s" }}>
                  {imgPreview ? <img src={imgPreview} alt="" style={{ width:"100%", height:"100%", objectFit:"contain" }}/> :
                    <div style={{ textAlign:"center", color:"var(--text-dim)" }}>
                      <div style={{ fontSize:28, marginBottom:6 }}>↑</div>
                      <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:12, letterSpacing:"0.1em" }}>CLICK TO UPLOAD</div>
                      <div style={{ fontSize:10, marginTop:3, fontStyle:"italic", color:"#2a2a2a" }}>JPG / PNG → Cloudinary</div>
                    </div>}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImg} style={{ display:"none" }}/>
                {imgPreview && <button onClick={() => { setImgPreview(""); set("img",""); }} style={{ marginTop:6, background:"transparent", border:"1px solid #222", color:"var(--text-dim)", fontSize:10, padding:"3px 10px", borderRadius:2, cursor:"pointer", fontFamily:"'Oswald',sans-serif" }}>REMOVE</button>}
              </div>
            </div>
            <button onClick={saveProduct} style={{ marginTop:24, background:GOLD, color:"#000", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:15, letterSpacing:"0.1em", padding:"12px 36px", border:"none", borderRadius:2, cursor:"pointer" }}>SAVE PRODUCT</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────
export default function GristmillClient() {
  const [spinDone, setSpinDone] = useState(false);
  const [catFilter, setCatFilter] = useState("All");
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [todaysDeal, setTodaysDeal] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heldProductIds, setHeldProductIds] = useState([]);
  const [dealClaimedToday, setDealClaimedToday] = useState(false);
  const [modal, setModal] = useState(null);
  const LIMIT = 24;

  // Fetch today's deal once on mount
  useEffect(() => {
    if (getStoredSpin()) setSpinDone(true);
    fetch('/api/deals/today').then(r => r.json()).then(deal => {
      if (deal && !deal.error) setTodaysDeal({ ...deal, pct: deal.discountPct });
    });
    // Check deal claimed status independently
    fetch('/api/availability?ids=').then(r => r.json()).then(a => {
      setDealClaimedToday(a.dealClaimedToday || false);
    });
    fetch('/api/categories').then(r => r.json()).then(d => {
      if (Array.isArray(d.categories)) setCategories(d.categories.map(c => c.name));
    });
  }, []);

  const catalogRef = useRef(null);

  // Fetch products when page/filter/search changes
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: LIMIT });
    if (catFilter && catFilter !== "All") params.set("category", catFilter);
    if (search) params.set("search", search);
    fetch(`/api/products?${params}`)
      .then(r => r.json())
      .then(data => {
        const prods = Array.isArray(data.products) ? data.products : [];
        setProducts(prods);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
        setLoading(false);
        // Check availability for loaded products
        if (prods.length) {
          const ids = prods.map(p => p.id).join(',');
          fetch(`/api/availability?ids=${ids}`)
            .then(r => r.json())
            .then(a => {
              setHeldProductIds(a.heldProductIds || []);
              setDealClaimedToday(a.dealClaimedToday || false);
            });
        }

      })
      .catch(() => setLoading(false));
  }, [page, catFilter, search]);

  // Scroll after products render
  useEffect(() => {
    if (!loading && catalogRef.current && page > 1) {
      const top = catalogRef.current.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, [products]);

  const handleSpinResult = () => {
    const endTime = Date.now() + 10 * 60 * 1000;
    saveSpinResult(endTime);
    setSpinDone(true);
  };

  const handleCatFilter = (cat) => { setCatFilter(cat); setPage(1); };
  const handleSearch = (val) => { setSearch(val); setPage(1); };

  const normalizeProduct = (p) => ({
    ...p,
    cat: p.category,
    sale: p.salePrice,
    desc: p.description,
    img: p.imageUrl || "",
    serial: p.serialNumber || "",
  });

  const dealProduct = todaysDeal?.product ? normalizeProduct(todaysDeal.product) : null;
  const normalized = products.map(normalizeProduct);




  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", color:"var(--text)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <header style={{ background:"var(--bg-header)", borderBottom:`2px solid ${GOLD}`, padding:"0 2rem", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", gap:14, padding:"0.85rem 0" }}>
          <Logo size={46}/>
          <div>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:22, fontWeight:700, color:"var(--text)", letterSpacing:"0.1em", lineHeight:1 }}>GRISTMILL</div>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, color:GOLD, letterSpacing:"0.24em" }}>GUNS & OPTICS</div>
          </div>
          <div style={{ marginLeft:"auto", fontFamily:"'Oswald',sans-serif", fontSize:11, color:"var(--text-dim)", letterSpacing:"0.1em" }}>(570) 713-7339 &nbsp;·&nbsp; 1549 PA-487, Orangeville PA</div>
        </div>
      </header>

      {/* HERO — SPINNER */}
      <section style={{ background:"linear-gradient(180deg,#050505 0%,#0a0a0a 100%)", borderBottom:"1px solid var(--border)", padding:"3rem 2rem 4rem", textAlign:"center" }}>
        <div style={{ maxWidth:640, margin:"0 auto" }}>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:"var(--text-dim)", letterSpacing:"0.28em", marginBottom:10 }}>EVERY DAY · ONE DEAL · LIMITED TIME</div>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:38, fontWeight:700, color:"var(--text)", letterSpacing:"0.05em", lineHeight:1, marginBottom:6 }}>DAILY DEAL SPINNER</div>
          <div style={{ width:48, height:2, background:GOLD, margin:"0 auto 12px" }}/>
          <div style={{ fontFamily:"Georgia,serif", fontStyle:"italic", color:"var(--text-dim)", fontSize:14, marginBottom:32 }}>
            Spin once a day for an exclusive in-store discount. Claim it before the clock runs out.
          </div>
          {loading ? (
            <div style={{ padding:"4rem 0", fontFamily:"'Oswald',sans-serif", fontSize:13, color:"var(--text-dim)", letterSpacing:"0.2em" }}>LOADING TODAY'S DEAL...</div>
          ) : !spinDone ? (
            <SpinnerWheel onResult={handleSpinResult} todaysDeal={todaysDeal}/>
          ) : dealProduct ? (
            <DealResult
              product={dealProduct}
              pct={todaysDeal.pct}
              claimed={dealClaimedToday}
              onReserve={(p, price) => setModal({ product:p, type:"deposit", price, dealId: todaysDeal?.id })}
              onPayFull={(p, price) => setModal({ product:p, type:"full", price, dealId: todaysDeal?.id })}
            />
          ) : null}
        </div>
      </section>


      {/* AMBIANCE */}
      <section style={{ background:"#080808", borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)", padding:"4rem 2rem" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>

          {/* Header */}
          <div style={{ textAlign:"center", marginBottom:"3rem" }}>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:9, color:"var(--text-dim)", letterSpacing:"0.22em", textTransform:"uppercase", marginBottom:8 }}>COME SEE US</div>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:32, fontWeight:700, color:"var(--text)", letterSpacing:"0.04em", marginBottom:10 }}>THE OLD GRISTMILL</div>
            <div style={{ width:48, height:2, background:GOLD, margin:"0 auto 16px" }}/>
            <div style={{ fontFamily:"Georgia,serif", fontStyle:"italic", color:"var(--text-dim)", fontSize:15, maxWidth:580, margin:"0 auto", lineHeight:1.8 }}>
              Built in the 1800s along the banks of Fishing Creek, our building has been lovingly restored and decorated to honor its history. Come for the deals — stay for the experience.
            </div>
          </div>

          {/* Hero photo — full width */}
          <div style={{ width:"100%", aspectRatio:"21/9", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:3, marginBottom:"1.5rem", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
            {/* REPLACE src below with Cloudinary URL of exterior/hero shot */}
            {false ? <img src="" alt="Gristmill Guns exterior" style={{ width:"100%", height:"100%", objectFit:"contain" }}/> : (
              <div style={{ textAlign:"center", color:"#2a2a2a" }}>
                <div style={{ fontSize:40, marginBottom:8 }}>🏚</div>
                <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:12, letterSpacing:"0.18em" }}>EXTERIOR PHOTO</div>
                <div style={{ fontSize:10, marginTop:4, fontStyle:"italic", color:"#222" }}>Replace with building exterior shot</div>
              </div>
            )}
          </div>

          {/* 3-column photo grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"1.5rem" }}>
            {[
              { slot:"INTERIOR", hint:"Wide shot of the shop floor / display cases", icon:"🔦" },
              { slot:"THE MILLSTONE", hint:"Original millstone or mill equipment", icon:"⚙" },
              { slot:"THE DÉCOR", hint:"Rustic details — reclaimed wood, vintage signs", icon:"🪵" },
            ].map(({ slot, hint, icon }) => (
              <div key={slot} style={{ aspectRatio:"4/3", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:3, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {/* REPLACE false with true and add src URL when photo is ready */}
                {false ? <img src="" alt={slot} style={{ width:"100%", height:"100%", objectFit:"contain" }}/> : (
                  <div style={{ textAlign:"center", color:"#2a2a2a", padding:"1rem" }}>
                    <div style={{ fontSize:28, marginBottom:6 }}>{icon}</div>
                    <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, letterSpacing:"0.14em" }}>{slot}</div>
                    <div style={{ fontSize:9, marginTop:4, fontStyle:"italic", color:"#1e1e1e", lineHeight:1.5 }}>{hint}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Info cards row */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:"1rem", marginBottom:"2.5rem" }}>
            {[
              { title:"Historic Structure", body:"Original hand-hewn timber framing, stone foundation walls, and wide-plank floors dating back over 150 years." },
              { title:"Working Mill Artifacts", body:"Antique millstones, gears, and equipment preserved throughout the building — history you can touch." },
              { title:"Rustic Décor", body:"Reclaimed wood, vintage signage, and curated antiques create an atmosphere unlike any other gun shop." },
              { title:"Find Us", body:"1549 State Route 487, Orangeville PA 17859. Easy parking, right off the highway. Come say hello to Grant." },
            ].map(({ title, body }) => (
              <div key={title} style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:3, padding:"1.25rem" }}>
                <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:GOLD, letterSpacing:"0.1em", marginBottom:6 }}>{title.toUpperCase()}</div>
                <div style={{ fontSize:13, color:"var(--text-dim)", lineHeight:1.7, fontStyle:"italic" }}>{body}</div>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <a href="https://www.google.com/maps/search/?api=1&query=1549+State+Route+487+Orangeville+PA+17859" target="_blank" rel="noreferrer"
              style={{ fontFamily:"'Oswald',sans-serif", fontSize:12, letterSpacing:"0.1em", padding:"10px 24px", background:"transparent", border:`1px solid ${GOLD}`, color:GOLD, borderRadius:2, textDecoration:"none" }}>
              GET DIRECTIONS
            </a>
            <a href="https://www.instagram.com/gristmillguns" target="_blank" rel="noreferrer"
              style={{ fontFamily:"'Oswald',sans-serif", fontSize:12, letterSpacing:"0.1em", padding:"10px 24px", background:"transparent", border:"1px solid #333", color:"var(--text-muted)", borderRadius:2, textDecoration:"none" }}>
              @GRISTMILLGUNS ON INSTAGRAM
            </a>
          </div>

        </div>
      </section>

      {/* CATALOG */}
      <section ref={catalogRef} style={{ maxWidth:1100, margin:"0 auto", padding:"3rem 2rem 5rem" }}>
        <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:"1.25rem", flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:9, color:"var(--text-dim)", letterSpacing:"0.22em", textTransform:"uppercase", marginBottom:4 }}>BROWSE OUR INVENTORY</div>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:26, fontWeight:700, color:"var(--text)", letterSpacing:"0.04em" }}>IN-STORE CATALOG</div>
          </div>
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search by name, caliber, make..."
            style={{ background:"var(--bg-card)", border:"1px solid var(--border-mid)", color:"var(--text)", padding:"8px 14px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:13, outline:"none", width:240 }}
          />
        </div>

        {/* Category filters */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:"1.5rem" }}>
          {["All", ...categories].map(c => (
            <button key={c} onClick={() => handleCatFilter(c)}
              style={{ background: catFilter===c ? `${GOLD}18`:"transparent", border:`1px solid ${catFilter===c ? GOLD:"#1e1e1e"}`, color: catFilter===c ? GOLD:"#a0a0a0", fontFamily:"'Oswald',sans-serif", fontSize:10, padding:"5px 12px", borderRadius:2, cursor:"pointer", letterSpacing:"0.12em", transition:"all 0.2s" }}>
              {c}
            </button>
          ))}
        </div>

        {/* Count */}
        {!loading && <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, color:"var(--text-dim)", letterSpacing:"0.12em", marginBottom:16 }}>{total} ITEMS{catFilter!=="All"?` IN ${catFilter.toUpperCase()}`:""}</div>}

        {/* Grid */}
        {loading ? (
          <div style={{ padding:"4rem 0", textAlign:"center", fontFamily:"'Oswald',sans-serif", fontSize:12, color:"var(--text-dim)", letterSpacing:"0.2em" }}>LOADING...</div>
        ) : normalized.length === 0 ? (
          <div style={{ padding:"4rem 0", textAlign:"center", fontFamily:"'Oswald',sans-serif", fontSize:12, color:"var(--text-dim)", letterSpacing:"0.2em" }}>NO ITEMS FOUND</div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:"1rem" }}>
            {normalized.map(p => <ProductCard key={p.id} p={p} held={heldProductIds.includes(p.id)}/>)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, marginTop:"2.5rem" }}>
            <button
              onClick={() => setPage(p => Math.max(1, p-1))}
              disabled={page === 1}
              style={{ background:"transparent", border:`1px solid ${page===1?"#1e1e1e":GOLD}`, color:page===1?"#9e9e9e":GOLD, fontFamily:"'Oswald',sans-serif", fontSize:11, padding:"8px 20px", borderRadius:2, cursor:page===1?"not-allowed":"pointer", letterSpacing:"0.1em", transition:"all 0.2s" }}>
              ← PREV
            </button>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:"var(--text-dim)", letterSpacing:"0.12em" }}>
              PAGE {page} OF {totalPages}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p+1))}
              disabled={page === totalPages}
              style={{ background:"transparent", border:`1px solid ${page===totalPages?"#1e1e1e":GOLD}`, color:page===totalPages?"#9e9e9e":GOLD, fontFamily:"'Oswald',sans-serif", fontSize:11, padding:"8px 20px", borderRadius:2, cursor:page===totalPages?"not-allowed":"pointer", letterSpacing:"0.1em", transition:"all 0.2s" }}>
              NEXT →
            </button>
          </div>
        )}
      </section>

      <footer className="gm-footer">
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
          <div className="gm-footer-text">
            <span className="gm-footer-name">Gristmill Guns & Optics</span>
            &nbsp;·&nbsp; 1549 State Route 487, Orangeville PA 17859<br/>
            <a href="tel:5707137339">(570) 713-7339</a>
            &nbsp;·&nbsp;
            <a href="mailto:grant@gristmillguns.com">grant@gristmillguns.com</a>
            &nbsp;·&nbsp;
            <a href="https://www.instagram.com/gristmillguns" target="_blank" rel="noreferrer">@gristmillguns</a>
            &nbsp;·&nbsp; All sales require valid ID &amp; background check
          </div>
          <button onClick={() => window.location.href="/admin"} style={{ background:"transparent", border:"none", color:"var(--text-dim)", fontSize:10, cursor:"pointer", fontFamily:"var(--font-display)", letterSpacing:"0.1em", transition:"color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color="var(--text-muted)"} onMouseLeave={e => e.currentTarget.style.color="var(--text-dim)"}>ADMIN</button>
        </div>
      </footer>

      {modal && <Modal {...modal} onClose={() => setModal(null)} onSuccess={() => {
        if (modal.dealId) setDealClaimedToday(true);
        if (modal.product?.id) setHeldProductIds(ids => [...ids, modal.product.id]);
      }}/>}

    </div>
  );
}

