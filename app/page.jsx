import { prisma } from "@/lib/prisma";
import ComingSoon from "./coming-soon/page";
import CatalogLoader from "./CatalogLoader";

export default async function RootPage() {
  let siteMode = "coming_soon";
  try {
    const row = await prisma.setting.findUnique({ where: { key: "site_mode" } });
    siteMode = row?.value || "coming_soon";
  } catch {}

  if (siteMode === "coming_soon") return <ComingSoon />;
  return <CatalogLoader />;
}
