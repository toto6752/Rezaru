"use client";

import Link from "next/link";
import { useT } from "@/components/i18n";

// A client component only so the accessible name can follow the language
// choice; the markup itself is static.
export function Logo({ href = "/" }: { href?: string }) {
  const t = useT();
  return (
    <Link className="brand" href={href} aria-label={t("common.home")}>
      <span className="brand-mark" aria-hidden="true" />
      <span className="brand-text">Rez<span>aru</span></span>
    </Link>
  );
}
