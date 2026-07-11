"use client";
import { useState, useEffect } from "react";
import PageHeader from "@/components/admin/PageHeader";
import AdminButton from "@/components/admin/AdminButton";
import InputField from "@/components/admin/InputField";

export default function SettingsPage() {
  const [settings, setSettings] = useState({ site_mode:"coming_soon", firstpay_transcenter_id:"", firstpay_gateway_id:"", firstpay_merchant_id:"", firstpay_checkout_url:"", klaviyo_api_key:"", klaviyo_list_id:"", klaviyo_company_id:"", resend_api_key:"", payment_mode:"email_only", new_password:"", confirm_password:"" });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => {
      setSettings(s => ({ ...s, ...d }));
      setLoading(false);
    });
  }, []);

  const set = (k,v) => setSettings(s => ({ ...s, [k]:v }));

  const save = async () => {
    const payload = { ...settings };
    if (payload.new_password && payload.new_password === payload.confirm_password) {
      payload.admin_password = payload.new_password;
    }
    delete payload.new_password;
    delete payload.confirm_password;
    await fetch("/api/settings", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
    setSettings(s => ({ ...s, new_password:"", confirm_password:"" }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const pwMismatch = settings.new_password && settings.confirm_password && settings.new_password !== settings.confirm_password;

  return (
    <div style={{ maxWidth:500 }}>
      <PageHeader title="SETTINGS"/>

      {loading ? <div style={{ color:"var(--text-dim)", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.15em" }}>LOADING...</div> : <>

        <div style={{ marginBottom:28 }}>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:"var(--text-muted)", letterSpacing:"0.12em", marginBottom:16, paddingBottom:8, borderBottom:"1px solid var(--border)" }}>SITE MODE</div>
          <div style={{ display:"flex", gap:10, marginBottom:28 }}>
            {[
              { val:"coming_soon", label:"COMING SOON", hint:"Shows the coming soon page to visitors. Admin still works." },
              { val:"live",        label:"LIVE",         hint:"Full site is visible — catalog, spinner, reservations." },
            ].map(({ val, label, hint }) => (
              <div key={val} onClick={() => set("site_mode", val)}
                style={{ flex:1, padding:"14px", borderRadius:3, cursor:"pointer", border:`1px solid ${settings.site_mode===val ? GOLD : "var(--border-mid)"}`, background: settings.site_mode===val ? "rgba(201,168,76,0.08)" : "transparent" }}>
                <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:12, color: settings.site_mode===val ? GOLD : "var(--text-dim)", letterSpacing:"0.1em", marginBottom:6 }}>{label}</div>
                <div style={{ fontSize:11, color:"var(--text-dim)", fontStyle:"italic", lineHeight:1.5 }}>{hint}</div>
              </div>
            ))}
          </div>

          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:"var(--text-muted)", letterSpacing:"0.12em", marginBottom:16, paddingBottom:8, borderBottom:"1px solid var(--border)" }}>PAYMENT MODE</div>
          <div style={{ display:"flex", gap:10, marginBottom:20 }}>
            {[
              { val:"email_only", label:"EMAIL ONLY", hint:"Customer reserves with contact info. No online payment — pay/complete in store." },
              { val:"gateway",    label:"ONLINE PAYMENT", hint:"Customer pays online via 1stPayGateway before reservation is confirmed." },
            ].map(({ val, label, hint }) => (
              <div key={val} onClick={() => set("payment_mode", val)}
                style={{ flex:1, padding:"14px", borderRadius:3, cursor:"pointer", border:`1px solid ${settings.payment_mode===val ? GOLD : "var(--border-mid)"}`, background: settings.payment_mode===val ? "rgba(201,168,76,0.08)" : "transparent" }}>
                <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:12, color: settings.payment_mode===val ? GOLD : "var(--text-dim)", letterSpacing:"0.1em", marginBottom:6 }}>{label}</div>
                <div style={{ fontSize:11, color:"var(--text-dim)", fontStyle:"italic", lineHeight:1.5 }}>{hint}</div>
              </div>
            ))}
          </div>

          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:"var(--text-muted)", letterSpacing:"0.12em", marginBottom:16, paddingBottom:8, borderBottom:"1px solid var(--border)" }}>1STPAYGATEWAY</div>
          <InputField label="Transcenter ID" value={settings.firstpay_transcenter_id||""} onChange={v => set("firstpay_transcenter_id",v)} type="password" hint="Your login ID — found in Security Settings → Gateway Options."/>
          <InputField label="Gateway ID" value={settings.firstpay_gateway_id||""} onChange={v => set("firstpay_gateway_id",v)} type="password" hint="Found in Security Settings → Gateway Options. Keep this private."/>
          <InputField label="Merchant Key" value={settings.firstpay_merchant_key||""} onChange={v => set("firstpay_merchant_key",v)} type="password" hint="Check your original 1stPayGateway signup email — it was shown once at account creation. Contact 1stPayGateway support if you can't locate it."/>
        </div>

        <div style={{ marginBottom:28 }}>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:"var(--text-muted)", letterSpacing:"0.12em", marginBottom:16, paddingBottom:8, borderBottom:"1px solid var(--border)" }}>KLAVIYO EMAIL MARKETING</div>
          <InputField label="Klaviyo Private API Key" value={settings.klaviyo_api_key||""} onChange={v => set("klaviyo_api_key",v)} type="password" hint="Found in Klaviyo → Settings → API Keys. Use a Private Key."/>
          <InputField label="Klaviyo List ID" value={settings.klaviyo_list_id||""} onChange={v => set("klaviyo_list_id",v)} placeholder="e.g. ABC123" hint="List to add customers to on reservation. Found in Klaviyo → Lists."/>
          <InputField label="Klaviyo Company ID (Public)" value={settings.klaviyo_company_id||""} onChange={v => set("klaviyo_company_id",v)} placeholder="e.g. ABC123" hint="Found in Klaviyo → Settings → Account. Enables popup signup forms on the site."/>
        </div>

        <div style={{ marginBottom:28 }}>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:"var(--text-muted)", letterSpacing:"0.12em", marginBottom:16, paddingBottom:8, borderBottom:"1px solid var(--border)" }}>EMAIL (RESEND)</div>
          <InputField label="Resend API Key" value={settings.resend_api_key||""} onChange={v => set("resend_api_key",v)} type="password" hint="From resend.com → API Keys. Powers reservation confirmations and customer login links."/>
        </div>

        <div style={{ marginBottom:28 }}>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:"var(--text-muted)", letterSpacing:"0.12em", marginBottom:16, paddingBottom:8, borderBottom:"1px solid var(--border)" }}>ADMIN PASSWORD</div>
          <InputField label="New Password" value={settings.new_password||""} onChange={v => set("new_password",v)} type="password" placeholder="Leave blank to keep current"/>
          <InputField label="Confirm New Password" value={settings.confirm_password||""} onChange={v => set("confirm_password",v)} type="password"/>
          {pwMismatch && <div style={{ fontSize:11, color:"#c0392b", fontStyle:"italic", marginTop:-8, marginBottom:14 }}>Passwords don't match</div>}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <AdminButton onClick={save} disabled={pwMismatch}>SAVE SETTINGS</AdminButton>
          {saved && <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:"#4caf50", letterSpacing:"0.1em" }}>✓ SAVED</span>}
        </div>
      </>}
    </div>
  );
}
