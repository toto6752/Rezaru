"use client";

import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLang, useT } from "@/components/i18n";
import { copy, focusKeys, teamSizes } from "@/components/landing-copy";

/**
 * The two answers from the first screen, editable later.
 *
 * They were free-text boxes, which meant an owner could type anything into a
 * field the product then tried to match against. Now they offer exactly the
 * options the first screen offered, so the value stays one of a known set.
 */
export function SettingsForm({ workspace }: { workspace: { name: string; department: string | null; companySize: string | null; slug: string } }) {
  const t = useT();
  const { lang } = useLang();
  const builder = copy[lang].builder;
  const [name, setName] = useState(workspace.name);
  const [department, setDepartment] = useState(workspace.department ?? focusKeys[0]);
  const [companySize, setCompanySize] = useState(workspace.companySize ?? teamSizes[0]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true); setSaved(false);
    const response = await fetch("/api/workspaces/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, department, companySize }) });
    setLoading(false); setSaved(response.ok);
  }

  return <form className="settings-form dashboard-panel" onSubmit={save}>
    <div className="panel-heading"><div><h2>{t("set.details")}</h2><p>{t("set.detailsSub")}</p></div></div>
    <label>{t("set.name")}<input value={name} onChange={(event) => setName(event.target.value)} /></label>
    <label>{t("set.slug")}<input value={workspace.slug} disabled /></label>
    <label>{builder.step3}
      <select value={department} onChange={(event) => setDepartment(event.target.value)}>
        {/* An older workspace may hold a value from the previous free-text
            field; it is kept as an option so saving does not silently
            overwrite it with something the owner never chose. */}
        {!focusKeys.some((key) => key === department) && <option value={department}>{department}</option>}
        {focusKeys.map((key) => <option value={key} key={key}>{builder.focus[key]}</option>)}
      </select>
    </label>
    <label>{builder.step2}
      <select value={companySize} onChange={(event) => setCompanySize(event.target.value)}>
        {!teamSizes.some((size) => size === companySize) && <option value={companySize}>{companySize}</option>}
        {teamSizes.map((size) => <option value={size} key={size}>{size}</option>)}
      </select>
    </label>
    <button className="button button-primary" disabled={loading}>{loading ? <Loader2 className="spin" size={14} /> : saved ? <Check size={14} /> : null}{saved ? t("common.saved") : t("set.saveSettings")}</button>
  </form>;
}
