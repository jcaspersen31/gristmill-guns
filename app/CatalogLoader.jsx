"use client";
import dynamic from "next/dynamic";

const GristmillClient = dynamic(() => import("./GristmillClient"), { ssr: false });

export default function CatalogLoader() {
  return <GristmillClient />;
}
