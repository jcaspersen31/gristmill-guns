const GOLD = "#c9a84c";
export default function AdminButton({ children, onClick, variant="gold", disabled=false, style={} }) {
  const styles = {
    gold:    { background:GOLD, color:"#000", border:"none" },
    outline: { background:"transparent", color:GOLD, border:`1px solid ${GOLD}` },
    ghost:   { background:"transparent", color:"var(--text-muted)", border:"1px solid var(--border-mid)" },
    danger:  { background:"transparent", color:"#c0392b", border:"1px solid #330000" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:12,
      letterSpacing:"0.1em", padding:"8px 18px", borderRadius:2,
      cursor: disabled ? "not-allowed":"pointer",
      opacity: disabled ? 0.5:1,
      transition:"opacity 0.15s",
      ...styles[variant], ...style
    }}>{children}</button>
  );
}
