import "./gristmill.css";
import AgeGate from "./AgeGate";
import { prisma } from "@/lib/prisma";
import Script from "next/script";

export const metadata = {
  title: "Gristmill Guns & Optics — Orangeville, PA",
  description: "Gristmill Guns & Optics in Orangeville, PA. Browse our inventory, spin for daily deals, and reserve firearms online. Call (570) 713-7339.",
  openGraph: {
    title: "Gristmill Guns & Optics",
    description: "Daily deals, full inventory, and online reservations. Located at 1549 State Route 487, Orangeville PA.",
    type: "website",
  },
};

export default async function RootLayout({ children }) {
  // Fetch Klaviyo company ID from settings
  let klaviyoCompanyId = null;
  try {
    const row = await prisma.setting.findUnique({ where: { key: 'klaviyo_company_id' } });
    if (row?.value) klaviyoCompanyId = row.value;
  } catch {}

  return (
    <html lang="en">
      <head>
        {klaviyoCompanyId && (
          <Script
            src={`https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${klaviyoCompanyId}`}
            strategy="afterInteractive"
          />
        )}
      </head>
      <body>
        <AgeGate>{children}</AgeGate>
      </body>
    </html>
  );
}
