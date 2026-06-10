const GOLD = "#c9a84c";
export default function PageHeader({ title, action }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, paddingBottom:16, borderBottom:"1px solid var(--border)" }}>
      <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:22, fontWeight:700, color:GOLD, letterSpacing:"0.08em" }}>{title}</div>
      {action}
    </div>
  );
}
