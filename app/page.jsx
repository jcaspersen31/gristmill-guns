import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import ComingSoon from "./coming-soon/page";

const GristmillClient = dynamic(() => import("./GristmillClient"), { ssr: false });

export default async function RootPage() {
  let siteMode = "coming_soon";
  try {
    const row = await prisma.setting.findUnique({ where: { key: "site_mode" } });
    siteMode = row?.value || "coming_soon";
  } catch {}

  if (siteMode === "coming_soon") return <ComingSoon />;
  return <GristmillClient />;
}
