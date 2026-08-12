"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useT } from "@/components/i18n";
import type { UiCopyKey } from "@/components/ui-copy";

/**
 * A way back for the pages that are no longer on the main menu.
 *
 * Without it, anyone who lands on billing or templates has no route out
 * except the browser's back button, because the sidebar no longer shows
 * where they are.
 */
export function BackLink({ href, labelKey }: { href: string; labelKey: UiCopyKey }) {
  const t = useT();
  return <Link className="back-link" href={href}><ArrowLeft size={14} /> {t(labelKey)}</Link>;
}
