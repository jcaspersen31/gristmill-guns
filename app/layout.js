import "./gristmill.css";
import AgeGate from "./AgeGate";

export const metadata = {
  title: "Gristmill Guns & Optics — Orangeville, PA",
  description: "Gristmill Guns & Optics in Orangeville, PA. Browse our inventory, spin for daily deals, and reserve firearms online. Call (570) 713-7339.",
  openGraph: {
    title: "Gristmill Guns & Optics",
    description: "Daily deals, full inventory, and online reservations. Located at 1549 State Route 487, Orangeville PA.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AgeGate>{children}</AgeGate>
      </body>
    </html>
  );
}
