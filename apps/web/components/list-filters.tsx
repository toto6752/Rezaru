"use client";

import { Filter } from "lucide-react";
import type { ReactNode } from "react";
import { useT } from "@/components/i18n";
import type { UiCopyKey } from "@/components/ui-copy";

/**
 * The search-and-filter bar above the outcome and execution lists.
 *
 * It lives in its own client component because placeholders, aria-labels and
 * <option> text are attributes — they need a translated string, which a server
 * component cannot produce.
 */
export function ListFilters({ searchKey, labelKey, icon, optionKeys, withFilterButton = false }: {
  searchKey: UiCopyKey;
  labelKey: UiCopyKey;
  icon: ReactNode;
  optionKeys: readonly UiCopyKey[];
  withFilterButton?: boolean;
}) {
  const t = useT();
  return <div className="list-toolbar">
    <div>{icon}<input placeholder={t(searchKey)} aria-label={t(searchKey)} /></div>
    <select aria-label={t(labelKey)} defaultValue={t(optionKeys[0] ?? searchKey)}>
      {optionKeys.map((key) => <option key={key}>{t(key)}</option>)}
    </select>
    {withFilterButton && <button className="button button-secondary"><Filter size={14} /> {t("exec.filters")}</button>}
  </div>;
}
