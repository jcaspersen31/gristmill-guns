"use client";
import { useState, useEffect } from "react";
import PageHeader from "@/components/admin/PageHeader";
import AdminButton from "@/components/admin/AdminButton";
import InputField from "@/components/admin/InputField";

export default function SettingsPage() {
  const [settings, setSettings] = useState({ firstpay_transcenter_id:"", firstpay_gateway_id:"", firstpay_merchant_id:"", firstpay_checkout_url:"", klaviyo_api_key:"", klaviyo_list_id:"", klaviyo_company_id:"", new_password:"", confirm_password:"" });
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
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:"var(--text-muted)", letterSpacing:"0.12em", marginBottom:16, paddingBottom:8, borderBottom:"1px solid var(--border)" }}>1STPAYGATEWAY</div>
          <InputField label="Transcenter ID" value={settings.firstpay_transcenter_id||""} onChange={v => set("firstpay_transcenter_id",v)} hint="Your login ID — found in Security Settings → Gateway Options in your Transaction Center."/>
          <InputField label="Gateway ID" value={settings.firstpay_gateway_id||""} onChange={v => set("firstpay_gateway_id",v)} type="password" hint="Found in Security Settings → Gateway Options. Keep this private."/>
        </div>

        <div style={{ marginBottom:28 }}>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:"var(--text-muted)", letterSpacing:"0.12em", marginBottom:16, paddingBottom:8, borderBottom:"1px solid var(--border)" }}>KLAVIYO EMAIL MARKETING</div>
          <InputField label="Klaviyo Private API Key" value={settings.klaviyo_api_key||""} onChange={v => set("klaviyo_api_key",v)} type="password" hint="Found in Klaviyo → Settings → API Keys. Use a Private Key."/>
          <InputField label="Klaviyo List ID" value={settings.klaviyo_list_id||""} onChange={v => set("klaviyo_list_id",v)} placeholder="e.g. ABC123" hint="List to add customers to on reservation. Found in Klaviyo → Lists."/>
          <InputField label="Klaviyo Company ID (Public)" value={settings.klaviyo_company_id||""} onChange={v => set("klaviyo_company_id",v)} placeholder="e.g. ABC123" hint="Found in Klaviyo → Settings → Account. Enables popup signup forms on the site."/>
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
