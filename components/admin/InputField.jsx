export default function InputField({ label, value, onChange, type="text", placeholder="", hint="" }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:9, color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.14em", marginBottom:4 }}>{label.toUpperCase()}</label>
      {type === "textarea"
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
            style={{ width:"100%", background:"var(--bg)", border:"1px solid #222", color:"var(--text)", padding:"8px 12px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:13, outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={{ width:"100%", background:"var(--bg)", border:"1px solid #222", color:"var(--text)", padding:"8px 12px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
      }
      {hint && <div style={{ fontSize:9, color:"var(--text-dim)", marginTop:3, fontStyle:"italic" }}>{hint}</div>}
    </div>
  );
}
